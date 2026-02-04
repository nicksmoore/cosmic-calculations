-- Drop old overly permissive policies
DROP POLICY IF EXISTS "Allow public uploads to natal-charts" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from natal-charts" ON storage.objects;

-- User-scoped policies for natal-charts bucket
CREATE POLICY "Users can upload their own charts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'natal-charts' AND
  (storage.foldername(name))[1] = 'charts' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can read their own charts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'natal-charts' AND
  (storage.foldername(name))[1] = 'charts' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can update their own charts"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'natal-charts' AND
  (storage.foldername(name))[1] = 'charts' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can delete their own charts"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'natal-charts' AND
  (storage.foldername(name))[1] = 'charts' AND
  (storage.foldername(name))[2] = auth.uid()::text
);