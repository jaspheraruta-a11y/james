import { Bell, Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import type { Notification } from '../types';
import PaymentModal from './PaymentModal';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  useEffect(() => {
    let unsubscribe: (() => Promise<void>) | null = null;

    (async () => {
      // initial load
      await loadNotifications();

      try {
        const user = await authService.getCurrentUser();
        if (!user) return;

        // Subscribe to realtime updates for this user's notifications
        // when an event occurs (insert/update/delete) reload notifications
        unsubscribe = notificationService.subscribeToUserNotifications(user.id, async (_payload) => {
          await loadNotifications();
        });
      } catch (err) {
        console.error('Notification subscription failed:', err);
      }
    })();

    return () => {
      if (unsubscribe) {
        unsubscribe().catch((e) => console.warn('Error unsubscribing:', e));
      }
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) return;

      const [allNotifications, count] = await Promise.all([
        notificationService.getUserNotifications(user.id),
        notificationService.getUnreadCount(user.id),
      ]);

      setNotifications(allNotifications);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      await loadNotifications();
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) return;

      await notificationService.markAllAsRead(user.id);
      await loadNotifications();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      await loadNotifications();
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleOpenPaymentModal = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsPaymentModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedNotification(null);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-[-84px] sm:right-0 mt-2 w-[90vw] sm:w-96 bg-black backdrop-blur-xl border border-white/10 rounded-lg shadow-xl z-50 max-h-[70vh] sm:max-h-[600px] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-cyan-400 hover:text-cyan-300"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white"
                  aria-label="Close notifications"
                  title="Close notifications"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-white/5 transition-colors ${
                        !notification.is_read ? 'bg-cyan-500/10' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-white text-sm">
                              {notification.title}
                            </h4>
                            {!notification.is_read && (
                              <span className="w-2 h-2 bg-cyan-400 rounded-full mt-1 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-300 mb-2">
                            {notification.message}
                          </p>
                          
                          {notification.gcash_qr_code_url && (
                            <p
                              onClick={() => handleOpenPaymentModal(notification)}
                              className="text-sm text-cyan-400 hover:text-cyan-300 cursor-pointer underline mt-2 mb-2 transition-colors"
                            >
                              Click here to process payment
                            </p>
                          )}

                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex flex-col gap-1">
                          {!notification.is_read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notification.id)}
                            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={handleClosePaymentModal}
        notification={selectedNotification}
      />
    </div>
  );
}

