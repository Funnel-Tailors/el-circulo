-- 1. Primero eliminar la FK existente
ALTER TABLE brecha_progress 
DROP CONSTRAINT IF EXISTS brecha_progress_token_fkey;

-- 2. Actualizar tokens en brecha_leads a usar ghl_contact_id
UPDATE brecha_leads 
SET token = ghl_contact_id 
WHERE token != ghl_contact_id;

-- 3. Limpiar brecha_progress huérfanos y actualizar tokens válidos
DELETE FROM brecha_progress 
WHERE token NOT IN (SELECT token FROM brecha_leads);

-- 4. Eliminar el default actual del token
ALTER TABLE brecha_leads 
ALTER COLUMN token DROP DEFAULT;

-- 5. Recrear la FK con CASCADE
ALTER TABLE brecha_progress
ADD CONSTRAINT brecha_progress_token_fkey
FOREIGN KEY (token) REFERENCES brecha_leads(token)
ON UPDATE CASCADE
ON DELETE CASCADE;

-- 6. Crear función trigger para mantener token = ghl_contact_id
CREATE OR REPLACE FUNCTION set_brecha_token()
RETURNS TRIGGER AS $$
BEGIN
  NEW.token = NEW.ghl_contact_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Crear el trigger
DROP TRIGGER IF EXISTS brecha_token_trigger ON brecha_leads;
CREATE TRIGGER brecha_token_trigger
BEFORE INSERT OR UPDATE ON brecha_leads
FOR EACH ROW EXECUTE FUNCTION set_brecha_token();