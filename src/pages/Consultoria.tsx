import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CONSULTORIA_ROADMAP, ROADMAP_NAME } from "@/data/consultoriaRoadmap";

const FOR_WHOM = [
  "Facturas bien pero dependes del boca a boca y te regatean cada proyecto.",
  "Ejecutas de lujo, pero no tienes un sistema que te traiga clientes de forma predecible.",
  "Quieres dejar de perseguir y que te lleguen proyectos de 5.000€+ sin rezar.",
];

const Consultoria = () => {
  const navigate = useNavigate();

  const { data: enabled, isLoading } = useQuery({
    queryKey: ["consulting-enabled"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("value").eq("key", "consulting_enabled").maybeSingle();
      return data?.value === true || data?.value === "true";
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 text-center">
        <div>
          <h1 className="text-2xl font-bold glow mb-2">El Círculo</h1>
          <p className="text-muted-foreground">La consultoría no está abierta ahora mismo.</p>
        </div>
      </div>
    );
  }

  const goOnboarding = () => navigate("/consultoria/onboarding");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 pt-20 pb-12 text-center">
        <span className="inline-block text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
          Consultoría DFY · El Círculo
        </span>
        <h1 className="text-3xl sm:text-5xl font-black uppercase leading-[1.05] glow">
          Te montamos todo el sistema.<br />Tú ejecutas tu trabajo.
        </h1>
        <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          En 3 meses construimos contigo tu máquina de adquisición de principio a fin: oferta, cliente ideal,
          anuncios, CRM, captación, embudo y tu carta de ventas en vídeo. Done-For-You de verdad.
        </p>
        <div className="mt-8">
          <Button variant="premium" size="xl" onClick={goOnboarding}>
            Empezar onboarding <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Para quién */}
      <section className="max-w-2xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold mb-5 text-center">¿Esto es para ti?</h2>
        <div className="grid gap-3">
          {FOR_WHOM.map((t) => (
            <Card key={t} className="p-4 bg-background/60 border-border flex items-start gap-3">
              <Check className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-sm text-foreground/90">{t}</span>
            </Card>
          ))}
        </div>
      </section>

      {/* Roadmap */}
      <section className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">El roadmap</span>
          <h2 className="text-2xl font-black uppercase glow mt-2">{ROADMAP_NAME}</h2>
          <p className="text-sm text-muted-foreground mt-2">3 meses, por bloques. Claridad en cada paso.</p>
        </div>
        <div className="grid gap-3">
          {CONSULTORIA_ROADMAP.map((phase) => (
            <Card key={phase.key} className="p-5 bg-background/60 border-border flex gap-4 items-start">
              <span className="text-2xl leading-none">{phase.rune}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{phase.title}</span>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{phase.weeks}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{phase.tagline}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {phase.milestones.map((m) => (
                    <span key={m.key} className="text-[11px] px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                      {m.title}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-black uppercase glow">Deja de depender de la suerte.</h2>
        <p className="mt-4 text-muted-foreground">
          El onboarding es online y tarda 3 minutos: datos, pago, acuerdo y agendamos tu llamada.
        </p>
        <div className="mt-8">
          <Button variant="premium" size="xl" onClick={goOnboarding}>
            Empezar onboarding <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Consultoria;
