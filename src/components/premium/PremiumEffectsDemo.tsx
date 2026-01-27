/**
 * PremiumEffectsDemo - Showcase de todos los efectos premium
 *
 * Esta pagina demuestra todos los efectos premium implementados.
 * Usala como referencia de implementacion.
 */

import * as React from "react";
import { motion } from "framer-motion";
import {
  EnergyCard,
  EnergyCardHeader,
  EnergyCardTitle,
  EnergyCardDescription,
  EnergyCardContent,
  EnergyCardFooter,
} from "./EnergyCard";
import { MagneticButton } from "./MagneticButton";
import { GlowInput, GlowTextarea } from "./GlowInput";
import { SpotlightCard, SpotlightGrid } from "./SpotlightCard";
import { useMousePositionCSS } from "./hooks/useMousePosition";

// Importar estilos premium
import "./premium-effects.css";

// ============================================================================
// SECTION COMPONENTS
// ============================================================================

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-3xl font-bold text-white mb-2">{children}</h2>
);

const SectionDescription: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <p className="text-white/60 mb-8">{children}</p>;

// ============================================================================
// MAIN DEMO
// ============================================================================

export function PremiumEffectsDemo() {
  return (
    <div className="min-h-screen bg-[hsl(0,0%,5%)] text-white p-8 md:p-16">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-20">
        <motion.h1
          className="text-5xl md:text-7xl font-black uppercase mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          Premium Effects
        </motion.h1>
        <motion.p
          className="text-xl text-white/60 max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          Efectos de nivel Linear, Raycast, y Vercel para El Circulo. Mueve el
          cursor sobre los elementos para ver la magia.
        </motion.p>
      </div>

      {/* Sections */}
      <div className="max-w-6xl mx-auto space-y-32">
        {/* ================================================================
            SECTION 1: ENERGY CARD
            ================================================================ */}
        <section>
          <SectionTitle>Energy Card</SectionTitle>
          <SectionDescription>
            Card con energy beam que recorre el borde como un circuito de luz.
            Incluye micro-tilt 3D y spotlight que sigue al cursor.
          </SectionDescription>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Default Energy Card */}
            <EnergyCard
              beamSpeed={3}
              beamIntensity={0.7}
              enableTilt={true}
              enableSpotlight={true}
            >
              <EnergyCardHeader>
                <EnergyCardTitle>Plan Premium</EnergyCardTitle>
                <EnergyCardDescription>
                  Acceso completo a todos los contenidos
                </EnergyCardDescription>
              </EnergyCardHeader>
              <EnergyCardContent>
                <div className="text-4xl font-bold mb-4">
                  49<span className="text-lg text-white/60">/mes</span>
                </div>
                <ul className="space-y-2 text-white/70">
                  <li className="flex items-center gap-2">
                    <span className="text-white">+</span> Acceso ilimitado
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-white">+</span> Comunidad privada
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-white">+</span> Sesiones en vivo
                  </li>
                </ul>
              </EnergyCardContent>
              <EnergyCardFooter>
                <MagneticButton variant="default" className="w-full">
                  Unirme ahora
                </MagneticButton>
              </EnergyCardFooter>
            </EnergyCard>

            {/* Elevated variant */}
            <EnergyCard
              variant="elevated"
              beamSpeed={2.5}
              beamIntensity={0.8}
              beamColor="rgba(255, 255, 255, 0.9)"
            >
              <EnergyCardHeader>
                <EnergyCardTitle>Plan Elite</EnergyCardTitle>
                <EnergyCardDescription>
                  La experiencia completa de El Circulo
                </EnergyCardDescription>
              </EnergyCardHeader>
              <EnergyCardContent>
                <div className="text-4xl font-bold mb-4">
                  149<span className="text-lg text-white/60">/mes</span>
                </div>
                <ul className="space-y-2 text-white/70">
                  <li className="flex items-center gap-2">
                    <span className="text-white">+</span> Todo del Premium
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-white">+</span> Mentoria 1:1
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-white">+</span> Acceso anticipado
                  </li>
                </ul>
              </EnergyCardContent>
              <EnergyCardFooter>
                <MagneticButton variant="glow" className="w-full">
                  Ascender a Elite
                </MagneticButton>
              </EnergyCardFooter>
            </EnergyCard>
          </div>
        </section>

        {/* ================================================================
            SECTION 2: MAGNETIC BUTTONS
            ================================================================ */}
        <section>
          <SectionTitle>Magnetic Button</SectionTitle>
          <SectionDescription>
            Botones con efecto magnetico que &quot;atrae&quot; al cursor, ripple effect
            en click, y variantes con glow pulsante.
          </SectionDescription>

          <div className="flex flex-wrap gap-4 items-center">
            <MagneticButton variant="default" size="xl">
              Default Button
            </MagneticButton>

            <MagneticButton variant="secondary" size="xl">
              Secondary
            </MagneticButton>

            <MagneticButton variant="ghost" size="xl">
              Ghost
            </MagneticButton>

            <MagneticButton variant="glow" size="xl">
              Glow Effect
            </MagneticButton>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 items-center">
            <MagneticButton variant="default" size="sm">
              Small
            </MagneticButton>

            <MagneticButton variant="default" size="default">
              Default
            </MagneticButton>

            <MagneticButton variant="default" size="lg">
              Large
            </MagneticButton>

            <MagneticButton variant="default" size="xl">
              Extra Large
            </MagneticButton>
          </div>

          <div className="mt-8 p-6 bg-white/5 rounded-xl">
            <p className="text-white/60 text-sm mb-4">
              Prueba: Acerca el cursor al boton sin hacer click. Observa como el
              boton se &quot;atrae&quot; hacia el cursor.
            </p>
            <div className="flex justify-center">
              <MagneticButton
                variant="glow"
                size="xl"
                magneticStrength={0.4}
              >
                Acercate a mi
              </MagneticButton>
            </div>
          </div>
        </section>

        {/* ================================================================
            SECTION 3: GLOW INPUT
            ================================================================ */}
        <section>
          <SectionTitle>Glow Input</SectionTitle>
          <SectionDescription>
            Inputs con glow dinamico que sigue al cursor, y border que se ilumina
            desde la posicion del focus.
          </SectionDescription>

          <div className="max-w-md space-y-6">
            <div>
              <label className="block text-sm text-white/60 mb-2">
                Email (default)
              </label>
              <GlowInput
                type="email"
                placeholder="tu@email.com"
                variant="default"
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">
                Password (filled variant)
              </label>
              <GlowInput
                type="password"
                placeholder="Tu contrasenya"
                variant="filled"
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">
                Search (ghost variant)
              </label>
              <GlowInput
                type="search"
                placeholder="Buscar..."
                variant="ghost"
                leftIcon={
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                }
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">
                Textarea
              </label>
              <GlowTextarea
                placeholder="Escribe tu mensaje..."
                variant="default"
              />
            </div>
          </div>
        </section>

        {/* ================================================================
            SECTION 4: SPOTLIGHT CARD
            ================================================================ */}
        <section>
          <SectionTitle>Spotlight Card</SectionTitle>
          <SectionDescription>
            Cards con efecto spotlight que sigue al cursor, creando un efecto de
            &quot;linterna&quot; premium.
          </SectionDescription>

          <SpotlightGrid columns={3} gap="md">
            <SpotlightCard>
              <div className="text-4xl mb-4">01</div>
              <h3 className="text-xl font-semibold mb-2">Mindset</h3>
              <p className="text-white/60">
                Transforma tu forma de pensar y actuar ante los desafios.
              </p>
            </SpotlightCard>

            <SpotlightCard spotlightOpacity={0.2}>
              <div className="text-4xl mb-4">02</div>
              <h3 className="text-xl font-semibold mb-2">Skills</h3>
              <p className="text-white/60">
                Desarrolla habilidades practicas de alto impacto.
              </p>
            </SpotlightCard>

            <SpotlightCard spotlightSize={400}>
              <div className="text-4xl mb-4">03</div>
              <h3 className="text-xl font-semibold mb-2">Network</h3>
              <p className="text-white/60">
                Conecta con personas que piensan como tu.
              </p>
            </SpotlightCard>
          </SpotlightGrid>
        </section>

        {/* ================================================================
            SECTION 5: CSS-ONLY EFFECTS
            ================================================================ */}
        <section>
          <SectionTitle>CSS-Only Effects</SectionTitle>
          <SectionDescription>
            Efectos que funcionan solo con CSS, sin JavaScript. Ideal para
            performance y simplicidad.
          </SectionDescription>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Shimmer skeleton */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Shimmer Skeleton</h4>
              <div className="space-y-3">
                <div className="shimmer h-4 w-3/4 rounded-lg" />
                <div className="shimmer h-4 w-full rounded-lg" />
                <div className="shimmer h-4 w-2/3 rounded-lg" />
              </div>
            </div>

            {/* Animated border gradient */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Border Gradient</h4>
              <div className="border-gradient-animated p-6 rounded-2xl">
                <p className="text-white/70">
                  Este borde tiene un gradient animado que se mueve
                  continuamente.
                </p>
              </div>
            </div>

            {/* Staggered fade in */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Staggered Fade In</h4>
              <p className="text-white/60 text-sm mb-2">
                Recarga la pagina para ver el efecto
              </p>
              <ul className="stagger-fade-in space-y-2">
                <li className="p-3 bg-white/5 rounded-lg">Item 1</li>
                <li className="p-3 bg-white/5 rounded-lg">Item 2</li>
                <li className="p-3 bg-white/5 rounded-lg">Item 3</li>
                <li className="p-3 bg-white/5 rounded-lg">Item 4</li>
              </ul>
            </div>

            {/* Spotlight hover (CSS) */}
            <CSSSpotlightDemo />
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto mt-32 pt-8 border-t border-white/10">
        <p className="text-white/40 text-sm">
          El Circulo Design System - Premium Effects v2.0
        </p>
      </footer>
    </div>
  );
}

// CSS Spotlight demo using the hook
function CSSSpotlightDemo() {
  const { ref, onMouseMove, onMouseEnter, onMouseLeave } = useMousePositionCSS({
    prefix: "mouse",
    asPercentage: true,
  });

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold">Spotlight (CSS Hook)</h4>
      <div
        ref={ref}
        className="spotlight-hover p-6 bg-black/40 rounded-2xl border border-white/10"
        onMouseMove={onMouseMove}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <p className="text-white/70">
          Este spotlight usa CSS custom properties actualizadas por un hook.
          Mas performante para casos simples.
        </p>
      </div>
    </div>
  );
}

export default PremiumEffectsDemo;
