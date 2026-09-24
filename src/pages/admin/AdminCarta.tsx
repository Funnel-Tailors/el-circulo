import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Eraser, Italic, Plus, SplitSquareVertical, Trash2, Underline } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCartaBlocks } from "@/hooks/useCartaBlocks";
import { CartaContent } from "@/pages/Carta";
import {
  BLOCK_LABELS,
  CARTA_DEFAULT_BLOCKS,
  blocksToText,
  isTextBlock,
  newBlock,
  textToBlocks,
  type CartaBlock,
} from "@/config/carta";

// El editor trabaja con secciones: todo el texto entre dos CTAs/testimonios es
// una sola caja de texto; los CTAs y testimonios quedan como separadores.
type FixedBlock = Extract<CartaBlock, { type: "form" | "videos" | "screenshots" }>;
type Section = { kind: "text"; id: string; text: string } | { kind: "fixed"; block: FixedBlock };

const toSections = (blocks: CartaBlock[]): Section[] => {
  const out: Section[] = [];
  let run: CartaBlock[] = [];
  const flush = () => {
    if (run.length) out.push({ kind: "text", id: run[0].id, text: blocksToText(run) });
    run = [];
  };
  for (const b of blocks) {
    if (isTextBlock(b)) run.push(b);
    else {
      flush();
      out.push({ kind: "fixed", block: b as FixedBlock });
    }
  }
  flush();
  return out;
};

const toBlocks = (sections: Section[]): CartaBlock[] =>
  sections.flatMap((s) => (s.kind === "text" ? textToBlocks(s.text) : [s.block]));

// Junta cajas de texto que se quedan pegadas (p.ej. al quitar un CTA entre ellas).
const mergeText = (sections: Section[]): Section[] =>
  sections.reduce<Section[]>((acc, s) => {
    const last = acc[acc.length - 1];
    if (s.kind === "text" && last?.kind === "text") {
      acc[acc.length - 1] = { ...last, text: `${last.text.trimEnd()}\n\n${s.text.trimStart()}` };
    } else acc.push(s);
    return acc;
  }, []);

// Huella sin ids para saber si hay cambios sin guardar.
const fingerprint = (blocks: CartaBlock[]) =>
  JSON.stringify(blocks.map(({ id: _id, ...rest }) => rest));

const MARKS = { u: "__", i: "*" } as const;
const stripMarks = (t: string) => t.replace(/__(.+?)__/g, "$1").replace(/\*(.+?)\*/g, "$1");

// Caja de texto con toolbar: seleccionas y le das a Subrayar / Itálica (o ⌘U / ⌘I).
// Si la selección ya está marcada, el mismo botón la desmarca.
const TextSection = ({
  value,
  onChange,
  onSplit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSplit: (pos: number) => void;
}) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const pendingSel = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (pendingSel.current && ref.current) {
      ref.current.focus();
      ref.current.setSelectionRange(...pendingSel.current);
      pendingSel.current = null;
    }
  }, [value]);

  const apply = (kind: "u" | "i" | "clear") => {
    const el = ref.current;
    if (!el) return;
    let start = el.selectionStart;
    let end = el.selectionEnd;
    if (start === end) {
      toast.message("Selecciona primero el trozo de texto");
      return;
    }
    // No arrastrar espacios dentro de la marca.
    while (start < end && /\s/.test(value[start])) start++;
    while (end > start && /\s/.test(value[end - 1])) end--;
    const sel = value.slice(start, end);
    const before = value.slice(0, start);
    const after = value.slice(end);

    if (kind === "clear") {
      const clean = stripMarks(sel);
      pendingSel.current = [start, start + clean.length];
      onChange(before + clean + after);
      return;
    }

    const m = MARKS[kind];
    if (before.endsWith(m) && after.startsWith(m)) {
      pendingSel.current = [start - m.length, end - m.length];
      onChange(before.slice(0, -m.length) + sel + after.slice(m.length));
      return;
    }
    if (sel.startsWith(m) && sel.endsWith(m) && sel.length > m.length * 2) {
      const inner = sel.slice(m.length, -m.length);
      pendingSel.current = [start, start + inner.length];
      onChange(before + inner + after);
      return;
    }
    pendingSel.current = [start + m.length, end + m.length];
    onChange(before + m + sel + m + after);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.metaKey || e.ctrlKey)) return;
    const k = e.key.toLowerCase();
    if (k === "u" || k === "i") {
      e.preventDefault();
      apply(k);
    }
  };

  const keepFocus = (e: MouseEvent) => e.preventDefault();

  return (
    <div className="space-y-2">
      <div className="sticky top-[84px] z-[5] flex flex-wrap gap-1 bg-background/95 py-1">
        <Button type="button" size="sm" variant="outline" className="h-7 px-2 gap-1" onMouseDown={keepFocus} onClick={() => apply("u")}>
          <Underline className="h-3.5 w-3.5" /> Subrayar
        </Button>
        <Button type="button" size="sm" variant="outline" className="h-7 px-2 gap-1" onMouseDown={keepFocus} onClick={() => apply("i")}>
          <Italic className="h-3.5 w-3.5" /> Itálica
        </Button>
        <Button type="button" size="sm" variant="ghost" className="h-7 px-2 gap-1 text-muted-foreground" onMouseDown={keepFocus} onClick={() => apply("clear")}>
          <Eraser className="h-3.5 w-3.5" /> Quitar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 gap-1 text-muted-foreground ml-auto"
          onMouseDown={keepFocus}
          onClick={() => onSplit(ref.current?.selectionStart ?? value.length)}
        >
          <SplitSquareVertical className="h-3.5 w-3.5" /> CTA en el cursor
        </Button>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        spellCheck
        style={{ fieldSizing: "content" } as CSSProperties}
        className="w-full min-h-[160px] rounded-md border border-input bg-background px-4 py-3 font-text text-[15px] leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
    </div>
  );
};

const INSERTABLE = [
  { label: "Formulario (CTA)", make: (): Section => ({ kind: "fixed", block: newBlock("form") as FixedBlock }) },
  { label: "Testimonios en vídeo", make: (): Section => ({ kind: "fixed", block: newBlock("videos") as FixedBlock }) },
  { label: "Testimonios en pantallazo", make: (): Section => ({ kind: "fixed", block: newBlock("screenshots") as FixedBlock }) },
  { label: "Texto", make: (): Section => ({ kind: "text", id: crypto.randomUUID(), text: "" }) },
];

const Insert = ({ onAdd }: { onAdd: (s: Section) => void }) => (
  <div className="flex justify-center">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs text-muted-foreground/70">
          <Plus className="h-3 w-3" /> Insertar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {INSERTABLE.map((opt) => (
          <DropdownMenuItem key={opt.label} onClick={() => onAdd(opt.make())}>
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);

export default function AdminCarta() {
  const { blocks: saved, isLoading, save } = useCartaBlocks();
  const [sections, setSections] = useState<Section[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading) setSections(toSections(saved));
  }, [isLoading, saved]);

  const blocks = useMemo(() => toBlocks(sections), [sections]);
  const dirty = fingerprint(blocks) !== fingerprint(saved);

  const setText = (i: number, text: string) =>
    setSections((ss) => ss.map((s, j) => (j === i && s.kind === "text" ? { ...s, text } : s)));
  const setBlock = (i: number, block: FixedBlock) =>
    setSections((ss) => ss.map((s, j) => (j === i ? { kind: "fixed", block } : s)));
  const remove = (i: number) => setSections((ss) => mergeText(ss.filter((_, j) => j !== i)));
  const move = (i: number, d: -1 | 1) =>
    setSections((ss) => {
      const j = i + d;
      if (j < 0 || j >= ss.length) return ss;
      const next = [...ss];
      [next[i], next[j]] = [next[j], next[i]];
      return mergeText(next);
    });
  const insertAt = (i: number, s: Section) =>
    setSections((ss) => mergeText([...ss.slice(0, i), s, ...ss.slice(i)]));
  const split = (i: number, pos: number) =>
    setSections((ss) => {
      const s = ss[i];
      if (s.kind !== "text") return ss;
      const before = s.text.slice(0, pos).trimEnd();
      const after = s.text.slice(pos).trimStart();
      const parts: Section[] = [];
      if (before) parts.push({ ...s, text: before });
      parts.push({ kind: "fixed", block: newBlock("form") as FixedBlock });
      if (after) parts.push({ kind: "text", id: crypto.randomUUID(), text: after });
      return [...ss.slice(0, i), ...parts, ...ss.slice(i + 1)];
    });

  const onSave = async () => {
    setSaving(true);
    const ok = await save(blocks);
    setSaving(false);
    if (ok) toast.success("Carta guardada");
    else toast.error("No se guardó (¿permisos admin?)");
  };

  if (isLoading) return <div className="p-8 text-muted-foreground">Cargando…</div>;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="sticky top-0 z-10 -mx-6 md:-mx-8 px-6 md:px-8 py-3 bg-background/95 backdrop-blur border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Carta de ventas</h1>
          <p className="text-sm text-muted-foreground">
            Lead magnet en{" "}
            <a href="/" target="_blank" rel="noreferrer" className="underline">
              /
            </a>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm("¿Volver a la carta original? Lo editado se pierde al guardar.")) setSections(toSections(CARTA_DEFAULT_BLOCKS));
            }}
          >
            Original
          </Button>
          <Button variant="outline" size="sm" disabled={!dirty} onClick={() => setSections(toSections(saved))}>
            Descartar
          </Button>
          <Button size="sm" disabled={!dirty || saving} onClick={onSave}>
            {saving ? "Guardando…" : dirty ? "Guardar" : "Guardado"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="edit">
        <TabsList>
          <TabsTrigger value="edit">Editar</TabsTrigger>
          <TabsTrigger value="preview">Vista previa</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-2 pt-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Línea en blanco = párrafo nuevo · <code># </code>titular · <code>&gt; </code>destacado ·{" "}
            <code>- </code>punto de lista · selecciona texto y ⌘U subraya, ⌘I itálica
          </p>
          <Insert onAdd={(s) => insertAt(0, s)} />
          {sections.map((s, i) => (
            <div key={s.kind === "text" ? s.id : s.block.id} className="space-y-2">
              {s.kind === "text" ? (
                <TextSection value={s.text} onChange={(t) => setText(i, t)} onSplit={(pos) => split(i, pos)} />
              ) : (
                <div className="rounded-lg border border-dashed border-white/20 px-4 py-2.5 flex flex-wrap items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                    {s.block.type === "form" ? "CTA · formulario" : BLOCK_LABELS[s.block.type]}
                  </span>
                  {s.block.type === "form" && (
                    <div className="flex items-center gap-2">
                      <Label className="text-[11px] text-muted-foreground">source</Label>
                      <Input
                        value={s.block.source}
                        onChange={(e) => setBlock(i, { ...s.block, source: e.target.value } as FixedBlock)}
                        className="h-7 w-48 font-mono text-xs"
                      />
                    </div>
                  )}
                  <div className="ml-auto flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === 0} onClick={() => move(i, -1)}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === sections.length - 1} onClick={() => move(i, 1)}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(i)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
              <Insert onAdd={(ns) => insertAt(i + 1, ns)} />
            </div>
          ))}
        </TabsContent>

        <TabsContent value="preview" className="pt-4">
          {/* Sin interacción: que la vista previa no mande leads de verdad. */}
          <div className="rounded-xl border border-white/10 overflow-hidden pointer-events-none">
            <CartaContent blocks={blocks} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
