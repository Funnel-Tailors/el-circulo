import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Video, Target, Sparkles, Bot, Lock, Unlock, RotateCcw } from 'lucide-react';

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
] as const;

export interface SendaProgress {
  class1_video_started: boolean;
  class1_video_progress: number;
  class1_drops_captured: string[];
  class1_drops_missed: string[];
  class1_ritual_accepted: boolean;
  class1_sequence_completed: boolean;
  class1_assistant_opened: boolean;
  vault_unlocked: boolean;
  class2_video_started: boolean;
  class2_video_progress: number;
  class2_drops_captured: string[];
  class2_drops_missed: string[];
  class2_ritual_accepted: boolean;
  class2_sequence_completed: boolean;
  assistant1_unlocked: boolean;
  assistant1_opened: boolean;
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
        <div className="flex items-center gap-1">
          {SENDA_MODULES.map((mod) => (
            <div key={mod.id} className="flex items-center gap-0.5">
              {mod.milestones.map((m) => {
                const { status } = getMilestoneStatus(mod.id, m.id, progress);
                return (
                  <span key={`${mod.id}-${m.id}`} className="text-xs">
                    {statusIcons[status]}
                  </span>
                );
              })}
              {mod.id !== 'class2' && <span className="text-foreground/20 mx-1">│</span>}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="flex-1 h-2 bg-foreground/10 rounded-full overflow-hidden">
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
                  </div>
                </div>
              ))}

              {/* Journey completion */}
              {progress?.journey_completed && (
                <div className="flex items-center justify-center gap-2 p-3 bg-emerald-950/30 rounded-lg border border-emerald-500/30">
                  <span className="text-emerald-400">✅ Journey completado</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SendaProgressBar;
