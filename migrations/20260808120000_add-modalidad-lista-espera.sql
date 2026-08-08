-- Relanzamiento nueva fecha (13-15 noviembre): la Lista HYBRID ahora pregunta
-- cómo quiere vivir el evento la persona (Individual / En equipo / Aún
-- decidiendo). Columna nueva sobre la tabla existente de HOLDING-PAGE-01.

ALTER TABLE public.hybrid_registro_lista_espera
  ADD COLUMN modalidad TEXT NOT NULL DEFAULT 'decidiendo'
  CHECK (modalidad IN ('individual', 'equipo', 'decidiendo'));

-- El default solo existía para poblar filas ya insertadas antes de esta
-- migración; los inserts nuevos (vía submitListaEspera) siempre lo envían.
ALTER TABLE public.hybrid_registro_lista_espera
  ALTER COLUMN modalidad DROP DEFAULT;
