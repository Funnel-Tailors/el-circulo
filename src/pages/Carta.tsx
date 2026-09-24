import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import TestimonialsMarquee from "@/components/roadmap/TestimonialsMarquee";
import ScreenshotMarquee from "@/components/roadmap/ScreenshotMarquee";
import { supabase } from "@/integrations/supabase/client";
import { successCases } from "@/data/roadmap";
import { renderInline } from "@/components/carta/CartaInline";
import { useCartaBlocks } from "@/hooks/useCartaBlocks";
import type { CartaBlock } from "@/config/carta";

// Carta de ventas del lead magnet (vídeo de 35 min por email). Capta solo email
// y lo manda a GHL con las etiquetas "lead magnet" + "oferta" vía
// submit-lead-magnet, que es lo que dispara la automatización del envío.
// El contenido son bloques editables desde /admin/carta (config/carta.ts).

const leadSchema = z.object({
  email: z.string().trim().email("Revisa el email"),
  website: z.string().optional(), // honeypot
});
type LeadData = z.infer<typeof leadSchema>;

// Todos los testimonios en vídeo menos el de Marta.
const videoCases = successCases.filter((c) => c.name !== "Marta");

const bodyClass = "font-text text-[18px] md:text-[19px] leading-[1.65] text-foreground/85 space-y-6";

const List = ({ items }: { items: ReactNode[] }) => (
  <ul className="space-y-3 pl-5 list-disc marker:text-foreground/40">
    {items.map((item, i) => (
      <li key={i} className="pl-1">
        {item}
      </li>
    ))}
  </ul>
);

// Caja del formulario: sin fondo, borde blanco fino y el beam de luz del design
// system (energy-beam-border, premium-effects.css) recorriéndolo.
const boxClass =
  "relative rounded-2xl border border-white/25 p-6 md:p-8 energy-beam-border energy-beam-active";

interface LeadFormProps {
  done: boolean;
  onSuccess: () => void;
  source: string;
}

// Formulario reutilizable: cuando cualquier instancia acierta, `done` pasa a true
// en el padre y todas muestran el estado de éxito.
const LeadForm = ({ done, onSuccess, source }: LeadFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<LeadData>({
    resolver: zodResolver(leadSchema),
    defaultValues: { email: "", website: "" },
  });

  const handleSubmit = async (data: LeadData) => {
    if (data.website) return; // honeypot
    setSubmitting(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("submit-lead-magnet", {
        body: { email: data.email.trim().toLowerCase(), source },
      });
      if (error || !res?.success) throw error || new Error("lead_magnet");
      onSuccess();
    } catch (err) {
      console.error("lead magnet submit error:", err);
      toast.error("No pudimos apuntarte. Revisa el email e inténtalo otra vez.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className={`${boxClass} text-center space-y-2`}>
        <p className="font-display font-black text-xl md:text-2xl">Hecho. Mira tu correo.</p>
        <p className="text-sm text-muted-foreground">
          El vídeo va de camino. Si no lo ves en unos minutos, mira en spam o promociones y
          muévelo a tu bandeja principal.
        </p>
      </div>
    );
  }

  return (
    <div className={boxClass}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem className="absolute -left-[9999px]" aria-hidden="true" tabIndex={-1}>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input {...field} type="text" autoComplete="off" tabIndex={-1} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Tu mejor correo</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="tu@email.com"
                    autoComplete="email"
                    inputMode="email"
                    disabled={submitting}
                    className="text-base h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="lg" className="w-full h-12 text-base font-bold" disabled={submitting}>
            {submitting ? "Enviando…" : "Mándame el vídeo"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            35 minutos. Gratis. Directo a tu correo.
          </p>
        </form>
      </Form>
    </div>
  );
};

// Bloques de texto seguidos se agrupan en una misma columna con el ritmo del cuerpo.
type Segment = { kind: "text"; blocks: CartaBlock[] } | { kind: "block"; block: CartaBlock };

const TEXT_TYPES = new Set(["p", "strong", "list"]);

const toSegments = (blocks: CartaBlock[]): Segment[] => {
  const out: Segment[] = [];
  for (const block of blocks) {
    const last = out[out.length - 1];
    if (TEXT_TYPES.has(block.type)) {
      if (last?.kind === "text") last.blocks.push(block);
      else out.push({ kind: "text", blocks: [block] });
    } else {
      out.push({ kind: "block", block });
    }
  }
  return out;
};

const TextBlock = ({ block }: { block: CartaBlock }) => {
  switch (block.type) {
    case "p":
      return <p>{renderInline(block.text, block.id)}</p>;
    case "strong":
      return <p className="font-medium text-foreground">{renderInline(block.text, block.id)}</p>;
    case "list":
      return <List items={block.items.filter((t) => t.trim()).map((t, i) => renderInline(t, `${block.id}-${i}`))} />;
    default:
      return null;
  }
};

const column = "max-w-[640px] mx-auto px-5";

export const CartaContent = ({ blocks }: { blocks: CartaBlock[] }) => {
  const [done, setDone] = useState(false);
  const onSuccess = () => setDone(true);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <div className="pt-16 md:pt-24" />
      {toSegments(blocks).map((seg) => {
        if (seg.kind === "text") {
          return (
            <div key={seg.blocks[0].id} className={`${column} ${bodyClass}`}>
              {seg.blocks.map((b) => (
                <TextBlock key={b.id} block={b} />
              ))}
            </div>
          );
        }
        const b = seg.block;
        switch (b.type) {
          case "heading":
            return (
              <div key={b.id} className={column}>
                <h1 className="font-display font-black text-5xl md:text-7xl leading-[1em] tracking-[-0.03em] mb-12">
                  {renderInline(b.text, b.id)}
                </h1>
              </div>
            );
          case "form":
            return (
              <div key={b.id} className={`${column} my-10`}>
                <LeadForm done={done} onSuccess={onSuccess} source={b.source} />
              </div>
            );
          case "videos":
            return (
              <section key={b.id} className="max-w-6xl mx-auto pt-10 pb-6" aria-label="Testimonios en vídeo">
                <TestimonialsMarquee cases={videoCases} />
              </section>
            );
          case "screenshots":
            return (
              <section key={b.id} className="max-w-5xl mx-auto pt-6 pb-6" aria-label="Testimonios">
                <ScreenshotMarquee />
              </section>
            );
          default:
            return null;
        }
      })}
      <p className="pt-6 pb-20 text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground/60">
        El Círculo
      </p>
    </div>
  );
};

const Carta = () => {
  const { blocks, isLoading } = useCartaBlocks();
  // Sin flash de la versión por defecto mientras llega la editada.
  if (isLoading) return <div className="min-h-screen bg-background" />;
  return <CartaContent blocks={blocks} />;
};

export default Carta;
