-- Reconciliación manual de pagos: staff anota el payment_id de Mercado
-- Pago (visible en su panel de MP) y notas libres al marcar un registro
-- como pagado. Columnas nullable, sin impacto en filas existentes.
-- No requiere cambios de RLS: anon no gana ninguna capacidad nueva (sigue
-- sin poder SELECT/UPDATE); solo project_admin llena estos campos.

ALTER TABLE public.hybrid_registro_inscripciones
  ADD COLUMN mp_payment_id TEXT,
  ADD COLUMN notes TEXT;

CREATE UNIQUE INDEX idx_hybrid_registro_mp_payment_id
  ON public.hybrid_registro_inscripciones (mp_payment_id)
  WHERE mp_payment_id IS NOT NULL;
