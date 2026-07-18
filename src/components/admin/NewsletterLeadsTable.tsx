import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Row {
  email: string;
  source: string | null;
  is_active: boolean;
  created_at: string;
}

export default function NewsletterLeadsTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("newsletter_leads")
      .select("email, source, is_active, created_at")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const exportCsv = () => {
    const header = ["Email", "Origen", "Activo", "Suscrito"];
    const lines = rows.map((r) =>
      [
        r.email,
        r.source ?? "",
        r.is_active ? "sí" : "no",
        new Date(r.created_at).toISOString(),
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "newsletter-leads.csv";
    a.click();
  };

  const fmt = (s: string) =>
    new Date(s).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? "Cargando…" : `${rows.length} suscriptores`}
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
              <th className="p-3">Email</th>
              <th className="p-3">Origen</th>
              <th className="p-3">Activo</th>
              <th className="p-3">Suscrito</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.email} className="border-t">
                <td className="p-3 font-medium">{r.email}</td>
                <td className="p-3 text-muted-foreground">{r.source ?? "—"}</td>
                <td className="p-3">
                  <span className={r.is_active ? "text-green-500" : "text-muted-foreground"}>
                    {r.is_active ? "✓ sí" : "no"}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">{fmt(r.created_at)}</td>
              </tr>
            ))}
            {!loading && !rows.length && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-muted-foreground">
                  Aún no hay suscriptores.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
