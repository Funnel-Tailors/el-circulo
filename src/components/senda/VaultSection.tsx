import { motion } from "framer-motion";
import { Lock, Play, Bot } from "lucide-react";

interface VaultSectionProps {
  isVisible: boolean;
  class2Progress: number;
}

const VaultSection = ({ isVisible, class2Progress }: VaultSectionProps) => {
  const assistant1Unlocked = class2Progress >= 25;
  const assistant2Unlocked = class2Progress >= 50;

  return (
    <motion.section
      id="vault-section"
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: isVisible ? 1 : 0,
        clipPath: isVisible 
          ? "circle(150% at 50% 0%)" 
          : "circle(0% at 50% 0%)"
      }}
      transition={{ 
        duration: 1.2, 
        ease: [0.22, 1, 0.36, 1]
      }}
      className="relative z-20 pt-16 pb-24"
      style={{ 
        visibility: isVisible ? 'visible' : 'hidden',
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
    >
      {/* Decorative top glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center top, hsl(var(--foreground) / 0.1) 0%, transparent 70%)'
        }}
      />

      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <span className="text-foreground/40 text-sm tracking-[0.3em] uppercase mb-4 block">
              ⟡ Acceso Exclusivo ⟡
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground glow mb-4">
              LA BÓVEDA
            </h2>
            <p className="text-foreground/60 max-w-xl mx-auto">
              Has cruzado el umbral. Aquí encontrarás las herramientas 
              que transformarán tu forma de vender para siempre.
            </p>
          </motion.div>
        </div>

        {/* Separator */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-foreground/20" />
          <span className="text-foreground/30 text-xs">✦</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-foreground/20" />
        </div>

        {/* Video Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="glass-card-dark p-6 md:p-8 mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center">
              <Play className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Clase 2: El Avatar</h3>
              <p className="text-foreground/50 text-sm">45 minutos • Acceso inmediato</p>
            </div>
          </div>
          
          {/* Video placeholder */}
          <div className="aspect-video bg-background/50 rounded-lg border border-foreground/10 flex items-center justify-center">
            <div className="text-center">
              <Play className="w-12 h-12 text-foreground/30 mx-auto mb-3" />
              <p className="text-foreground/40 text-sm">Video Clase Avatar</p>
              <p className="text-foreground/20 text-xs mt-1">(URL pendiente)</p>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-foreground/50">Tu progreso</span>
              <span className="text-foreground/70">{class2Progress}%</span>
            </div>
            <div className="h-1 bg-foreground/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-foreground/40"
                initial={{ width: 0 }}
                animate={{ width: `${class2Progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </motion.div>

        {/* Separator */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className="h-px w-24 bg-gradient-to-r from-transparent to-foreground/20" />
          <span className="text-foreground/30 text-xs">⟡</span>
          <div className="h-px w-24 bg-gradient-to-l from-transparent to-foreground/20" />
        </div>

        {/* Assistants Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <h3 className="text-center text-foreground/50 text-sm tracking-[0.2em] uppercase mb-8">
            Asistentes IA Exclusivos
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Assistant 1 */}
            <div className={`glass-card-dark p-6 transition-all duration-500 ${
              !assistant1Unlocked ? 'opacity-50 grayscale' : ''
            }`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  assistant1Unlocked 
                    ? 'bg-foreground/10' 
                    : 'bg-foreground/5'
                }`}>
                  {assistant1Unlocked ? (
                    <Bot className="w-6 h-6 text-foreground" />
                  ) : (
                    <Lock className="w-5 h-5 text-foreground/40" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-foreground font-semibold mb-1">
                    El Arquitecto de Avatares
                  </h4>
                  <p className="text-foreground/50 text-sm mb-3">
                    Diseña tu cliente ideal con precisión quirúrgica
                  </p>
                  {!assistant1Unlocked ? (
                    <span className="text-foreground/30 text-xs">
                      🔒 Desbloquea al 25% de la clase
                    </span>
                  ) : (
                    <button className="dark-button text-sm py-2 px-4">
                      Abrir Asistente
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Assistant 2 */}
            <div className={`glass-card-dark p-6 transition-all duration-500 ${
              !assistant2Unlocked ? 'opacity-50 grayscale' : ''
            }`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  assistant2Unlocked 
                    ? 'bg-foreground/10' 
                    : 'bg-foreground/5'
                }`}>
                  {assistant2Unlocked ? (
                    <Bot className="w-6 h-6 text-foreground" />
                  ) : (
                    <Lock className="w-5 h-5 text-foreground/40" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-foreground font-semibold mb-1">
                    El Espejo de Dolores
                  </h4>
                  <p className="text-foreground/50 text-sm mb-3">
                    Descubre qué mantiene despierto a tu avatar por las noches
                  </p>
                  {!assistant2Unlocked ? (
                    <span className="text-foreground/30 text-xs">
                      🔒 Desbloquea al 50% de la clase
                    </span>
                  ) : (
                    <button className="dark-button text-sm py-2 px-4">
                      Abrir Asistente
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer separator */}
        <div className="flex items-center justify-center gap-4 mt-16">
          <div className="h-px w-32 bg-gradient-to-r from-transparent to-foreground/10" />
          <span className="text-foreground/20 text-xs">✦ ⟡ ✦</span>
          <div className="h-px w-32 bg-gradient-to-l from-transparent to-foreground/10" />
        </div>
      </div>
    </motion.section>
  );
};

export default VaultSection;
