import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Check, X, Loader2, Zap, ZapOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SyncResult {
  token: string;
  name: string;
  success: boolean;
  tags?: string[];
  error?: string;
}

interface BulkSyncResponse {
  success: boolean;
  total: number;
  synced: number;
  failed: number;
  results: SyncResult[];
}

export default function BrechaSyncManager() {
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [loadingToggle, setLoadingToggle] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResults, setLastSyncResults] = useState<BulkSyncResponse | null>(null);

  // Load initial sync setting
  useEffect(() => {
    loadSyncSetting();
  }, []);

  const loadSyncSetting = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'brecha_sync_enabled')
        .maybeSingle();

      if (error) throw error;
      
      // Handle both boolean and string values
      const value = data?.value;
      setSyncEnabled(value === true || value === 'true');
    } catch (err) {
      console.error('Error loading sync setting:', err);
    } finally {
      setLoadingToggle(false);
    }
  };

  const handleToggleSync = async (enabled: boolean) => {
    setLoadingToggle(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ 
          key: 'brecha_sync_enabled', 
          value: enabled,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setSyncEnabled(enabled);
      toast.success(enabled ? 'Sincronización activada' : 'Sincronización pausada');
    } catch (err) {
      console.error('Error updating sync setting:', err);
      toast.error('Error al actualizar configuración');
    } finally {
      setLoadingToggle(false);
    }
  };

  const handleBulkSync = async () => {
    setSyncing(true);
    setLastSyncResults(null);
    
    try {
      toast.info('Iniciando sincronización masiva...');
      
      const { data, error } = await supabase.functions.invoke('sync-brecha-tags-bulk');
      
      if (error) throw error;
      
      const response = data as BulkSyncResponse;
      setLastSyncResults(response);
      
      if (response.success) {
        toast.success(`Sincronización completada: ${response.synced}/${response.total} exitosos`);
      } else {
        toast.error('Error en la sincronización masiva');
      }
    } catch (err) {
      console.error('Error in bulk sync:', err);
      toast.error('Error al ejecutar sincronización');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {syncEnabled ? <Zap className="h-5 w-5 text-yellow-500" /> : <ZapOff className="h-5 w-5 text-muted-foreground" />}
            Control de Sincronización
          </CardTitle>
          <CardDescription>
            Gestiona la sincronización automática de tags con GHL
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="sync-toggle" className="text-base font-medium">
                Sincronización Automática
              </Label>
              <p className="text-sm text-muted-foreground">
                Cuando está activo, los tags se actualizan automáticamente al completar hitos
              </p>
            </div>
            <Switch
              id="sync-toggle"
              checked={syncEnabled}
              onCheckedChange={handleToggleSync}
              disabled={loadingToggle}
            />
          </div>

          {/* Re-sync Button */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <p className="font-medium">Re-sincronizar Todos los Leads</p>
              <p className="text-sm text-muted-foreground">
                Fuerza una actualización de tags para todos los leads existentes
              </p>
            </div>
            <Button 
              onClick={handleBulkSync} 
              disabled={syncing}
              variant="outline"
            >
              {syncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Re-sync Masivo
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Panel */}
      {lastSyncResults && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resultados del Último Sync</CardTitle>
            <CardDescription>
              {lastSyncResults.synced} de {lastSyncResults.total} leads sincronizados correctamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Summary */}
            <div className="flex gap-4 mb-4">
              <Badge variant="default" className="bg-green-500/20 text-green-600 border-green-500/30">
                <Check className="mr-1 h-3 w-3" />
                {lastSyncResults.synced} Exitosos
              </Badge>
              {lastSyncResults.failed > 0 && (
                <Badge variant="destructive" className="bg-red-500/20 text-red-600 border-red-500/30">
                  <X className="mr-1 h-3 w-3" />
                  {lastSyncResults.failed} Fallidos
                </Badge>
              )}
            </div>

            {/* Detailed Results */}
            <div className="max-h-80 overflow-y-auto space-y-2">
              {lastSyncResults.results.map((result, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    result.success 
                      ? 'bg-green-500/5 border-green-500/20' 
                      : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-medium">{result.name}</span>
                    </div>
                    {result.success && result.tags && (
                      <span className="text-sm text-muted-foreground">
                        {result.tags.length} tags
                      </span>
                    )}
                  </div>
                  {result.success && result.tags && result.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {result.tags.slice(0, 5).map((tag, tagIdx) => (
                        <Badge key={tagIdx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {result.tags.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{result.tags.length - 5} más
                        </Badge>
                      )}
                    </div>
                  )}
                  {!result.success && result.error && (
                    <p className="mt-1 text-sm text-red-500">{result.error}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
