import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ShootingStars from "@/components/roadmap/ShootingStars";
import Starfield from "@/components/quiz/Starfield";

interface BlacklistedResultProps {
  reason: string;
}

const BlacklistedResult = ({ reason }: BlacklistedResultProps) => {
  const [portalClosed, setPortalClosed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setPortalClosed(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Copys brutales basados en PainSection y ClientBubble
  const messages: Record<string, { title: string; subtitle: string; message: string; footer: string }> = {
    no_show: {
      title: "El Portal Se Cierra",
      subtitle: "No apareciste.",
      message: "Tenías una cita. La confirmaste. Y no apareciste. Mientras tú ignorabas el calendario, alguien del Círculo cerraba un proyecto de 5.000€ en esa misma hora. Eso es lo que cuesta un no-show.",
      footer: "Este enlace ha sido revocado permanentemente."
    },
    ghosted: {
      title: "👻",
      subtitle: "Prometiste que no eras un fantasma.",
      message: "Te lo preguntamos directamente. Marcaste la casilla. \"No soy un fantasma. Voy a contestar.\" Y aquí estamos. Ghosting de manual. El Círculo no trabaja con gente que ignora WhatsApps como tú ignoras las revisiones de tus clientes.",
      footer: "El Círculo recuerda."
    },
    not_admitted: {
      title: "La Senda No Es Para Ti",
      subtitle: "Esto no es un curso para curiosos.",
      message: "La llamada lo dejó claro: no estás donde necesitas estar para que esto funcione. Sigues vendiendo por cuatro duros. Sigues persiguiendo clientes de mierda. Sigues culpando al algoritmo. Cuando dejes de hacer todo eso, quizá nos crucemos. O quizá no.",
      footer: "No hay segundas oportunidades."
    },
    cancelled: {
      title: "Cancelaste",
      subtitle: "A última hora. Como un profesional de manual.",
      message: "Bloqueaste un hueco que podría haber sido de alguien dispuesto a aparecer. Alguien que no cancela citas como cancela plazos de entrega. Alguien que respeta el tiempo de los demás porque respeta el suyo.",
      footer: "El hueco ya está ocupado. Por alguien que sí apareció."
    }
  };

  const content = messages[reason] || messages.no_show;

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <ShootingStars />
      <Starfield />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Vórtice cerrándose - inverso al de apertura */}
        <motion.div
          className="relative w-64 h-64 md:w-80 md:h-80 mb-8"
          initial={{ scale: 1, opacity: 1 }}
          animate={{
            scale: portalClosed ? 0 : 1,
            opacity: portalClosed ? 0 : 1,
            rotate: portalClosed ? -180 : 0
          }}
          transition={{
            duration: 2.5,
            ease: [0.16, 1, 0.3, 1]
          }}
        >
          {/* SVG del vórtice colapsando */}
          <motion.svg
            viewBox="0 0 400 400"
            className="w-full h-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <defs>
              <radialGradient id="closeGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.6" />
                <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0.1" />
              </radialGradient>
            </defs>

            {/* Spirales que colapsan */}
            {Array.from({ length: 8 }).map((_, i) => {
              const startAngle = (i / 8) * 360;
              return (
                <motion.path
                  key={i}
                  d={generateSpiralPath(startAngle)}
                  fill="none"
                  stroke="url(#closeGradient)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  initial={{ pathLength: 1 }}
                  animate={{ pathLength: portalClosed ? 0 : 1 }}
                  transition={{ duration: 2, ease: "easeIn" }}
                />
              );
            })}
          </motion.svg>

          {/* Centro negro que absorbe todo */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background"
            initial={{ width: 24, height: 24 }}
            animate={{
              width: portalClosed ? 400 : 24,
              height: portalClosed ? 400 : 24,
            }}
            transition={{
              duration: 2.5,
              ease: [0.16, 1, 0.3, 1]
            }}
            style={{
              boxShadow: '0 0 30px 15px rgba(0,0,0,0.8)'
            }}
          />
        </motion.div>

        {/* Mensaje que aparece después del colapso */}
        <motion.div
          className="text-center max-w-xl px-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{
            opacity: portalClosed ? 1 : 0,
            y: portalClosed ? 0 : 30
          }}
          transition={{ delay: 2.0, duration: 0.8 }}
        >
          <span className="text-5xl mb-6 block">🚫</span>

          <h1 className="text-3xl md:text-4xl font-display font-black text-foreground mb-4 glow">
            {content.title}
          </h1>

          <p className="text-xl md:text-2xl text-foreground/80 mb-6 font-medium">
            {content.subtitle}
          </p>

          <p className="text-foreground/60 mb-8 leading-relaxed">
            {content.message}
          </p>

          <p className="text-sm text-foreground/40 italic">
            {content.footer}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

// Helper para generar spiral path
function generateSpiralPath(startAngle: number): string {
  const cx = 200, cy = 200;
  const startRadius = 10;
  const endRadius = 90;
  const turns = 1.5;
  const steps = 30;

  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = startAngle + (t * turns * 360);
    const radius = startRadius + (t * (endRadius - startRadius));
    const rad = (angle * Math.PI) / 180;
    points.push({
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad)
    });
  }

  let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L${points[i].x.toFixed(1)},${points[i].y.toFixed(1)}`;
  }
  return d;
}

export default BlacklistedResult;
