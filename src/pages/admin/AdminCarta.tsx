import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Eraser, Italic, Plus, Trash2, Underline } from "lucide-react";
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
import { renderInline } from "@/components/carta/CartaInline";
import { CartaContent } from "@/pages/Carta";
import {
  BLOCK_LABELS,
  CARTA_DEFAULT_BLOCKS,
  newBlock,
  type CartaBlock,
  type CartaBlockType,
} from "@/config/carta";

const MARKS = { u: "__", i: "*" } as const;

// Quita el marcado de un trozo de texto.
const stripMarks = (t: string) => t.replace(/__(.+?)__/g, "$1").replace(/\*(.+?)\*/g, "$1");

// Textarea con toolbar: seleccionas texto y le das a Subrayar / Itálica (o ⌘U / ⌘I).
// Si la selección ya está marcada, el mismo botón la desmarca.
const MarkupField = ({
  value,
  onChange,
  rows = 3,
  preview = true,
  previewClass = "font-text text-[17px] leading-[1.6] text-foreground/85",
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  preview?: boolean;
  previewClass?: string;
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
    while (start < end && value[start] === " ") start++;
    while (end > start && value[end - 1] === " ") end--;
    const sel = value.slice(start, end);

    if (kind === "clear") {
      const clean = stripMarks(sel);
      pendingSel.current = [start, start + clean.length];
      onChange(value.slice(0, start) + clean + value.slice(end));
      return;
    }

    const m = MARKS[kind];
    const before = value.slice(0, start);
    const after = value.slice(end);
    // Ya marcado por fuera → desmarcar.
    if (before.endsWith(m) && after.startsWith(m)) {
      pendingSel.current = [start - m.length, end - m.length];
      onChange(before.slice(0, -m.length) + sel + after.slice(m.length));
      return;
    }
    // Selección que incluye las marcas → desmarcar.
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

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        <Button type="button" size="sm" variant="outline" className="h-7 px-2 gap-1" onMouseDown={(e) => e.preventDefault()} onClick={() => apply("u")}>
          <Underline className="h-3.5 w-3.5" /> Subrayar
        </Button>
        <Button type="button" size="sm" variant="outline" className="h-7 px-2 gap-1" onMouseDown={(e) => e.preventDefault()} onClick={() => apply("i")}>
          <Italic className="h-3.5 w-3.5" /> Itálica
        </Button>
        <Button type="button" size="sm" variant="ghost" className="h-7 px-2 gap-1 text-muted-foreground" onMouseDown={(e) => e.preventDefault()} onClick={() => apply("clear")}>
          <Eraser className="h-3.5 w-3.5" /> Quitar
        </Button>
      </div>
      <textarea
        ref={ref}
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        style={{ fieldSizing: "content" } as CSSProperties}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      {preview && value.trim() && <div className={previewClass}>{renderInline(value)}</div>}
    </div>
  );
};

const ADDABLE: CartaBlockType[] = ["p", "strong", "list", "heading", "form", "videos", "screenshots"];

const AddBlock = ({ onAdd }: { onAdd: (t: CartaBlockType) => void }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground">
        <Plus className="h-3.5 w-3.5" /> Añadir bloque aquí
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      {ADDABLE.map((t) => (
        <DropdownMenuItem key={t} onClick={() => onAdd(t)}>
          {BLOCK_LABELS[t]}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

const BlockEditor = ({ block, onChange }: { block: CartaBlock; onChange: (b: CartaBlock) => void }) => {
  switch (block.type) {
    case "heading":
      return (
        <MarkupField
          value={block.text}
          rows={2}
          onChange={(text) => onChange({ ...block, text })}
          previewClass="font-display font-black text-3xl leading-[1em] tracking-[-0.03em]"
        />
      );
    case "p":
      return <MarkupField value={block.text} onChange={(text) => onChange({ ...block, text })} />;
    case "strong":
      return (
        <MarkupField
          value={block.text}
          rows={2}
          onChange={(text) => onChange({ ...block, text })}
          previewClass="font-text text-[17px] leading-[1.6] font-medium text-foreground"
        />
      );
    case "list":
      return (
        <div className="space-y-3">
          {block.items.map((item, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="mt-9 text-muted-foreground">•</span>
              <div className="flex-1">
                <MarkupField
                  value={item}
                  rows={2}
                  onChange={(v) => onChange({ ...block, items: block.items.map((x, j) => (j === i ? v : x)) })}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="mt-8 h-7 w-7"
                onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="h-7 gap-1" onClick={() => onChange({ ...block, items: [...block.items, ""] })}>
            <Plus className="h-3.5 w-3.5" /> Punto
          </Button>
        </div>
      );
    case "form":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Source (para saber desde qué formulario entra el lead)</Label>
          <Input value={block.source} onChange={(e) => onChange({ ...block, source: e.target.value })} className="h-8 font-mono text-xs" />
        </div>
      );
    default:
      return <p className="text-xs text-muted-foreground">Sección fija, solo se puede mover o quitar.</p>;
  }
};

export default function AdminCarta() {
  const { blocks: saved, isLoading, save } = useCartaBlocks();
  const [blocks, setBlocks] = useState<CartaBlock[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading) setBlocks(saved);
  }, [isLoading, saved]);

  const dirty = JSON.stringify(blocks) !== JSON.stringify(saved);

  const update = (i: number, b: CartaBlock) => setBlocks((bs) => bs.map((x, j) => (j === i ? b : x)));
  const remove = (i: number) => setBlocks((bs) => bs.filter((_, j) => j !== i));
  const move = (i: number, d: -1 | 1) =>
    setBlocks((bs) => {
      const j = i + d;
      if (j < 0 || j >= bs.length) return bs;
      const next = [...bs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const insertAt = (i: number, t: CartaBlockType) =>
    setBlocks((bs) => [...bs.slice(0, i), newBlock(t), ...bs.slice(i)]);

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
            </a>{" "}
            · selecciona texto y dale a Subrayar / Itálica (⌘U / ⌘I)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm("¿Volver a la carta original? Se pierde lo editado al guardar.")) setBlocks(CARTA_DEFAULT_BLOCKS);
            }}
          >
            Original
          </Button>
          <Button variant="outline" size="sm" disabled={!dirty} onClick={() => setBlocks(saved)}>
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

        <TabsContent value="edit" className="space-y-1 pt-4">
          <AddBlock onAdd={(t) => insertAt(0, t)} />
          {blocks.map((b, i) => (
            <div key={b.id} className="space-y-1">
              <div className="rounded-xl border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {BLOCK_LABELS[b.type]}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === 0} onClick={() => move(i, -1)}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === blocks.length - 1} onClick={() => move(i, 1)}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(i)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <BlockEditor block={b} onChange={(nb) => update(i, nb)} />
              </div>
              <AddBlock onAdd={(t) => insertAt(i + 1, t)} />
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
