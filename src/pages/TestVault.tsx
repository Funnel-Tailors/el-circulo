import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Starfield from "@/components/quiz/Starfield";
import ShootingStars from "@/components/roadmap/ShootingStars";
import VaultPortal from "@/components/senda/VaultPortal";
import VaultSection from "@/components/senda/VaultSection";
import { useVideoDrops } from "@/hooks/useVideoDrops";
import { VideoDropOverlay } from "@/components/senda/VideoDropOverlay";
import { DropsInventory } from "@/components/senda/DropsInventory";
import { RitualSequenceModal } from "@/components/senda/RitualSequenceModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const TestVault = () => {
  const navigate = useNavigate();
  const [initialLoading, setInitialLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [showPortal, setShowPortal] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [class2Progress, setClass2Progress] = useState(0);
  const vaultSectionRef = useRef<HTMLDivElement>(null);

  // Drops testing state
  const [selectedClass, setSelectedClass] = useState<1 | 2>(1);
  const [showDropDemo, setShowDropDemo] = useState(false);
  const [showRitualModal, setShowRitualModal] = useState(false);

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roles) {
        toast({
          variant: 'destructive',
          title: 'Acceso denegado',
          description: 'No tienes permisos de administrador',
        });
        navigate('/');
        return;
      }

      setIsAdmin(true);
      setInitialLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const {
    drops,
    capturedDrops,
    activeDrop,
    checkForDrop,
    captureDrop,
    resetDrops,
    allCaptured,
  } = useVideoDrops({
    sessionId: 'test-vault-drops',
    classNumber: selectedClass,
    onCapture: (drop) => console.log('Captured:', drop.symbol),
    onMiss: (drop) => console.log('Missed:', drop.symbol),
    onAllCaptured: () => console.log('All drops captured!'),
  });

  const handleUnlock = () => {
    setShowPortal(false);
    setVaultUnlocked(true);
    
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

  // Loading screen
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    );
  }

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

        {/* DROPS TEST SECTION */}
        <div className="glass-card-dark p-8 max-w-lg mx-auto text-center mt-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            🎮 Test: Minijuego de Drops
          </h2>
          
          {/* Selector de clase */}
          <div className="flex justify-center gap-2 mb-6">
            <button
              onClick={() => {
                setSelectedClass(1);
                resetDrops();
              }}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedClass === 1 
                  ? 'bg-primary text-primary-foreground' 
                  : 'dark-button'
              }`}
            >
              Clase 1 (3 drops)
            </button>
            <button
              onClick={() => {
                setSelectedClass(2);
                resetDrops();
              }}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedClass === 2 
                  ? 'bg-primary text-primary-foreground' 
                  : 'dark-button'
              }`}
            >
              Clase 2 (5 drops)
            </button>
          </div>

          {/* Lista de drops y botones para simular */}
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-6">
            {drops.map((drop) => {
              const isCaptured = capturedDrops.some(d => d.id === drop.id);
              return (
                <button
                  key={drop.id}
                  onClick={() => {
                    if (!isCaptured) {
                      checkForDrop(drop.timestamp + 0.001);
                    }
                  }}
                  disabled={isCaptured}
                  className={`
                    p-3 rounded-lg text-2xl transition-all
                    ${isCaptured 
                      ? 'bg-primary/20 text-primary opacity-50 cursor-not-allowed' 
                      : 'dark-button hover:bg-foreground/10'
                    }
                  `}
                  title={`Timestamp: ${Math.round(drop.timestamp * 100)}%`}
                >
                  {drop.symbol}
                  <span className="block text-xs mt-1 opacity-50">
                    {Math.round(drop.timestamp * 100)}%
                  </span>
                </button>
              );
            })}
          </div>

          {/* Toggle área de demo */}
          <button
            onClick={() => setShowDropDemo(!showDropDemo)}
            className="dark-button-primary w-full py-3 mb-4"
          >
            {showDropDemo ? 'Ocultar Área de Demo' : 'Mostrar Área de Demo'}
          </button>
          
          <button
            onClick={resetDrops}
            className="dark-button w-full py-3"
          >
            🔄 Reset Drops
          </button>

          <button
            onClick={() => setShowRitualModal(true)}
            className="dark-button w-full py-3 mt-2"
            disabled={capturedDrops.length < 2}
          >
            🔮 Test Modal Ritual (ordenar secuencia)
          </button>
          
          {/* Info estado actual */}
          <div className="mt-4 text-xs text-foreground/50">
            <p>Capturados: {capturedDrops.length}/{drops.length}</p>
            <p>Drop activo: {activeDrop ? activeDrop.symbol : 'ninguno'}</p>
            <p>Todos capturados: {allCaptured ? '✅ Sí' : '❌ No'}</p>
          </div>
        </div>

        {/* Drop Demo Area */}
        {showDropDemo && (
          <div className="glass-card-dark p-4 max-w-2xl mx-auto mt-8">
            <div 
              className="relative bg-black/50 rounded-lg overflow-hidden"
              style={{ height: '300px' }}
            >
              <VideoDropOverlay 
                activeDrop={activeDrop} 
                onCapture={captureDrop} 
              />
              
              <div className="absolute inset-0 flex items-center justify-center text-foreground/30 text-center px-4">
                {activeDrop 
                  ? `¡Haz clic en ${activeDrop.symbol} para capturarlo!` 
                  : 'Haz clic en un símbolo arriba para activar un drop'
                }
              </div>
            </div>
          </div>
        )}

        {/* Drops Inventory */}
        <div className="max-w-2xl mx-auto">
          <DropsInventory 
            capturedDrops={capturedDrops}
            totalDrops={drops.length}
            allCaptured={allCaptured}
          />
        </div>
      </div>

      {/* Vault Section - appears after unlock */}
      <div ref={vaultSectionRef}>
        <VaultSection 
          isVisible={vaultUnlocked} 
          class2Progress={class2Progress}
          onClass2Progress={setClass2Progress}
          token="test-token"
        />
      </div>

      {/* Portal Component */}
      <VaultPortal
        isOpen={showPortal}
        onClose={() => setShowPortal(false)}
        onUnlock={handleUnlock}
      />

      {/* Ritual Sequence Modal */}
      <RitualSequenceModal
        isOpen={showRitualModal}
        capturedDrops={capturedDrops}
        onSequenceComplete={() => {
          console.log('Sequence completed!');
          toast({
            title: '✦ Secuencia correcta',
            description: 'El ritual ha sido completado',
          });
          setShowRitualModal(false);
        }}
        onSequenceFailed={() => {
          console.log('Sequence failed!');
        }}
        onClose={() => setShowRitualModal(false)}
      />
    </div>
  );
};

export default TestVault;
