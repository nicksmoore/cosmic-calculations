-- Add NOT NULL constraint to user_id column to ensure all charts are properly owned
ALTER TABLE public.natal_chart_pdfs ALTER COLUMN user_id SET NOT NULL;