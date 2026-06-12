import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Row {
  token: string;
  first_name: string | null;
  whatsapp: string | null;
  created_at: string;
  attended: boolean;
  watched_pct: number;
  cta_clicks: number;
  last_activity_at: string | null;
}

export default function WebinarRegistrationsTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: regs }, { data: progs }] = await Promise.all([
      supabase
        .from("webinar_registrations")
        .select("token, first_name, whatsapp, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("webinar_progress")
        .select("token, first_visit_at, watched_pct, cta_clicks, last_activity_at"),
    ]);

    const progByToken = new Map(
      (progs ?? []).map((p) => [p.token, p])
    );

    const merged: Row[] = (regs ?? []).map((r) => {
      const p = progByToken.get(r.token);
      const ctas = Array.isArray(p?.cta_clicks) ? (p!.cta_clicks as unknown[]).length : 0;
      return {
        token: r.token,
        first_name: r.first_name,
        whatsapp: r.whatsapp,
        created_at: r.created_at,
        attended: !!p?.first_visit_at,
        watched_pct: p?.watched_pct ?? 0,
        cta_clicks: ctas,
        last_activity_at: p?.last_activity_at ?? null,
      };
    });
    setRows(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/webinardo/ver?token=${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Enlace copiado");
  };

  const exportCsv = () => {
    const header = ["Nombre", "WhatsApp", "Registrado", "Asistió", "% Visto", "CTAs", "Último acceso", "Enlace"];
    const lines = rows.map((r) =>
      [
        r.first_name ?? "",
        r.whatsapp ?? "",
        new Date(r.created_at).toISOString(),
        r.attended ? "sí" : "no",
        `${r.watched_pct}%`,
        String(r.cta_clicks),
        r.last_activity_at ? new Date(r.last_activity_at).toISOString() : "",
        `${window.location.origin}/webinardo/ver?token=${r.token}`,
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "webinardo-registros.csv";
    a.click();
  };

  const fmt = (s: string | null) =>
    s ? new Date(s).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? "Cargando…" : `${rows.length} registros`}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            Recargar
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!rows.length}>
            Export CSV
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">WhatsApp</th>
              <th className="p-3">Registrado</th>
              <th className="p-3">Asistió</th>
              <th className="p-3">% Visto</th>
              <th className="p-3">CTAs</th>
              <th className="p-3">Último acceso</th>
              <th className="p-3">Enlace</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.token} className="border-t">
                <td className="p-3 font-medium">{r.first_name ?? "—"}</td>
                <td className="p-3 text-muted-foreground">{r.whatsapp ?? "—"}</td>
                <td className="p-3 text-muted-foreground">{fmt(r.created_at)}</td>
                <td className="p-3">
                  <span className={r.attended ? "text-green-500" : "text-muted-foreground"}>
                    {r.attended ? "✓ sí" : "no"}
                  </span>
                </td>
                <td className="p-3">{r.watched_pct}%</td>
                <td className="p-3">{r.cta_clicks}</td>
                <td className="p-3 text-muted-foreground">{fmt(r.last_activity_at)}</td>
                <td className="p-3">
                  <Button variant="ghost" size="sm" onClick={() => copyLink(r.token)}>
                    Copiar
                  </Button>
                </td>
              </tr>
            ))}
            {!loading && !rows.length && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-muted-foreground">
                  Aún no hay registros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
