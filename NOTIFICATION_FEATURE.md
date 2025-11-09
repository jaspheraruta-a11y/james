# Notification Feature Implementation

## Overview
This feature sends notifications to users when their permit application is approved and payment is completed. The notification includes a message indicating the permit is ready to receive, along with a GCash QR code image.

## Database Setup

1. Run the SQL migration file to create the notifications table:
   ```sql
   -- Execute database_notifications.sql in your Supabase SQL editor
   ```

2. The migration creates:
   - `notifications` table with all necessary fields
   - Indexes for performance
   - Row Level Security (RLS) policies

## GCash QR Code Image

1. Place your GCash QR code image in: `public/images/gcash-qr-code.png`
2. Supported formats: PNG, JPG, SVG
3. Recommended size: 200x200 pixels or larger (square aspect ratio)

## How It Works

### Flow:
1. **Admin approves application** → `updatePermitStatus('approved')` is called
2. **System checks payment status** → If payment is completed, notification is sent
3. **Payment completed** → If permit is already approved, notification is sent
4. **User receives notification** → Shows in notification bell with GCash QR code

### Key Functions:

#### `permitService.updatePermitStatus()`
- Updates permit status
- If status is 'approved', automatically checks payment and sends notification

#### `permitService.checkAndSendPermitReadyNotification()`
- Checks if permit is approved AND payment is completed
- Sends notification with GCash QR code if both conditions are met

#### `permitService.updatePaymentStatus()`
- Updates payment status
- If payment is 'completed', checks if permit is approved and sends notification

## Components

### NotificationBell Component
- Displays notification count badge
- Shows notification dropdown with all notifications
- Displays GCash QR code image when present
- Allows marking notifications as read/delete

### Integration:
- Already integrated into `Navbar` component
- Appears in all pages that use the Navbar

## Usage

### For Admins:
When approving a permit application:
1. Go to Admin Dashboard
2. Click "Review" on a permit
3. Click "Approve"
4. If payment is already completed, notification is automatically sent

### For Users:
1. Notification bell appears in the top-right corner of the navbar
2. Red badge shows unread count
3. Click bell to view notifications
4. GCash QR code is displayed in permit-ready notifications

## Notification Types

- `permit_ready`: Sent when permit is approved and payment is completed
- `payment_required`: (Future use)
- `general`: (Future use)

## Customization

### Change GCash QR Code Path:
Edit `src/services/permitService.ts`, line ~1066:
```typescript
const gcashQrCodeUrl = '/images/gcash-qr-code.png'; // Change this path
```

### Customize Notification Message:
Edit `src/services/permitService.ts`, line ~1074:
```typescript
`Your ${permitTypeTitle} application has been approved...` // Customize message
```

## Testing

1. **Test approval with completed payment:**
   - Create a permit application
   - Create a payment with status 'completed'
   - Admin approves the permit
   - Check notification appears

2. **Test payment completion after approval:**
   - Admin approves a permit
   - Update payment status to 'completed'
   - Check notification appears

3. **Test notification display:**
   - Click notification bell
   - Verify GCash QR code displays
   - Test mark as read/delete functions

## Notes

- Notifications are automatically refreshed every 30 seconds
- Notification failure won't break the approval process (errors are logged)
- GCash QR code image gracefully handles missing files (hides if not found)
- All notifications are user-specific (users only see their own)

