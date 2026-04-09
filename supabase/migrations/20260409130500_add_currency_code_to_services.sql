ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS currency_code text NOT NULL DEFAULT 'USD';

ALTER TABLE public.services
ADD CONSTRAINT services_currency_code_len CHECK (char_length(currency_code) = 3);
