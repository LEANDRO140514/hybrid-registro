-- PLANB-LANDING-01: dedicated, isolated table for the emergency /inscribir
-- landing. Kept separate from the existing pending_registrations/orders
-- tables (different schema, different consumer) to avoid coupling this
-- temporary flow to the live hybrid-event-landing sandbox checkout data.

CREATE TABLE public.hybrid_registro_inscripciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_code TEXT NOT NULL,
  category_name TEXT NOT NULL,
  category_bloque TEXT NOT NULL,
  team_name TEXT,
  participants JSONB NOT NULL DEFAULT '[]'::jsonb,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MXN',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hybrid_registro_inscripciones_category_code
  ON public.hybrid_registro_inscripciones (category_code);

CREATE INDEX idx_hybrid_registro_inscripciones_status
  ON public.hybrid_registro_inscripciones (status);

ALTER TABLE public.hybrid_registro_inscripciones ENABLE ROW LEVEL SECURITY;

-- Public form: anonymous visitors may create a pending registration, but
-- may not read, edit, or delete any row (including their own) — only
-- project_admin (dashboard/CLI) reviews and reconciles registrations.
REVOKE ALL ON public.hybrid_registro_inscripciones FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT ON public.hybrid_registro_inscripciones TO anon;

CREATE POLICY "public can submit pending registration"
  ON public.hybrid_registro_inscripciones
  FOR INSERT
  TO anon
  WITH CHECK (status = 'pending');

CREATE TRIGGER hybrid_registro_inscripciones_updated_at
  BEFORE UPDATE ON public.hybrid_registro_inscripciones
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();
