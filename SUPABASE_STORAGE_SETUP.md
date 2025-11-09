# Supabase Storage Setup Guide

## Issue Fixed
The image upload for building permits was failing because the code was uploading files to Supabase Storage but **not inserting records into the `uploaded_images` table** in the database.

## Changes Made

### 1. Dashboard.tsx
- Added file metadata tracking when uploading proof of ownership images
- Metadata includes: file name, extension, MIME type, size, storage path, public URL, and category
- This metadata is passed to the permitService for database insertion

### 2. permitService.ts
- Added logic to insert uploaded image metadata into the `uploaded_images` table during permit creation
- Added logic to insert uploaded image metadata during permit updates
- Properly tracks permit_id, uploader_id, and all file metadata

## Required Supabase Configuration

### Step 1: Verify Storage Bucket Exists
1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Check if a bucket named `permit-documents` exists
5. If it doesn't exist, create it:
   - Click "New bucket"
   - Name: `permit-documents`
   - Public bucket: **YES** (so uploaded images can be accessed via public URLs)
   - Click "Create bucket"

### Step 2: Set Storage Bucket Policies
The bucket needs proper Row Level Security (RLS) policies to allow uploads and reads.

Go to **Storage** > **Policies** and add these policies for the `permit-documents` bucket:

#### Policy 1: Allow Authenticated Users to Upload
```sql
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'permit-documents');
```

#### Policy 2: Allow Public Read Access
```sql
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'permit-documents');
```

#### Policy 3: Allow Users to Update Their Own Files
```sql
CREATE POLICY "Allow users to update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'permit-documents' AND auth.uid() = owner);
```

#### Policy 4: Allow Users to Delete Their Own Files
```sql
CREATE POLICY "Allow users to delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'permit-documents' AND auth.uid() = owner);
```

### Step 3: Verify Database Table Exists
The `uploaded_images` table should already exist based on your database.sql file. Verify it exists:

```sql
SELECT * FROM uploaded_images LIMIT 1;
```

If it doesn't exist, run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE public.uploaded_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  permit_id uuid,
  uploader_id uuid,
  category text,
  file_name text,
  file_ext text,
  mime_type text,
  size_bytes bigint,
  storage_bucket text NOT NULL DEFAULT 'permit-documents'::text,
  storage_path text NOT NULL,
  public_url text,
  checksum text,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT uploaded_images_pkey PRIMARY KEY (id),
  CONSTRAINT uploaded_images_permit_id_fkey FOREIGN KEY (permit_id) REFERENCES public.permits(id),
  CONSTRAINT uploaded_images_uploader_id_fkey FOREIGN KEY (uploader_id) REFERENCES public.profiles(id)
);
```

### Step 4: Set RLS Policies for uploaded_images Table

```sql
-- Enable RLS
ALTER TABLE uploaded_images ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own uploads
CREATE POLICY "Users can insert their own uploads"
ON uploaded_images
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = uploader_id);

-- Allow users to view uploads for their permits
CREATE POLICY "Users can view uploads for their permits"
ON uploaded_images
FOR SELECT
TO authenticated
USING (
  uploader_id = auth.uid() 
  OR 
  permit_id IN (
    SELECT id FROM permits WHERE applicant_id = auth.uid()
  )
);

-- Allow admins to view all uploads
CREATE POLICY "Admins can view all uploads"
ON uploaded_images
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);
```

## Testing the Fix

### Test 1: Create New Building Permit with Image
1. Log in to the application
2. Click "New Application"
3. Select a Building Permit type
4. Fill in all required fields
5. Upload an image for "Proof of Ownership"
6. Submit the application
7. Check the database:
   ```sql
   SELECT * FROM uploaded_images ORDER BY uploaded_at DESC LIMIT 1;
   ```
   You should see a new record with all file metadata

### Test 2: Update Existing Building Permit with New Image
1. Edit a pending building permit
2. Upload a new proof of ownership image
3. Save the changes
4. Check the database - you should see a new record in `uploaded_images`

### Test 3: Verify Storage Upload
1. Go to Supabase Dashboard > Storage > permit-documents
2. Navigate to the `proof-of-ownership` folder
3. You should see the uploaded images with timestamps in their filenames

## Troubleshooting

### Error: "Failed to upload proof of ownership image"
- Check that the `permit-documents` bucket exists
- Verify storage policies are set correctly
- Check browser console for detailed error messages

### Error: "Error inserting uploaded image metadata"
- Check that the `uploaded_images` table exists
- Verify RLS policies allow the current user to insert
- Check that foreign key constraints are satisfied (permit_id and uploader_id must exist)

### Images Upload but Don't Show in Database
- This was the original issue - now fixed
- Verify you're using the updated code
- Check browser console for any JavaScript errors

## File Size Limits
Current limit: **5MB per image**

To change this, modify the validation in Dashboard.tsx:
```typescript
if (file.size > 5 * 1024 * 1024) {
  toast.error('Image size must be less than 5MB');
  return;
}
```

## Supported Image Formats
- PNG
- JPG/JPEG
- GIF
- BMP
- WebP
- SVG
- TIFF
- ICO
- HEIC
- HEIF

The validation checks for `image/*` MIME type.
