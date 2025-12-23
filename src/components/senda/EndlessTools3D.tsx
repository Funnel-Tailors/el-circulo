import { useState } from "react";
import { motion } from "framer-motion";

interface EndlessTools3DProps {
  embedId: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showGlow?: boolean;
  floatAnimation?: boolean;
}

const sizeMap = {
  sm: { width: 200, height: 200 },
  md: { width: 300, height: 300 },
  lg: { width: 400, height: 400 },
  xl: { width: 500, height: 500 },
};

export const EndlessTools3D = ({ 
  embedId, 
  size = 'md', 
  className = '',
  showGlow = true,
  floatAnimation = true,
}: EndlessTools3DProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const dimensions = sizeMap[size];

  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        y: floatAnimation ? [0, -10, 0] : 0,
      }}
      transition={{ 
        opacity: { duration: 0.6 },
        scale: { duration: 0.6 },
        y: floatAnimation ? {
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        } : undefined,
      }}
    >
      {/* Glow effect behind */}
      {showGlow && (
        <motion.div 
          className="absolute inset-0 rounded-full bg-primary/20 pointer-events-none"
          style={{
            filter: 'blur(40px)',
            transform: 'scale(1.2)',
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1.1, 1.3, 1.1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Loading placeholder */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-foreground/5 rounded-full"
          style={{ width: dimensions.width, height: dimensions.height }}
        >
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Iframe embed */}
      <iframe
        src={`https://app.endlesstools.io/embed/${embedId}`}
        width={dimensions.width}
        height={dimensions.height}
        style={{ 
          border: 'none', 
          background: 'transparent',
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
        allow="autoplay"
        onLoad={() => setIsLoaded(true)}
        title="3D Element"
      />
    </motion.div>
  );
};

export default EndlessTools3D;
