import { useState } from "react";
import Starfield from "@/components/quiz/Starfield";
import ShootingStars from "@/components/roadmap/ShootingStars";
import VaultPortal from "@/components/senda/VaultPortal";

const TestVault = () => {
  const [showPortal, setShowPortal] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);

  const handleUnlock = () => {
    setShowPortal(false);
    setVaultUnlocked(true);
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
            >
              Mostrar Portal (Vórtice)
            </button>

            <button
              onClick={() => setVaultUnlocked(false)}
              className="dark-button w-full py-3"
              disabled={!vaultUnlocked}
            >
              Reset Estado
            </button>
          </div>

          {vaultUnlocked && (
            <div className="mt-6 p-4 border border-emerald-500/30 bg-emerald-950/20 rounded-lg">
              <p className="text-emerald-400 text-sm">
                ✓ La Bóveda desbloqueada — aquí iría el smooth scroll
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
