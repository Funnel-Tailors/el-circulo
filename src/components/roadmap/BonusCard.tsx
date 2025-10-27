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
      className={`dark-card p-6 hover:scale-105 transition-all duration-700 group cursor-pointer hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] relative overflow-hidden ${
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

      {/* Glow decorativo en hover */}
      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gradient-to-br from-white/5 to-transparent" />
    </div>
  );
};

export default BonusCard;
