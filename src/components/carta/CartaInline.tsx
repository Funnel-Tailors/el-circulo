import type { ReactNode } from "react";

// Énfasis de la carta: subrayado para las ideas clave, itálica para tono y apartes.
export const U = ({ children }: { children: ReactNode }) => (
  <span className="underline decoration-foreground/50 decoration-[1.5px] underline-offset-[5px] text-foreground">
    {children}
  </span>
);
export const I = ({ children }: { children: ReactNode }) => <em className="italic">{children}</em>;

// Convierte el marcado de la carta en nodos: __subrayado__ y *itálica* (anidables).
const TOKEN = /__(.+?)__|\*(.+?)\*/;

export const renderInline = (text: string, keyPrefix = "k"): ReactNode[] => {
  const out: ReactNode[] = [];
  let rest = text;
  let i = 0;
  while (rest) {
    const m = rest.match(TOKEN);
    if (!m || m.index === undefined) {
      out.push(rest);
      break;
    }
    if (m.index > 0) out.push(rest.slice(0, m.index));
    const key = `${keyPrefix}-${i++}`;
    if (m[1] !== undefined) out.push(<U key={key}>{renderInline(m[1], key)}</U>);
    else out.push(<I key={key}>{renderInline(m[2], key)}</I>);
    rest = rest.slice(m.index + m[0].length);
  }
  return out;
};
