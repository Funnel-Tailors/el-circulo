export const SendaFooter = () => {
  return (
    <div className="text-center space-y-6 pt-8 pb-16">
      <div className="flex items-center justify-center gap-4" aria-hidden="true">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
        <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
      </div>

      <div className="glass-card-dark p-8 max-w-2xl mx-auto space-y-4">
        <p className="text-lg text-foreground font-semibold">
          Nos vemos en el ritual de iniciación.
        </p>

        <p className="text-muted-foreground">
          ¿Dudas? Escríbenos a WhatsApp
        </p>

        <a
          href="https://wa.me/34YOUR_PHONE"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block dark-button-primary px-6 py-3 rounded-lg font-medium transition-all"
        >
          Contactar por WhatsApp →
        </a>
      </div>

      <div className="flex items-center justify-center gap-4 pt-6" aria-hidden="true">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
        <div className="text-muted-foreground text-xs">⟡</div>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
      </div>

      <div className="text-center space-y-2 pt-4">
        <div className="text-4xl opacity-30">⊙</div>
        <p className="text-xs text-muted-foreground">
          No compartas este link. Es solo para los que han cualificado.
        </p>
      </div>
    </div>
  );
};
