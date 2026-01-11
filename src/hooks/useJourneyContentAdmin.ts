/**
 * Hook para gestionar el contenido de journeys desde el admin
 * 
 * IMPORTANTE: Este hook es SOLO para el panel de admin.
 * NO se usa en componentes del live.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  JOURNEY_DEFAULTS, 
  type ModuleContent, 
  type VideoContent, 
  type AssistantContent, 
  type DropsSettings 
} from '@/config/journey-defaults';

export type JourneyType = 'senda' | 'brecha';
export type ContentType = 'video' | 'assistant';

export interface JourneyContentRow {
  id: string;
  journey_type: string;
  module_id: string;
  content_type: string;
  content_key: string;
  video_url: string | null;
  video_title: string | null;
  assistant_name: string | null;
  assistant_description: string | null;
  assistant_url: string | null;
  assistant_icon: string | null;
  assistant_poetic_message: string | null;
  assistant_features: string[] | null;
  sub_type: string | null; // 'standard', 'roleplay', etc.
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JourneyDropsConfigRow {
  id: string;
  journey_type: string;
  module_id: string;
  drops: { id: string; symbol: string; timestamp: number }[];
  window_ms: number;
  auto_capture: boolean;
  persist_until_next: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JourneyModuleRow {
  id: string;
  journey_type: string;
  module_id: string;
  label: string;
  short_label: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JourneyRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

// =====================================================
// JOURNEYS & MODULES HOOKS
// =====================================================

// Fetch all journeys
export function useJourneys() {
  return useQuery({
    queryKey: ['journeys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journeys')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      return data as JourneyRow[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Fetch modules for a journey type
export function useJourneyModules(journeyType: JourneyType) {
  return useQuery({
    queryKey: ['journey-modules', journeyType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journey_modules')
        .select('*')
        .eq('journey_type', journeyType)
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data as JourneyModuleRow[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Save module
export function useSaveModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (module: Partial<JourneyModuleRow> & { 
      journey_type: string; 
      module_id: string;
      label: string;
    }) => {
      const { data, error } = await supabase
        .from('journey_modules')
        .upsert(module, { 
          onConflict: 'journey_type,module_id' 
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['journey-modules', variables.journey_type] 
      });
      toast.success('Módulo guardado');
    },
    onError: (error) => {
      console.error('Error saving module:', error);
      toast.error('Error al guardar el módulo');
    },
  });
}

// Delete module
export function useDeleteModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, journeyType }: { id: string; journeyType: string }) => {
      const { error } = await supabase
        .from('journey_modules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { journeyType };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ 
        queryKey: ['journey-modules', result.journeyType] 
      });
      toast.success('Módulo eliminado');
    },
    onError: (error) => {
      console.error('Error deleting module:', error);
      toast.error('Error al eliminar el módulo');
    },
  });
}

// =====================================================
// CONTENT HOOKS
// =====================================================

// Fetch all content for a journey type
export function useJourneyContent(journeyType: JourneyType) {
  return useQuery({
    queryKey: ['journey-content', journeyType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journey_content')
        .select('*')
        .eq('journey_type', journeyType)
        .order('module_id')
        .order('sort_order');

      if (error) throw error;
      return data as JourneyContentRow[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch all drops config for a journey type
export function useJourneyDropsConfig(journeyType: JourneyType) {
  return useQuery({
    queryKey: ['journey-drops-config', journeyType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journey_drops_config')
        .select('*')
        .eq('journey_type', journeyType)
        .order('module_id');

      if (error) throw error;
      return data as JourneyDropsConfigRow[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Save content item
export function useSaveContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: Partial<JourneyContentRow> & { 
      journey_type: string; 
      module_id: string; 
      content_type: string; 
      content_key: string;
    }) => {
      const { data, error } = await supabase
        .from('journey_content')
        .upsert(content, { 
          onConflict: 'journey_type,module_id,content_type,content_key' 
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['journey-content', variables.journey_type] 
      });
      toast.success('Contenido guardado');
    },
    onError: (error) => {
      console.error('Error saving content:', error);
      toast.error('Error al guardar el contenido');
    },
  });
}

// Save drops config
export function useSaveDropsConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<JourneyDropsConfigRow> & { 
      journey_type: string; 
      module_id: string;
    }) => {
      const { data, error } = await supabase
        .from('journey_drops_config')
        .upsert(config, { 
          onConflict: 'journey_type,module_id' 
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['journey-drops-config', variables.journey_type] 
      });
      toast.success('Configuración de drops guardada');
    },
    onError: (error) => {
      console.error('Error saving drops config:', error);
      toast.error('Error al guardar la configuración');
    },
  });
}

// Delete content item
export function useDeleteContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, journeyType }: { id: string; journeyType: string }) => {
      const { error } = await supabase
        .from('journey_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { journeyType };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ 
        queryKey: ['journey-content', result.journeyType] 
      });
      toast.success('Contenido eliminado');
    },
    onError: (error) => {
      console.error('Error deleting content:', error);
      toast.error('Error al eliminar el contenido');
    },
  });
}

// =====================================================
// MIGRATION HOOKS
// =====================================================

// Migrate defaults to database
export function useMigrateDefaults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (journeyType: JourneyType) => {
      const defaults = JOURNEY_DEFAULTS[journeyType];
      const contentRows: Array<{
        journey_type: string;
        module_id: string;
        content_type: string;
        content_key: string;
        video_url?: string | null;
        video_title?: string | null;
        assistant_name?: string | null;
        assistant_description?: string | null;
        assistant_url?: string | null;
        assistant_icon?: string | null;
        assistant_poetic_message?: string | null;
        assistant_features?: string[] | null;
        sub_type?: string | null;
        sort_order: number;
        is_active: boolean;
      }> = [];
      const dropsRows: Array<{
        journey_type: string;
        module_id: string;
        drops: { id: string; symbol: string; timestamp: number }[];
        window_ms: number;
        auto_capture: boolean;
        persist_until_next: boolean;
        is_active: boolean;
      }> = [];

      for (const [moduleId, moduleContent] of Object.entries(defaults)) {
        // Videos
        moduleContent.videos.forEach((video, index) => {
          contentRows.push({
            journey_type: journeyType,
            module_id: moduleId,
            content_type: 'video',
            content_key: video.key,
            video_url: video.url,
            video_title: video.title,
            sort_order: index,
            is_active: true,
          });
        });

        // Assistants (includes roleplays with sub_type)
        moduleContent.assistants.forEach((assistant, index) => {
          contentRows.push({
            journey_type: journeyType,
            module_id: moduleId,
            content_type: 'assistant',
            content_key: assistant.key,
            assistant_name: assistant.name,
            assistant_description: assistant.description,
            assistant_url: assistant.url,
            assistant_icon: assistant.icon,
            assistant_poetic_message: assistant.poeticMessage || null,
            assistant_features: assistant.features || null,
            sub_type: assistant.subType || 'standard',
            sort_order: index,
            is_active: true,
          });
        });

        // Drops config
        dropsRows.push({
          journey_type: journeyType,
          module_id: moduleId,
          drops: moduleContent.drops.drops,
          window_ms: moduleContent.drops.windowMs === Infinity ? 999999 : moduleContent.drops.windowMs,
          auto_capture: moduleContent.drops.autoCapture,
          persist_until_next: moduleContent.drops.persistUntilNext || false,
          is_active: true,
        });
      }

      // Insert all content
      if (contentRows.length > 0) {
        const { error: contentError } = await supabase
          .from('journey_content')
          .upsert(contentRows, { 
            onConflict: 'journey_type,module_id,content_type,content_key' 
          });
        if (contentError) throw contentError;
      }

      // Insert all drops configs
      if (dropsRows.length > 0) {
        const { error: dropsError } = await supabase
          .from('journey_drops_config')
          .upsert(dropsRows, { 
            onConflict: 'journey_type,module_id' 
          });
        if (dropsError) throw dropsError;
      }

      return { journeyType, contentCount: contentRows.length, dropsCount: dropsRows.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['journey-content', result.journeyType] });
      queryClient.invalidateQueries({ queryKey: ['journey-drops-config', result.journeyType] });
      toast.success(`Migración completada: ${result.contentCount} items de contenido, ${result.dropsCount} configs de drops`);
    },
    onError: (error) => {
      console.error('Error migrating defaults:', error);
      toast.error('Error al migrar la configuración');
    },
  });
}

// Check if database has content
export function useHasDbContent(journeyType: JourneyType) {
  const { data: content } = useJourneyContent(journeyType);
  return (content?.length ?? 0) > 0;
}

// =====================================================
// HELPERS
// =====================================================

// Group content by module
export function groupContentByModule(content: JourneyContentRow[] | undefined) {
  if (!content) return {};
  
  return content.reduce((acc, item) => {
    if (!acc[item.module_id]) {
      acc[item.module_id] = {
        videos: [],
        assistants: [],
      };
    }
    
    if (item.content_type === 'video') {
      acc[item.module_id].videos.push(item);
    } else if (item.content_type === 'assistant') {
      acc[item.module_id].assistants.push(item);
    }
    
    return acc;
  }, {} as Record<string, { videos: JourneyContentRow[]; assistants: JourneyContentRow[] }>);
}
