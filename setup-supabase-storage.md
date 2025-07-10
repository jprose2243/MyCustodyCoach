# Supabase Storage Setup Guide

## Creating the `user-files` Storage Bucket

To enable file uploads in your MyCustodyCoach application, you need to create a storage bucket in your Supabase project.

### Step 1: Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Sign in and navigate to your project
3. Click on "Storage" in the left sidebar

### Step 2: Create the Bucket
1. Click "Create Bucket"
2. Name: `user-files`
3. Public: `false` (private bucket for security)
4. Click "Create Bucket"

### Step 3: Set Up Security Policies
Click on the `user-files` bucket, then go to "Policies" and add these policies:

#### Policy 1: Allow authenticated users to upload files
```sql
-- Policy name: Allow authenticated users to upload files
-- Operation: INSERT
-- Target roles: authenticated

(auth.uid() IS NOT NULL)
```

#### Policy 2: Allow users to read their own files
```sql
-- Policy name: Allow users to read their own files  
-- Operation: SELECT
-- Target roles: authenticated

(auth.uid()::text = (storage.foldername(name))[1])
```

#### Policy 3: Allow users to delete their own files
```sql
-- Policy name: Allow users to delete their own files
-- Operation: DELETE  
-- Target roles: authenticated

(auth.uid()::text = (storage.foldername(name))[1])
```

### Step 4: Create Database Table
Run this SQL in your Supabase SQL editor:

```sql
-- Create table for file metadata
CREATE TABLE IF NOT EXISTS user_uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(storage_path)
);

-- Enable Row Level Security
ALTER TABLE user_uploads ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own file records
CREATE POLICY "Users can access their own files" ON user_uploads
    FOR ALL USING (auth.uid() = user_id);
```

### Step 5: Re-enable File Uploads
Once the bucket is created, update `app/upload/UploadClient.tsx`:

1. Change the file input from `disabled={true}` to `disabled={false}`
2. Update the label from "Coming Soon" to "Optional"
3. Restore the original `handleFileChange` function
4. Remove the overlay div that says "File upload temporarily disabled"

### Step 6: Test File Upload
1. Restart your development server
2. Try uploading a small PDF or image file
3. Check that the file appears in your Supabase storage bucket

## Security Notes
- Files are stored in user-specific folders (by user ID)
- All files are scanned for malware before upload
- File types are validated both client-side and server-side
- Files are automatically cleaned up if upload fails

## File Size Limits
- Maximum file size: 500MB
- Supported types: PDF, DOCX, TXT, PNG, JPEG

## Troubleshooting
If you encounter issues:
1. Check that your Supabase environment variables are correct
2. Verify the bucket policies are set up correctly
3. Ensure the `user_uploads` table exists
4. Check the browser console for error messages 