-- Allow the public /inscribir form (anon) to upload and read QR ticket
-- images in the isolated 'hybrid-registro-qr' bucket only. No existing
-- storage.objects policies were present (fresh install), so this doesn't
-- touch access to any other bucket.

CREATE POLICY "hybrid_registro_qr anon select"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket = 'hybrid-registro-qr');

CREATE POLICY "hybrid_registro_qr anon insert"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket = 'hybrid-registro-qr');

GRANT USAGE ON SCHEMA storage TO anon;
GRANT SELECT, INSERT ON storage.objects TO anon;
