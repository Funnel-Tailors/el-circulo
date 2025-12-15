-- Tabla para gestionar tokens baneados de /senda
CREATE TABLE public.senda_blacklist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ghl_contact_id TEXT NOT NULL UNIQUE,
  contact_name TEXT,
  reason TEXT NOT NULL CHECK (reason IN ('no_show', 'ghosted', 'not_admitted')),
  banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  banned_by TEXT DEFAULT 'admin'
);

-- RLS
ALTER TABLE public.senda_blacklist ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede verificar si está baneado (necesario para el hook)
CREATE POLICY "Anyone can check blacklist" ON public.senda_blacklist 
FOR SELECT USING (true);

-- Solo admins pueden insertar
CREATE POLICY "Admins can insert blacklist" ON public.senda_blacklist 
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Solo admins pueden eliminar (para desbanear)
CREATE POLICY "Admins can delete blacklist" ON public.senda_blacklist 
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));