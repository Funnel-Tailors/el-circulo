import { useState } from "react";
import { formatDistanceToNow, format, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Clock, Plus, RotateCcw, Pause, Play, CalendarIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface TimerControlPanelProps {
  token: string;
  expiresAt: Date | null;
  isPaused: boolean;
  hoursExtended: number;
  firstVisitAt: string | null;
  onExtendTimer: (token: string, hours: number) => Promise<void>;
  onResetTimer: (token: string) => Promise<void>;
  onTogglePause: (token: string, paused: boolean) => Promise<void>;
  onSetCustomExpiry: (token: string, date: Date) => Promise<void>;
}

export function TimerControlPanel({
  token,
  expiresAt,
  isPaused,
  hoursExtended,
  firstVisitAt,
  onExtendTimer,
  onResetTimer,
  onTogglePause,
  onSetCustomExpiry,
}: TimerControlPanelProps) {
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [customDateOpen, setCustomDateOpen] = useState(false);

  const isExpired = expiresAt ? isPast(expiresAt) : false;
  const hasStarted = !!firstVisitAt;

  const handleExtend = async (hours: number) => {
    try {
      await onExtendTimer(token, hours);
      toast({ 
        title: `Timer extendido +${hours}h`, 
        description: `Nuevo total extendido: ${hoursExtended + hours}h` 
      });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo extender el timer' });
    }
  };

  const handleReset = async () => {
    try {
      await onResetTimer(token);
      toast({ title: 'Timer reiniciado', description: '48h desde ahora' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo reiniciar el timer' });
    }
  };

  const handleTogglePause = async () => {
    try {
      await onTogglePause(token, !isPaused);
      toast({ 
        title: isPaused ? 'Acceso reanudado' : 'Acceso pausado',
        description: isPaused ? 'El timer continúa' : 'El usuario no puede acceder temporalmente'
      });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cambiar el estado' });
    }
  };

  const handleCustomDate = async () => {
    if (!customDate) return;
    try {
      await onSetCustomExpiry(token, customDate);
      toast({ 
        title: 'Expiración personalizada', 
        description: format(customDate, "d 'de' MMMM 'a las' HH:mm", { locale: es })
      });
      setCustomDate(undefined);
      setCustomDateOpen(false);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo establecer la fecha' });
    }
  };

  return (
    <div className="bg-foreground/5 rounded-lg p-3 mt-2 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm">
        <Clock className="w-4 h-4 text-foreground/50" />
        <span className="font-medium text-foreground/70">Control de Timer</span>
        {hoursExtended > 0 && (
          <span className="text-xs text-amber-400">+{hoursExtended}h extendidas</span>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center justify-between text-xs">
        <div className="space-y-1">
          {!hasStarted ? (
            <span className="text-foreground/50">Sin primera visita</span>
          ) : isPaused ? (
            <span className="text-orange-400 font-medium">⏸️ Acceso pausado</span>
          ) : isExpired ? (
            <span className="text-red-400 font-medium">⏰ Expirado</span>
          ) : expiresAt ? (
            <span className="text-emerald-400">
              Expira {formatDistanceToNow(expiresAt, { addSuffix: true, locale: es })}
            </span>
          ) : null}
          
          {expiresAt && (
            <p className="text-foreground/40">
              {format(expiresAt, "d MMM yyyy HH:mm", { locale: es })}
            </p>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExtend(24)}
          className="text-xs h-7 gap-1"
        >
          <Plus className="w-3 h-3" /> 24h
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExtend(48)}
          className="text-xs h-7 gap-1"
        >
          <Plus className="w-3 h-3" /> 48h
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExtend(168)}
          className="text-xs h-7 gap-1"
        >
          <Plus className="w-3 h-3" /> 7d
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="text-xs h-7 gap-1 text-cyan-400 hover:text-cyan-300"
        >
          <RotateCcw className="w-3 h-3" /> Reset 48h
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleTogglePause}
          className={`text-xs h-7 gap-1 ${isPaused ? 'text-emerald-400 hover:text-emerald-300' : 'text-orange-400 hover:text-orange-300'}`}
        >
          {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          {isPaused ? 'Reanudar' : 'Pausar'}
        </Button>

        <Popover open={customDateOpen} onOpenChange={setCustomDateOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 gap-1"
            >
              <CalendarIcon className="w-3 h-3" /> Fecha
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={customDate}
              onSelect={setCustomDate}
              disabled={(date) => date < new Date()}
              initialFocus
            />
            <div className="p-3 border-t border-foreground/10">
              <Button 
                size="sm" 
                className="w-full"
                disabled={!customDate}
                onClick={handleCustomDate}
              >
                Establecer expiración
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
