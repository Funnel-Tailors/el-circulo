interface ProgressBarProps {
  current: number;
  total: number;
}

const ProgressBar = ({ current, total }: ProgressBarProps) => {
  const percentage = (current / total) * 100;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">
          Pregunta {current} de {total}
        </span>
        <span className="font-medium">{Math.round(percentage)}%</span>
      </div>

      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-foreground rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex gap-2 justify-center">
        {Array.from({ length: total }).map((_, index) => (
          <div
            key={index}
            className={`h-1.5 w-8 rounded-full transition-all duration-300 ${
              index < current
                ? "bg-foreground"
                : index === current
                ? "bg-foreground/60"
                : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
