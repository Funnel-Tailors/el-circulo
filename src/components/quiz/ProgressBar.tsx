interface ProgressBarProps {
  current: number;
  total: number;
}

const ProgressBar = ({ current, total }: ProgressBarProps) => {
  const progressPercentage = (current / total) * 100;
  const isHalfway = current >= total / 2;
  const isComplete = current === total;
  
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 h-1 bg-border/30 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ease-out ${
            isComplete 
              ? "bg-gradient-to-r from-accent via-primary to-accent shadow-[0_0_10px_rgba(var(--primary),0.5)]" 
              : "bg-gradient-to-r from-muted-foreground/40 via-foreground/60 to-muted-foreground/40"
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <div className="flex items-center gap-1">
        {isHalfway && <span className="animate-pulse text-sm">✨</span>}
        <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
          {current}/{total}
        </span>
      </div>
    </div>
  );
};

export default ProgressBar;
