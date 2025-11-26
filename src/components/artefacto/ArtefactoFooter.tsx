export const ArtefactoFooter = () => {
  return (
    <footer className="container mx-auto px-4 py-20">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Divider místico */}
        <div className="flex items-center justify-center gap-4" aria-hidden="true">
          <div className="h-px w-20 bg-gradient-to-r from-transparent to-border"></div>
          <span className="text-muted-foreground">✦</span>
          <div className="h-px w-20 bg-gradient-to-l from-transparent to-border"></div>
        </div>

        <div className="space-y-4">
          <p className="text-2xl md:text-3xl font-display font-bold text-foreground">
            El Círculo no compite con las mismas armas.
          </p>
          <p className="text-xl md:text-2xl text-foreground/80">
            Ahora tú tampoco tienes que hacerlo.
          </p>
        </div>

        <div className="pt-8 border-t border-white/10">
          <p className="text-sm text-foreground/60">
            — El Círculo
          </p>
        </div>
      </div>
    </footer>
  );
};
