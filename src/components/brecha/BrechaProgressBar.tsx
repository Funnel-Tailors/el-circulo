import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Video, Target, Sparkles, Bot, Unlock, RotateCcw, MessageSquare, Zap } from 'lucide-react';

// Modular milestone configuration for La Brecha (4 Fragmentos + 3 Portals)
const BRECHA_MODULES = [
  {
    id: 'frag1',
    name: 'F1: El Precio',
    icon: '💰',
    milestones: [
      { id: 'video', icon: Video, label: 'Video' },
      { id: 'drops', icon: Target, label: 'Drops' },
      { id: 'ritual', icon: Sparkles, label: 'Ritual' },
      { id: 'assistant', icon: Bot, label: 'Asistente' },
    ]
  },
  {
    id: 'portal1',
    name: 'Portal 1',
    icon: '🌀',
    milestones: [
      { id: 'traversed', icon: Zap, label: 'Portal' },
    ]
  },
  {
    id: 'frag2',
    name: 'F2: El Espejo',
    icon: '🪞',
    milestones: [
      { id: 'video', icon: Video, label: 'Video' },
      { id: 'drops', icon: Target, label: 'Drops' },
      { id: 'ritual', icon: Sparkles, label: 'Ritual' },
      { id: 'assistant', icon: Bot, label: 'Asistente' },
    ]
  },
  {
    id: 'portal2',
    name: 'Portal 2',
    icon: '🌀',
    milestones: [
      { id: 'traversed', icon: Zap, label: 'Portal' },
    ]
  },
  {
    id: 'frag3',
    name: 'F3: La Voz',
    icon: '🗣️',
    milestones: [
      { id: 'video1', icon: Video, label: 'Video 1' },
      { id: 'video2', icon: Video, label: 'Video 2' },
      { id: 'drops', icon: Target, label: 'Drops' },
      { id: 'ritual', icon: Sparkles, label: 'Ritual' },
      { id: 'assistant1', icon: Bot, label: 'Asist. 1' },
      { id: 'assistant2', icon: Bot, label: 'Asist. 2' },
      { id: 'assistant3', icon: Bot, label: 'Asist. 3' },
    ]
  },
  {
    id: 'portal3',
    name: 'Portal 3',
    icon: '🌀',
    milestones: [
      { id: 'traversed', icon: Zap, label: 'Portal' },
    ]
  },
  {
    id: 'frag4',
    name: 'F4: El Cierre',
    icon: '🎯',
    milestones: [
      { id: 'video', icon: Video, label: 'Video' },
      { id: 'drops', icon: Target, label: 'Drops' },
      { id: 'ritual', icon: Sparkles, label: 'Ritual' },
      { id: 'roleplay', icon: MessageSquare, label: 'Roleplay' },
    ]
  },
] as const;

export interface BrechaProgress {
  // Frag 1
  frag1_video_started?: boolean;
  frag1_video_progress?: number;
  frag1_drops_captured?: string[];
  frag1_drops_missed?: string[];
  frag1_ritual_accepted?: boolean;
  frag1_sequence_completed?: boolean;
  frag1_assistant_unlocked?: boolean;
  frag1_assistant_opened?: boolean;
  // Portal 1
  portal_traversed?: boolean;
  // Frag 2
  frag2_video_started?: boolean;
  frag2_video_progress?: number;
  frag2_drops_captured?: string[];
  frag2_drops_missed?: string[];
  frag2_ritual_accepted?: boolean;
  frag2_sequence_completed?: boolean;
  frag2_assistant_unlocked?: boolean;
  frag2_assistant_opened?: boolean;
  // Portal 2
  portal2_traversed?: boolean;
  // Frag 3
  frag3_video1_started?: boolean;
  frag3_video1_progress?: number;
  frag3_video2_started?: boolean;
  frag3_video2_progress?: number;
  frag3_drops_captured?: string[];
  frag3_drops_missed?: string[];
  frag3_ritual_accepted?: boolean;
  frag3_sequence_completed?: boolean;
  frag3_assistant1_opened?: boolean;
  frag3_assistant2_opened?: boolean;
  frag3_assistant3_opened?: boolean;
  // Portal 3
  portal3_traversed?: boolean;
  // Frag 4
  frag4_video_started?: boolean;
  frag4_video_progress?: number;
  frag4_drops_captured?: string[];
  frag4_drops_missed?: string[];
  frag4_ritual_accepted?: boolean;
  frag4_sequence_completed?: boolean;
  frag4_roleplay_unlocked?: boolean;
  frag4_roleplay_opened?: boolean;
  // Journey
  journey_completed?: boolean;
}

interface BrechaProgressBarProps {
  progress: BrechaProgress | null;
  onUnlockMilestone: (milestone: string) => Promise<void>;
  onResetMilestone: (milestone: string) => Promise<void>;
  leadName: string;
}

type MilestoneStatus = 'completed' | 'partial' | 'locked';

const getMilestoneStatus = (
  moduleId: string,
  milestoneId: string,
  progress: BrechaProgress | null
): { status: MilestoneStatus; detail: string } => {
  if (!progress) return { status: 'locked', detail: 'Sin datos' };

  // Frag 1
  if (moduleId === 'frag1') {
    if (milestoneId === 'video') {
      const pct = progress.frag1_video_progress || 0;
      if (pct >= 100) return { status: 'completed', detail: '100%' };
      if (pct > 0) return { status: 'partial', detail: `${pct}%` };
      return { status: 'locked', detail: '0%' };
    }
    if (milestoneId === 'drops') {
      const captured = progress.frag1_drops_captured?.length || 0;
      if (captured >= 3) return { status: 'completed', detail: '3/3' };
      if (captured > 0) return { status: 'partial', detail: `${captured}/3` };
      return { status: 'locked', detail: '0/3' };
    }
    if (milestoneId === 'ritual') {
      if (progress.frag1_sequence_completed) return { status: 'completed', detail: 'Completado' };
      if (progress.frag1_ritual_accepted) return { status: 'partial', detail: 'Aceptado' };
      return { status: 'locked', detail: 'Pendiente' };
    }
    if (milestoneId === 'assistant') {
      if (progress.frag1_assistant_opened) return { status: 'completed', detail: 'Abierto' };
      if (progress.frag1_assistant_unlocked) return { status: 'partial', detail: 'Desbloqueado' };
      return { status: 'locked', detail: 'Bloqueado' };
    }
  }

  // Portal 1
  if (moduleId === 'portal1' && milestoneId === 'traversed') {
    if (progress.portal_traversed) return { status: 'completed', detail: 'Atravesado' };
    return { status: 'locked', detail: 'Cerrado' };
  }

  // Frag 2
  if (moduleId === 'frag2') {
    if (milestoneId === 'video') {
      const pct = progress.frag2_video_progress || 0;
      if (pct >= 100) return { status: 'completed', detail: '100%' };
      if (pct > 0) return { status: 'partial', detail: `${pct}%` };
      return { status: 'locked', detail: '0%' };
    }
    if (milestoneId === 'drops') {
      const captured = progress.frag2_drops_captured?.length || 0;
      if (captured >= 5) return { status: 'completed', detail: '5/5' };
      if (captured > 0) return { status: 'partial', detail: `${captured}/5` };
      return { status: 'locked', detail: '0/5' };
    }
    if (milestoneId === 'ritual') {
      if (progress.frag2_sequence_completed) return { status: 'completed', detail: 'Completado' };
      if (progress.frag2_ritual_accepted) return { status: 'partial', detail: 'Aceptado' };
      return { status: 'locked', detail: 'Pendiente' };
    }
    if (milestoneId === 'assistant') {
      if (progress.frag2_assistant_opened) return { status: 'completed', detail: 'Abierto' };
      if (progress.frag2_assistant_unlocked) return { status: 'partial', detail: 'Desbloqueado' };
      return { status: 'locked', detail: 'Bloqueado' };
    }
  }

  // Portal 2
  if (moduleId === 'portal2' && milestoneId === 'traversed') {
    if (progress.portal2_traversed) return { status: 'completed', detail: 'Atravesado' };
    return { status: 'locked', detail: 'Cerrado' };
  }

  // Frag 3
  if (moduleId === 'frag3') {
    if (milestoneId === 'video1') {
      const pct = progress.frag3_video1_progress || 0;
      if (pct >= 100) return { status: 'completed', detail: '100%' };
      if (pct > 0) return { status: 'partial', detail: `${pct}%` };
      return { status: 'locked', detail: '0%' };
    }
    if (milestoneId === 'video2') {
      const pct = progress.frag3_video2_progress || 0;
      if (pct >= 100) return { status: 'completed', detail: '100%' };
      if (pct > 0) return { status: 'partial', detail: `${pct}%` };
      return { status: 'locked', detail: '0%' };
    }
    if (milestoneId === 'drops') {
      const captured = progress.frag3_drops_captured?.length || 0;
      if (captured >= 4) return { status: 'completed', detail: '4/4' };
      if (captured > 0) return { status: 'partial', detail: `${captured}/4` };
      return { status: 'locked', detail: '0/4' };
    }
    if (milestoneId === 'ritual') {
      if (progress.frag3_sequence_completed) return { status: 'completed', detail: 'Completado' };
      if (progress.frag3_ritual_accepted) return { status: 'partial', detail: 'Aceptado' };
      return { status: 'locked', detail: 'Pendiente' };
    }
    if (milestoneId === 'assistant1') {
      if (progress.frag3_assistant1_opened) return { status: 'completed', detail: 'Abierto' };
      return { status: 'locked', detail: 'Cerrado' };
    }
    if (milestoneId === 'assistant2') {
      if (progress.frag3_assistant2_opened) return { status: 'completed', detail: 'Abierto' };
      return { status: 'locked', detail: 'Cerrado' };
    }
    if (milestoneId === 'assistant3') {
      if (progress.frag3_assistant3_opened) return { status: 'completed', detail: 'Abierto' };
      return { status: 'locked', detail: 'Cerrado' };
    }
  }

  // Portal 3
  if (moduleId === 'portal3' && milestoneId === 'traversed') {
    if (progress.portal3_traversed) return { status: 'completed', detail: 'Atravesado' };
    return { status: 'locked', detail: 'Cerrado' };
  }

  // Frag 4
  if (moduleId === 'frag4') {
    if (milestoneId === 'video') {
      const pct = progress.frag4_video_progress || 0;
      if (pct >= 100) return { status: 'completed', detail: '100%' };
      if (pct > 0) return { status: 'partial', detail: `${pct}%` };
      return { status: 'locked', detail: '0%' };
    }
    if (milestoneId === 'drops') {
      const captured = progress.frag4_drops_captured?.length || 0;
      if (captured >= 5) return { status: 'completed', detail: '5/5' };
      if (captured > 0) return { status: 'partial', detail: `${captured}/5` };
      return { status: 'locked', detail: '0/5' };
    }
    if (milestoneId === 'ritual') {
      if (progress.frag4_sequence_completed) return { status: 'completed', detail: 'Completado' };
      if (progress.frag4_ritual_accepted) return { status: 'partial', detail: 'Aceptado' };
      return { status: 'locked', detail: 'Pendiente' };
    }
    if (milestoneId === 'roleplay') {
      if (progress.frag4_roleplay_opened) return { status: 'completed', detail: 'Abierto' };
      if (progress.frag4_roleplay_unlocked) return { status: 'partial', detail: 'Desbloqueado' };
      return { status: 'locked', detail: 'Bloqueado' };
    }
  }

  return { status: 'locked', detail: '' };
};

const statusColors: Record<MilestoneStatus, string> = {
  completed: 'text-foreground glow bg-foreground/10 border-foreground/30',
  partial: 'text-foreground/70 bg-foreground/5 border-foreground/20',
  locked: 'text-foreground/30 bg-foreground/5 border-foreground/10',
};

const statusIcons: Record<MilestoneStatus, string> = {
  completed: '✓',
  partial: '◇',
  locked: '○',
};

export const BrechaProgressBar = ({
  progress,
  onUnlockMilestone,
  onResetMilestone,
  leadName,
}: BrechaProgressBarProps) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  // Calculate overall progress percentage
  const totalMilestones = BRECHA_MODULES.reduce((acc, mod) => acc + mod.milestones.length, 0);
  const completedMilestones = BRECHA_MODULES.reduce((acc, mod) => {
    return acc + mod.milestones.filter(m => 
      getMilestoneStatus(mod.id, m.id, progress).status === 'completed'
    ).length;
  }, 0);
  const progressPercent = Math.round((completedMilestones / totalMilestones) * 100);

  const handleAction = async (action: () => Promise<void>, key: string) => {
    setLoading(key);
    try {
      await action();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="border border-foreground/10 rounded-lg overflow-hidden bg-background/30">
      {/* Compact bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-3 hover:bg-foreground/5 transition-colors"
      >
        {/* Mini progress icons */}
        <div className="flex items-center gap-1 flex-wrap">
          {BRECHA_MODULES.map((mod, idx) => (
            <div key={mod.id} className="flex items-center gap-0.5">
              {mod.milestones.map((m) => {
                const { status } = getMilestoneStatus(mod.id, m.id, progress);
                return (
                  <span key={`${mod.id}-${m.id}`} className="text-xs">
                    {statusIcons[status]}
                  </span>
                );
              })}
              {idx < BRECHA_MODULES.length - 1 && <span className="text-foreground/20 mx-0.5">│</span>}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="flex-1 h-2 bg-foreground/10 rounded-full overflow-hidden min-w-[60px]">
          <motion.div
            className="h-full bg-gradient-to-r from-foreground/40 via-foreground/60 to-foreground/80"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <span className="text-xs text-foreground/50 min-w-[3rem] text-right">
          {progressPercent}%
        </span>

        {expanded ? (
          <ChevronUp className="w-4 h-4 text-foreground/50" />
        ) : (
          <ChevronDown className="w-4 h-4 text-foreground/50" />
        )}
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-foreground/10 space-y-4">
              {BRECHA_MODULES.map((mod) => (
                <div key={mod.id} className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                    <span>{mod.icon}</span>
                    {mod.name}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {mod.milestones.map((m) => {
                      const { status, detail } = getMilestoneStatus(mod.id, m.id, progress);
                      const Icon = m.icon;
                      return (
                        <div
                          key={`${mod.id}-${m.id}`}
                          className={`flex flex-col items-center p-2 rounded-lg border ${statusColors[status]}`}
                        >
                          <Icon className="w-4 h-4 mb-1" />
                          <span className="text-xs font-medium">{m.label}</span>
                          <span className="text-[10px] opacity-70">{detail}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Module actions */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {mod.id === 'frag1' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-purple-400 hover:text-purple-300"
                          disabled={loading !== null}
                          onClick={() => handleAction(() => onUnlockMilestone('frag1_all_drops'), 'f1drops')}
                        >
                          {loading === 'f1drops' ? '...' : '🎯 Dar todos los drops'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-amber-400 hover:text-amber-300"
                          disabled={loading !== null}
                          onClick={() => handleAction(() => onResetMilestone('frag1_sequence'), 'f1seq')}
                        >
                          {loading === 'f1seq' ? '...' : <><RotateCcw className="w-3 h-3 mr-1" /> Reset secuencia</>}
                        </Button>
                      </>
                    )}
                    {mod.id === 'portal1' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 text-indigo-400 hover:text-indigo-300"
                        disabled={loading !== null || progress?.portal_traversed}
                        onClick={() => handleAction(() => onUnlockMilestone('portal1'), 'portal1')}
                      >
                        {loading === 'portal1' ? '...' : <><Unlock className="w-3 h-3 mr-1" /> Abrir Portal</>}
                      </Button>
                    )}
                    {mod.id === 'frag2' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-purple-400 hover:text-purple-300"
                          disabled={loading !== null}
                          onClick={() => handleAction(() => onUnlockMilestone('frag2_all_drops'), 'f2drops')}
                        >
                          {loading === 'f2drops' ? '...' : '🎯 Dar todos los drops'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-amber-400 hover:text-amber-300"
                          disabled={loading !== null}
                          onClick={() => handleAction(() => onResetMilestone('frag2_sequence'), 'f2seq')}
                        >
                          {loading === 'f2seq' ? '...' : <><RotateCcw className="w-3 h-3 mr-1" /> Reset secuencia</>}
                        </Button>
                      </>
                    )}
                    {mod.id === 'portal2' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 text-indigo-400 hover:text-indigo-300"
                        disabled={loading !== null || progress?.portal2_traversed}
                        onClick={() => handleAction(() => onUnlockMilestone('portal2'), 'portal2')}
                      >
                        {loading === 'portal2' ? '...' : <><Unlock className="w-3 h-3 mr-1" /> Abrir Portal</>}
                      </Button>
                    )}
                    {mod.id === 'frag3' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-purple-400 hover:text-purple-300"
                          disabled={loading !== null}
                          onClick={() => handleAction(() => onUnlockMilestone('frag3_all_drops'), 'f3drops')}
                        >
                          {loading === 'f3drops' ? '...' : '🎯 Dar todos los drops'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-amber-400 hover:text-amber-300"
                          disabled={loading !== null}
                          onClick={() => handleAction(() => onResetMilestone('frag3_sequence'), 'f3seq')}
                        >
                          {loading === 'f3seq' ? '...' : <><RotateCcw className="w-3 h-3 mr-1" /> Reset secuencia</>}
                        </Button>
                      </>
                    )}
                    {mod.id === 'portal3' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 text-indigo-400 hover:text-indigo-300"
                        disabled={loading !== null || progress?.portal3_traversed}
                        onClick={() => handleAction(() => onUnlockMilestone('portal3'), 'portal3')}
                      >
                        {loading === 'portal3' ? '...' : <><Unlock className="w-3 h-3 mr-1" /> Abrir Portal</>}
                      </Button>
                    )}
                    {mod.id === 'frag4' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-purple-400 hover:text-purple-300"
                          disabled={loading !== null}
                          onClick={() => handleAction(() => onUnlockMilestone('frag4_all_drops'), 'f4drops')}
                        >
                          {loading === 'f4drops' ? '...' : '🎯 Dar todos los drops'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-amber-400 hover:text-amber-300"
                          disabled={loading !== null}
                          onClick={() => handleAction(() => onResetMilestone('frag4_sequence'), 'f4seq')}
                        >
                          {loading === 'f4seq' ? '...' : <><RotateCcw className="w-3 h-3 mr-1" /> Reset secuencia</>}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-emerald-400 hover:text-emerald-300"
                          disabled={loading !== null || progress?.frag4_roleplay_unlocked}
                          onClick={() => handleAction(() => onUnlockMilestone('frag4_roleplay'), 'f4roleplay')}
                        >
                          {loading === 'f4roleplay' ? '...' : <><MessageSquare className="w-3 h-3 mr-1" /> Unlock Roleplay</>}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {/* Journey completion */}
              {progress?.journey_completed && (
                <div className="flex items-center justify-center gap-2 p-3 bg-emerald-950/30 rounded-lg border border-emerald-500/30">
                  <span className="text-emerald-400">✅ Journey completado</span>
                </div>
              )}

              {/* Quick Actions */}
              <div className="mt-4 pt-4 border-t border-foreground/10">
                <p className="text-xs text-foreground/50 mb-2">Acciones rápidas:</p>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-xs"
                    disabled={loading !== null || progress?.portal_traversed}
                    onClick={() => handleAction(() => onUnlockMilestone('push_to_portal1'), 'pushF2')}
                  >
                    {loading === 'pushF2' ? '...' : '🌀 Empujar hasta F2'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-xs"
                    disabled={loading !== null || progress?.portal2_traversed}
                    onClick={() => handleAction(() => onUnlockMilestone('push_to_portal2'), 'pushF3')}
                  >
                    {loading === 'pushF3' ? '...' : '🌀 Empujar hasta F3'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-xs"
                    disabled={loading !== null || progress?.portal3_traversed}
                    onClick={() => handleAction(() => onUnlockMilestone('push_to_portal3'), 'pushF4')}
                  >
                    {loading === 'pushF4' ? '...' : '🌀 Empujar hasta F4'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="default"
                    className="text-xs"
                    disabled={loading !== null || progress?.journey_completed}
                    onClick={() => handleAction(() => onUnlockMilestone('push_to_complete'), 'complete')}
                  >
                    {loading === 'complete' ? '...' : '✅ Marcar Completado'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    className="text-xs"
                    disabled={loading !== null}
                    onClick={() => handleAction(() => onResetMilestone('full_reset'), 'fullReset')}
                  >
                    {loading === 'fullReset' ? '...' : '🔄 Reset Total'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BrechaProgressBar;
