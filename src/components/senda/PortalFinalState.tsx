import { motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ShootingStars from "@/components/roadmap/ShootingStars";
import Starfield from "@/components/quiz/Starfield";
import VortexEffect from "./VortexEffect";

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
    },
    completed: {
      title: "Has Atravesado",
      subtitle: "La iniciación está completa.",
      message: "Lo que viene después... ya lo descubrirás.",
    },
    expired: {
      title: "48 Horas",
      subtitle: "Ese era el plazo.",
      message: "La Senda no espera a quien no camina.",
    }
  };

  const { title, subtitle, message } = content[variant];
  const isStatic = variant === 'completed';

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <ShootingStars />
      <Starfield />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Vortex visual - exact copy from VaultPortal */}
        <div className="mb-12">
          <VortexEffect 
            size="md" 
            isStatic={isStatic}
            rotationSpeed={variant === 'expired' ? 20 : 15}
          />
        </div>

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
