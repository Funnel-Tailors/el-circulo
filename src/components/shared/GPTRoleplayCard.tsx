/**
 * GPTRoleplayCard - Specialized component for roleplay assistants
 * 
 * Handles:
 * - Pending state (drops not captured yet)
 * - Permanently locked state (drops missed)
 * - Unlocked state with success message
 * 
 * Uses <a> with target="_blank" (NOT button with window.open)
 */

import { motion } from "framer-motion";
import { Lock, CheckCircle, ChevronRight } from "lucide-react";

interface GPTRoleplayCardProps {
  roleplay: {
    id: string;
    name: string;
    description: string;
    url: string;
    icon: string;
  };
  isUnlocked: boolean;
  isPermanentlyLocked: boolean;
  pendingMessage: string; // e.g. "Captura todos los resquicios..."
  lockedMessage: string; // e.g. "Perdiste resquicios durante el video"
  successMessage?: string;
  onOpen: () => void;
  animationDelay?: number;
  className?: string;
}

export const GPTRoleplayCard = ({
  roleplay,
  isUnlocked,
  isPermanentlyLocked,
  pendingMessage,
  lockedMessage,
  successMessage,
  onOpen,
  animationDelay = 0,
  className = "",
}: GPTRoleplayCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay, duration: 0.8 }}
      className={`glass-card-dark p-6 relative ${
        isPermanentlyLocked ? 'opacity-50 pointer-events-none' : ''
      } ${className}`}
    >
      {/* Permanently locked overlay */}
      {isPermanentlyLocked && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
          <div className="text-center p-6">
            <Lock className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-semibold">Roleplay Bloqueado</p>
            <p className="text-foreground/40 text-sm mt-1">
              {lockedMessage}
            </p>
          </div>
        </div>
      )}
      
      {/* Pending unlock overlay */}
      {!isUnlocked && !isPermanentlyLocked && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
          <div className="text-center p-6">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">{roleplay.icon}</span>
            </div>
            <p className="text-foreground/80 font-semibold">Roleplay Bloqueado</p>
            <p className="text-foreground/40 text-sm mt-1">
              {pendingMessage}
            </p>
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-4">
        <div className="p-4 rounded-2xl bg-primary/10 text-4xl flex-shrink-0">
          {roleplay.icon}
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-foreground mb-1">
            {roleplay.name}
          </h4>
          <p className="text-foreground/60 text-sm">
            {roleplay.description}
          </p>
        </div>
        <a
          href={roleplay.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            if (!isUnlocked) {
              e.preventDefault();
              return;
            }
            onOpen();
          }}
          className={`dark-button-primary px-6 py-3 flex items-center gap-2 flex-shrink-0 ${
            !isUnlocked ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          Practicar <ChevronRight className="w-4 h-4" />
        </a>
      </div>
      
      {/* Success message when unlocked */}
      {isUnlocked && successMessage && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-4 border-t border-foreground/10"
        >
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">
              {successMessage}
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
