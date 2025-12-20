import { motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ShootingStars from "@/components/roadmap/ShootingStars";
import Starfield from "@/components/quiz/Starfield";

interface PortalFinalStateProps {
  variant: 'scheduled' | 'completed' | 'expired';
  callDate?: Date | null;
}

const PortalFinalState = ({ variant, callDate }: PortalFinalStateProps) => {
  const content = {
    scheduled: {
      title: "Tu Momento Se Acerca",
      subtitle: callDate 
        ? `Llamada: ${format(callDate, "d 'de' MMMM 'a las' HH:mm", { locale: es })}`
        : "Tu llamada está programada",
      message: "El contenido se ha consumido. Solo queda el paso final. Prepárate.",
      portalColor: "hsl(var(--primary))",
      pulseIntensity: 1.1
    },
    completed: {
      title: "Has Atravesado",
      subtitle: "La iniciación está completa.",
      message: "Lo que viene después... ya lo descubrirás.",
      portalColor: "hsl(var(--muted-foreground))",
      pulseIntensity: 1.0
    },
    expired: {
      title: "48 Horas",
      subtitle: "Ese era el plazo.",
      message: "La Senda no espera a quien no camina.",
      portalColor: "hsl(var(--destructive))",
      pulseIntensity: 0.95
    }
  };

  const { title, subtitle, message, pulseIntensity } = content[variant];
  const isStatic = variant === 'completed';

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <ShootingStars />
      <Starfield />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Portal visual */}
        <motion.div
          className="relative w-64 h-64 md:w-80 md:h-80 mb-12"
          animate={isStatic ? {} : {
            scale: [1, pulseIntensity, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <defs>
              <radialGradient id="portalGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={isStatic ? 0.2 : 0.6} />
                <stop offset="70%" stopColor="hsl(var(--foreground))" stopOpacity={isStatic ? 0.1 : 0.3} />
                <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0.05" />
              </radialGradient>
              <filter id="portalGlow">
                <feGaussianBlur stdDeviation={isStatic ? 2 : 4} result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Anillos concéntricos */}
            {[0.9, 0.7, 0.5, 0.3].map((scale, i) => (
              <motion.circle
                key={i}
                cx="200"
                cy="200"
                r={180 * scale}
                fill="none"
                stroke="url(#portalGradient)"
                strokeWidth={isStatic ? 1 : 2}
                filter="url(#portalGlow)"
                animate={isStatic ? {} : {
                  r: [180 * scale, 180 * scale * 1.02, 180 * scale],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{
                  duration: 2 + i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.2
                }}
              />
            ))}

            {/* Centro */}
            <motion.circle
              cx="200"
              cy="200"
              r="30"
              fill="hsl(var(--background))"
              animate={isStatic ? {} : {
                r: [28, 32, 28]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.8))'
              }}
            />
          </svg>

          {/* Resplandor exterior */}
          {!isStatic && (
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: [
                  '0 0 40px 10px hsla(var(--foreground) / 0.1)',
                  '0 0 60px 20px hsla(var(--foreground) / 0.2)',
                  '0 0 40px 10px hsla(var(--foreground) / 0.1)'
                ]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
        </motion.div>

        {/* Texto */}
        <motion.div
          className="text-center max-w-xl px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <h1 className="text-3xl md:text-4xl font-display font-black text-foreground mb-4 glow">
            {title}
          </h1>

          <p className="text-xl md:text-2xl text-foreground/80 mb-6 font-medium">
            {subtitle}
          </p>

          <p className="text-foreground/60 leading-relaxed">
            {message}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default PortalFinalState;
