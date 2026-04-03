

## Plan: Screenshot Testimonials Multi-Row Marquee

### What we're building
A standalone `ScreenshotMarquee` component that displays screenshot testimonials in 3 rows scrolling in alternating directions (left, right, left) at different speeds. Cards have varying sizes for an organic "cloud" feel. Designed to scale from 10 to 83+ images.

### Architecture

**New files:**
1. `src/components/roadmap/ScreenshotMarquee.tsx` — Main component with 3 CSS-animated rows
2. `src/data/screenshot-testimonials.ts` — Data array with image paths and optional metadata (name, size hint)

**Modified files:**
3. `src/index.css` — Add `marquee-track-reverse` keyframe (right-to-left already exists, need left-to-right)

### How it works

- **3 rows**, each with a CSS `marquee-scroll` animation:
  - Row 1: left direction, 50s speed
  - Row 2: right direction (reverse keyframe), 40s speed  
  - Row 3: left direction, 55s speed
- **Images split** into 3 groups distributed round-robin for balance
- **Card sizes**: 3 variants (sm: 180px, md: 240px, lg: 300px width) assigned via a simple pattern to create visual variety
- **Lazy loading**: All images use `loading="lazy"` and `decoding="async"`
- **Doubled arrays** for seamless loop (same pattern as existing marquee)
- **Glass card style**: Same `rgba(0,0,0,0.55)` + `backdrop-blur` treatment as the video marquee cards
- **Click to expand**: Optional lightbox on click (simple state toggle with a larger overlay)
- **Hover**: Pauses the row, slight scale-up on the card
- **Reuses** existing `.marquee-container` mask for fade edges

### Image storage
- Copy all uploaded images to `src/assets/testimonials/` for Vite bundling and optimization
- Data file maps filename to size variant

### CSS additions
```css
@keyframes marquee-scroll-reverse {
  from { transform: translateX(-50%); }
  to { transform: translateX(0); }
}
.marquee-track-reverse {
  animation: marquee-scroll-reverse 40s linear infinite;
}
```

### Usage (standalone, import anywhere)
```tsx
import ScreenshotMarquee from "@/components/roadmap/ScreenshotMarquee";
<ScreenshotMarquee />
```

### Files changed summary
| File | Action |
|------|--------|
| `src/assets/testimonials/*.{png,jpg}` | Copy 10 uploaded images |
| `src/data/screenshot-testimonials.ts` | New — image list + size hints |
| `src/components/roadmap/ScreenshotMarquee.tsx` | New — 3-row marquee component |
| `src/index.css` | Add reverse keyframe + track class |

