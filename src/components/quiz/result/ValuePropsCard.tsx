import { Card } from "@/components/ui/card";

/**
 * ValuePropsCard - Previously showed bonus class info.
 * Now simplified since OTO is the primary CTA.
 * Kept as a component for potential reuse.
 */
export const ValuePropsCard = () => {
  return (
    <Card className="bg-accent/5 border-accent/20 p-4">
      <div className="space-y-3 text-center">
        <h3 className="text-sm font-semibold text-foreground glow">
          Qué incluye el acceso
        </h3>
        <ul className="text-xs text-left space-y-2 max-w-md mx-auto">
          <li className="flex items-start gap-2">
            <span className="text-base flex-shrink-0">🎁</span>
            <span className="text-foreground/80">
              Acceso completo al sistema del Círculo
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-base flex-shrink-0">🔮</span>
            <span className="text-foreground/80">
              Asistente IA exclusivo para diseñar tu oferta premium
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-base flex-shrink-0">⚔️</span>
            <span className="text-foreground/80">
              CRM y pipeline de ventas (El Artefacto)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-base flex-shrink-0">🎯</span>
            <span className="text-foreground/80">
              Comunidad privada de agencias premium
            </span>
          </li>
        </ul>
      </div>
    </Card>
  );
};
