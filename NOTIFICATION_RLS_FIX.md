# Notification RLS Policy Fix

## Problem
The notification system was experiencing 403 Forbidden errors when trying to insert notifications:
- Error: `new row violates row-level security policy for table "notifications"`
- Error Code: `42501`
- This occurred when admins tried to send notifications to users

## Root Cause
The Row-Level Security (RLS) policy on the `notifications` table was blocking inserts even though the policy appeared to allow authenticated users to insert. This is a common issue when RLS policies interact with cross-user operations.

## Solution
Created a database function with `SECURITY DEFINER` privileges that bypasses RLS policies. This is the recommended approach for system operations that need to insert data on behalf of other users.

## Steps to Apply the Fix

### 1. Run the Database Function in Supabase

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Run the following SQL code (the function is already in `database_notifications.sql`, but you can run just the function part):

```sql
-- Function: Insert notification with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.insert_notification(
  p_user_id uuid,
  p_permit_id uuid DEFAULT NULL,
  p_title text DEFAULT '',
  p_message text DEFAULT '',
  p_type text DEFAULT 'general',
  p_gcash_qr_code_url text DEFAULT NULL
)
RETURNS public.notifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification public.notifications;
BEGIN
  -- Validate type
  IF p_type NOT IN ('permit_ready', 'payment_required', 'general') THEN
    RAISE EXCEPTION 'Invalid notification type: %', p_type;
  END IF;

  -- Insert notification
  INSERT INTO public.notifications (
    user_id,
    permit_id,
    title,
    message,
    type,
    is_read,
    gcash_qr_code_url
  )
  VALUES (
    p_user_id,
    p_permit_id,
    p_title,
    p_message,
    p_type,
    false,
    p_gcash_qr_code_url
  )
  RETURNING * INTO v_notification;

  RETURN v_notification;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_notification TO authenticated;
```

### 2. Verify the Function Was Created

Run this query to verify:
```sql
SELECT 
  routine_name, 
  routine_type, 
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'insert_notification';
```

You should see:
- `routine_name`: `insert_notification`
- `routine_type`: `FUNCTION`
- `security_type`: `DEFINER`

### 3. Test the Fix

1. **Log in as an admin user**
2. **Approve a permit** (this should trigger a notification)
3. **Check the browser console** - you should see:
   - `[NotificationService] ✅ Notification created successfully`
   - No 403 errors
4. **Verify the notification was created** in the database:
   ```sql
   SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;
   ```

## What Changed

### Code Changes
- **`src/services/notificationService.ts`**: Updated `sendNotification()` method to use `supabase.rpc('insert_notification', ...)` instead of direct `.insert()`
- **`database_notifications.sql`**: Added the `insert_notification()` function with `SECURITY DEFINER`

### How It Works
1. The `insert_notification()` function runs with `SECURITY DEFINER`, which means it executes with the privileges of the function owner (typically a superuser or the database owner)
2. This bypasses RLS policies, allowing authenticated users to insert notifications for any user
3. The function still validates input (notification type) and maintains data integrity
4. Only authenticated users can call this function (via the `GRANT` statement)

## Security Considerations

- ✅ The function only allows authenticated users to execute it
- ✅ Input validation is performed (notification type must be valid)
- ✅ The function maintains referential integrity (foreign keys are still enforced)
- ✅ Users can still only see their own notifications (SELECT policy remains unchanged)
- ✅ Users can still only update/delete their own notifications (UPDATE/DELETE policies remain unchanged)

## Troubleshooting

### If you still see 403 errors:

1. **Verify the function exists:**
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_schema = 'public' AND routine_name = 'insert_notification';
   ```

2. **Check function permissions:**
   ```sql
   SELECT grantee, privilege_type 
   FROM information_schema.routine_privileges 
   WHERE routine_name = 'insert_notification';
   ```
   Should show `authenticated` with `EXECUTE` privilege.

3. **Verify you're authenticated:**
   - Check browser console for authentication logs
   - Try logging out and back in
   - Check that your session is valid

4. **Check for function errors:**
   - Look in browser console for any function execution errors
   - Check Supabase logs for database errors

### If the function doesn't exist:

- Make sure you ran the SQL in the Supabase SQL Editor
- Check for any SQL errors when creating the function
- Verify you have permissions to create functions in your Supabase project

## Next Steps

After applying this fix:
1. Test notification sending by approving a permit
2. Verify notifications appear for users
3. Monitor console logs for any remaining errors
4. If issues persist, check Supabase dashboard logs

