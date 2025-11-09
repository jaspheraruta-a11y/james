# Notification 403 Error Fix

## Problem
The application was experiencing 403 Forbidden errors when trying to send notifications:
- `Failed to load resource: the server responded with a status of 403`
- `Error sending permit ready notification`
- `ERR_CONNECTION_CLOSED` on auth endpoint

## Root Cause
The 403 errors were caused by:
1. **Expired or invalid authentication session** - The Supabase session may have expired, causing RLS (Row Level Security) policies to reject the insert operation
2. **Missing authentication check** - The notification service wasn't verifying authentication before attempting to insert notifications
3. **No session refresh logic** - When the session expired, there was no attempt to refresh it

## Solution Implemented

### 1. Added Authentication Verification
Updated `src/services/notificationService.ts` to:
- Check authentication status before sending notifications
- Verify session validity
- Attempt to refresh expired sessions automatically
- Provide clear error messages if authentication fails

### 2. Enhanced Error Handling
- Added detailed error logging with authentication status
- Improved error messages to help diagnose issues
- Better handling of Supabase-specific error codes

## Changes Made

### `src/services/notificationService.ts`
- Added `ensureAuthenticated()` method that:
  - Checks current session
  - Attempts to refresh expired sessions
  - Verifies user authentication
  - Provides clear error messages
- Updated `sendNotification()` to:
  - Call `ensureAuthenticated()` before inserting
  - Handle 403 errors with helpful messages
  - Log detailed error information

## How to Verify the Fix

1. **Check Authentication Status**
   - Ensure you are logged in before performing admin actions
   - Check browser console for authentication logs

2. **Test Notification Sending**
   - Approve a permit as an admin
   - Check browser console for authentication verification logs
   - Verify notifications are created successfully

3. **Monitor for Errors**
   - If you still see 403 errors, check:
     - Are you logged in?
     - Has your session expired? (Try logging out and back in)
     - Are the RLS policies correctly set up in Supabase?

## Database RLS Policies

The following RLS policies should be in place (from `database_notifications.sql`):

```sql
-- Policy: System can insert notifications (allows authenticated users to insert notifications for any user)
CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

**Important**: If you're still getting 403 errors after this fix, verify that:
1. The RLS policies are correctly applied in your Supabase project
2. The `notifications` table has RLS enabled
3. The INSERT policy exists and allows authenticated users

## Troubleshooting

### If you still see 403 errors:

1. **Check Supabase Dashboard**
   - Go to Authentication > Policies
   - Verify the "System can insert notifications" policy exists
   - Ensure it's enabled and allows INSERT for authenticated users

2. **Verify Session**
   - Open browser DevTools > Application > Cookies
   - Check for Supabase session cookies
   - If missing, log out and log back in

3. **Check Network Tab**
   - Look for the actual error response
   - Check if it's a 403 or a different error code
   - Verify the request includes authentication headers

4. **Test Authentication**
   - Try logging out and logging back in
   - Check if other authenticated operations work (e.g., viewing permits)

## Connection Errors

If you see `ERR_CONNECTION_CLOSED` errors:
- Check your internet connection
- Verify Supabase project is active and accessible
- Check if there are any Supabase service outages
- Verify your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct in your `.env` file

## Next Steps

1. Test the notification feature after logging in
2. Monitor console logs for authentication status
3. If issues persist, check Supabase dashboard for RLS policy configuration
4. Consider adding a session refresh mechanism at the app level if sessions expire frequently

