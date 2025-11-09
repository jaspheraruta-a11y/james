# Test: Rejection Notification Feature

## ✅ Status: Ready to Test
The database migration has been applied and all code is in place.

## Test Steps

### Step 1: Create a Test Permit (As User)
1. Log in as a **regular user** (not admin)
2. Navigate to **Dashboard** or **Apply for Permit**
3. Submit a new permit application
4. Note the applicant's email/username for later

### Step 2: Reject the Permit (As Admin)
1. Log out and log in as **admin**
2. Go to **Admin Dashboard**
3. Find the permit you just created
4. Click **Review** button
5. In the review modal:
   - Enter an admin comment (e.g., "Missing required documents")
   - Click **Reject** button
6. You should see: "Permit rejected successfully" toast message

### Step 3: Check Notification (As User)
1. Log out and log back in as the **user** who submitted the permit
2. Look at the **notification bell icon** (top right)
3. You should see:
   - ✅ Red badge with unread count (should show 1 or more)
   - ✅ Click the bell to open notifications
   - ✅ See notification titled "Application Rejected"
   - ✅ Message should include the permit type and admin comment
   - ✅ Notification should be highlighted (cyan background) as unread

### Expected Notification Format
```
Title: Application Rejected
Message: Your [Permit Type] application has been rejected. Reason: [Admin Comment]. Please review your application and resubmit if necessary.
Type: application_rejected
Status: Unread (initially)
```

## Troubleshooting

### If notification doesn't appear:

1. **Check browser console** (F12) for errors
2. **Check if notification was sent:**
   - Look for console logs: `[Notification] ✅ Successfully sent rejection notification`
   - Look for any error logs starting with `[Notification] ❌`

3. **Verify database:**
   ```sql
   -- Check if notification exists in database
   SELECT * FROM notifications 
   WHERE type = 'application_rejected' 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

4. **Check user session:**
   - Make sure you're logged in as the correct user
   - Try refreshing the page
   - Try logging out and back in

### Common Issues:
- **"Invalid notification type"** → Database migration not applied correctly
- **No notification at all** → Check admin comment was saved, permit status changed to 'rejected'
- **403 Forbidden** → RLS policies issue (should be fixed by SECURITY DEFINER function)

## Additional Test Scenarios

### Test A: Rejection Without Comment
1. Reject a permit without entering an admin comment
2. Notification should still be sent
3. Message should not include "Reason:" part

### Test B: Multiple Rejections
1. Reject multiple permits
2. Each should generate its own notification
3. All should appear in the notification list

### Test C: Real-time Updates
1. Open the application in two browser windows
2. Window 1: Log in as user and open notifications
3. Window 2: Log in as admin and reject a permit
4. Window 1: Should see notification appear automatically (via real-time subscription)

## Success Criteria
✅ Notification appears immediately after rejection  
✅ Notification includes permit type  
✅ Notification includes admin comment (if provided)  
✅ Notification badge shows unread count  
✅ User can mark notification as read  
✅ User can delete notification  
✅ Real-time updates work (notification appears without refresh)

## Technical Verification
After testing, you can verify the notification was stored correctly:

```sql
SELECT 
  n.id,
  n.title,
  n.message,
  n.type,
  n.is_read,
  n.created_at,
  p.firstname || ' ' || p.lastname as user_name,
  pm.status as permit_status
FROM notifications n
JOIN profiles p ON n.user_id = p.id
LEFT JOIN permits pm ON n.permit_id = pm.id
WHERE n.type = 'application_rejected'
ORDER BY n.created_at DESC;
```
