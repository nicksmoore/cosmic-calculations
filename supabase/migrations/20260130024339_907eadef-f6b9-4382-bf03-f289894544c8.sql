-- Add user_id to natal_chart_pdfs table to associate charts with users
ALTER TABLE public.natal_chart_pdfs 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster user lookups
CREATE INDEX idx_natal_chart_pdfs_user_id ON public.natal_chart_pdfs(user_id);

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public insert" ON public.natal_chart_pdfs;
DROP POLICY IF EXISTS "Allow public select" ON public.natal_chart_pdfs;

-- Create new RLS policies for authenticated users
CREATE POLICY "Users can insert their own charts"
ON public.natal_chart_pdfs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own charts"
ON public.natal_chart_pdfs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own charts"
ON public.natal_chart_pdfs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own charts"
ON public.natal_chart_pdfs
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);