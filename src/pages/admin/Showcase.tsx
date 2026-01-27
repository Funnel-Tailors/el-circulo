import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import PortalVortex from "@/components/shared/PortalVortex";
import Starfield from "@/components/quiz/Starfield";
import { colors } from "@/design-system/tokens/colors";
import { radius, semanticRadius } from "@/design-system/tokens/radius";
import { duration, ease, easeCss } from "@/design-system/tokens/motion";
import { glow, buttonShadow } from "@/design-system/tokens/shadows";

type TabId = "foundations" | "signature" | "base" | "motion";

const TABS: { id: TabId; label: string }[] = [
  { id: "foundations", label: "Foundations" },
  { id: "signature", label: "Signature" },
  { id: "base", label: "Base" },
  { id: "motion", label: "Motion" },
];

// Copy button component
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-colors"
      title="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-foreground/50" />}
    </button>
  );
}

// Code preview component
function CodePreview({ code, language = "tsx" }: { code: string; language?: string }) {
  return (
    <div className="relative mt-4 rounded-xl bg-black/60 border border-foreground/10 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-foreground/10">
        <span className="text-xs text-foreground/40 font-mono">{language}</span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 text-sm font-mono text-foreground/70 overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Section wrapper
function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-12"
    >
      <h3 className="text-2xl font-display font-black text-foreground glow mb-2">{title}</h3>
      {description && <p className="text-foreground/60 mb-6">{description}</p>}
      {children}
    </motion.div>
  );
}

// Color swatch
function ColorSwatch({ name, value, cssVar }: { name: string; value: string; cssVar?: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-foreground/5">
      <div
        className="w-12 h-12 rounded-lg border border-foreground/20 shrink-0"
        style={{ backgroundColor: value }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{name}</p>
        <p className="text-xs text-foreground/50 font-mono truncate">{cssVar || value}</p>
      </div>
    </div>
  );
}

// Foundations tab content
function FoundationsTab() {
  return (
    <div className="space-y-12">
      {/* Colors */}
      <Section title="Colors" description="Carbon black palette - pure monochromatic, no blue tints">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <ColorSwatch name="Background" value="hsl(0, 0%, 5%)" cssVar="--background" />
          <ColorSwatch name="Foreground" value="hsl(0, 0%, 98%)" cssVar="--foreground" />
          <ColorSwatch name="Muted" value="hsl(0, 0%, 10%)" cssVar="--muted" />
          <ColorSwatch name="Muted FG" value="hsl(0, 0%, 70%)" cssVar="--muted-foreground" />
          <ColorSwatch name="Border" value="hsl(0, 0%, 20%)" cssVar="--border" />
          <ColorSwatch name="Input" value="hsl(0, 0%, 12%)" cssVar="--input" />
        </div>

        <h4 className="text-lg font-semibold text-foreground mt-8 mb-4">Gray Scale</h4>
        <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-2">
          {Object.entries(colors.gray).map(([key, value]) => (
            <div key={key} className="text-center">
              <div
                className="w-full aspect-square rounded-lg border border-foreground/10 mb-1"
                style={{ backgroundColor: value }}
              />
              <span className="text-[10px] text-foreground/40">{key}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Typography */}
      <Section title="Typography" description="Degular Display for headings, Degular Text for body">
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-foreground/5 border border-foreground/10">
            <span className="text-xs text-foreground/40 mb-2 block">H1 - Degular Display</span>
            <h1 className="text-5xl md:text-6xl font-display font-black glow">EL CIRCULO</h1>
          </div>
          <div className="p-6 rounded-2xl bg-foreground/5 border border-foreground/10">
            <span className="text-xs text-foreground/40 mb-2 block">H2 - Degular Display</span>
            <h2 className="text-3xl md:text-4xl font-display font-black">LA SENDA</h2>
          </div>
          <div className="p-6 rounded-2xl bg-foreground/5 border border-foreground/10">
            <span className="text-xs text-foreground/40 mb-2 block">Body - Degular Text</span>
            <p className="text-lg text-foreground/80">
              The quick brown fox jumps over the lazy dog. Smooth, legible, and elegant.
            </p>
          </div>
        </div>
      </Section>

      {/* Radius */}
      <Section title="Border Radius" description="Hierarchy: 3xl (hero) > 2xl (cards) > xl (buttons) > lg (badges)">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(semanticRadius).slice(0, 8).map(([key, value]) => (
            <div key={key} className="text-center">
              <div
                className="w-20 h-20 mx-auto bg-foreground/10 border border-foreground/20 mb-2"
                style={{ borderRadius: value }}
              />
              <p className="text-sm font-medium text-foreground">{key}</p>
              <p className="text-xs text-foreground/40">{value}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Shadows & Glow */}
      <Section title="Shadows & Glow" description="Glow effects are the signature of El Circulo">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-foreground/5 text-center">
            <div className="w-16 h-16 mx-auto rounded-xl bg-foreground/10 mb-3 shadow-glow-sm" />
            <p className="text-sm font-medium">glow-sm</p>
            <p className="text-xs text-foreground/40">Subtle glow</p>
          </div>
          <div className="p-6 rounded-2xl bg-foreground/5 text-center">
            <div className="w-16 h-16 mx-auto rounded-xl bg-foreground/10 mb-3 shadow-glow-md" />
            <p className="text-sm font-medium">glow-md</p>
            <p className="text-xs text-foreground/40">Standard glow</p>
          </div>
          <div className="p-6 rounded-2xl bg-foreground/5 text-center">
            <div className="w-16 h-16 mx-auto rounded-xl bg-foreground/10 mb-3 shadow-glow-lg" />
            <p className="text-sm font-medium">glow-lg</p>
            <p className="text-xs text-foreground/40">Prominent glow</p>
          </div>
          <div className="p-6 rounded-2xl bg-foreground/5 text-center">
            <div className="w-16 h-16 mx-auto rounded-xl bg-foreground/10 mb-3 shadow-glow-xl" />
            <p className="text-sm font-medium">glow-xl</p>
            <p className="text-xs text-foreground/40">Maximum glow</p>
          </div>
        </div>

        <h4 className="text-lg font-semibold text-foreground mt-8 mb-4">Text Glow</h4>
        <div className="p-6 rounded-2xl bg-foreground/5 text-center">
          <p className="text-3xl font-display font-black glow">Pulsing text glow effect</p>
          <p className="text-xs text-foreground/40 mt-2">class: glow</p>
        </div>
      </Section>
    </div>
  );
}

// Signature components tab
function SignatureTab() {
  return (
    <div className="space-y-12">
      {/* Portal Vortex */}
      <Section title="Portal Vortex" description="Unified vortex effect with Archimedean spirals, used across portals">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="flex justify-center">
            <PortalVortex size="sm" idPrefix="showcase1" />
          </div>
          <div className="flex justify-center">
            <PortalVortex size="md" idPrefix="showcase2" />
          </div>
          <div className="flex justify-center">
            <PortalVortex size="lg" idPrefix="showcase3" />
          </div>
        </div>
        <CodePreview
          code={`import PortalVortex from "@/components/shared/PortalVortex";

<PortalVortex
  size="md"           // sm | md | lg | xl
  isClosing={false}   // animate closing
  rotationSpeed={15}  // seconds per rotation
  particleCount={20}  // attracted particles
  idPrefix="unique"   // unique ID for SVG gradients
/>`}
        />
      </Section>

      {/* Glassmorphism */}
      <Section title="Glassmorphism" description="Dark glass cards with blur, borders, and hover effects">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card-dark p-6">
            <h4 className="text-lg font-semibold mb-2">Glass Card Dark</h4>
            <p className="text-sm text-foreground/60">Hover to see the scale and glow effect.</p>
          </div>
          <div className="glass-card-dark glass-card-dark-static p-6">
            <h4 className="text-lg font-semibold mb-2">Glass Static</h4>
            <p className="text-sm text-foreground/60">Same style, no hover scale (for tables).</p>
          </div>
          <div className="dark-card p-6 rounded-2xl">
            <h4 className="text-lg font-semibold mb-2">Dark Card</h4>
            <p className="text-sm text-foreground/60">Solid dark card with pulsing glow.</p>
          </div>
        </div>
        <CodePreview
          code={`// CSS class (recommended)
<div className="glass-card-dark p-6">Content</div>

// Or using Card component variant
<Card variant="glass">
  <CardContent>Content</CardContent>
</Card>`}
        />
      </Section>

      {/* Starfield placeholder */}
      <Section title="Starfield" description="Atmospheric depth with 3 layers of parallax stars">
        <div className="relative h-64 rounded-2xl overflow-hidden border border-foreground/10">
          <Starfield />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-foreground/60">80 stars across 3 depth layers</p>
          </div>
        </div>
        <CodePreview
          code={`import Starfield from "@/components/quiz/Starfield";

<div className="relative">
  <Starfield />
  {/* Your content here */}
</div>`}
        />
      </Section>
    </div>
  );
}

// Base components tab
function BaseTab() {
  return (
    <div className="space-y-12">
      {/* Buttons */}
      <Section title="Buttons" description="Extended with premium variants for El Circulo">
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-foreground/60 mb-3">Standard Variants</h4>
            <div className="flex flex-wrap gap-4">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-foreground/60 mb-3">Premium Variants (New)</h4>
            <div className="flex flex-wrap gap-4">
              <Button variant="premium">Premium</Button>
              <Button variant="dark-primary">Dark Primary</Button>
              <Button variant="dark">Dark</Button>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-foreground/60 mb-3">Sizes</h4>
            <div className="flex flex-wrap items-center gap-4">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="xl" variant="dark-primary">Extra Large</Button>
            </div>
          </div>
        </div>

        <CodePreview
          code={`<Button variant="premium">Premium</Button>
<Button variant="dark-primary" size="xl">CTA Button</Button>
<Button variant="dark">Secondary Action</Button>`}
        />
      </Section>

      {/* Cards */}
      <Section title="Cards" description="Now with variant prop for different styles">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
              <CardDescription>Standard shadcn card</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/60">Basic card styling</p>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <CardTitle>Glass Card</CardTitle>
              <CardDescription>El Circulo glassmorphism</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/60">Hover for effect</p>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Elevated Card</CardTitle>
              <CardDescription>With subtle glow</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/60">Elevated appearance</p>
            </CardContent>
          </Card>
        </div>

        <CodePreview
          code={`<Card variant="glass">
  <CardHeader>
    <CardTitle>Glass Card</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>`}
        />
      </Section>

      {/* Inputs */}
      <Section title="Inputs" description="Enhanced with focus glow and rounded corners">
        <div className="max-w-md space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground/60 mb-1 block">Default Input</label>
            <Input placeholder="Type something..." />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground/60 mb-1 block">Disabled Input</label>
            <Input placeholder="Disabled" disabled />
          </div>
        </div>

        <CodePreview
          code={`<Input placeholder="Type something..." />

// Features:
// - rounded-xl (12px corners)
// - hover:border-foreground/20
// - focus-visible:shadow-glow-focus`}
        />
      </Section>
    </div>
  );
}

// Motion tab
function MotionTab() {
  const [playDemo, setPlayDemo] = useState<string | null>(null);

  return (
    <div className="space-y-12">
      {/* Durations */}
      <Section title="Duration Tokens" description="Standardized timing for all animations">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Object.entries(duration).filter(([k]) => !k.includes('pulse')).map(([key, value]) => (
            <div key={key} className="p-4 rounded-xl bg-foreground/5 border border-foreground/10 text-center">
              <p className="text-lg font-semibold text-foreground">{value}s</p>
              <p className="text-xs text-foreground/40">{key}</p>
            </div>
          ))}
        </div>

        <CodePreview
          code={`import { duration } from "@/design-system/tokens/motion";

// Usage with Framer Motion
<motion.div
  transition={{ duration: duration.gentle }} // 0.4s
/>`}
        />
      </Section>

      {/* Easings */}
      <Section title="Easing Curves" description="Cubic bezier presets for different use cases">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(ease).slice(0, 6).map(([key, value]) => (
            <div
              key={key}
              className="p-4 rounded-xl bg-foreground/5 border border-foreground/10 cursor-pointer hover:bg-foreground/10 transition-colors"
              onClick={() => setPlayDemo(key)}
            >
              <div className="flex justify-between items-center mb-2">
                <p className="font-medium text-foreground">{key}</p>
                <span className="text-xs text-foreground/40">Click to demo</span>
              </div>
              <p className="text-xs text-foreground/50 font-mono">[{(value as number[]).join(', ')}]</p>
            </div>
          ))}
        </div>

        {playDemo && (
          <div className="mt-6 p-6 rounded-xl bg-foreground/5 border border-foreground/10">
            <p className="text-sm text-foreground/60 mb-4">Demo: {playDemo}</p>
            <motion.div
              key={playDemo + Date.now()}
              className="w-16 h-16 rounded-xl bg-foreground"
              initial={{ x: 0 }}
              animate={{ x: 200 }}
              transition={{
                duration: 1,
                ease: ease[playDemo as keyof typeof ease] as number[],
              }}
            />
          </div>
        )}

        <CodePreview
          code={`import { ease, easeCss } from "@/design-system/tokens/motion";

// Framer Motion (array)
<motion.div transition={{ ease: ease.out }} />

// CSS (string)
element.style.transition = \`transform 0.4s \${easeCss.out}\`;`}
        />
      </Section>

      {/* Reduced Motion */}
      <Section title="Reduced Motion" description="Accessibility hook for respecting user preferences">
        <Card variant="glass">
          <CardContent className="p-6">
            <CodePreview
              code={`import { useReducedMotion } from "@/hooks/useReducedMotion";

function AnimatedComponent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={{ y: prefersReducedMotion ? 0 : 20 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4 }}
    />
  );
}`}
            />
          </CardContent>
        </Card>
      </Section>
    </div>
  );
}

export default function Showcase() {
  const [activeTab, setActiveTab] = useState<TabId>("foundations");

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-black text-foreground glow mb-2">
          Design System
        </h1>
        <p className="text-foreground/60">
          El Circulo component showcase - tokens, components, and patterns
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-foreground/10 pb-2 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-foreground text-background"
                : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === "foundations" && <FoundationsTab />}
        {activeTab === "signature" && <SignatureTab />}
        {activeTab === "base" && <BaseTab />}
        {activeTab === "motion" && <MotionTab />}
      </div>
    </div>
  );
}
