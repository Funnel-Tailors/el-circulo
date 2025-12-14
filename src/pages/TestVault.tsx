import { useState, useRef } from "react";
import Starfield from "@/components/quiz/Starfield";
import ShootingStars from "@/components/roadmap/ShootingStars";
import VaultPortal from "@/components/senda/VaultPortal";
import VaultSection from "@/components/senda/VaultSection";

const TestVault = () => {
  const [showPortal, setShowPortal] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [class2Progress, setClass2Progress] = useState(0);
  const vaultSectionRef = useRef<HTMLDivElement>(null);

  const handleUnlock = () => {
    setShowPortal(false);
    setVaultUnlocked(true);
    
    // Smooth scroll to vault section after animation
    setTimeout(() => {
      vaultSectionRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 400);
  };

  const handleReset = () => {
    setVaultUnlocked(false);
    setClass2Progress(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Background effects */}
      <Starfield />
      <ShootingStars />
      
      {/* Gradient overlay */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'var(--gradient-overlay)' }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Test: Portal La Bóveda
          </h1>
          <p className="text-foreground/60 text-sm">
            Página de pruebas — eliminar después
          </p>
        </div>

        {/* Test Controls */}
        <div className="glass-card-dark p-8 max-w-md mx-auto text-center">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Controles de Prueba
          </h2>

          <div className="space-y-4">
            <button
              onClick={() => setShowPortal(true)}
              className="dark-button-primary w-full py-3"
              disabled={vaultUnlocked}
            >
              Mostrar Portal (Vórtice)
            </button>

            {vaultUnlocked && (
              <>
                <div className="pt-4 border-t border-foreground/10">
                  <p className="text-foreground/50 text-sm mb-3">Simular progreso Clase 2:</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setClass2Progress(25)}
                      className={`dark-button py-2 text-xs ${class2Progress >= 25 ? 'ring-1 ring-foreground/30' : ''}`}
                    >
                      25%
                    </button>
                    <button
                      onClick={() => setClass2Progress(50)}
                      className={`dark-button py-2 text-xs ${class2Progress >= 50 ? 'ring-1 ring-foreground/30' : ''}`}
                    >
                      50%
                    </button>
                    <button
                      onClick={() => setClass2Progress(100)}
                      className={`dark-button py-2 text-xs ${class2Progress >= 100 ? 'ring-1 ring-foreground/30' : ''}`}
                    >
                      100%
                    </button>
                  </div>
                </div>
              </>
            )}

            <button
              onClick={handleReset}
              className="dark-button w-full py-3"
              disabled={!vaultUnlocked}
            >
              Reset Todo
            </button>
          </div>

          {vaultUnlocked && (
            <div className="mt-6 p-4 border border-foreground/20 bg-foreground/5 rounded-lg">
              <p className="text-foreground/70 text-sm">
                ✓ La Bóveda desbloqueada — scroll abajo para ver
              </p>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-12 text-center text-foreground/40 text-xs max-w-lg mx-auto">
          <p className="mb-2">⟡ Versión actual: Vórtice SVG con 3 brazos espirales</p>
          <p>Rotación: 12s | Símbolo central fijo con breathe animation</p>
        </div>
      </div>

      {/* Vault Section - appears after unlock */}
      <div ref={vaultSectionRef}>
        <VaultSection 
          isVisible={vaultUnlocked} 
          class2Progress={class2Progress}
        />
      </div>

      {/* Portal Component */}
      <VaultPortal
        isOpen={showPortal}
        onClose={() => setShowPortal(false)}
        onUnlock={handleUnlock}
      />
    </div>
  );
};

export default TestVault;
