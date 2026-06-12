import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useWebinarSettings } from "@/hooks/useWebinarSettings";
import WebinarRegistrationsTable from "@/components/admin/WebinarRegistrationsTable";

const toLocalInput = (d: Date | null) => {
  if (!d) return "";
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 16);
};

export default function AdminWebinar() {
  const { settings, isLoading, setKey } = useWebinarSettings();

  const [enabled, setEnabled] = useState(true);
  const [mode, setMode] = useState<"evergreen" | "launch">("evergreen");
  const [date, setDate] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [h1, setH1] = useState("");
  const [subhead, setSubhead] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    setEnabled(settings.enabled);
    setMode(settings.mode);
    setDate(toLocalInput(settings.date));
    setVideoUrl(settings.videoUrl);
    setH1(settings.copy.h1);
    setSubhead(settings.copy.subhead);
  }, [isLoading, settings]);

  const save = async () => {
    setSaving(true);
    const ok = await Promise.all([
      setKey("webinar_enabled", enabled),
      setKey("webinar_mode", mode),
      setKey("webinar_date", mode === "launch" && date ? new Date(date).toISOString() : null),
      setKey("webinar_video_url", videoUrl),
      setKey("webinar_copy", { h1, subhead }),
    ]);
    setSaving(false);
    if (ok.every(Boolean)) toast.success("Configuración guardada");
    else toast.error("Algo no se guardó (¿permisos de admin?)");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Webinardo Creativos</h1>
        <p className="text-muted-foreground">Configuración, registros y tracking</p>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList>
          <TabsTrigger value="config">⚙️ Configuración</TabsTrigger>
          <TabsTrigger value="registros">👥 Registros</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <div className="max-w-xl space-y-5 bg-card p-6 rounded-lg border">
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              <span className="text-sm">Webinardo activo (página de registro publicada)</span>
            </label>

            <div className="space-y-1.5">
              <Label>Modo</Label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as "evergreen" | "launch")}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="evergreen">Evergreen (acceso inmediato)</option>
                <option value="launch">En directo (con fecha y countdown)</option>
              </select>
            </div>

            {mode === "launch" && (
              <div className="space-y-1.5">
                <Label>Fecha y hora del directo</Label>
                <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>URL del vídeo del webinardo</Label>
              <Input
                placeholder="https://…"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Headline (H1)</Label>
              <Input value={h1} onChange={(e) => setH1(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Subhead</Label>
              <Input value={subhead} onChange={(e) => setSubhead(e.target.value)} />
            </div>

            <p className="text-xs text-muted-foreground">
              El resto del copy (bullets, FAQ, CTA) vive en{" "}
              <code className="font-mono">src/config/webinardo.ts</code>.
            </p>

            <Button onClick={save} disabled={saving}>
              {saving ? "Guardando…" : "Guardar configuración"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="registros" className="space-y-6">
          <WebinarRegistrationsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
