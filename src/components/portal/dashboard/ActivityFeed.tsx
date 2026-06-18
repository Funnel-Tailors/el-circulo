// ============================================================================
// ACTIVITY FEED — El Círculo Service Delivery Dashboard
// Recent leads list with live-feel relative times
// ============================================================================

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Zap } from "lucide-react";
import { SpotlightCard } from "@/components/premium/SpotlightCard";
import { cn } from "@/lib/utils";
import type { DashboardMetrics } from "./types";
import { relativeTime } from "./utils";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

// ─── Single feed item ────────────────────────────────────────────────────────
interface FeedItemProps {
  name: string;
  when: string;
  index: number;
}

const FeedItem: React.FC<FeedItemProps> = ({ name, when, index }) => {
  const timeLabel = relativeTime(when);
  // "Live" feel: items in the last 10 minutes get a pulse indicator
  const isRecent = Date.now() - new Date(when).getTime() < 10 * 60 * 1000;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.38,
        delay: 0.42 + index * 0.06,
        ease: EASE_OUT_EXPO,
      }}
      className={cn(
        "flex items-center gap-3 py-3",
        "border-b border-white/5 last:border-none"
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-white/8 border border-white/12 flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-white/50" />
        </div>
        {isRecent && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-black animate-pulse" />
        )}
      </div>

      {/* Name + time */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/85 truncate leading-snug">{name}</p>
        <p className="text-xs text-white/35 mt-0.5">{timeLabel}</p>
      </div>

      {/* Status dot */}
      <div
        className={cn(
          "w-1.5 h-1.5 rounded-full flex-shrink-0",
          isRecent ? "bg-emerald-400" : "bg-white/20"
        )}
      />
    </motion.div>
  );
};

// ─── Empty state ─────────────────────────────────────────────────────────────
const EmptyFeed: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col items-center justify-center py-10 text-center"
  >
    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
      <Zap className="w-5 h-5 text-white/25" />
    </div>
    <p className="text-sm text-white/30">Sin actividad reciente</p>
    <p className="text-xs text-white/20 mt-1">Los leads aparecerán aquí en tiempo real</p>
  </motion.div>
);

// ─── ActivityFeed ─────────────────────────────────────────────────────────────
interface ActivityFeedProps {
  activity: DashboardMetrics["activity"];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activity }) => {
  const hasItems = activity && activity.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.35, ease: EASE_OUT_EXPO }}
      className="h-full"
    >
      <SpotlightCard
        spotlightOnHover
        padded={false}
        className="p-6 h-full"
        style={{ background: "rgba(0,0,0,0.45)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-white/40 mb-1">
              Actividad
            </p>
            <h3 className="font-display font-black text-base text-white tracking-tight uppercase">
              Leads Recientes
            </h3>
          </div>
          {hasItems && (
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">En vivo</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-white/6 mb-1" />

        {/* Feed */}
        <AnimatePresence>
          {hasItems ? (
            <div className="divide-y-0 overflow-y-auto max-h-[320px]">
              {activity.slice(0, 12).map((item, i) => (
                <FeedItem
                  key={`${item.name}-${item.when}-${i}`}
                  name={item.name}
                  when={item.when}
                  index={i}
                />
              ))}
            </div>
          ) : (
            <EmptyFeed />
          )}
        </AnimatePresence>
      </SpotlightCard>
    </motion.div>
  );
};

export default ActivityFeed;
