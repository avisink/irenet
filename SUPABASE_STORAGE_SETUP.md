# Supabase Storage Setup Guide

If you want to use Supabase Storage for file uploads (images, documents, etc.), follow this guide.

## Step 1: Create Storage Buckets

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/hnuxixhyrmgiwlihmciq
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**

### Recommended Buckets:

#### 1. `donation-images` (Public)
- **Purpose**: Store images of donations
- **Public**: Yes (so images can be accessed via URL)
- **File size limit**: 5MB (adjust as needed)
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`

#### 2. `organization-documents` (Private)
- **Purpose**: Store organization documents (certificates, licenses, etc.)
- **Public**: No (private, requires authentication)
- **File size limit**: 10MB
- **Allowed MIME types**: `application/pdf`, `image/jpeg`, `image/png`

#### 3. `user-avatars` (Public)
- **Purpose**: Store user profile pictures
- **Public**: Yes
- **File size limit**: 2MB
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`

## Step 2: Set Up Storage Policies

After creating buckets, set up Row Level Security (RLS) policies:

### For Public Buckets (donation-images, user-avatars):

```sql
-- Allow anyone to read files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'donation-images' OR bucket_id = 'user-avatars');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  (bucket_id = 'donation-images' OR bucket_id = 'user-avatars')
);

-- Allow users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
  auth.role() = 'authenticated' AND
  (bucket_id = 'donation-images' OR bucket_id = 'user-avatars')
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  auth.role() = 'authenticated' AND
  (bucket_id = 'donation-images' OR bucket_id = 'user-avatars')
);
```

### For Private Buckets (organization-documents):

```sql
-- Only authenticated users can read
CREATE POLICY "Authenticated users can read"
ON storage.objects FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'organization-documents'
);

-- Only organization users can upload
CREATE POLICY "Organizations can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id = 'organization-documents'
);
```

## Step 3: Update Backend Code (If Needed)

The backend already has `supabaseStorage` configured in `backend/config/supabase.js`. You can use it like this:

```javascript
const { supabaseStorage } = require('./config/supabase');

// Upload a file
async function uploadFile(bucketName, filePath, fileBuffer) {
  const { data, error } = await supabaseStorage.storage
    .from(bucketName)
    .upload(filePath, fileBuffer, {
      contentType: 'image/jpeg',
      upsert: true
    });
  
  if (error) throw error;
  return data;
}

// Get public URL
function getPublicUrl(bucketName, filePath) {
  const { data } = supabaseStorage.storage
    .from(bucketName)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}
```

## Step 4: Update Frontend Code (If Needed)

In your React components, you can upload files like this:

```typescript
import { supabase } from '../utils/supabase/client';

async function uploadDonationImage(file: File, donationId: number) {
  const filePath = `donations/${donationId}/${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('donation-images')
    .upload(filePath, file);
  
  if (error) throw error;
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('donation-images')
    .getPublicUrl(filePath);
  
  return urlData.publicUrl;
}
```

## Step 5: Update Database Schema (Optional)

If you want to store file URLs in your MySQL database, you can add columns:

```sql
-- Add image_url to donations table
ALTER TABLE donations 
ADD COLUMN image_url VARCHAR(500);

-- Add avatar_url to users table
ALTER TABLE users 
ADD COLUMN avatar_url VARCHAR(500);
```

## Testing Storage

1. **Test upload**:
   ```bash
   # Using curl
   curl -X POST \
     'https://hnuxixhyrmgiwlihmciq.supabase.co/storage/v1/object/donation-images/test.jpg' \
     -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
     -H 'Content-Type: image/jpeg' \
     --data-binary @test.jpg
   ```

2. **Test public URL**:
   - Upload a file to a public bucket
   - Get the public URL from Supabase dashboard
   - Access it in a browser

## Storage Limits

- **Free Tier**: 1GB storage, 2GB bandwidth/month
- **Pro Tier**: 100GB storage, 200GB bandwidth/month

Monitor your usage in the Supabase dashboard under **Storage** → **Usage**.

## Security Notes

1. **Never expose service role key** in frontend code
2. **Use RLS policies** to control access
3. **Validate file types** and sizes before upload
4. **Sanitize file names** to prevent path traversal attacks
5. **Use signed URLs** for private files instead of public URLs

## Example: Adding Image Upload to Donations

If you want to add image upload functionality to donations:

1. Add file input to `CreateDonationPage.tsx`
2. Upload image when creating donation
3. Store image URL in MySQL `donations.image_url`
4. Display image in donation cards

See the code examples above for implementation details.

