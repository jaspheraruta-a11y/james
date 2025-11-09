# Fix: Rejection Notifications Not Appearing

## Problem
When an admin rejects a permit application, users are not receiving notifications because the database schema doesn't support the `'application_rejected'` notification type.

## Root Cause
The notification type constraint in the database only allows:
- `'permit_ready'`
- `'payment_required'`
- `'general'`

But the code tries to send rejection notifications with type `'application_rejected'`, which causes the insertion to fail silently.

## Solution
Run the migration SQL script to add support for the `'application_rejected'` notification type.

## How to Apply the Fix

### Method 1: Using Supabase Dashboard (Recommended)
1. Open your Supabase project dashboard
2. Go to **SQL Editor** (in the left sidebar)
3. Click **New query**
4. Copy and paste the contents of `database_notifications_fix.sql`
5. Click **Run** to execute the migration

### Method 2: Using psql Command Line
```bash
psql -U your_username -d your_database -f database_notifications_fix.sql
```

### Method 3: Manual Execution
If you prefer to run the commands manually, execute these SQL statements in order:

```sql
-- Step 1: Drop the existing check constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Step 2: Add new constraint with 'application_rejected' included
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type = ANY (ARRAY['permit_ready'::text, 'payment_required'::text, 'general'::text, 'application_rejected'::text]));

-- Step 3: Update the insert_notification function
-- (Copy the entire function from database_notifications_fix.sql)
```

## Verification
After applying the fix:

1. Log in as an admin
2. Go to Admin Dashboard
3. Review a permit and click **Reject**
4. Add an admin comment (optional)
5. Log out and log in as the applicant user
6. Check the notifications bell icon - you should see the rejection notification

## Files Modified
- ✅ `database_notifications.sql` - Updated for future deployments
- ✅ `database_notifications_fix.sql` - Migration script created
- ✅ Code already supports rejection notifications (no code changes needed)

## Technical Details
The rejection notification system was already implemented in the code:
- `permitService.ts` line 1147-1159: Sends notification when status is 'rejected'
- `permitService.ts` line 1291-1345: `sendRejectionNotification()` function
- `notificationService.ts` line 82: Already supports 'application_rejected' type

Only the database schema was missing support for this notification type.
