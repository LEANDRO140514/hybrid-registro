-- SIMULACRO-PRO-01: modulo de captacion de interes para una eventual
-- modalidad Pro (Individual Pro / Dobles Pro), separado de las
-- inscripciones reales. Dejar los datos aqui NO es una inscripcion
-- confirmada — solo expresa interes para que Direccion Deportiva evalue
-- abrir la modalidad segun volumen.

CREATE TABLE public.hybrid_registro_simulacro_pro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  correo TEXT NOT NULL,
  telefono TEXT NOT NULL,
  individual_pro TEXT,
  dobles_pro TEXT,
  contactado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT individual_pro_valido CHECK (individual_pro IS NULL OR individual_pro IN ('hombre', 'mujer')),
  CONSTRAINT dobles_pro_valido CHECK (dobles_pro IS NULL OR dobles_pro IN ('hombres', 'mujeres', 'mixto')),
  CONSTRAINT al_menos_una_modalidad CHECK (individual_pro IS NOT NULL OR dobles_pro IS NOT NULL)
);

CREATE INDEX idx_hybrid_registro_simulacro_pro_contactado
  ON public.hybrid_registro_simulacro_pro (contactado);

ALTER TABLE public.hybrid_registro_simulacro_pro ENABLE ROW LEVEL SECURITY;

-- Publico: cualquier visitante puede dejar su interes, pero no puede leer,
-- editar ni borrar ningun renglon (incluido el propio) — solo
-- project_admin (dashboard/CLI) revisa y contacta.
REVOKE ALL ON public.hybrid_registro_simulacro_pro FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT ON public.hybrid_registro_simulacro_pro TO anon;

CREATE POLICY "public can express interes en simulacro pro"
  ON public.hybrid_registro_simulacro_pro
  FOR INSERT
  TO anon
  WITH CHECK (contactado = false);
