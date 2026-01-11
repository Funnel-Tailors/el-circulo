/**
 * DropsConfigEditor - Editor visual de configuración de drops
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Loader2, Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useSaveDropsConfig,
  type JourneyDropsConfigRow,
  type JourneyType,
} from '@/hooks/useJourneyContentAdmin';

interface DropItem {
  id: string;
  symbol: string;
  timestamp: number;
}

interface DropsConfigEditorProps {
  config: JourneyDropsConfigRow;
  journeyType: JourneyType;
  onClose: () => void;
}

// Common symbols for drops
const SYMBOL_OPTIONS = ['◆', '⬢', '✧', '◇', '⌬', '⏣', '⬡', '◈', '✦', '⟡', '⌘', '☆', '★', '◉', '◎'];

export function DropsConfigEditor({ config, journeyType, onClose }: DropsConfigEditorProps) {
  const saveConfig = useSaveDropsConfig();

  // Form state
  const [drops, setDrops] = useState<DropItem[]>(config.drops || []);
  const [windowMs, setWindowMs] = useState(config.window_ms || 5000);
  const [autoCapture, setAutoCapture] = useState(config.auto_capture ?? true);
  const [persistUntilNext, setPersistUntilNext] = useState(config.persist_until_next || false);

  const handleAddDrop = () => {
    const newDrop: DropItem = {
      id: `drop_${Date.now()}`,
      symbol: SYMBOL_OPTIONS[drops.length % SYMBOL_OPTIONS.length],
      timestamp: drops.length > 0 
        ? Math.min(0.95, (drops[drops.length - 1].timestamp || 0.5) + 0.15)
        : 0.2,
    };
    setDrops([...drops, newDrop]);
  };

  const handleRemoveDrop = (index: number) => {
    setDrops(drops.filter((_, i) => i !== index));
  };

  const handleUpdateDrop = (index: number, field: keyof DropItem, value: any) => {
    const updated = [...drops];
    updated[index] = { ...updated[index], [field]: value };
    setDrops(updated);
  };

  const handleSave = async () => {
    await saveConfig.mutateAsync({
      id: config.id,
      journey_type: config.journey_type,
      module_id: config.module_id,
      drops: drops,
      window_ms: windowMs,
      auto_capture: autoCapture,
      persist_until_next: persistUntilNext,
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Drops</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Drops list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Drops ({drops.length})</Label>
              <Button variant="outline" size="sm" onClick={handleAddDrop}>
                <Plus className="w-4 h-4 mr-1" />
                Añadir Drop
              </Button>
            </div>

            <div className="space-y-3">
              {drops.map((drop, index) => (
                <motion.div
                  key={drop.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                  
                  {/* Symbol selector */}
                  <div className="w-16">
                    <select
                      value={drop.symbol}
                      onChange={(e) => handleUpdateDrop(index, 'symbol', e.target.value)}
                      className="w-full h-10 text-center text-xl bg-background border border-border rounded-md cursor-pointer"
                    >
                      {SYMBOL_OPTIONS.map((sym) => (
                        <option key={sym} value={sym}>{sym}</option>
                      ))}
                    </select>
                  </div>

                  {/* Timestamp slider */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Posición en video</span>
                      <span>{Math.round(drop.timestamp * 100)}%</span>
                    </div>
                    <Slider
                      value={[drop.timestamp * 100]}
                      onValueChange={([val]) => handleUpdateDrop(index, 'timestamp', val / 100)}
                      min={5}
                      max={95}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* ID input */}
                  <Input
                    value={drop.id}
                    onChange={(e) => handleUpdateDrop(index, 'id', e.target.value)}
                    className="w-24 text-xs"
                    placeholder="ID"
                  />

                  {/* Remove button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleRemoveDrop(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}

              {drops.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No hay drops configurados
                </div>
              )}
            </div>
          </div>

          {/* Timing settings */}
          <div className="space-y-4 pt-4 border-t border-border">
            <Label>Configuración de tiempo</Label>
            
            <div className="space-y-4">
              {/* Window duration */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Ventana de captura</span>
                  <span className="text-sm font-medium">
                    {windowMs >= 999999 ? '∞ (infinito)' : `${windowMs / 1000}s`}
                  </span>
                </div>
                <Slider
                  value={[windowMs >= 999999 ? 100 : windowMs / 1000]}
                  onValueChange={([val]) => setWindowMs(val >= 100 ? 999999 : val * 1000)}
                  min={1}
                  max={100}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  Tiempo que el drop está visible antes de desaparecer. 100 = infinito.
                </p>
              </div>

              {/* Auto capture toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto_capture">Auto-captura</Label>
                  <p className="text-xs text-muted-foreground">
                    Si está activado, el drop se captura automáticamente al expirar
                  </p>
                </div>
                <Switch
                  id="auto_capture"
                  checked={autoCapture}
                  onCheckedChange={setAutoCapture}
                />
              </div>

              {/* Persist until next toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="persist_until_next">Persistir hasta siguiente</Label>
                  <p className="text-xs text-muted-foreground">
                    El drop permanece hasta que aparece el siguiente
                  </p>
                </div>
                <Switch
                  id="persist_until_next"
                  checked={persistUntilNext}
                  onCheckedChange={setPersistUntilNext}
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2 pt-4 border-t border-border">
            <Label>Vista previa</Label>
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <div className="h-8 relative bg-foreground/5 rounded-full overflow-hidden">
                {drops.map((drop, index) => (
                  <div
                    key={drop.id}
                    className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/30 border border-primary flex items-center justify-center text-sm"
                    style={{ left: `calc(${drop.timestamp * 100}% - 12px)` }}
                    title={`${drop.symbol} @ ${Math.round(drop.timestamp * 100)}%`}
                  >
                    {drop.symbol}
                  </div>
                ))}
                {/* Progress indicator line */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent" style={{ width: '30%' }} />
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saveConfig.isPending}
          >
            {saveConfig.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
