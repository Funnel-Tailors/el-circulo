import { useScrollReveal } from "@/hooks/useScrollReveal";

interface SuccessCaseProps {
  name: string;
  highlight: string;
  achievements: string[];
  index: number;
}

const SuccessCase = ({ name, highlight, achievements, index }: SuccessCaseProps) => {
  const { ref, isVisible } = useScrollReveal(0.3);

  return (
    <div 
      ref={ref}
      className={`glass-card-dark p-6 pt-20 relative group cursor-default transition-all duration-700 hover:scale-[1.02] ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
      style={{ animationDelay: `${index * 200}ms` }}
    >
      {/* Badge flotante con highlight */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
        <div className="px-6 py-3 rounded-2xl bg-accent/80 border-2 border-border backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
          <span className="text-2xl font-display font-black text-foreground glow">
            {highlight}
          </span>
        </div>
      </div>

      {/* Nombre */}
      <h3 className="text-2xl font-display font-bold text-foreground mb-3 text-center">
        {name}
      </h3>

      {/* Línea decorativa */}
      <div className="w-16 h-px bg-gradient-to-r from-transparent via-border to-transparent mx-auto mb-4" />

      {/* Lista de logros */}
      <ul className="space-y-2">
        {achievements.map((achievement, idx) => (
          <li 
            key={idx}
            className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed"
            style={{ animationDelay: `${(index * 200) + (idx * 100)}ms` }}
          >
            <span className="text-foreground mt-0.5 shrink-0">▸</span>
            <span>{achievement}</span>
          </li>
        ))}
      </ul>

      {/* Glow decorativo en hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-lg" />
    </div>
  );
};

export default SuccessCase;
