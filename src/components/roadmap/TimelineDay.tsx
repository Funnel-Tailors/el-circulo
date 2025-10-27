import { useScrollReveal } from "@/hooks/useScrollReveal";

interface TimelineDayProps {
  day: number;
  title: string;
  description: string;
  index: number;
}

const TimelineDay = ({ day, title, description, index }: TimelineDayProps) => {
  const { ref, isVisible } = useScrollReveal(0.3);

  return (
    <div 
      ref={ref}
      className={`relative group transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Conector vertical glowing */}
      {index > 0 && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 timeline-connector" />
      )}

      {/* Círculo central animado */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-8 w-3 h-3 rounded-full bg-foreground group-hover:shadow-[0_0_20px_rgba(255,255,255,0.6)] transition-all duration-300 z-10" />

      {/* Card del día */}
      <div className="glass-card-dark p-6 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs text-muted-foreground font-semibold tracking-widest uppercase">
            Día {day.toString().padStart(2, '0')}
          </span>
        </div>

        <h3 className="text-xl font-display font-bold text-foreground mb-2">
          {title}
        </h3>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};

export default TimelineDay;
