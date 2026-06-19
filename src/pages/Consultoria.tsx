import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { PitchDeck } from "@/components/consultoria/pitch/PitchDeck";

/**
 * /consultoria — Deck de venta high-ticket (presenter-led, full-screen).
 * Mikel comparte pantalla y narra; avanza con flechas/click. Arco de cierre
 * (Gap → value equation → poder de decidir). Roadmap atado a fechas reales.
 * El gate `consulting_enabled` (app_settings) lo muestra/oculta.
 */
const Consultoria = () => {
  const { data: enabled, isLoading } = useQuery({
    queryKey: ["consulting-enabled"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "consulting_enabled")
        .maybeSingle();
      return data?.value === true || data?.value === "true";
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "hsl(0 0% 5%)" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white"
        />
      </div>
    );
  }

  if (!enabled) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4 text-center text-foreground"
        style={{ background: "hsl(0 0% 5%)" }}
      >
        <div>
          <h1 className="mb-2 font-display text-2xl font-black uppercase glow">El Círculo</h1>
          <p className="text-sm text-foreground/50">La consultoría no está abierta ahora mismo.</p>
        </div>
      </div>
    );
  }

  return <PitchDeck />;
};

export default Consultoria;
