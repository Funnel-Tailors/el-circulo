// ============================================================================
// ACTIVITY FEED — El Círculo Service Delivery Dashboard
// Compact 1/3-width tile: recent leads with live pulse indicator
// ============================================================================

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { SpotlightCard } from "@/components/premium/SpotlightCard";
import { cn } from "@/lib/utils";
import type { DashboardMetrics } from "./types";
import { relativeTime } from "./utils";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

// Initials from name (first two words)
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// ─── Single feed item ────────────────────────────────────────────────────────
interface FeedItemProps {
  name: string;
  when: string;
  index: number;
}

const FeedItem: React.FC<FeedItemProps> = ({ name, when, index }) => {
  const timeLabel = relativeTime(when);
  const isRecent = Date.now() - new Date(when).getTime() < 10 * 60 * 1000;
  const initials = getInitials(name);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.28,
        delay: 0.35 + index * 0.04,
        ease: EASE_OUT_EXPO,
      }}
      className={cn(
        "flex items-center gap-2 py-1.5",
        "border-b border-white/[0.04] last:border-none"
      )}
    >
      {/* Avatar with initials — compact */}
      <div className="relative flex-shrink-0">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white/55 leading-none"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.09)",
          }}
        >
          {initials}
        </div>
        {isRecent && (
          <span className="absolute -top-px -right-px w-1.5 h-1.5 rounded-full bg-emerald-400 border border-black animate-pulse" />
        )}
      </div>

      {/* Name + time */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-white/80 truncate leading-snug">{name}</p>
        <p className="text-[9px] text-white/28 mt-px leading-none">{timeLabel}</p>
      </div>

      {/* Live dot */}
      <div
        className={cn(
          "w-1.5 h-1.5 rounded-full flex-shrink-0",
          isRecent ? "bg-emerald-400" : "bg-white/12"
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
    className="flex flex-col items-center justify-center py-8 text-center"
  >
    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
      <Zap className="w-4 h-4 text-white/25" />
    </div>
    <p className="text-xs text-white/30">Sin actividad reciente</p>
    <p className="text-[10px] text-white/18 mt-1">Los leads aparecerán aquí</p>
  </motion.div>
);

// ─── ActivityFeed ─────────────────────────────────────────────────────────────
interface ActivityFeedProps {
  activity: DashboardMetrics["activity"];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activity }) => {
  const hasItems = activity && activity.length > 0;
  // Show max 6 items in the compact above-the-fold tile
  const visibleItems = hasItems ? activity.slice(0, 6) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.32, ease: EASE_OUT_EXPO }}
      className="h-full"
    >
      <SpotlightCard
        spotlightOnHover
        padded={false}
        className="p-4 h-full flex flex-col"
        style={{ background: "rgba(0,0,0,0.5)" }}
      >
        {/* Header — compact */}
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/35 mb-0.5">
              Actividad
            </p>
            <h3 className="font-display font-black text-sm text-white tracking-tight uppercase leading-none">
              Leads Recientes
            </h3>
          </div>
          {hasItems && (
            <div className="flex items-center gap-1 rounded-full bg-emerald-400/8 border border-emerald-400/20 px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] text-emerald-400 font-semibold uppercase tracking-wide">Live</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-white/[0.05] mb-1 flex-shrink-0" />

        {/* Feed — scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <AnimatePresence>
            {hasItems ? (
              <div>
                {visibleItems.map((item, i) => (
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
        </div>
      </SpotlightCard>
    </motion.div>
  );
};

export default ActivityFeed;
