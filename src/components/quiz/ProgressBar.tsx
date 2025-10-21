interface ProgressBarProps {
  current: number;
  total: number;
}

const ProgressBar = ({ current, total }: ProgressBarProps) => {
  return (
    <div className="flex gap-2 justify-center py-4">
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
  );
};

export default ProgressBar;
