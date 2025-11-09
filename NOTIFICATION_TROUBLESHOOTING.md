# Notification Troubleshooting Guide

## Issue: Notifications Not Appearing After Admin Approval

This guide will help you identify why notifications aren't being sent to users after admin approval.

## Step 1: Check Browser Console

After approving a permit, open the browser console (F12) and look for logs prefixed with `[Notification]`:

### Expected Logs (Success):
```
[Notification] Starting notification check for permit <permit-id>
[Notification] Permit fetched, status: approved, applicant_id: <user-id>
[Notification] Permit status confirmed as approved
[Notification] Found X payment(s) for permit <permit-id>
[Notification] Has completed payment: true/false
[Notification] Preparing to send notification to user <user-id>
[NotificationService] Attempting to send notification: {...}
[NotificationService] ✅ Notification created successfully: {...}
[Notification] ✅ Successfully sent: Permit Ready for permit <permit-id> to user <user-id>
```

### Error Logs to Look For:
- `[Notification] ❌ Error inserting notification:` - Database/RLS issue
- `[Notification] Permit <permit-id> has no applicant_id` - Missing applicant_id
- `[Notification] Failed to fetch permit` - Database connection issue
- `[NotificationService] ❌ Error inserting notification:` - RLS policy blocking insert

## Step 2: Verify Database Setup

### Check if notifications table exists:
Run this in your Supabase SQL Editor:
```sql
SELECT * FROM notifications LIMIT 1;
```

If you get an error, the table doesn't exist. Run `database_notifications.sql` in your Supabase SQL Editor.

### Check RLS Policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'notifications';
```

You should see these policies:
1. "Users can view their own notifications" (SELECT)
2. "System can insert notifications" (INSERT) - **This is critical!**
3. "Users can update their own notifications" (UPDATE)
4. "Users can delete their own notifications" (DELETE)

### Verify INSERT Policy:
The INSERT policy should allow authenticated users to insert:
```sql
CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);
```

If this policy doesn't exist or is different, recreate it.

## Step 3: Check Common Issues

### Issue A: RLS Policy Blocking Inserts
**Symptom**: Console shows `[NotificationService] ❌ Error inserting notification:` with error code `42501` or `new row violates row-level security policy`

**Solution**: 
1. Verify the INSERT policy exists (see Step 2)
2. Make sure you're authenticated as admin when approving
3. Try updating the policy to be more explicit:
```sql
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

### Issue B: Missing applicant_id
**Symptom**: Console shows `[Notification] Permit <permit-id> has no applicant_id, cannot send notification`

**Solution**: 
- Check that permits have a valid `applicant_id` field
- Run: `SELECT id, applicant_id FROM permits WHERE id = '<permit-id>';`

### Issue C: Notifications Table Doesn't Exist
**Symptom**: Console shows database error about table not existing

**Solution**: 
- Run `database_notifications.sql` in Supabase SQL Editor
- Verify table exists: `SELECT * FROM notifications LIMIT 1;`

### Issue D: Notifications Created But Not Visible
**Symptom**: Console shows notification created successfully, but user doesn't see it

**Solution**:
1. Check if notification exists in database:
```sql
SELECT * FROM notifications WHERE user_id = '<user-id>' ORDER BY created_at DESC;
```

2. Verify RLS SELECT policy allows user to see their notifications:
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'notifications' 
AND policyname = 'Users can view their own notifications';
```

3. Check NotificationBell component is mounted and refreshing (should refresh every 30 seconds)

## Step 4: Test Notification Flow Manually

### Test 1: Direct Database Insert
Try inserting a notification directly to verify RLS works:
```sql
INSERT INTO notifications (user_id, title, message, type)
VALUES ('<user-id>', 'Test Notification', 'This is a test', 'general');
```

If this fails, RLS is blocking inserts.

### Test 2: Check Notification Service
In browser console, try:
```javascript
// Get current user
const user = await authService.getCurrentUser();
console.log('Current user:', user);

// Try to get notifications
const notifications = await notificationService.getUserNotifications(user.id);
console.log('Notifications:', notifications);
```

## Step 5: Common Fixes

### Fix 1: Update RLS Policy for Inserts
If inserts are being blocked, update the policy:
```sql
-- Drop existing policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Create new policy that allows authenticated users to insert
CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

### Fix 2: Verify Admin is Authenticated
Make sure the admin user is properly authenticated when approving permits. Check:
- Admin is logged in
- Session is valid
- Supabase client is using correct credentials

### Fix 3: Check Notification Bell Component
Verify the NotificationBell component:
1. Is mounted in the Navbar
2. Is calling `loadNotifications()` on mount
3. Has the 30-second refresh interval working
4. User is logged in when checking notifications

## Step 6: Debug Checklist

- [ ] Browser console shows `[Notification]` logs when approving
- [ ] Notifications table exists in database
- [ ] RLS policies are set up correctly
- [ ] INSERT policy allows authenticated users (`WITH CHECK (true)`)
- [ ] Permit has valid `applicant_id`
- [ ] Admin is authenticated when approving
- [ ] NotificationBell component is mounted
- [ ] User is logged in when checking notifications
- [ ] No errors in browser console
- [ ] Network tab shows successful POST to notifications table

## Still Not Working?

If notifications still aren't working after checking all the above:

1. **Check Supabase Dashboard**:
   - Go to Supabase Dashboard → Database → Tables → notifications
   - Check if notifications are being created (even if not visible to user)
   - Check RLS policies in the dashboard

2. **Check Network Tab**:
   - Open browser DevTools → Network tab
   - Filter for "notifications"
   - Approve a permit and check if there's a POST request
   - Check the response for errors

3. **Enable More Logging**:
   - All notification-related logs are prefixed with `[Notification]` or `[NotificationService]`
   - Filter console for these prefixes to see the full flow

4. **Contact Support**:
   - Share the console logs
   - Share the RLS policy setup
   - Share any error messages from Network tab

