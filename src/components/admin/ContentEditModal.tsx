/**
 * ContentEditModal - Modal para editar contenido individual
 * Soporta videos y asistentes (con sub_type para distinguir roleplays)
 */

import { useState } from 'react';
import { X, Save, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useSaveContent,
  useDeleteContent,
  type JourneyContentRow,
  type JourneyType,
  type ContentType,
} from '@/hooks/useJourneyContentAdmin';

interface ContentEditModalProps {
  content: JourneyContentRow | null;
  journeyType: JourneyType;
  moduleId?: string;
  contentType?: ContentType;
  onClose: () => void;
}

export function ContentEditModal({ 
  content, 
  journeyType,
  moduleId,
  contentType,
  onClose 
}: ContentEditModalProps) {
  const saveContent = useSaveContent();
  const deleteContent = useDeleteContent();
  
  const isNew = !content;
  const type = content?.content_type || contentType || 'video';

  // Form state
  const [formData, setFormData] = useState({
    content_key: content?.content_key || '',
    video_url: content?.video_url || '',
    video_title: content?.video_title || '',
    assistant_name: content?.assistant_name || '',
    assistant_description: content?.assistant_description || '',
    assistant_url: content?.assistant_url || '',
    assistant_icon: content?.assistant_icon || '🤖',
    assistant_poetic_message: content?.assistant_poetic_message || '',
    sub_type: content?.sub_type || 'standard',
    is_active: content?.is_active ?? true,
  });

  const handleSave = async () => {
    const saveData: any = {
      journey_type: content?.journey_type || journeyType,
      module_id: content?.module_id || moduleId || '',
      content_type: type,
      content_key: formData.content_key || `${type}_${Date.now()}`,
      is_active: formData.is_active,
    };

    if (type === 'video') {
      saveData.video_url = formData.video_url;
      saveData.video_title = formData.video_title;
    } else {
      saveData.assistant_name = formData.assistant_name;
      saveData.assistant_description = formData.assistant_description;
      saveData.assistant_url = formData.assistant_url;
      saveData.assistant_icon = formData.assistant_icon;
      saveData.assistant_poetic_message = formData.assistant_poetic_message || null;
      saveData.sub_type = formData.sub_type;
    }

    if (content?.id) {
      saveData.id = content.id;
    }

    await saveContent.mutateAsync(saveData);
    onClose();
  };

  const handleDelete = async () => {
    if (!content?.id) return;
    if (!confirm('¿Estás seguro de que quieres eliminar este contenido?')) return;
    
    await deleteContent.mutateAsync({ 
      id: content.id, 
      journeyType: content.journey_type 
    });
    onClose();
  };

  const getTitle = () => {
    if (isNew) {
      return type === 'video' ? 'Añadir Video' : 'Añadir Asistente GPT';
    }
    return type === 'video' ? 'Editar Video' : 'Editar Asistente GPT';
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Content Key (only for new items) */}
          {isNew && (
            <div className="space-y-2">
              <Label htmlFor="content_key">Identificador único</Label>
              <Input
                id="content_key"
                value={formData.content_key}
                onChange={(e) => setFormData(prev => ({ ...prev, content_key: e.target.value }))}
                placeholder="ej: main, video_1, assistant_1"
              />
              <p className="text-xs text-muted-foreground">
                Identificador interno. Dejar vacío para autogenerar.
              </p>
            </div>
          )}

          {/* Video fields */}
          {type === 'video' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="video_title">Título</Label>
                <Input
                  id="video_title"
                  value={formData.video_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, video_title: e.target.value }))}
                  placeholder="Ej: Clase 1: Preparación"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="video_url">URL del video</Label>
                <Input
                  id="video_url"
                  value={formData.video_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                  placeholder="https://storage.googleapis.com/..."
                />
              </div>
            </>
          )}

          {/* Assistant fields */}
          {type === 'assistant' && (
            <>
              <div className="grid grid-cols-[60px_1fr] gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assistant_icon">Icono</Label>
                  <Input
                    id="assistant_icon"
                    value={formData.assistant_icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, assistant_icon: e.target.value }))}
                    className="text-center text-2xl"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assistant_name">Nombre</Label>
                  <Input
                    id="assistant_name"
                    value={formData.assistant_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, assistant_name: e.target.value }))}
                    placeholder="Ej: Asistente de Oferta"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="assistant_description">Descripción</Label>
                <Input
                  id="assistant_description"
                  value={formData.assistant_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, assistant_description: e.target.value }))}
                  placeholder="Breve descripción de lo que hace"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="assistant_url">URL de ChatGPT</Label>
                <Input
                  id="assistant_url"
                  value={formData.assistant_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, assistant_url: e.target.value }))}
                  placeholder="https://chatgpt.com/g/..."
                />
              </div>

              {/* Sub-type selector */}
              <div className="space-y-2">
                <Label htmlFor="sub_type">Tipo de asistente</Label>
                <Select
                  value={formData.sub_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, sub_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Estándar</SelectItem>
                    <SelectItem value="roleplay">Roleplay (práctica)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Los roleplays se muestran con una etiqueta distintiva.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assistant_poetic_message">Mensaje poético (opcional)</Label>
                <Textarea
                  id="assistant_poetic_message"
                  value={formData.assistant_poetic_message}
                  onChange={(e) => setFormData(prev => ({ ...prev, assistant_poetic_message: e.target.value }))}
                  placeholder="Mensaje que aparece al desbloquear..."
                  rows={2}
                />
              </div>
            </>
          )}

          {/* Active toggle */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              <Label htmlFor="is_active">Activo</Label>
              <p className="text-xs text-muted-foreground">
                Si está desactivado, no aparecerá en el live
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
              disabled={deleteContent.isPending}
            >
              {deleteContent.isPending ? (
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
              disabled={saveContent.isPending}
            >
              {saveContent.isPending ? (
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
