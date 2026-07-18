import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useNewsletterSettings } from "@/hooks/useNewsletterSettings";
import NewsletterLeadsTable from "@/components/admin/NewsletterLeadsTable";

export default function AdminNewsletter() {
  const { settings, isLoading, setKey } = useNewsletterSettings();

  const [enabled, setEnabled] = useState(true);
  const [eyebrow, setEyebrow] = useState("");
  const [h1, setH1] = useState("");
  const [subhead, setSubhead] = useState("");
  const [lead, setLead] = useState("");
  const [body, setBody] = useState(""); // párrafos separados por línea en blanco
  const [ctaButton, setCtaButton] = useState("");
  const [ctaSub, setCtaSub] = useState("");
  const [ps, setPs] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    const c = settings.copy;
    setEnabled(settings.enabled);
    setEyebrow(c.eyebrow);
    setH1(c.h1);
    setSubhead(c.subhead);
    setLead(c.lead);
    setBody(c.body.join("\n\n"));
    setCtaButton(c.ctaButton);
    setCtaSub(c.ctaSub);
    setPs(c.ps);
  }, [isLoading, settings]);

  const save = async () => {
    setSaving(true);
    const bodyArr = body
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    const ok = await Promise.all([
      setKey("newsletter_enabled", enabled),
      setKey("newsletter_copy", {
        eyebrow: eyebrow.trim(),
        h1: h1.trim(),
        subhead: subhead.trim(),
        lead: lead.trim(),
        body: bodyArr,
        ctaButton: ctaButton.trim(),
        ctaSub: ctaSub.trim(),
        ps: ps.trim(),
      }),
    ]);
    setSaving(false);
    if (ok.every(Boolean)) toast.success("Configuración guardada");
    else toast.error("Algo no se guardó (¿permisos de admin?)");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">La Letra (Newsletter)</h1>
        <p className="text-muted-foreground">
          Carta de ventas en <code className="font-mono">/newsletter</code> · leads → GHL tag{" "}
          <code className="font-mono">nuevosletra</code>
        </p>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList>
          <TabsTrigger value="config">⚙️ Configuración</TabsTrigger>
          <TabsTrigger value="leads">👥 Suscriptores</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <div className="max-w-2xl space-y-5 bg-card p-6 rounded-lg border">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              <span className="text-sm">Newsletter activa (página publicada)</span>
            </label>

            <div className="space-y-1.5">
              <Label>Eyebrow (línea pequeña de arriba)</Label>
              <Input value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Headline (H1)</Label>
              <Textarea rows={2} value={h1} onChange={(e) => setH1(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Subhead</Label>
              <Textarea rows={2} value={subhead} onChange={(e) => setSubhead(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Primera línea de la carta (lead)</Label>
              <Textarea rows={2} value={lead} onChange={(e) => setLead(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Cuerpo de la carta</Label>
              <Textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} />
              <p className="text-xs text-muted-foreground">
                Un párrafo por bloque. Separa cada párrafo con una línea en blanco.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Texto del botón (CTA)</Label>
              <Input value={ctaButton} onChange={(e) => setCtaButton(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Sub-texto bajo el botón</Label>
              <Input value={ctaSub} onChange={(e) => setCtaSub(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Posdata (P.D.)</Label>
              <Textarea rows={3} value={ps} onChange={(e) => setPs(e.target.value)} />
            </div>

            <p className="text-xs text-muted-foreground">
              Los bullets ("esto es lo que te llega") y las FAQ viven en{" "}
              <code className="font-mono">src/config/newsletter.ts</code>.
            </p>

            <Button onClick={save} disabled={saving}>
              {saving ? "Guardando…" : "Guardar configuración"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          <NewsletterLeadsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
