-- supabase/email_reports_schema.sql

-- Criação da tabela para armazenar as NFs lidas dos e-mails
CREATE TABLE IF NOT EXISTS public.email_delivery_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nf TEXT NOT NULL,
  destinatario TEXT NOT NULL,
  status TEXT NOT NULL,
  chegada TEXT,
  saida TEXT,
  email_subject TEXT,
  email_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT email_delivery_reports_nf_key UNIQUE (nf)
);

-- Permissões básicas
ALTER TABLE public.email_delivery_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.email_delivery_reports FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.email_delivery_reports FOR INSERT WITH CHECK (true);
-- OBS: Para a POC deixamos "insert for all users", mas em produção limite para o admin/servidor.
