import { useScrollReveal } from "@/hooks/useScrollReveal";

interface BonusCardProps {
  icon: string;
  title: string;
  description: string;
}

const BonusCard = ({ icon, title, description }: BonusCardProps) => {
  const { ref, isVisible } = useScrollReveal(0.3);

  return (
    <div 
      ref={ref}
      className={`glass-card-dark p-6 transition-all duration-700 group cursor-pointer relative overflow-hidden ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
        {icon}
      </div>

      <h3 className="text-lg font-display font-bold text-foreground mb-2">
        {title}
      </h3>

      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default BonusCard;
