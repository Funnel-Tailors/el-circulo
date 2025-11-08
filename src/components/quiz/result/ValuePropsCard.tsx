import { Card } from "@/components/ui/card";
import { RESULT_MESSAGES } from "@/constants/resultMessages";
export const ValuePropsCard = () => {
  return <Card className="bg-accent/5 border-accent/20 p-4">
      <h3 className="text-sm font-semibold text-foreground glow mb-3 text-center">
        {RESULT_MESSAGES.qualified.bonusClass.title}
      </h3>
      <div className="space-y-3">
        <div className="text-center">
          <p className="text-xs font-medium text-foreground/90 mb-1">
            {RESULT_MESSAGES.qualified.bonusClass.subtitle}
          </p>
          <p className="text-xs text-muted-foreground">
            {RESULT_MESSAGES.qualified.bonusClass.description}
          </p>
        </div>
        
        <div className="border-t border-accent/20 pt-3">
          <p className="text-xs text-muted-foreground mb-3 text-center">
            {RESULT_MESSAGES.qualified.instructions}
          </p>
          
          <ul className="text-xs text-left space-y-2 max-w-md mx-auto">
            {RESULT_MESSAGES.qualified.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-base flex-shrink-0">{benefit.icon}</span>
                <span className="text-foreground/80">
                  {benefit.text}
                  {benefit.strong && <strong className="text-foreground"> {benefit.strong}</strong>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>;
};