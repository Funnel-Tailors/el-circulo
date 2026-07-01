import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useConfirmationSettings } from "@/hooks/useConfirmationSettings";
import type { ConfirmBreakout, ConfirmAuthority } from "@/config/confirmation";

export default function AdminConfirmation() {
  const { settings, isLoading, setKey } = useConfirmationSettings();

  const [enabled, setEnabled] = useState(true);
  const [eyebrow, setEyebrow] = useState("");
  const [headline, setHeadline] = useState("");
  const [subhead, setSubhead] = useState("");
  const [heroLabel, setHeroLabel] = useState("");
  const [heroVideoUrl, setHeroVideoUrl] = useState("");
  const [breakouts, setBreakouts] = useState<ConfirmBreakout[]>([]);
  const [authority, setAuthority] = useState<ConfirmAuthority[]>([]);
  const [expectations, setExpectations] = useState("");
  const [waNumber, setWaNumber] = useState("");
  const [waNote, setWaNote] = useState("");
  const [showTestimonials, setShowTestimonials] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    setEnabled(settings.enabled);
    setEyebrow(settings.copy.eyebrow);
    setHeadline(settings.copy.headline);
    setSubhead(settings.copy.subhead);
    setHeroLabel(settings.copy.heroLabel);
    setHeroVideoUrl(settings.heroVideoUrl);
    setBreakouts(settings.breakouts);
    setAuthority(settings.authority);
    setExpectations(settings.expectations);
    setWaNumber(settings.contact.whatsapp);
    setWaNote(settings.contact.note);
    setShowTestimonials(settings.showTestimonials);
  }, [isLoading, settings]);

  const save = async () => {
    setSaving(true);
    const ok = await Promise.all([
      setKey("confirm_enabled", enabled),
      setKey("confirm_copy", { eyebrow, headline, subhead, heroLabel }),
      setKey("confirm_hero_video_url", heroVideoUrl.trim()),
      setKey(
        "confirm_breakouts",
        breakouts.filter((b) => b.title.trim() || b.videoUrl.trim())
      ),
      setKey(
        "confirm_authority",
        authority.filter((a) => a.label.trim() || a.url.trim())
      ),
      setKey("confirm_expectations", expectations),
      setKey("confirm_contact", { whatsapp: waNumber.trim(), note: waNote }),
      setKey("confirm_show_testimonials", showTestimonials),
    ]);
    setSaving(false);
    if (ok.every(Boolean)) toast.success("Página de gracias guardada");
    else toast.error("Algo no se guardó (¿permisos admin?)");
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Página de gracias (VSL)</h1>
          <p className="text-sm text-muted-foreground">
            Post-booking de la llamada estratégica ·{" "}
            <a href="/gracias" target="_blank" rel="noreferrer" className="underline">
              ver /gracias
            </a>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={enabled} onCheckedChange={setEnabled} id="enabled" />
          <Label htmlFor="enabled" className="text-sm">Activa</Label>
        </div>
      </div>

      {/* Copy cabecera */}
      <div className="rounded-xl border border-white/10 p-4 space-y-3">
        <h2 className="font-semibold text-sm text-foreground">Cabecera</h2>
        <div className="space-y-1.5">
          <Label className="text-xs">Eyebrow</Label>
          <Input value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Headline (usa <code>&lt;glow&gt;palabra&lt;/glow&gt;</code> para el acento)</Label>
          <Input value={headline} onChange={(e) => setHeadline(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Subhead</Label>
          <Textarea value={subhead} onChange={(e) => setSubhead(e.target.value)} className="min-h-[70px]" />
        </div>
      </div>

      {/* Vídeo hero */}
      <div className="rounded-xl border border-white/10 p-4 space-y-3">
        <h2 className="font-semibold text-sm text-foreground">Vídeo hero</h2>
        <p className="text-xs text-muted-foreground">URL de embed (Wistia/YouTube/Vimeo) o un .mp4. Vacío = slot "próximamente".</p>
        <div className="space-y-1.5">
          <Label className="text-xs">Titulillo encima del vídeo</Label>
          <Input value={heroLabel} onChange={(e) => setHeroLabel(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">URL del vídeo hero</Label>
          <Input value={heroVideoUrl} onChange={(e) => setHeroVideoUrl(e.target.value)} placeholder="https://fast.wistia.net/embed/iframe/..." />
        </div>
      </div>

      {/* Breakouts */}
      <div className="rounded-xl border border-white/10 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm text-foreground">Breakout videos</h2>
          <Button size="sm" variant="outline" onClick={() => setBreakouts([...breakouts, { title: "", videoUrl: "" }])}>
            <Plus className="h-4 w-4 mr-1" /> Añadir
          </Button>
        </div>
        {breakouts.length === 0 && <p className="text-xs text-muted-foreground">Sin breakouts todavía.</p>}
        {breakouts.map((b, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1 space-y-1.5">
              <Input
                value={b.title}
                placeholder="Título / pregunta"
                onChange={(e) => setBreakouts(breakouts.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
              />
              <Input
                value={b.videoUrl}
                placeholder="URL del vídeo (vacío = próximamente)"
                onChange={(e) => setBreakouts(breakouts.map((x, j) => (j === i ? { ...x, videoUrl: e.target.value } : x)))}
              />
            </div>
            <Button size="icon" variant="ghost" onClick={() => setBreakouts(breakouts.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4 text-red-400" />
            </Button>
          </div>
        ))}
      </div>

      {/* Autoridad */}
      <div className="rounded-xl border border-white/10 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm text-foreground">Autoridad (opcional)</h2>
          <Button size="sm" variant="outline" onClick={() => setAuthority([...authority, { label: "", url: "" }])}>
            <Plus className="h-4 w-4 mr-1" /> Añadir
          </Button>
        </div>
        {authority.map((a, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input
              value={a.label}
              placeholder="Etiqueta (p.ej. Caso FLOC €80k)"
              onChange={(e) => setAuthority(authority.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
            />
            <Input
              value={a.url}
              placeholder="https://..."
              onChange={(e) => setAuthority(authority.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
            />
            <Button size="icon" variant="ghost" onClick={() => setAuthority(authority.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4 text-red-400" />
            </Button>
          </div>
        ))}
      </div>

      {/* Expectativas */}
      <div className="rounded-xl border border-white/10 p-4 space-y-3">
        <h2 className="font-semibold text-sm text-foreground">Qué pasa ahora (markdown)</h2>
        <Textarea value={expectations} onChange={(e) => setExpectations(e.target.value)} className="min-h-[200px] font-mono text-xs" />
      </div>

      {/* Contacto + testimonios */}
      <div className="rounded-xl border border-white/10 p-4 space-y-3">
        <h2 className="font-semibold text-sm text-foreground">Contacto</h2>
        <div className="space-y-1.5">
          <Label className="text-xs">WhatsApp (número internacional o link wa.me — vacío lo oculta)</Label>
          <Input value={waNumber} onChange={(e) => setWaNumber(e.target.value)} placeholder="+34600000000" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Nota junto al botón</Label>
          <Input value={waNote} onChange={(e) => setWaNote(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Switch checked={showTestimonials} onCheckedChange={setShowTestimonials} id="testis" />
          <Label htmlFor="testis" className="text-sm">Mostrar sección de testimonios</Label>
        </div>
      </div>

      <Button onClick={save} disabled={saving || isLoading} className="w-full">
        {saving ? "Guardando…" : "Guardar página de gracias"}
      </Button>
    </div>
  );
}
