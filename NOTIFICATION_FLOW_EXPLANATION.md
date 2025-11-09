# Notification Flow Explanation

## Overview
This document explains how the notification system works in the application, specifically when an admin approves a permit application.

## Complete Flow

### 1. Admin Approves Application
- **Location**: `src/pages/AdminDashboard.tsx` or `src/pages/AdminPermits.tsx`
- **Action**: Admin clicks "Approve" button on a permit application
- **Handler**: `handlePermitAction(permitId, 'approved')` is called
- **Service Call**: `permitService.updatePermitStatus(permitId, 'approved', adminComment)`

### 2. Permit Status Update
- **Location**: `src/services/permitService.ts` → `updatePermitStatus()`
- **What Happens**:
  1. Updates the permit status to 'approved' in the database
  2. Updates `admin_comment` if provided
  3. Updates `updated_at` timestamp
  4. **If status is 'approved'**, triggers notification flow

### 3. Notification Trigger
- **Location**: `src/services/permitService.ts` → `updatePermitStatus()`
- **What Happens**:
  1. After database update completes, waits 500ms to ensure transaction is committed
  2. Calls `checkAndSendPermitReadyNotification(permitId)` asynchronously (non-blocking)
  3. Errors are caught and logged but don't break the approval process

### 4. Notification Preparation
- **Location**: `src/services/permitService.ts` → `checkAndSendPermitReadyNotification()`
- **What Happens**:
  1. **Retry Logic**: Fetches permit data with retry mechanism (up to 3 attempts)
     - Handles race conditions where database might not have updated yet
     - Waits 300ms between retries if status is not 'approved'
  2. **Validates Permit**:
     - Checks if permit exists
     - Verifies permit status is 'approved'
     - Ensures `applicant_id` exists (required to send notification)
  3. **Checks Payment Status**:
     - Retrieves all payments for the permit
     - Checks if at least one payment has status 'completed'
  4. **Prepares Notification Data**:
     - Gets permit type title
     - Sets GCash QR code URL (`/images/gcash-qr-code.png`)
     - Determines notification type and message based on payment status

### 5. Notification Types

#### A. Payment Completed → "Permit Ready"
- **Type**: `permit_ready`
- **Title**: "Permit Ready"
- **Message**: "Your [Permit Type] application has been approved and payment is completed. Your permit is ready to receive. Please use the GCash QR code below for reference."
- **Includes**: GCash QR code image

#### B. Payment Not Completed → "Application Approved"
- **Type**: `payment_required`
- **Title**: "Application Approved"
- **Message**: "Your [Permit Type] application has been approved. Please complete your payment using the GCash QR code below to proceed with your permit."
- **Includes**: GCash QR code image

### 6. Notification Creation
- **Location**: `src/services/notificationService.ts` → `sendNotification()`
- **What Happens**:
  1. Inserts notification record into `notifications` table with:
     - `user_id`: The applicant's user ID
     - `permit_id`: The permit ID
     - `title`: Notification title
     - `message`: Notification message
     - `type`: 'permit_ready' or 'payment_required'
     - `is_read`: false (unread)
     - `gcash_qr_code_url`: Path to GCash QR code image
     - `created_at`: Current timestamp
  2. Returns the created notification

### 7. Notification Display
- **Location**: `src/components/NotificationBell.tsx`
- **What Happens**:
  1. **Auto-refresh**: Notifications are loaded every 30 seconds
  2. **Badge Display**: Red badge shows unread count
  3. **Dropdown**: Clicking bell shows all notifications
  4. **Features**:
     - Unread notifications highlighted with cyan background
     - GCash QR code displayed if present
     - Mark as read / Delete buttons
     - Timestamp display

## Key Components

### Files Involved
1. **`src/services/permitService.ts`**
   - `updatePermitStatus()`: Updates permit and triggers notification
   - `checkAndSendPermitReadyNotification()`: Prepares and sends notification

2. **`src/services/notificationService.ts`**
   - `sendNotification()`: Creates notification in database
   - `getUserNotifications()`: Retrieves user's notifications
   - `getUnreadCount()`: Gets unread notification count
   - `markAsRead()`: Marks notification as read
   - `deleteNotification()`: Deletes notification

3. **`src/components/NotificationBell.tsx`**
   - Displays notification UI
   - Handles user interactions (mark read, delete)

4. **`src/pages/AdminDashboard.tsx`**
   - Admin interface for approving permits

## Database Schema

### `notifications` Table
```sql
- id: uuid (primary key)
- user_id: uuid (foreign key to profiles)
- permit_id: uuid (foreign key to permits, nullable)
- title: text
- message: text
- type: text ('permit_ready', 'payment_required', 'general')
- is_read: boolean (default: false)
- gcash_qr_code_url: text (nullable)
- created_at: timestamp
```

## Error Handling

### Retry Mechanism
- If permit status is not 'approved' when first checked, the system retries up to 3 times
- 300ms delay between retries to handle database transaction timing

### Error Logging
- All errors are logged to console with detailed information
- Errors don't break the approval process (notification failure is non-critical)
- Logs include:
  - Permit ID
  - Error message
  - Stack trace (if available)

### Silent Failures
- If notification fails to send, the approval still succeeds
- Errors are logged but not thrown to the user
- Admin sees success message even if notification fails

## Recent Fixes

### Issue Fixed
**Problem**: No notification received after admin approves application

**Root Cause**: Race condition where notification check happened before database transaction was fully committed, causing the status check to fail.

**Solution**:
1. Added 500ms delay before checking permit status
2. Implemented retry mechanism (3 attempts with 300ms delays)
3. Improved error logging for debugging
4. Made notification sending non-blocking (fire-and-forget)
5. Added validation for `applicant_id` before sending

### Changes Made
- **`updatePermitStatus()`**: Added async delay before notification check
- **`checkAndSendPermitReadyNotification()`**: 
  - Added retry logic for status checks
  - Improved error handling and logging
  - Better validation of permit data

## Testing

### How to Test
1. **As Admin**:
   - Go to Admin Dashboard
   - Find a pending permit application
   - Click "Review" → "Approve"
   - Check browser console for notification logs

2. **As User**:
   - Wait for notification (should appear within 30 seconds)
   - Check notification bell in navbar
   - Verify notification appears with correct message
   - Verify GCash QR code displays (if image exists)

### Expected Behavior
- Notification appears within 30 seconds of approval
- Notification shows correct title and message
- GCash QR code displays (if image file exists)
- Unread count badge updates
- Notification persists until marked as read or deleted

## Troubleshooting

### Notification Not Appearing
1. **Check Browser Console**: Look for error messages
2. **Check Database**: Verify notification was created in `notifications` table
3. **Check RLS Policies**: Ensure user can read their own notifications
4. **Check Applicant ID**: Verify permit has valid `applicant_id`
5. **Check Notification Bell**: Ensure component is mounted and refreshing

### Common Issues
- **RLS Policy Blocking**: Check Supabase RLS policies for notifications table
- **Missing Applicant ID**: Permit must have `applicant_id` to send notification
- **Image Not Found**: GCash QR code won't display if image file is missing (but notification still works)
- **Network Issues**: Check network tab for failed API calls

## Future Enhancements
- Real-time notifications using Supabase Realtime
- Email notifications
- Push notifications
- Notification preferences per user
- Notification history/archiving

