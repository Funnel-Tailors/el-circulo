import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface OtpStepProps {
  phone: string;
  contactId: string;
  /** Se llama tras verificar OK. Devuelve la promesa de creación del lead
   *  (true = ok / false = falló) para mantener el botón en "cargando" hasta
   *  que aparezca el calendario, o reactivarlo si la creación del lead falla. */
  onVerified: () => Promise<boolean | void> | boolean | void;
  onBack: () => void;
  /** Reenvía el código. Devuelve true si se envió. */
  onResend: () => Promise<boolean>;
  /** Cláusula final del subtítulo (default: contexto de llamada). */
  purposeText?: string;
  /** Texto del botón de verificar (default: contexto de llamada). */
  ctaLabel?: string;
}

export const OtpStep = ({
  phone,
  contactId,
  onVerified,
  onBack,
  onResend,
  purposeText = "para ver tu hueco de llamada",
  ctaLabel = "Verificar y ver mi hueco →",
}: OtpStepProps) => {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(60);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError("Introduce los 6 dígitos del código.");
      return;
    }
    setIsVerifying(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("verify-circulo-otp", {
        body: { contactId, code },
      });
      if (fnErr) throw fnErr;
      if (data?.verified) {
        // Mantener el loading mientras se crea el lead y aparece el calendario
        const ok = await onVerified();
        if (ok === false) {
          setError("No se pudo confirmar tu plaza. Inténtalo otra vez.");
          setIsVerifying(false);
        }
      } else {
        setError(data?.error || "Código incorrecto.");
        setIsVerifying(false);
      }
    } catch (e) {
      console.error("verify-circulo-otp error:", e);
      setError("No se pudo verificar. Inténtalo otra vez.");
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError(null);
    setCode("");
    const ok = await onResend();
    if (ok) setCooldown(60);
    else setError("No se pudo reenviar el código. Inténtalo en un momento.");
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="text-4xl" aria-hidden="true">💬</div>
        <h2 className="text-2xl md:text-3xl font-display font-black text-foreground leading-tight">
          Verifica tu <span className="glow">WhatsApp</span>
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Te acabo de enviar un código de 6 dígitos por WhatsApp a{" "}
          <span className="text-foreground font-semibold">{phone}</span>. Introduce aquí el código {purposeText}.
        </p>
      </div>

      <div className="space-y-3 max-w-xs mx-auto">
        <Input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6));
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleVerify();
          }}
          placeholder="••••••"
          className="dark-button text-center text-2xl tracking-[0.5em] font-bold"
          disabled={isVerifying}
        />

        {error && <p className="text-xs text-destructive text-center">{error}</p>}

        <Button
          onClick={handleVerify}
          disabled={isVerifying || code.length !== 6}
          className="w-full bg-foreground text-background hover:bg-foreground/90 ring-1 ring-foreground/60 animate-glow-pulse-intense text-lg py-6 font-bold transition-colors"
          size="lg"
        >
          {isVerifying ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              Verificando...
            </span>
          ) : (
            ctaLabel
          )}
        </Button>

        <div className="flex items-center justify-between text-xs pt-1">
          <button
            type="button"
            onClick={onBack}
            disabled={isVerifying}
            className="text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            ← Cambiar número
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || isVerifying}
            className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cooldown > 0 ? `Reenviar (${cooldown}s)` : "Reenviar código"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtpStep;
