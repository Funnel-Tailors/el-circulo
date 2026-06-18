# Deploy — El Círculo (Supabase propio + Vercel)

Backend en **Supabase propio** (controlado por CLI) y frontend en **Vercel** (auto-deploy desde GitHub). Sin Lovable.

## Una sola vez — crear y enlazar el proyecto

1. Crea un proyecto en https://supabase.com (tu cuenta). Apunta: **Project ref**, **URL**, **anon key**, **service_role key**, **DB password**.
2. Login + link del CLI:
   ```bash
   supabase login            # pega tu Personal Access Token de supabase.com
   supabase link --project-ref <NUEVO_REF>
   ```
3. Actualiza `project_id` en `supabase/config.toml` con `<NUEVO_REF>`.
4. Levanta el esquema completo (todas las migraciones):
   ```bash
   npm run db:push           # = supabase db push
   ```
5. Secrets (se regeneran en origen; no dependen de Lovable):
   ```bash
   supabase secrets set GHL_API_TOKEN=...   GHL_LOCATION_ID=...
   # opcionales (solo si usas La Brecha):
   supabase secrets set BRECHA_API_KEY=...  BRECHA_BASE_URL=...
   ```
   - `GHL_API_TOKEN`: genera un token nuevo en GoHighLevel.
   - `GHL_LOCATION_ID`: en Settings de GHL.
6. Despliega las edge functions:
   ```bash
   npm run fn:deploy         # = supabase functions deploy (todas)
   ```
7. Crea tu usuario admin: regístrate en `/auth` y luego, en el SQL editor de Supabase:
   ```sql
   INSERT INTO user_roles(user_id, role) VALUES ('<tu_uid>', 'admin');
   ```
8. Frontend → nuevo proyecto:
   - Local: `.env` con `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (anon), `VITE_SUPABASE_PROJECT_ID` del proyecto nuevo.
   - Vercel → Project Settings → Environment Variables: las mismas. Redeploy.

## Día a día

| Acción | Comando |
|---|---|
| Nueva migración de esquema | `npm run db:new <nombre>` → editas el `.sql` → `npm run db:push` |
| Desplegar 1 función | `supabase functions deploy <fn>` |
| Desplegar todas las funciones | `npm run fn:deploy` |
| Nuevo secret | `supabase secrets set CLAVE=valor` |
| Frontend | `git push` → Vercel deploya solo |

## Notas
- La función `generate-analytics-insights` usa `LOVABLE_API_KEY` (IA de analytics del admin). Queda inactiva hasta cambiarla a Anthropic/OpenAI.
- Custom fields que conviene crear en GHL: `consulting_invoice_number`, `consulting_total`, `consulting_legal_name`, `consulting_tax_id`, `circulo_portal_user`, `circulo_portal_password`.
