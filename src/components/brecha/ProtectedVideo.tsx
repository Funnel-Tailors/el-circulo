/**
 * ProtectedVideo - Video wrapper with content protection
 * 
 * Protections:
 * - No right-click context menu
 * - No download button (controlsList="nodownload")
 * - No Picture-in-Picture (can reveal URL)
 * - Invisible overlay to intercept right-clicks
 */

import { forwardRef, ReactNode } from "react";

interface ProtectedVideoProps {
  src: string;
  className?: string;
  playsInline?: boolean;
  children?: ReactNode;
}

export const ProtectedVideo = forwardRef<HTMLVideoElement, ProtectedVideoProps>(
  ({ src, className = "", playsInline = true, children }, ref) => {
    return (
      <div 
        className="relative w-full h-full"
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Invisible overlay to block right-click inspection */}
        <div 
          className="absolute inset-0 z-[1] pointer-events-none"
          onContextMenu={(e) => e.preventDefault()}
        />
        
        <video
          ref={ref}
          src={src}
          className={className}
          playsInline={playsInline}
          preload="metadata"
          controlsList="nodownload nofullscreen noremoteplayback"
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
        />
        
        {/* Render children (overlays, controls, etc.) */}
        {children}
      </div>
    );
  }
);

ProtectedVideo.displayName = "ProtectedVideo";
