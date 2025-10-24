interface ProgressBarProps {
  current: number;
  total: number;
}

const ProgressBar = ({ current, total }: ProgressBarProps) => {
  const progressPercentage = (current / total) * 100;
  
  return (
    <div className="w-full h-1 bg-border/30 rounded-full overflow-hidden">
      <div 
        className="h-full bg-gradient-to-r from-muted-foreground/40 via-foreground/60 to-muted-foreground/40 transition-all duration-500 ease-out"
        style={{ width: `${progressPercentage}%` }}
      />
    </div>
  );
};

export default ProgressBar;
