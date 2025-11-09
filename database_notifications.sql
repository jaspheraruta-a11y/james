-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  permit_id uuid,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'general'::text CHECK (type = ANY (ARRAY['permit_ready'::text, 'payment_required'::text, 'general'::text, 'application_rejected'::text])),
  is_read boolean NOT NULL DEFAULT false,
  gcash_qr_code_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT notifications_permit_id_fkey FOREIGN KEY (permit_id) REFERENCES public.permits(id) ON DELETE SET NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_is_read_idx ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS notifications_permit_id_idx ON public.notifications(permit_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: System can insert notifications (allows authenticated users to insert notifications for any user)
-- This is needed because admins need to send notifications to users
CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Users can update their own notifications (mark as read, delete)
CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function: Insert notification with SECURITY DEFINER to bypass RLS
-- This function allows authenticated users to insert notifications for any user
-- It runs with elevated privileges to bypass RLS policies
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
  IF p_type NOT IN ('permit_ready', 'payment_required', 'general', 'application_rejected') THEN
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

