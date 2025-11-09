import { supabase } from './supabaseClient';
import type { Notification } from '../types';

export const notificationService = {
  /**
   * Ensure user is authenticated and session is valid
   */
  async ensureAuthenticated(): Promise<void> {
    // Get current session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error(`[NotificationService] Session error:`, sessionError);
      throw new Error(`Authentication error: ${sessionError.message}`);
    }

    // If no session, try to get user (this may trigger auto-refresh)
    if (!session) {
      console.warn(`[NotificationService] No active session found`);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error(`[NotificationService] No authenticated user:`, userError);
        throw new Error('Not authenticated. Please log in again.');
      }
      
      console.log(`[NotificationService] User authenticated (session auto-refreshed):`, user.id);
      return;
    }

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error(`[NotificationService] User verification error:`, userError);
      
      // If session exists but getUser fails, try refreshing
      if (session.refresh_token) {
        try {
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshedSession) {
            console.error(`[NotificationService] Failed to refresh session:`, refreshError);
            throw new Error('Session expired. Please log in again.');
          }
          
          // Verify again after refresh
          const { data: { user: refreshedUser }, error: refreshedUserError } = await supabase.auth.getUser();
          
          if (refreshedUserError || !refreshedUser) {
            throw new Error('Not authenticated. Please log in again.');
          }
          
          console.log(`[NotificationService] Session refreshed and verified for user:`, refreshedUser.id);
          return;
        } catch (refreshErr) {
          console.error(`[NotificationService] Refresh failed:`, refreshErr);
          throw new Error('Session expired. Please log in again.');
        }
      } else {
        throw new Error('Not authenticated. Please log in again.');
      }
    }
    
    if (!user) {
      console.error(`[NotificationService] No user found`);
      throw new Error('Not authenticated. Please log in again.');
    }

    console.log(`[NotificationService] Authentication verified for user:`, user.id);
  },

  /**
   * Send a notification to a user
   * Uses a database function with SECURITY DEFINER to bypass RLS policies
   */
  async sendNotification(
    userId: string,
    permitId: string | null,
    title: string,
    message: string,
    type: 'permit_ready' | 'payment_required' | 'general' | 'application_rejected' = 'general',
    gcashQrCodeUrl: string | null = null
  ): Promise<Notification> {
    console.log(`[NotificationService] Attempting to send notification:`, {
      userId,
      permitId,
      title,
      type,
      hasGcashQr: !!gcashQrCodeUrl
    });

    // Ensure user is authenticated before sending notification
    try {
      await this.ensureAuthenticated();
    } catch (authError) {
      console.error(`[NotificationService] ❌ Authentication check failed:`, authError);
      throw authError;
    }

    // Use database function to insert notification (bypasses RLS)
    const { data, error } = await supabase.rpc('insert_notification', {
      p_user_id: userId,
      p_permit_id: permitId,
      p_title: title,
      p_message: message,
      p_type: type,
      p_gcash_qr_code_url: gcashQrCodeUrl,
    });

    if (error) {
      console.error(`[NotificationService] ❌ Error inserting notification:`, {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // Provide more helpful error messages
      if (error.code === 'PGRST301' || error.code === '42501' || error.message?.includes('403')) {
        throw new Error(`Permission denied: Unable to send notification. Please ensure you are logged in and have the necessary permissions. (${error.message})`);
      }
      
      throw error;
    }

    console.log(`[NotificationService] ✅ Notification created successfully:`, data);
    return data;
  },

  /**
   * Get all notifications for the current user
   */
  async getUserNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get unread notifications count for the current user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  },

  /**
   * Subscribe to realtime changes for a specific user's notifications.
   * Returns an unsubscribe function that will remove the realtime channel.
   */
  subscribeToUserNotifications(userId: string, callback: (payload: any) => void) {
    try {
      const channel = supabase
        .channel(`user-notifications-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            // filter to only events for this user
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            // forward the payload to the consumer (UI)
            callback(payload);
          }
        )
        .subscribe();

      // Return unsubscribe function
      return async () => {
        try {
          await supabase.removeChannel(channel);
        } catch (err) {
          console.warn('[NotificationService] Failed to remove channel:', err);
        }
      };
    } catch (err) {
      console.error('[NotificationService] Failed to subscribe to notifications:', err);
      // Return a no-op unsubscribe so callers can always call it
      return async () => {};
    }
  },
};

