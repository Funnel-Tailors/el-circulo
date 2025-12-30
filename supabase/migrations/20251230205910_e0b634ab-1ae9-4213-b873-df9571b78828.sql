-- Add access_override column to brecha_leads for admin control
ALTER TABLE brecha_leads 
ADD COLUMN access_override text DEFAULT null;

-- Add comment explaining the column
COMMENT ON COLUMN brecha_leads.access_override IS 'Admin override for access: grant_full_access gives full access to disqualified leads';