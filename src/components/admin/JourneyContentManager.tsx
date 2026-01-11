/**
 * JourneyContentManager - Panel de gestión de contenido de journeys
 * 
 * Vista principal que muestra el contenido por módulo con tabs.
 * Usa módulos dinámicos desde la base de datos.
 * Permite editar videos, asistentes y configuración de drops.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Video, 
  Bot, 
  Settings2, 
  Plus, 
  AlertCircle, 
  Database,
  Loader2,
  ExternalLink,
  Copy,
  Pencil
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  useJourneyContent,
  useJourneyDropsConfig,
  useJourneyModules,
  useMigrateDefaults,
  groupContentByModule,
  type JourneyType,
  type JourneyContentRow,
  type JourneyDropsConfigRow,
  type JourneyModuleRow,
} from '@/hooks/useJourneyContentAdmin';
import { JOURNEY_DEFAULTS } from '@/config/journey-defaults';
import { ContentEditModal } from './ContentEditModal';
import { DropsConfigEditor } from './DropsConfigEditor';
import { ModuleEditModal } from './ModuleEditModal';

interface JourneyContentManagerProps {
  journeyType: JourneyType;
}

export function JourneyContentManager({ journeyType }: JourneyContentManagerProps) {
  const { data: content, isLoading: contentLoading } = useJourneyContent(journeyType);
  const { data: dropsConfig, isLoading: dropsLoading } = useJourneyDropsConfig(journeyType);
  const { data: modules, isLoading: modulesLoading } = useJourneyModules(journeyType);
  const migrateDefaults = useMigrateDefaults();
  
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<JourneyContentRow | null>(null);
  const [editingDrops, setEditingDrops] = useState<JourneyDropsConfigRow | null>(null);
  const [editingModule, setEditingModule] = useState<JourneyModuleRow | null>(null);
  const [addingModule, setAddingModule] = useState(false);
  const [addingContentType, setAddingContentType] = useState<'video' | 'assistant' | null>(null);
  
  const isLoading = contentLoading || dropsLoading || modulesLoading;
  const hasDbContent = (content?.length ?? 0) > 0;
  const groupedContent = groupContentByModule(content);
  
  // Use first module if none selected
  const currentModule = selectedModule || modules?.[0]?.module_id || '';
  
  // Get drops config for selected module
  const selectedDropsConfig = dropsConfig?.find(d => d.module_id === currentModule);
  
  // Get default content for reference (fallback)
  const defaultModuleContent = JOURNEY_DEFAULTS[journeyType]?.[currentModule];

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copiada al portapapeles');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No modules yet - prompt to use defaults or add
  if (!modules?.length) {
    return (
      <div className="space-y-6">
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong className="text-foreground">No hay módulos configurados.</strong>
              <span className="text-muted-foreground ml-2">
                Añade módulos para organizar el contenido del journey.
              </span>
            </div>
            <Button
              size="sm"
              onClick={() => setAddingModule(true)}
              className="ml-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Añadir Módulo
            </Button>
          </AlertDescription>
        </Alert>

        {addingModule && (
          <ModuleEditModal
            module={null}
            journeyType={journeyType}
            nextSortOrder={1}
            onClose={() => setAddingModule(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Migration alert if no DB content */}
      {!hasDbContent && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong className="text-foreground">Base de datos vacía.</strong>
              <span className="text-muted-foreground ml-2">
                El live usa configuración hardcodeada. Migra para poder editar desde aquí.
              </span>
            </div>
            <Button
              size="sm"
              onClick={() => migrateDefaults.mutate(journeyType)}
              disabled={migrateDefaults.isPending}
              className="ml-4"
            >
              {migrateDefaults.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Database className="w-4 h-4 mr-2" />
              )}
              Migrar configuración
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Info alert */}
      <Alert className="border-primary/30 bg-primary/5">
        <Settings2 className="h-4 w-4 text-primary" />
        <AlertDescription className="text-muted-foreground">
          <strong className="text-foreground">Modo aislado:</strong> Los cambios aquí se guardan en la base de datos 
          pero <strong className="text-foreground">NO afectan al live</strong> hasta que se active el switch final.
        </AlertDescription>
      </Alert>

      {/* Module tabs */}
      <Tabs value={currentModule} onValueChange={setSelectedModule}>
        <div className="flex items-center gap-2">
          <TabsList className="flex-1 justify-start">
            {modules.map((mod) => (
              <TabsTrigger 
                key={mod.module_id} 
                value={mod.module_id} 
                className="flex items-center gap-2 max-w-[200px]"
              >
                <span>{mod.short_label || mod.label.split(':')[0]}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-50 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingModule(mod);
                  }}
                >
                  <Pencil className="w-3 h-3" />
                </Button>
              </TabsTrigger>
            ))}
          </TabsList>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddingModule(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Módulo
          </Button>
        </div>

        {modules.map((mod) => (
          <TabsContent key={mod.module_id} value={mod.module_id} className="space-y-8 mt-6">
            {/* Module header */}
            <div className="border-b border-border pb-4">
              <h3 className="text-xl font-semibold text-foreground">
                {mod.label}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Gestiona el contenido de este módulo
              </p>
            </div>

            {/* Videos section */}
            <ContentSection
              title="Videos"
              icon={<Video className="w-5 h-5" />}
              items={hasDbContent ? groupedContent[mod.module_id]?.videos || [] : []}
              defaultItems={defaultModuleContent?.videos || []}
              hasDbContent={hasDbContent}
              onEdit={(item) => setEditingContent(item)}
              onAdd={() => setAddingContentType('video')}
              onCopyUrl={handleCopyUrl}
              renderItem={(item, isDefault) => (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {isDefault ? (item as any).title : item.video_title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                      {isDefault ? (item as any).url : item.video_url}
                    </p>
                  </div>
                </div>
              )}
            />

            {/* Assistants section */}
            <ContentSection
              title="Asistentes GPT"
              icon={<Bot className="w-5 h-5" />}
              items={hasDbContent ? groupedContent[mod.module_id]?.assistants || [] : []}
              defaultItems={defaultModuleContent?.assistants || []}
              hasDbContent={hasDbContent}
              onEdit={(item) => setEditingContent(item)}
              onAdd={() => setAddingContentType('assistant')}
              onCopyUrl={handleCopyUrl}
              renderItem={(item, isDefault) => (
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {isDefault ? (item as any).icon : item.assistant_icon}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">
                        {isDefault ? (item as any).name : item.assistant_name}
                      </p>
                      {/* Show sub_type badge */}
                      {(isDefault ? (item as any).subType : item.sub_type) === 'roleplay' && (
                        <Badge variant="secondary" className="text-xs">
                          Roleplay
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isDefault ? (item as any).description : item.assistant_description}
                    </p>
                  </div>
                </div>
              )}
            />

            {/* Drops config section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-muted-foreground" />
                  <h4 className="text-lg font-semibold text-foreground">Configuración de Drops</h4>
                </div>
                {hasDbContent && selectedDropsConfig && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingDrops(selectedDropsConfig)}
                  >
                    Editar Drops
                  </Button>
                )}
              </div>

              <div className="glass-card-dark glass-card-dark-static p-4 rounded-lg">
                {hasDbContent && selectedDropsConfig ? (
                  <DropsPreview config={selectedDropsConfig} />
                ) : (
                  <DropsPreview 
                    config={{
                      drops: defaultModuleContent?.drops.drops || [],
                      window_ms: defaultModuleContent?.drops.windowMs === Infinity ? 999999 : (defaultModuleContent?.drops.windowMs || 5000),
                      auto_capture: defaultModuleContent?.drops.autoCapture ?? true,
                      persist_until_next: defaultModuleContent?.drops.persistUntilNext || false,
                    } as any}
                  />
                )}
                {!hasDbContent && (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    (Valores por defecto del código)
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Content Modal */}
      {editingContent && (
        <ContentEditModal
          content={editingContent}
          journeyType={journeyType}
          onClose={() => setEditingContent(null)}
        />
      )}

      {/* Add Content Modal */}
      {addingContentType && (
        <ContentEditModal
          content={null}
          journeyType={journeyType}
          moduleId={currentModule}
          contentType={addingContentType}
          onClose={() => setAddingContentType(null)}
        />
      )}

      {/* Drops Editor Modal */}
      {editingDrops && (
        <DropsConfigEditor
          config={editingDrops}
          journeyType={journeyType}
          onClose={() => setEditingDrops(null)}
        />
      )}

      {/* Module Edit Modal */}
      {editingModule && (
        <ModuleEditModal
          module={editingModule}
          journeyType={journeyType}
          onClose={() => setEditingModule(null)}
        />
      )}

      {/* Add Module Modal */}
      {addingModule && (
        <ModuleEditModal
          module={null}
          journeyType={journeyType}
          nextSortOrder={(modules?.length || 0) + 1}
          onClose={() => setAddingModule(false)}
        />
      )}
    </div>
  );
}

// Content section component
interface ContentSectionProps {
  title: string;
  icon: React.ReactNode;
  items: JourneyContentRow[];
  defaultItems: any[];
  hasDbContent: boolean;
  onEdit: (item: JourneyContentRow) => void;
  onAdd: () => void;
  onCopyUrl: (url: string) => void;
  renderItem: (item: JourneyContentRow | any, isDefault: boolean) => React.ReactNode;
}

function ContentSection({ 
  title, 
  icon, 
  items, 
  defaultItems,
  hasDbContent,
  onEdit, 
  onAdd,
  onCopyUrl,
  renderItem 
}: ContentSectionProps) {
  const displayItems = hasDbContent ? items : defaultItems;
  const isEmpty = displayItems.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="text-lg font-semibold text-foreground">{title}</h4>
          <span className="text-xs text-muted-foreground">({displayItems.length})</span>
        </div>
        {hasDbContent && (
          <Button variant="outline" size="sm" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-1" />
            Añadir
          </Button>
        )}
      </div>

      {isEmpty ? (
        <div className="glass-card-dark glass-card-dark-static p-6 rounded-lg text-center">
          <p className="text-muted-foreground text-sm">No hay {title.toLowerCase()} configurados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayItems.map((item, index) => (
            <motion.div
              key={hasDbContent ? item.id : index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card-dark glass-card-dark-static p-4 rounded-lg flex items-center justify-between group"
            >
              {renderItem(item, !hasDbContent)}
              
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onCopyUrl(hasDbContent ? (item.video_url || item.assistant_url || '') : (item.url || ''))}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                {hasDbContent && (item.video_url || item.assistant_url) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <a href={item.video_url || item.assistant_url || ''} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                )}
                {hasDbContent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(item)}
                  >
                    Editar
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// Drops preview component
function DropsPreview({ config }: { config: Partial<JourneyDropsConfigRow> }) {
  const drops = config.drops || [];
  const windowMs = config.window_ms || 5000;
  const autoCapture = config.auto_capture ?? true;
  const persistUntilNext = config.persist_until_next || false;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4">
        {drops.map((drop, index) => (
          <div key={index} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-foreground/5 border border-foreground/10">
            <span className="text-lg">{drop.symbol}</span>
            <span className="text-xs text-muted-foreground">@ {Math.round(drop.timestamp * 100)}%</span>
          </div>
        ))}
      </div>
      
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>
          Ventana: {windowMs >= 999999 ? '∞' : `${windowMs / 1000}s`}
        </span>
        <span>
          Auto-captura: {autoCapture ? '✓' : '✗'}
        </span>
        {persistUntilNext && (
          <span>Persiste hasta siguiente</span>
        )}
      </div>
    </div>
  );
}
