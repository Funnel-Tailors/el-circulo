import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Video, Target, Sparkles, Bot, Unlock, RotateCcw, MessageSquare } from 'lucide-react';

// Modular milestone configuration - easy to extend
const SENDA_MODULES = [
  {
    id: 'class1',
    name: 'Clase 1: La Oferta',
    icon: '🎬',
    milestones: [
      { id: 'video', icon: Video, label: 'Video' },
      { id: 'drops', icon: Target, label: 'Drops' },
      { id: 'ritual', icon: Sparkles, label: 'Ritual' },
      { id: 'assistant', icon: Bot, label: 'Asistente' },
    ]
  },
  {
    id: 'vault',
    name: 'La Bóveda',
    icon: '🔮',
    milestones: [
      { id: 'unlocked', icon: Unlock, label: 'Vault' },
    ]
  },
  {
    id: 'class2',
    name: 'Clase 2: El Avatar',
    icon: '🎭',
    milestones: [
      { id: 'video', icon: Video, label: 'Video' },
      { id: 'drops', icon: Target, label: 'Drops' },
      { id: 'ritual', icon: Sparkles, label: 'Ritual' },
      { id: 'assistant', icon: Bot, label: 'Asistente' },
    ]
  },
  {
    id: 'module3',
    name: 'Módulo 3: El Sistema',
    icon: '⚙️',
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
    id: 'module4',
    name: 'Módulo 4: El Cierre',
    icon: '🎯',
    milestones: [
      { id: 'video', icon: Video, label: 'Video' },
      { id: 'drops', icon: Target, label: 'Drops' },
      { id: 'ritual', icon: Sparkles, label: 'Ritual' },
      { id: 'roleplay', icon: MessageSquare, label: 'Roleplay' },
    ]
  },
] as const;

export interface SendaProgress {
  // Class 1
  class1_video_started: boolean;
  class1_video_progress: number;
  class1_drops_captured: string[];
  class1_drops_missed: string[];
  class1_ritual_accepted: boolean;
  class1_sequence_completed: boolean;
  class1_assistant_opened: boolean;
  // Vault
  vault_unlocked: boolean;
  // Class 2
  class2_video_started: boolean;
  class2_video_progress: number;
  class2_drops_captured: string[];
  class2_drops_missed: string[];
  class2_ritual_accepted: boolean;
  class2_sequence_completed: boolean;
  assistant1_unlocked: boolean;
  assistant1_opened: boolean;
  // Module 3
  module3_unlocked?: boolean;
  module3_video1_started?: boolean;
  module3_video1_progress?: number;
  module3_video2_started?: boolean;
  module3_video2_progress?: number;
  module3_drops_captured?: string[];
  module3_drops_missed?: string[];
  module3_ritual_accepted?: boolean;
  module3_sequence_completed?: boolean;
  module3_assistant1_opened?: boolean;
  module3_assistant2_opened?: boolean;
  module3_assistant3_opened?: boolean;
  // Module 4
  module4_unlocked?: boolean;
  module4_video_started?: boolean;
  module4_video_progress?: number;
  module4_drops_captured?: string[];
  module4_drops_missed?: string[];
  module4_ritual_accepted?: boolean;
  module4_sequence_completed?: boolean;
  module4_roleplay_unlocked?: boolean;
  module4_roleplay_opened?: boolean;
  // Journey
  journey_completed: boolean;
}

interface SendaProgressBarProps {
  progress: SendaProgress | null;
  onUnlockMilestone: (milestone: string) => Promise<void>;
  onResetMilestone: (milestone: string) => Promise<void>;
  leadName: string;
}

type MilestoneStatus = 'completed' | 'partial' | 'locked';

const getMilestoneStatus = (
  moduleId: string,
  milestoneId: string,
  progress: SendaProgress | null
): { status: MilestoneStatus; detail: string } => {
  if (!progress) return { status: 'locked', detail: 'Sin datos' };

  // Class 1
  if (moduleId === 'class1') {
    if (milestoneId === 'video') {
      const pct = progress.class1_video_progress || 0;
      if (pct >= 100) return { status: 'completed', detail: '100%' };
      if (pct > 0) return { status: 'partial', detail: `${pct}%` };
      return { status: 'locked', detail: '0%' };
    }
    if (milestoneId === 'drops') {
      const captured = progress.class1_drops_captured?.length || 0;
      if (captured >= 3) return { status: 'completed', detail: '3/3' };
      if (captured > 0) return { status: 'partial', detail: `${captured}/3` };
      return { status: 'locked', detail: '0/3' };
    }
    if (milestoneId === 'ritual') {
      if (progress.class1_sequence_completed) return { status: 'completed', detail: 'Completado' };
      if (progress.class1_ritual_accepted) return { status: 'partial', detail: 'Aceptado' };
      return { status: 'locked', detail: 'Pendiente' };
    }
    if (milestoneId === 'assistant') {
      if (progress.class1_assistant_opened) return { status: 'completed', detail: 'Abierto' };
      return { status: 'locked', detail: 'Cerrado' };
    }
  }

  // Vault
  if (moduleId === 'vault' && milestoneId === 'unlocked') {
    if (progress.vault_unlocked) return { status: 'completed', detail: 'Desbloqueado' };
    return { status: 'locked', detail: 'Bloqueado' };
  }

  // Class 2
  if (moduleId === 'class2') {
    if (milestoneId === 'video') {
      const pct = progress.class2_video_progress || 0;
      if (pct >= 100) return { status: 'completed', detail: '100%' };
      if (pct > 0) return { status: 'partial', detail: `${pct}%` };
      return { status: 'locked', detail: '0%' };
    }
    if (milestoneId === 'drops') {
      const captured = progress.class2_drops_captured?.length || 0;
      if (captured >= 5) return { status: 'completed', detail: '5/5' };
      if (captured > 0) return { status: 'partial', detail: `${captured}/5` };
      return { status: 'locked', detail: '0/5' };
    }
    if (milestoneId === 'ritual') {
      if (progress.class2_sequence_completed) return { status: 'completed', detail: 'Completado' };
      if (progress.class2_ritual_accepted) return { status: 'partial', detail: 'Aceptado' };
      return { status: 'locked', detail: 'Pendiente' };
    }
    if (milestoneId === 'assistant') {
      if (progress.assistant1_opened) return { status: 'completed', detail: 'Abierto' };
      if (progress.assistant1_unlocked) return { status: 'partial', detail: 'Desbloqueado' };
      return { status: 'locked', detail: 'Bloqueado' };
    }
  }

  // Module 3
  if (moduleId === 'module3') {
    if (milestoneId === 'video1') {
      const pct = progress.module3_video1_progress || 0;
      if (pct >= 100) return { status: 'completed', detail: '100%' };
      if (pct > 0) return { status: 'partial', detail: `${pct}%` };
      return { status: 'locked', detail: '0%' };
    }
    if (milestoneId === 'video2') {
      const pct = progress.module3_video2_progress || 0;
      if (pct >= 100) return { status: 'completed', detail: '100%' };
      if (pct > 0) return { status: 'partial', detail: `${pct}%` };
      return { status: 'locked', detail: '0%' };
    }
    if (milestoneId === 'drops') {
      const captured = progress.module3_drops_captured?.length || 0;
      if (captured >= 4) return { status: 'completed', detail: '4/4' };
      if (captured > 0) return { status: 'partial', detail: `${captured}/4` };
      return { status: 'locked', detail: '0/4' };
    }
    if (milestoneId === 'ritual') {
      if (progress.module3_sequence_completed) return { status: 'completed', detail: 'Completado' };
      if (progress.module3_ritual_accepted) return { status: 'partial', detail: 'Aceptado' };
      return { status: 'locked', detail: 'Pendiente' };
    }
    if (milestoneId === 'assistant1') {
      if (progress.module3_assistant1_opened) return { status: 'completed', detail: 'Abierto' };
      return { status: 'locked', detail: 'Cerrado' };
    }
    if (milestoneId === 'assistant2') {
      if (progress.module3_assistant2_opened) return { status: 'completed', detail: 'Abierto' };
      return { status: 'locked', detail: 'Cerrado' };
    }
    if (milestoneId === 'assistant3') {
      if (progress.module3_assistant3_opened) return { status: 'completed', detail: 'Abierto' };
      return { status: 'locked', detail: 'Cerrado' };
    }
  }

  // Module 4
  if (moduleId === 'module4') {
    if (milestoneId === 'video') {
      const pct = progress.module4_video_progress || 0;
      if (pct >= 100) return { status: 'completed', detail: '100%' };
      if (pct > 0) return { status: 'partial', detail: `${pct}%` };
      return { status: 'locked', detail: '0%' };
    }
    if (milestoneId === 'drops') {
      const captured = progress.module4_drops_captured?.length || 0;
      if (captured >= 5) return { status: 'completed', detail: '5/5' };
      if (captured > 0) return { status: 'partial', detail: `${captured}/5` };
      return { status: 'locked', detail: '0/5' };
    }
    if (milestoneId === 'ritual') {
      if (progress.module4_sequence_completed) return { status: 'completed', detail: 'Completado' };
      if (progress.module4_ritual_accepted) return { status: 'partial', detail: 'Aceptado' };
      return { status: 'locked', detail: 'Pendiente' };
    }
    if (milestoneId === 'roleplay') {
      if (progress.module4_roleplay_opened) return { status: 'completed', detail: 'Abierto' };
      if (progress.module4_roleplay_unlocked) return { status: 'partial', detail: 'Desbloqueado' };
      return { status: 'locked', detail: 'Bloqueado' };
    }
  }

  return { status: 'locked', detail: '' };
};

const statusColors: Record<MilestoneStatus, string> = {
  completed: 'text-emerald-400 bg-emerald-950/50 border-emerald-500/30',
  partial: 'text-amber-400 bg-amber-950/50 border-amber-500/30',
  locked: 'text-foreground/30 bg-foreground/5 border-foreground/10',
};

const statusIcons: Record<MilestoneStatus, string> = {
  completed: '✅',
  partial: '⚠️',
  locked: '🔒',
};

// Helper to get unlock key for each milestone
const getUnlockKey = (moduleId: string, milestoneId: string): string | null => {
  // Class 1
  if (moduleId === 'class1' && milestoneId === 'video') return 'class1_video_complete';
  if (moduleId === 'class1' && milestoneId === 'drops') return 'class1_all_drops';
  if (moduleId === 'class1' && milestoneId === 'ritual') return 'class1_ritual_complete';
  if (moduleId === 'class1' && milestoneId === 'assistant') return 'class1_assistant';
  // Vault
  if (moduleId === 'vault' && milestoneId === 'unlocked') return 'vault';
  // Class 2
  if (moduleId === 'class2' && milestoneId === 'video') return 'class2_video_complete';
  if (moduleId === 'class2' && milestoneId === 'drops') return 'class2_all_drops';
  if (moduleId === 'class2' && milestoneId === 'ritual') return 'class2_ritual_complete';
  if (moduleId === 'class2' && milestoneId === 'assistant') return 'assistant';
  // Module 3
  if (moduleId === 'module3' && milestoneId === 'video1') return 'module3_video1_complete';
  if (moduleId === 'module3' && milestoneId === 'video2') return 'module3_video2_complete';
  if (moduleId === 'module3' && milestoneId === 'drops') return 'module3_all_drops';
  if (moduleId === 'module3' && milestoneId === 'ritual') return 'module3_ritual_complete';
  if (moduleId === 'module3' && milestoneId === 'assistant1') return 'module3_assistant1';
  if (moduleId === 'module3' && milestoneId === 'assistant2') return 'module3_assistant2';
  if (moduleId === 'module3' && milestoneId === 'assistant3') return 'module3_assistant3';
  // Module 4
  if (moduleId === 'module4' && milestoneId === 'video') return 'module4_video_complete';
  if (moduleId === 'module4' && milestoneId === 'drops') return 'module4_all_drops';
  if (moduleId === 'module4' && milestoneId === 'ritual') return 'module4_ritual_complete';
  if (moduleId === 'module4' && milestoneId === 'roleplay') return 'module4_roleplay';
  return null;
};

export const SendaProgressBar = ({
  progress,
  onUnlockMilestone,
  onResetMilestone,
  leadName,
}: SendaProgressBarProps) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  // Calculate overall progress percentage
  const totalMilestones = SENDA_MODULES.reduce((acc, mod) => acc + mod.milestones.length, 0);
  const completedMilestones = SENDA_MODULES.reduce((acc, mod) => {
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
          {SENDA_MODULES.map((mod, idx) => (
            <div key={mod.id} className="flex items-center gap-0.5">
              {mod.milestones.map((m) => {
                const { status } = getMilestoneStatus(mod.id, m.id, progress);
                return (
                  <span key={`${mod.id}-${m.id}`} className="text-xs">
                    {statusIcons[status]}
                  </span>
                );
              })}
              {idx < SENDA_MODULES.length - 1 && <span className="text-foreground/20 mx-1">│</span>}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="flex-1 h-2 bg-foreground/10 rounded-full overflow-hidden min-w-[60px]">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-emerald-500"
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
              {SENDA_MODULES.map((mod) => (
                <div key={mod.id} className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                    <span>{mod.icon}</span>
                    {mod.name}
                    {mod.id === 'module3' && !progress?.module3_unlocked && (
                      <span className="text-xs text-foreground/40">(Bloqueado)</span>
                    )}
                    {mod.id === 'module4' && !progress?.module4_unlocked && (
                      <span className="text-xs text-foreground/40">(Bloqueado)</span>
                    )}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {mod.milestones.map((m) => {
                      const { status, detail } = getMilestoneStatus(mod.id, m.id, progress);
                      const Icon = m.icon;
                      const unlockKey = getUnlockKey(mod.id, m.id);
                      const canUnlock = status !== 'completed' && unlockKey;
                      return (
                        <div
                          key={`${mod.id}-${m.id}`}
                          className={`flex flex-col items-center p-2 rounded-lg border ${statusColors[status]} relative group`}
                        >
                          <Icon className="w-4 h-4 mb-1" />
                          <span className="text-xs font-medium">{m.label}</span>
                          <span className="text-[10px] opacity-70">{detail}</span>
                          {/* Inline unlock button */}
                          {canUnlock && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-600 hover:bg-emerald-500 text-white rounded-full"
                              disabled={loading !== null}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction(() => onUnlockMilestone(unlockKey), unlockKey);
                              }}
                              title="Desbloquear"
                            >
                              {loading === unlockKey ? '...' : <Unlock className="w-3 h-3" />}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Module actions */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {mod.id === 'class1' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-purple-400 hover:text-purple-300"
                          disabled={loading !== null}
                          onClick={() => handleAction(() => onUnlockMilestone('class1_all_drops'), 'c1drops')}
                        >
                          {loading === 'c1drops' ? '...' : '🎯 Dar todos los drops'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-amber-400 hover:text-amber-300"
                          disabled={loading !== null}
                          onClick={() => handleAction(() => onResetMilestone('class1_sequence'), 'c1seq')}
                        >
                          {loading === 'c1seq' ? '...' : <><RotateCcw className="w-3 h-3 mr-1" /> Reset secuencia</>}
                        </Button>
                      </>
                    )}
                    {mod.id === 'vault' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 text-indigo-400 hover:text-indigo-300"
                        disabled={loading !== null || progress?.vault_unlocked}
                        onClick={() => handleAction(() => onUnlockMilestone('vault'), 'vault')}
                      >
                        {loading === 'vault' ? '...' : <><Unlock className="w-3 h-3 mr-1" /> Desbloquear Vault</>}
                      </Button>
                    )}
                    {mod.id === 'class2' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-purple-400 hover:text-purple-300"
                          disabled={loading !== null}
                          onClick={() => handleAction(() => onUnlockMilestone('class2_all_drops'), 'c2drops')}
                        >
                          {loading === 'c2drops' ? '...' : '🎯 Dar todos los drops'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-amber-400 hover:text-amber-300"
                          disabled={loading !== null}
                          onClick={() => handleAction(() => onResetMilestone('class2_sequence'), 'c2seq')}
                        >
                          {loading === 'c2seq' ? '...' : <><RotateCcw className="w-3 h-3 mr-1" /> Reset secuencia</>}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-emerald-400 hover:text-emerald-300"
                          disabled={loading !== null || progress?.assistant1_unlocked}
                          onClick={() => handleAction(() => onUnlockMilestone('assistant'), 'assistant')}
                        >
                          {loading === 'assistant' ? '...' : <><Bot className="w-3 h-3 mr-1" /> Unlock Asistente</>}
                        </Button>
                      </>
                    )}
                    {mod.id === 'module3' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-indigo-400 hover:text-indigo-300"
                          disabled={loading !== null || progress?.module3_unlocked}
                          onClick={() => handleAction(() => onUnlockMilestone('module3'), 'm3unlock')}
                        >
                          {loading === 'm3unlock' ? '...' : <><Unlock className="w-3 h-3 mr-1" /> Desbloquear Módulo 3</>}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-purple-400 hover:text-purple-300"
                          disabled={loading !== null}
                          onClick={() => handleAction(() => onUnlockMilestone('module3_all_drops'), 'm3drops')}
                        >
                          {loading === 'm3drops' ? '...' : '🎯 Dar todos los drops'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-amber-400 hover:text-amber-300"
                          disabled={loading !== null}
                          onClick={() => handleAction(() => onResetMilestone('module3_sequence'), 'm3seq')}
                        >
                          {loading === 'm3seq' ? '...' : <><RotateCcw className="w-3 h-3 mr-1" /> Reset secuencia</>}
                        </Button>
                      </>
                    )}
                    {mod.id === 'module4' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-indigo-400 hover:text-indigo-300"
                          disabled={loading !== null || progress?.module4_unlocked}
                          onClick={() => handleAction(() => onUnlockMilestone('module4'), 'm4unlock')}
                        >
                          {loading === 'm4unlock' ? '...' : <><Unlock className="w-3 h-3 mr-1" /> Desbloquear Módulo 4</>}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-purple-400 hover:text-purple-300"
                          disabled={loading !== null}
                          onClick={() => handleAction(() => onUnlockMilestone('module4_all_drops'), 'm4drops')}
                        >
                          {loading === 'm4drops' ? '...' : '🎯 Dar todos los drops'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-amber-400 hover:text-amber-300"
                          disabled={loading !== null}
                          onClick={() => handleAction(() => onResetMilestone('module4_sequence'), 'm4seq')}
                        >
                          {loading === 'm4seq' ? '...' : <><RotateCcw className="w-3 h-3 mr-1" /> Reset secuencia</>}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-emerald-400 hover:text-emerald-300"
                          disabled={loading !== null || progress?.module4_roleplay_unlocked}
                          onClick={() => handleAction(() => onUnlockMilestone('module4_roleplay'), 'm4roleplay')}
                        >
                          {loading === 'm4roleplay' ? '...' : <><MessageSquare className="w-3 h-3 mr-1" /> Unlock Roleplay</>}
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
                    disabled={loading !== null || progress?.vault_unlocked}
                    onClick={() => handleAction(() => onUnlockMilestone('push_to_vault'), 'pushVault')}
                  >
                    {loading === 'pushVault' ? '...' : '🔮 Empujar hasta Vault'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-xs"
                    disabled={loading !== null || progress?.class2_sequence_completed}
                    onClick={() => handleAction(() => onUnlockMilestone('push_to_class2_complete'), 'pushC2')}
                  >
                    {loading === 'pushC2' ? '...' : '🎭 Empujar hasta Clase 2'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-xs"
                    disabled={loading !== null || progress?.module3_sequence_completed}
                    onClick={() => handleAction(() => onUnlockMilestone('push_to_module3_complete'), 'pushM3')}
                  >
                    {loading === 'pushM3' ? '...' : '⚙️ Empujar hasta Módulo 3'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-xs"
                    disabled={loading !== null || progress?.module4_sequence_completed}
                    onClick={() => handleAction(() => onUnlockMilestone('push_to_module4_complete'), 'pushM4')}
                  >
                    {loading === 'pushM4' ? '...' : '🎯 Empujar hasta Módulo 4'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="default"
                    className="text-xs"
                    disabled={loading !== null || progress?.journey_completed}
                    onClick={() => handleAction(() => onUnlockMilestone('complete_journey'), 'complete')}
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

export default SendaProgressBar;
