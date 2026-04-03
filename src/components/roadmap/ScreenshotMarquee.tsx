import { useState, useCallback, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { X } from "lucide-react";
import { useTestimonialScreenshots } from "@/hooks/useTestimonialScreenshots";

const glassStyle = {
  background: "rgba(0, 0, 0, 0.55)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  boxShadow: `
    0 0 0 1px rgba(255, 255, 255, 0.04) inset,
    0 8px 40px rgba(0, 0, 0, 0.6)
  `,
};

// Reduced glass for mobile (performance)
const glassStyleMobile = {
  background: "rgba(0, 0, 0, 0.55)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
};

// ─── Lightbox ────────────────────────────────────────────────────────────────
const Lightbox = ({ src, onClose }: { src: string; onClose: () => void }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm cursor-pointer"
    onClick={onClose}
  >
    <button
      onClick={onClose}
      className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
    >
      <X className="w-6 h-6 text-white" />
    </button>
    <img
      src={src}
      alt="Testimonio"
      className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl"
      onClick={(e) => e.stopPropagation()}
    />
  </div>
);

// ─── Desktop: 3-column masonry grid ──────────────────────────────────────────
const DesktopGrid = ({
  images,
  onImageClick,
}: {
  images: string[];
  onImageClick: (src: string) => void;
}) => {
  const cols: string[][] = [[], [], []];
  images.forEach((src, i) => cols[i % 3].push(src));

  return (
    <div className="flex gap-4 px-4">
      {cols.map((col, ci) => (
        <div key={ci} className={`flex-1 flex flex-col gap-4 ${ci === 1 ? "mt-8" : ci === 2 ? "mt-4" : ""}`}>
          {col.map((src, i) => (
            <div
              key={`d${ci}-${i}`}
              className="rounded-2xl overflow-hidden cursor-pointer group"
              style={glassStyle}
              onClick={() => onImageClick(src)}
            >
              <img
                src={src}
                alt="Testimonio de cliente"
                className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// ─── Mobile: 2-column masonry scroll ─────────────────────────────────────────
const MobileGrid = ({
  images,
  onImageClick,
}: {
  images: string[];
  onImageClick: (src: string) => void;
}) => {
  // Split into 2 columns alternating
  const col1 = images.filter((_, i) => i % 2 === 0);
  const col2 = images.filter((_, i) => i % 2 === 1);

  return (
    <div className="flex gap-3 px-4 overflow-x-hidden">
      <div className="flex-1 flex flex-col gap-3">
        {col1.map((src, i) => (
          <div
            key={`c1-${i}`}
            className="rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
            style={glassStyleMobile}
            onClick={() => onImageClick(src)}
          >
            <img
              src={src}
              alt="Testimonio de cliente"
              className="w-full h-auto object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        ))}
      </div>
      <div className="flex-1 flex flex-col gap-3 mt-6">
        {col2.map((src, i) => (
          <div
            key={`c2-${i}`}
            className="rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
            style={glassStyleMobile}
            onClick={() => onImageClick(src)}
          >
            <img
              src={src}
              alt="Testimonio de cliente"
              className="w-full h-auto object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────
const ScreenshotMarquee = () => {
  const { images } = useTestimonialScreenshots();
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  const handleImageClick = useCallback((src: string) => {
    setLightboxSrc(src);
  }, []);

  if (images.length === 0) return null;

  return (
    <>
      <div ref={sectionRef} className="w-full">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          {/* Desktop: 3-column masonry */}
          <div className="hidden md:block">
            {rows.map((rowImages, i) => (
              <MarqueeRow
                key={i}
                images={rowImages}
                speed={rowConfigs[i].speed}
                reverse={rowConfigs[i].reverse}
                onImageClick={handleImageClick}
              />
            ))}
          </div>

          {/* Mobile: 2-column masonry grid */}
          <div className="md:hidden">
            <MobileGrid images={images} onImageClick={handleImageClick} />
          </div>
        </motion.div>
      </div>

      {lightboxSrc && (
        <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </>
  );
};

export default ScreenshotMarquee;
