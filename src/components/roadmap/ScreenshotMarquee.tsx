import { useState, useCallback, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { X } from "lucide-react";
import { useTestimonialScreenshots } from "@/hooks/useTestimonialScreenshots";

// Size variants for organic cloud feel
const SIZE_PATTERN: Array<"sm" | "md" | "lg"> = ["md", "sm", "lg", "sm", "md", "lg", "sm", "md", "sm", "lg"];

const sizeClasses = {
  sm: "w-[160px] md:w-[180px]",
  md: "w-[200px] md:w-[240px]",
  lg: "w-[240px] md:w-[300px]",
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

// ─── Single row ──────────────────────────────────────────────────────────────
const MarqueeRow = ({
  images,
  reverse,
  speed,
  onImageClick,
}: {
  images: string[];
  reverse?: boolean;
  speed: number;
  onImageClick: (src: string) => void;
}) => {
  const doubled = [...images, ...images];

  return (
    <div className="marquee-container overflow-hidden">
      <div
        className={`flex gap-4 w-max ${reverse ? "marquee-track-reverse" : "marquee-track"}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {doubled.map((src, i) => {
          const sizeKey = SIZE_PATTERN[i % SIZE_PATTERN.length];
          return (
            <div
              key={`${i}-${src}`}
              className={`flex-shrink-0 ${sizeClasses[sizeKey]} group cursor-pointer`}
              onClick={() => onImageClick(src)}
            >
              <div
                className="rounded-2xl overflow-hidden transition-all duration-300 group-hover:scale-[1.04]"
                style={{
                  background: "rgba(0, 0, 0, 0.55)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  boxShadow: `
                    0 0 0 1px rgba(255, 255, 255, 0.04) inset,
                    0 8px 40px rgba(0, 0, 0, 0.6)
                  `,
                }}
              >
                <img
                  src={src}
                  alt="Testimonio de cliente"
                  className="w-full h-auto object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          );
        })}
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

  // Split images into 5 rows round-robin for maximum volume
  const ROW_COUNT = 5;
  const rows: string[][] = Array.from({ length: ROW_COUNT }, () => []);
  images.forEach((img, i) => rows[i % ROW_COUNT].push(img));

  if (images.length === 0) return null;

  const rowConfigs = [
    { speed: 45, reverse: false },
    { speed: 35, reverse: true },
    { speed: 50, reverse: false },
    { speed: 38, reverse: true },
    { speed: 48, reverse: false },
  ];

  return (
    <>
      <div ref={sectionRef} className="w-full space-y-3">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="space-y-3"
        >
          {rows.map((rowImages, i) => (
            <MarqueeRow
              key={i}
              images={rowImages}
              speed={rowConfigs[i].speed}
              reverse={rowConfigs[i].reverse}
              onImageClick={handleImageClick}
            />
          ))}
        </motion.div>
      </div>

      {lightboxSrc && (
        <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </>
  );
};

export default ScreenshotMarquee;
