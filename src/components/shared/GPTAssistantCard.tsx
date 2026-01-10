/**
 * GPTAssistantCard - Unified component for GPT assistants across Senda and Brecha
 * 
 * Based on PreparationCards.tsx (historical reference)
 * - Uses <a> with target="_blank" (NOT button with window.open)
 * - "Abrir Asistente →" text OR "Abrir" + ChevronRight for grid variant
 * - Lock overlay with emoji + message
 * - motion.div animations
 */

import { motion } from "framer-motion";
import { Lock, Bot, ChevronRight } from "lucide-react";

export interface GPTAssistant {
  id: string | number;
  name: string;
  description: string;
  url: string;
  icon: string; // emoji or "bot" for lucide Bot icon
  poeticMessage?: string; // Optional poetic unlock message
  features?: string[]; // Optional bullet list
}

interface GPTAssistantCardProps {
  assistant: GPTAssistant;
  isUnlocked: boolean;
  lockMessage: string;
  variant: 'single' | 'grid';
  animationDelay?: number;
  onOpen: () => void;
  className?: string;
}

export const GPTAssistantCard = ({
  assistant,
  isUnlocked,
  lockMessage,
  variant,
  animationDelay = 0,
  onOpen,
  className = "",
}: GPTAssistantCardProps) => {
  const isSingle = variant === 'single';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay, duration: 0.6 }}
      className={`glass-card-dark transition-all duration-700 relative ${isSingle ? 'p-8 max-w-xl mx-auto' : 'p-6'} ${className}`}
    >
      {/* Lock overlay when not unlocked */}
      {!isUnlocked && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
          <div className="text-center px-4">
            <span className="text-2xl md:text-3xl mb-2 block">🔒</span>
            <p className="text-sm text-muted-foreground">
              {lockMessage}
            </p>
          </div>
        </div>
      )}
      
      <div className={`flex flex-col items-center text-center ${isSingle ? 'gap-4' : 'gap-3'}`}>
        {/* Icon */}
        <div className={`rounded-full flex items-center justify-center transition-all duration-500 ${
          isUnlocked ? 'bg-foreground/10' : 'bg-foreground/5'
        } ${isSingle ? 'w-16 h-16' : 'w-14 h-14'}`}>
          {assistant.icon === 'bot' ? (
            isUnlocked ? (
              <Bot className={isSingle ? 'w-8 h-8 text-foreground' : 'w-6 h-6 text-foreground'} />
            ) : (
              <Lock className={isSingle ? 'w-7 h-7 text-foreground/40' : 'w-5 h-5 text-foreground/40'} />
            )
          ) : (
            <span className={isSingle ? 'text-3xl' : 'text-2xl'}>{assistant.icon}</span>
          )}
        </div>
        
        <div>
          <h4 className={`font-bold text-foreground ${isSingle ? 'text-xl mb-2' : 'text-lg mb-1'}`}>
            {assistant.name}
          </h4>
          <p className={`text-foreground/50 ${isSingle ? 'text-sm mb-4' : 'text-sm'}`}>
            {assistant.description}
          </p>
          
          {/* Optional features list (single variant only) */}
          {isSingle && assistant.features && assistant.features.length > 0 && (
            <ul className="text-sm text-muted-foreground space-y-2 mb-4 text-left">
              {assistant.features.map((feature, idx) => (
                <li key={idx}>• {feature}</li>
              ))}
            </ul>
          )}
          
          {/* Poetic message when unlocked (single variant only) */}
          {isSingle && isUnlocked && assistant.poeticMessage && (
            <motion.p
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-foreground/60 text-sm mb-4 italic"
              dangerouslySetInnerHTML={{ __html: assistant.poeticMessage }}
            />
          )}
          
          {/* Action button - only show when unlocked */}
          {isUnlocked && (
            <a
              href={assistant.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                onOpen();
              }}
              className={`inline-flex items-center gap-2 dark-button-primary ${
                isSingle ? 'text-base py-3 px-8' : 'text-sm py-2 px-4'
              }`}
            >
              {isSingle ? (
                <>Abrir Asistente →</>
              ) : (
                <>Abrir <ChevronRight className="w-4 h-4" /></>
              )}
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
};
