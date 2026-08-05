-- HOLDING-PAGE-01: modo espera temporal mientras se reordenan los bloques
-- del itinerario. Tabla aislada de hybrid_registro_inscripciones (esto no
-- son registros/pagos, son leads para avisar cuando reabran las ventas).

CREATE TABLE public.hybrid_registro_lista_espera (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  correo TEXT NOT NULL,
  telefono TEXT NOT NULL,
  notificado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hybrid_registro_lista_espera_notificado
  ON public.hybrid_registro_lista_espera (notificado);

ALTER TABLE public.hybrid_registro_lista_espera ENABLE ROW LEVEL SECURITY;

-- Público: cualquier visitante puede dejar su reserva, pero no puede leer,
-- editar ni borrar ningún renglón (incluido el propio) — solo project_admin
-- (dashboard/CLI) exporta la lista para notificar cuando reabran ventas.
REVOKE ALL ON public.hybrid_registro_lista_espera FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT ON public.hybrid_registro_lista_espera TO anon;

CREATE POLICY "public can join lista de espera"
  ON public.hybrid_registro_lista_espera
  FOR INSERT
  TO anon
  WITH CHECK (notificado = false);
