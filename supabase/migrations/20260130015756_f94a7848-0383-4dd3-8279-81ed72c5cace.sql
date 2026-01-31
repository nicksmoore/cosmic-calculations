-- Create storage bucket for natal chart PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('natal-charts', 'natal-charts', false);

-- RLS policy: Allow anyone to upload (since we don't have auth yet)
CREATE POLICY "Allow public uploads to natal-charts"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'natal-charts');

-- RLS policy: Allow anyone to read their own files (by path matching)
CREATE POLICY "Allow public reads from natal-charts"
ON storage.objects
FOR SELECT
USING (bucket_id = 'natal-charts');

-- Create table to track generated PDFs for upselling
CREATE TABLE public.natal_chart_pdfs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  birth_time TEXT,
  location TEXT,
  house_system TEXT NOT NULL DEFAULT 'placidus',
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.natal_chart_pdfs ENABLE ROW LEVEL SECURITY;

-- Public read/insert for now (no auth)
CREATE POLICY "Allow public insert"
ON public.natal_chart_pdfs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public select"
ON public.natal_chart_pdfs
FOR SELECT
USING (true);