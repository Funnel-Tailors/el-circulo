import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBrechaSettings } from "@/hooks/useBrechaSettings";
import { Loader2, Calendar, Clock, AlertCircle, Check, Zap, Rocket } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function BrechaSettings() {
  const { settings, isLoading, error, updateMode, updateDates, validateDates } = useBrechaSettings();
  
  const [opensAtInput, setOpensAtInput] = useState("");
  const [closesAtInput, setClosesAtInput] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync inputs with settings
  useEffect(() => {
    if (settings.opensAt) {
      setOpensAtInput(format(settings.opensAt, "yyyy-MM-dd'T'HH:mm"));
    }
    if (settings.closesAt) {
      setClosesAtInput(format(settings.closesAt, "yyyy-MM-dd'T'HH:mm"));
    }
  }, [settings.opensAt, settings.closesAt]);

  const handleModeToggle = async (checked: boolean) => {
    const newMode = checked ? "evergreen" : "launch";
    
    if (newMode === "launch") {
      if (!opensAtInput || !closesAtInput) {
        setLocalError("Configura las fechas antes de activar modo lanzamiento");
        return;
      }
      const opensAt = new Date(opensAtInput);
      const closesAt = new Date(closesAtInput);
      const validationError = validateDates(opensAt, closesAt);
      if (validationError) {
        setLocalError(validationError);
        return;
      }
    }
    
    setLocalError(null);
    await updateMode(newMode);
  };

  const handleSaveDates = async () => {
    if (!opensAtInput || !closesAtInput) {
      setLocalError("Ambas fechas son requeridas");
      return;
    }

    const opensAt = new Date(opensAtInput);
    const closesAt = new Date(closesAtInput);
    
    const validationError = validateDates(opensAt, closesAt);
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setIsSaving(true);
    setLocalError(null);
    
    const success = await updateDates(opensAt, closesAt);
    
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
    
    setIsSaving(false);
  };

  const getCurrentStatus = () => {
    if (settings.mode === "evergreen") {
      return {
        label: "Evergreen Activo",
        description: "Cada lead tiene 48h desde su primera visita",
        variant: "default" as const,
        icon: Zap,
      };
    }

    const now = new Date();
    if (settings.opensAt && settings.closesAt) {
      if (now < settings.opensAt) {
        return {
          label: "Lanzamiento Programado",
          description: `Abre: ${format(settings.opensAt, "d MMM HH:mm", { locale: es })}`,
          variant: "secondary" as const,
          icon: Calendar,
        };
      }
      if (now >= settings.opensAt && now <= settings.closesAt) {
        return {
          label: "Lanzamiento EN VIVO",
          description: `Cierra: ${format(settings.closesAt, "d MMM HH:mm", { locale: es })}`,
          variant: "destructive" as const,
          icon: Rocket,
        };
      }
      return {
        label: "Lanzamiento Cerrado",
        description: `Cerró: ${format(settings.closesAt, "d MMM HH:mm", { locale: es })}`,
        variant: "outline" as const,
        icon: Clock,
      };
    }

    return {
      label: "Lanzamiento Sin Fechas",
      description: "Configura las fechas de apertura y cierre",
      variant: "outline" as const,
      icon: AlertCircle,
    };
  };

  if (isLoading) {
    return (
      <div className="glass-card-dark rounded-xl p-6 flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-foreground/40" />
      </div>
    );
  }

  const status = getCurrentStatus();
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="text-foreground/30">⟡</span>
            Configuración de Acceso
            <span className="text-foreground/30">⟡</span>
          </h2>
          <p className="text-foreground/60 text-sm mt-1">
            {settings.mode === "evergreen" 
              ? "Modo Evergreen: cada lead tiene 48h" 
              : "Modo Lanzamiento activo"}
          </p>
        </div>
        <Badge variant={status.variant} className="text-sm">
          {status.label}
        </Badge>
      </div>

      {/* Status Card */}
      <div className="glass-card-dark rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon className="h-6 w-6 text-primary" />
            <div>
              <p className="font-medium text-foreground">{status.label}</p>
              <p className="text-sm text-foreground/60">{status.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="glass-card-dark rounded-xl p-6 space-y-6">
        <h3 className="text-lg font-semibold text-foreground">Modo de Acceso</h3>
        
        <div className="flex items-center justify-between p-4 rounded-lg border border-foreground/10 bg-background/20">
          <div className="space-y-1">
            <Label htmlFor="mode-toggle" className="text-base font-medium text-foreground">
              Modo Evergreen
            </Label>
            <p className="text-sm text-foreground/60">
              {settings.mode === "evergreen" 
                ? "Cada lead tiene 48h desde su primera visita" 
                : "Fechas globales para todos los leads"}
            </p>
          </div>
          <Switch
            id="mode-toggle"
            checked={settings.mode === "evergreen"}
            onCheckedChange={handleModeToggle}
          />
        </div>

        {/* Launch Mode Settings - Siempre visible */}
        <div className={`space-y-4 p-4 rounded-lg border ${
          settings.mode === "launch" 
            ? "border-dashed border-foreground/20" 
            : "border-foreground/10 opacity-75"
        }`}>
          <h4 className="font-medium flex items-center gap-2 text-foreground">
            <Rocket className="h-4 w-4" />
            Configuración de Lanzamiento
            {settings.mode === "evergreen" && (
              <span className="text-xs text-foreground/50 font-normal ml-1">
                (pre-configura para cuando desactives evergreen)
              </span>
            )}
          </h4>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="opens-at" className="text-foreground/80">Fecha de Apertura</Label>
              <Input
                id="opens-at"
                type="datetime-local"
                value={opensAtInput}
                onChange={(e) => {
                  setOpensAtInput(e.target.value);
                  setLocalError(null);
                }}
                className="bg-background/30 border-foreground/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closes-at" className="text-foreground/80">Fecha de Cierre</Label>
              <Input
                id="closes-at"
                type="datetime-local"
                value={closesAtInput}
                onChange={(e) => {
                  setClosesAtInput(e.target.value);
                  setLocalError(null);
                }}
                className="bg-background/30 border-foreground/20"
              />
            </div>
          </div>

          <Button 
            onClick={handleSaveDates} 
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Guardado
              </>
            ) : (
              "Guardar Fechas"
            )}
          </Button>
        </div>

        {/* Error Display */}
        {(error || localError) && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="text-sm">{error || localError}</p>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="glass-card-dark rounded-xl p-6">
        <h3 className="text-base font-medium text-foreground mb-4">Cómo funciona cada modo</h3>
        <div className="space-y-4 text-sm text-foreground/60">
          <div className="flex gap-3">
            <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Evergreen</p>
              <p>Cada lead tiene exactamente 48 horas desde su primera visita. Perfecto para tráfico continuo.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Rocket className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Lanzamiento</p>
              <p>Todos los leads comparten las mismas fechas de apertura y cierre. Ideal para eventos en vivo.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
