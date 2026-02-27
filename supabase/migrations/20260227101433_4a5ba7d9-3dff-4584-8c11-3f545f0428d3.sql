
-- Create featured_stocks table for admin-managed stock list
CREATE TABLE public.featured_stocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  company_name TEXT NOT NULL,
  exchange TEXT NOT NULL DEFAULT 'NSE',
  sector TEXT NOT NULL DEFAULT 'General',
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.featured_stocks ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can see featured stocks)
CREATE POLICY "Featured stocks are publicly readable"
ON public.featured_stocks
FOR SELECT
USING (true);

-- No public write - writes handled via edge function with service role
-- Create unique constraint on symbol
ALTER TABLE public.featured_stocks ADD CONSTRAINT featured_stocks_symbol_unique UNIQUE (symbol);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_featured_stocks_updated_at
BEFORE UPDATE ON public.featured_stocks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
