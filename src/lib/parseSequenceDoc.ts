// Lee una secuencia de cold email redactada en texto (pegada desde el doc) y la parte en pasos.
// Marcadores reconocidos (en cualquier orden razonable):
//   "Subject: …" / "Asunto: …"            → abre un email nuevo con ese asunto
//   "Email 2: día 3 (en hilo)"            → abre un email nuevo el día 3; "en hilo" = sin asunto
// Lo que va antes del primer marcador (título, borradores sueltos) se ignora.

export type ParsedStep = { subject: string; body: string; day: number; threaded: boolean };

const SUBJECT_RE = /^(?:subject|asunto)\s*:\s*(.*)$/i;
const EMAIL_RE = /^email\s*(\d+)\s*[:\-–—]?\s*(?:d[ií]a|day)\s*(\d+)\s*(.*)$/i;

export function parseSequenceDoc(text: string): ParsedStep[] {
  const steps: (ParsedStep & { lines: string[]; fromHeader: boolean })[] = [];
  const cur = () => steps[steps.length - 1];
  const nextDay = () => (steps.length ? cur().day + 3 : 0);

  for (const raw of text.replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    const email = line.match(EMAIL_RE);
    if (email) {
      steps.push({ subject: "", body: "", day: Number(email[2]) || 0, threaded: /hilo|thread/i.test(email[3]), lines: [], fromHeader: true });
      continue;
    }
    const subject = line.match(SUBJECT_RE);
    if (subject) {
      const c = cur();
      // "Email 3: día 7" seguido de "Subject: …" es el mismo email.
      if (c && c.fromHeader && !c.subject && !c.lines.some((l) => l)) { c.subject = subject[1].trim(); c.threaded = false; }
      else steps.push({ subject: subject[1].trim(), body: "", day: nextDay(), threaded: false, lines: [], fromHeader: false });
      continue;
    }
    if (steps.length) cur().lines.push(line);
  }

  return steps.map(({ lines, fromHeader: _f, ...s }) => ({
    ...s,
    body: lines.join("\n").replace(/\n{3,}/g, "\n\n").trim(),
  })).filter((s) => s.body);
}
