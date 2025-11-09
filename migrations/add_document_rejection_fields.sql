-- Migration: Add document rejection fields to permit_documents table
-- This migration adds support for individual document rejection by admins

-- Add status column (pending, approved, rejected)
ALTER TABLE public.permit_documents 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add rejection_reason column for storing why a document was rejected
ALTER TABLE public.permit_documents 
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Add rejected_at timestamp to track when document was rejected
ALTER TABLE public.permit_documents 
ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone;

-- Add rejected_by to track which admin rejected the document
ALTER TABLE public.permit_documents 
ADD COLUMN IF NOT EXISTS rejected_by uuid REFERENCES public.profiles(id);

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_permit_documents_status ON public.permit_documents(status);

-- Create index on rejected_by for faster queries
CREATE INDEX IF NOT EXISTS idx_permit_documents_rejected_by ON public.permit_documents(rejected_by);

-- Update existing documents to have 'pending' status if they don't have one
UPDATE public.permit_documents 
SET status = 'pending' 
WHERE status IS NULL;

