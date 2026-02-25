import { useState, useRef } from "react";
import Starfield from "@/components/quiz/Starfield";
import ShootingStars from "@/components/roadmap/ShootingStars";
import VaultPortal from "@/components/senda/VaultPortal";
import { useVideoDrops } from "@/hooks/useVideoDrops";
import { VideoDropOverlay } from "@/components/senda/VideoDropOverlay";
import { DropsInventory } from "@/components/senda/DropsInventory";
import { RitualSequenceModal } from "@/components/senda/RitualSequenceModal";
import { EndlessTools3D } from "@/components/senda/EndlessTools3D";

import { toast } from "@/hooks/use-toast";

// Drops config info for display
const DROPS_INFO: Record<number, { count: number; windowMs: number; autoCapture: boolean }> = {
  1: { count: 3, windowMs: 10000, autoCapture: true },
  2: { count: 5, windowMs: 8000, autoCapture: true },
  3: { count: 4, windowMs: 7000, autoCapture: true },
  4: { count: 5, windowMs: 4000, autoCapture: false },
  5: { count: 3, windowMs: 4000, autoCapture: false },
  6: { count: 5, windowMs: 4000, autoCapture: false },
};

export default function AdminDevTools() {
  const [showPortal, setShowPortal] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [class2Progress, setClass2Progress] = useState(0);
  const vaultSectionRef = useRef<HTMLDivElement>(null);

  // Drops testing state
  const [selectedClass, setSelectedClass] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [showDropDemo, setShowDropDemo] = useState(false);
  const [showRitualModal, setShowRitualModal] = useState(false);
  const [simulatedMissedDrops, setSimulatedMissedDrops] = useState<string[]>([]);

  // 3D Element testing state
  const [element3DSize, setElement3DSize] = useState<"sm" | "md" | "lg" | "xl">("md");
  const [showGlow, setShowGlow] = useState(true);
  const [showFloat, setShowFloat] = useState(true);

  // OTO Preview state
  const [otoPreviewMode, setOtoPreviewMode] = useState<"mobile" | "desktop">("desktop");

  const {
    drops,
    capturedDrops,
    activeDrop,
    checkForDrop,
    captureDrop,
    resetDrops,
    allCaptured,
    hasAutoCapture,
  } = useVideoDrops({
    sessionId: "test-vault-drops",
    classNumber: selectedClass,
    onCapture: (drop) => console.log("Captured:", drop.symbol),
    onMiss: (drop) => {
      console.log("Missed:", drop.symbol);
      setSimulatedMissedDrops((prev) => [...prev, drop.id]);
    },
    onAllCaptured: () => console.log("All drops captured!"),
  });

  const handleUnlock = () => {
    setShowPortal(false);
    setVaultUnlocked(true);

    setTimeout(() => {
      vaultSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 400);
  };

  const handleReset = () => {
    setVaultUnlocked(false);
    setClass2Progress(0);
    setSimulatedMissedDrops([]);
    resetDrops();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClassChange = (classNum: 1 | 2 | 3 | 4 | 5 | 6) => {
    setSelectedClass(classNum);
    setSimulatedMissedDrops([]);
    resetDrops();
  };

  const currentConfig = DROPS_INFO[selectedClass];

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Background effects */}
      <Starfield />
      <ShootingStars />

      {/* Gradient overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: "var(--gradient-overlay)" }} />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dev Tools</h1>
          <p className="text-foreground/60 text-sm">Testing de componentes Portal, Drops, 3D</p>
        </div>

        {/* Test Controls */}
        <div className="glass-card-dark p-6 max-w-md mx-auto text-center">
          <h2 className="text-lg font-semibold text-foreground mb-4">Portal La Bóveda</h2>

          <div className="space-y-3">
            <button onClick={() => setShowPortal(true)} className="dark-button-primary w-full py-2" disabled={vaultUnlocked}>
              Mostrar Portal (Vórtice)
            </button>

            {vaultUnlocked && (
              <div className="pt-3 border-t border-foreground/10">
                <p className="text-foreground/50 text-xs mb-2">Simular progreso Clase 2:</p>
                <div className="grid grid-cols-3 gap-2">
                  {[25, 50, 100].map((p) => (
                    <button
                      key={p}
                      onClick={() => setClass2Progress(p)}
                      className={`dark-button py-1.5 text-xs ${class2Progress >= p ? "ring-1 ring-foreground/30" : ""}`}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button onClick={handleReset} className="dark-button w-full py-2" disabled={!vaultUnlocked}>
              Reset Todo
            </button>
          </div>
        </div>

        {/* ===== BRECHA FOOTER COMPLETO (Preview) ===== */}
        <div className="glass-card-dark p-6 rounded-xl max-w-4xl mx-auto mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Footer Completo — El Círculo</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setOtoPreviewMode("mobile")}
                className={`px-3 py-1 rounded text-sm ${otoPreviewMode === "mobile" ? "bg-foreground text-background" : "bg-foreground/10 text-foreground/70"}`}
              >
                Mobile
              </button>
              <button
                onClick={() => setOtoPreviewMode("desktop")}
                className={`px-3 py-1 rounded text-sm ${otoPreviewMode === "desktop" ? "bg-foreground text-background" : "bg-foreground/10 text-foreground/70"}`}
              >
                Desktop
              </button>
            </div>
          </div>

          {/* PREVIEW CONTAINER */}
          <div className={`mx-auto ${otoPreviewMode === "mobile" ? "max-w-sm" : "max-w-2xl"}`}>
            
            {/* ===== REVEAL ÉPICO ===== */}
            <div className="text-center mb-8">
              {/* Badge */}
              <div className="inline-block mb-4">
                <div className="glass-card-dark px-5 py-1.5 rounded-full border border-primary/30">
                  <span className="text-primary text-xs font-medium">✦ EL CONSEJO HA HABLADO ✦</span>
                </div>
              </div>
              
              <h2 className="text-2xl md:text-4xl font-display font-black glow mb-3">
                Viajero, has demostrado ser digno.
              </h2>
              
              <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                Tu viaje por La Brecha te ha otorgado una{" "}
                <span className="text-foreground font-semibold">Beca Parcial de €500</span>. 
                Ahora tienes acceso exclusivo a El Círculo.
              </p>

              {/* Value Stack COMPLETO */}
              <div className="glass-card-dark p-5 rounded-xl mb-8 text-left">
                <p className="text-foreground/60 text-xs uppercase tracking-wider mb-3 text-center">
                  ADEMÁS de todo lo que has visto:
                </p>
                <div className="space-y-1.5 text-sm text-foreground/80">
                  <p className="flex items-start gap-2"><span className="text-primary mt-0.5">✦</span><span>Onboarding 1-1 de bienvenida conmigo</span></p>
                  <p className="flex items-start gap-2"><span className="text-primary mt-0.5">✦</span><span>Directos cada semana</span></p>
                  <p className="flex items-start gap-2"><span className="text-primary mt-0.5">✦</span><span>Chat 24/7</span></p>
                  <p className="flex items-start gap-2"><span className="text-primary mt-0.5">✦</span><span>Hoja de ruta: crear y lanzar en 3 días</span></p>
                  <p className="flex items-start gap-2"><span className="text-primary mt-0.5">✦</span><span>El embudo de los 70.000€</span></p>
                  <p className="flex items-start gap-2"><span className="text-primary mt-0.5">✦</span><span>Clases: Automatizaciones, Social Funnels, Landings, VSLs validados</span></p>
                  <p className="flex items-start gap-2"><span className="text-primary mt-0.5">✦</span><span>Creación de asistentes IA + IA generativa para creativos</span></p>
                  <p className="flex items-start gap-2"><span className="text-primary mt-0.5">✦</span><span>El Artefacto — 20 días gratis</span></p>
                  <p className="flex items-start gap-2"><span className="text-primary mt-0.5">✦</span><span>Y mucho más cada semana</span></p>
                </div>
                <div className="mt-4 pt-3 border-t border-foreground/10 text-center">
                  <p className="text-muted-foreground text-sm">
                    <span className="line-through opacity-60">€3,500</span>
                    <span className="text-foreground font-bold text-lg mx-2">→ €3,000</span>
                  </p>
                  <p className="text-foreground/50 text-xs mt-1">Beca Parcial de €500 desbloqueada</p>
                </div>
              </div>
            </div>

            {/* Pricing con beca */}
            <div className="text-center my-6">
              <p className="text-muted-foreground text-sm">
                <span className="line-through opacity-60">€6.000</span>
                <span className="text-foreground font-bold text-lg mx-2">→ €5.000</span>
              </p>
              <p className="text-foreground/50 text-xs mt-1">Beca de La Brecha desbloqueada</p>
            </div>

            {/* ===== CALENDAR PLACEHOLDER - DESPUÉS ===== */}
            <div className="text-center mb-2">
              <span className="text-muted-foreground text-sm">¿Aún tienes dudas? Agenda una llamada</span>
            </div>
            <div className="glass-card-dark p-4 rounded-xl mb-6">
              <div className="bg-black/30 rounded-lg h-48 flex items-center justify-center">
                <span className="text-foreground/30 text-sm">[Calendario GHL]</span>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-6 text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground/60 text-xs">
                <span className="text-foreground/40">✦</span>
                <span>Esta es tu única oportunidad. Al cerrar esta pestaña, La Brecha se sella.</span>
              </div>
            </div>
          </div>
        </div>

        {/* ENDLESS TOOLS 3D TEST SECTION */}
        <div className="glass-card-dark p-6 max-w-lg mx-auto text-center mt-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">✦ Elemento 3D Endless Tools</h2>

          <div className="flex justify-center mb-4">
            <EndlessTools3D
              embedId="d5e20946-1c89-4b1f-8d4a-9bc050121883"
              size={element3DSize}
              showGlow={showGlow}
              floatAnimation={showFloat}
            />
          </div>

          <div className="mb-3">
            <p className="text-foreground/50 text-xs mb-2">Tamaño:</p>
            <div className="flex justify-center gap-2">
              {(["sm", "md", "lg", "xl"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setElement3DSize(s)}
                  className={`px-2 py-1 rounded text-xs transition-all ${
                    element3DSize === s ? "bg-primary text-primary-foreground" : "dark-button"
                  }`}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => setShowGlow(!showGlow)}
              className={`px-3 py-1.5 rounded text-xs ${showGlow ? "bg-primary/20 text-primary ring-1 ring-primary/30" : "dark-button"}`}
            >
              Glow {showGlow ? "ON" : "OFF"}
            </button>
            <button
              onClick={() => setShowFloat(!showFloat)}
              className={`px-3 py-1.5 rounded text-xs ${showFloat ? "bg-primary/20 text-primary ring-1 ring-primary/30" : "dark-button"}`}
            >
              Float {showFloat ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* DROPS TEST SECTION */}
        <div className="glass-card-dark p-6 max-w-2xl mx-auto text-center mt-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">🎮 Minijuego de Drops</h2>

          {/* Class selector */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {([1, 2, 3, 4, 5, 6] as const).map((classNum) => {
              const info = DROPS_INFO[classNum];
              return (
                <button
                  key={classNum}
                  onClick={() => handleClassChange(classNum)}
                  className={`px-3 py-1.5 rounded text-xs flex items-center gap-1 ${
                    selectedClass === classNum ? "bg-primary text-primary-foreground" : "dark-button"
                  }`}
                >
                  <span>{classNum <= 4 ? `Clase ${classNum}` : `Brecha F${classNum - 4}`}</span>
                  <span className="opacity-70">({info.count})</span>
                  {!info.autoCapture && <span className="text-muted-foreground">◇</span>}
                </button>
              );
            })}
          </div>

          {/* Config info */}
          <div className="glass-card-dark p-3 mb-4 inline-block">
            <div className="flex items-center gap-3 text-xs">
              <span className="text-foreground/70">Drops: {currentConfig.count}</span>
              <span className="text-foreground/50">|</span>
              <span className="text-foreground/70">Window: {currentConfig.windowMs / 1000}s</span>
              <span className="text-foreground/50">|</span>
              <span className={!currentConfig.autoCapture ? "text-muted-foreground" : "text-primary"}>
                {currentConfig.autoCapture ? "✓ Auto" : "◇ Manual"}
              </span>
            </div>
          </div>

          {/* Drop buttons */}
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-4">
            {drops.map((drop) => {
              const isCaptured = capturedDrops.some((d) => d.id === drop.id);
              const isMissed = simulatedMissedDrops.includes(drop.id);
              return (
                <button
                  key={drop.id}
                  onClick={() => {
                    if (!isCaptured && !isMissed) {
                      checkForDrop(drop.timestamp + 0.001);
                    }
                  }}
                  disabled={isCaptured || isMissed}
                  className={`p-2 rounded text-xl relative ${
                    isCaptured
                      ? "bg-primary/20 text-primary opacity-50"
                      : isMissed
                      ? "bg-destructive/20 text-destructive opacity-50"
                      : "dark-button hover:bg-foreground/10"
                  }`}
                >
                  {drop.symbol}
                  <span className="block text-xs mt-0.5 opacity-50">{Math.round(drop.timestamp * 100)}%</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setShowDropDemo(!showDropDemo)} className="dark-button-primary py-2 text-sm">
              {showDropDemo ? "Ocultar Demo" : "Mostrar Demo"}
            </button>
            <button
              onClick={() => {
                setSimulatedMissedDrops([]);
                resetDrops();
              }}
              className="dark-button py-2 text-sm"
            >
              Reset Drops
            </button>
          </div>

          <div className="mt-3 text-xs text-foreground/50">
            <p>Capturados: {capturedDrops.length}/{drops.length} | Perdidos: {simulatedMissedDrops.length}</p>
          </div>
        </div>

        {/* Drop Demo Area */}
        {showDropDemo && (
          <div className="glass-card-dark p-4 max-w-2xl mx-auto mt-6">
            <div className="relative bg-black/50 rounded-lg overflow-hidden" style={{ height: "250px" }}>
              <VideoDropOverlay activeDrop={activeDrop} onCapture={captureDrop} />
              <div className="absolute inset-0 flex items-center justify-center text-foreground/30 text-center px-4">
                {activeDrop ? (
                  <p>¡DROP ACTIVO! Click para capturar</p>
                ) : (
                  <p>Simula un drop clickeando los símbolos arriba</p>
                )}
              </div>
            </div>
            <div className="mt-4">
              <DropsInventory 
                capturedDrops={capturedDrops} 
                totalDrops={drops.length} 
                allCaptured={allCaptured}
                classNumber={selectedClass}
              />
            </div>
          </div>
        )}

        {/* Portal Modal */}
        <VaultPortal isOpen={showPortal} onClose={() => setShowPortal(false)} onUnlock={handleUnlock} />

        {/* Ritual Modal */}
        <RitualSequenceModal
          isOpen={showRitualModal}
          onClose={() => setShowRitualModal(false)}
          capturedDrops={capturedDrops}
          onSequenceComplete={() => {
            setShowRitualModal(false);
            toast({ title: "¡Ritual completado!" });
          }}
          onSequenceFailed={() => toast({ variant: "destructive", title: "Secuencia incorrecta" })}
        />
      </div>
    </div>
  );
}
