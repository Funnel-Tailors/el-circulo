---
name: resumen-reunion
description: Transcribe una reunión grabada con un cliente de El Círculo, escribe el resumen para su portal con la plantilla fija y lo publica en la sección "Reuniones". Úsalo cuando el usuario pida transcribir o resumir una reunión, subir una reunión/grabación al portal, o adjuntar un vídeo de llamada a un cliente.
---

# Reunión → transcripción → resumen → portal

Objetivo: que cada reunión quede en el portal del cliente (pestaña **Reuniones**) con el vídeo y un resumen **siempre con la misma estructura y tono**. El modelo de referencia es `ejemplo-resumen.md` (en esta carpeta): léelo antes de escribir.

## 1. Transcribir

```bash
python scripts/transcribe-meeting.py "<ruta del vídeo>" --out "<scratchpad>/reunion-AAAA-MM-DD"
```

- Lánzalo **en segundo plano**. Escribe en vivo, así que se puede mirar el avance en el `.txt`.
- Usa faster-whisper en GPU si puede. Si no, usa openai-whisper. Si cae a CPU lo avisa y es mucho más lento: en Windows suele ser porque faltan `pip install nvidia-cublas-cu12 "nvidia-cudnn-cu12==9.*"`. Con GPU, 50 min de reunión tardan pocos minutos.
- Genera `.txt` (bruto) y `.redacted.txt` (sin basura y con credenciales tachadas). Para el resumen y para guardar en el portal se usa **solo el `.redacted.txt`**.
- Si el script avisa de **posibles credenciales**, díselo al usuario con los minutos: en el vídeo se oyen. Ofrece dos salidas: que el cliente cambie la contraseña, o recortar el tramo sin recodificar (`ffmpeg -ss/-to` de las dos partes + `concat`).
- Nunca subas el vídeo ni la transcripción a ningún servicio externo. El vídeo lo aloja el usuario y te pasa la URL.

## 2. Escribir el resumen (markdown)

Estructura fija. Las secciones van en este orden; quita las que no apliquen.

```markdown
## De qué hablamos
1-2 frases: propósito de la reunión y resultado.

## Lo que vimos
**Bloque o herramienta**
- bullets concretos, en lenguaje de cliente (qué hace y para qué le sirve)

## Lo que dejamos hecho en la llamada
- accesos, conexiones o decisiones que quedaron cerradas durante la reunión

## Ideas que añadimos
- mejoras acordadas y para qué sirven

## Contexto
- (opcional) datos o referencias útiles que se comentaron

## Próximos pasos

**Por tu parte**
- …

**Por la nuestra**
- …

**Juntos**
- **Siguiente reunión / hito** con fecha si se dijo
```

Reglas:
- Español, **tuteando al cliente**, tono profesional y cercano. Frases cortas y concretas. Nada de relleno ni de autobombo.
- **Prohibidas las tablas**: el portal pinta el markdown con `react-markdown` sin GFM, así que una tabla sale como texto con barras. Usa encabezados `##`, negritas y bullets.
- Los próximos pasos se agrupan **por responsable** (Por tu parte / Por la nuestra / Juntos), nunca en tabla.
- **Fuera siempre:** charla personal (viajes, aficiones, vida privada), credenciales, datos de pago, comisiones o acuerdos económicos entre las partes (salvo que el usuario lo pida), y quejas o comentarios que puedan incomodar al cliente.
- No pongas como pendiente algo que ya sabes que está hecho (pregunta si dudas).
- Título de la reunión: descriptivo y corto (p. ej. "Revisión del sistema y puesta en marcha"), no "Reunión 1".

**Antes de publicar, enseña el borrador al usuario** y espera su ok.

## 3. Publicar en el portal

Tabla `consulting_meetings`: `project_id`, `title`, `meeting_date`, `video_url`, `summary` (markdown), `transcript` (solo admin; nunca llega al cliente), `visible_to_client`.

- **Opción A (manual):** admin → Consultoría → ficha del cliente → panel **Reuniones** → "+ Reunión". Pega el título, la fecha, el resumen y la transcripción, marca "Visible para el cliente" y guarda.
- **Opción B (SQL):** busca el `project_id` uniendo `consulting_projects` con `consulting_onboardings` por `legal_name`. Escribe un `.sql` en el scratchpad con dollar-quoting para no tener que escapar nada, y ejecútalo:

```sql
INSERT INTO consulting_meetings (project_id, title, meeting_date, video_url, summary, transcript, visible_to_client)
SELECT '<project_id>', '<título>', 'AAAA-MM-DD', NULL, $MT$<resumen>$MT$, $MT$<transcripción redactada>$MT$, true
WHERE NOT EXISTS (SELECT 1 FROM consulting_meetings WHERE project_id = '<project_id>' AND meeting_date = 'AAAA-MM-DD');
```

```bash
npx supabase db query --linked -f <archivo.sql>
```

- Sin `video_url`, el portal muestra "La grabación se está procesando". Cuando el usuario pase la URL:
  - comprueba con `curl -sI <url>` que devuelve 200 y `Content-Type: video/mp4` (o un enlace de YouTube, Vimeo, Loom o Drive, que se embeben solos);
  - después haz `UPDATE consulting_meetings SET video_url = '<url>' WHERE id = '<id>'`.
- La pestaña **Reuniones** solo aparece en el portal del cliente cuando tiene al menos una reunión visible.
