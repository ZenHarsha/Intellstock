
-- Create user portfolios table
CREATE TABLE public.user_portfolios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  company_name TEXT NOT NULL,
  exchange TEXT NOT NULL DEFAULT 'NSE',
  sector TEXT NOT NULL DEFAULT 'General',
  quantity INTEGER NOT NULL DEFAULT 1,
  avg_buy_price NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, symbol)
);

-- Enable RLS
ALTER TABLE public.user_portfolios ENABLE ROW LEVEL SECURITY;

-- Users can only see their own portfolio
CREATE POLICY "Users can view own portfolio"
ON public.user_portfolios FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert into their own portfolio
CREATE POLICY "Users can insert own portfolio"
ON public.user_portfolios FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own portfolio
CREATE POLICY "Users can update own portfolio"
ON public.user_portfolios FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete from their own portfolio
CREATE POLICY "Users can delete own portfolio"
ON public.user_portfolios FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_portfolios_updated_at
BEFORE UPDATE ON public.user_portfolios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
