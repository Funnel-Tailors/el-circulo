/**
 * ModuleEditModal - Modal para editar/crear módulos de un journey
 */

import { useState } from 'react';
import { Loader2, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  useSaveModule,
  useDeleteModule,
  type JourneyModuleRow,
  type JourneyType,
} from '@/hooks/useJourneyContentAdmin';

interface ModuleEditModalProps {
  module: JourneyModuleRow | null;
  journeyType: JourneyType;
  nextSortOrder?: number;
  onClose: () => void;
}

export function ModuleEditModal({ 
  module, 
  journeyType,
  nextSortOrder = 0,
  onClose 
}: ModuleEditModalProps) {
  const saveModule = useSaveModule();
  const deleteModule = useDeleteModule();
  
  const isNew = !module;

  // Form state
  const [formData, setFormData] = useState({
    module_id: module?.module_id || '',
    label: module?.label || '',
    short_label: module?.short_label || '',
    sort_order: module?.sort_order ?? nextSortOrder,
    is_active: module?.is_active ?? true,
  });

  const handleSave = async () => {
    if (!formData.module_id.trim() || !formData.label.trim()) {
      return;
    }

    const saveData = {
      journey_type: journeyType,
      module_id: formData.module_id.toLowerCase().replace(/\s+/g, '_'),
      label: formData.label,
      short_label: formData.short_label || formData.label.split(':')[0],
      sort_order: formData.sort_order,
      is_active: formData.is_active,
    };

    if (module?.id) {
      (saveData as any).id = module.id;
    }

    await saveModule.mutateAsync(saveData);
    onClose();
  };

  const handleDelete = async () => {
    if (!module?.id) return;
    if (!confirm('¿Estás seguro de que quieres eliminar este módulo? Se perderá todo el contenido asociado.')) return;
    
    await deleteModule.mutateAsync({ 
      id: module.id, 
      journeyType 
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {isNew ? 'Añadir Módulo' : 'Editar Módulo'}
          </DialogTitle>
          <DialogDescription>
            {isNew 
              ? 'Crea un nuevo módulo para organizar el contenido' 
              : 'Modifica el nombre y configuración del módulo'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Module ID (only for new) */}
          {isNew && (
            <div className="space-y-2">
              <Label htmlFor="module_id">Identificador</Label>
              <Input
                id="module_id"
                value={formData.module_id}
                onChange={(e) => setFormData(prev => ({ ...prev, module_id: e.target.value }))}
                placeholder="ej: frag5, modulo_nuevo"
              />
              <p className="text-xs text-muted-foreground">
                ID interno único. Se usará en la base de datos.
              </p>
            </div>
          )}

          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="label">Nombre completo</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              placeholder="ej: Fragmento 5: El Portal"
            />
          </div>

          {/* Short label */}
          <div className="space-y-2">
            <Label htmlFor="short_label">Nombre corto (para tabs)</Label>
            <Input
              id="short_label"
              value={formData.short_label}
              onChange={(e) => setFormData(prev => ({ ...prev, short_label: e.target.value }))}
              placeholder="ej: Fragmento 5"
            />
            <p className="text-xs text-muted-foreground">
              Se usa en la navegación por tabs. Dejar vacío para usar la primera parte del nombre.
            </p>
          </div>

          {/* Sort order */}
          <div className="space-y-2">
            <Label htmlFor="sort_order">Orden</Label>
            <Input
              id="sort_order"
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
              min={0}
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              <Label htmlFor="is_active">Activo</Label>
              <p className="text-xs text-muted-foreground">
                Si está desactivado, no aparecerá en el CMS
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between pt-4 border-t border-border">
          {!isNew && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteModule.isPending}
            >
              {deleteModule.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          )}
          
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saveModule.isPending || !formData.module_id.trim() || !formData.label.trim()}
            >
              {saveModule.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
