import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Static fallback images bundled with the app
import cap01 from "@/assets/testimonials/captura-01.png";
import cap02 from "@/assets/testimonials/captura-02.png";
import cap03 from "@/assets/testimonials/captura-03.png";
import cap04 from "@/assets/testimonials/captura-04.png";
import img05 from "@/assets/testimonials/img-05.jpg";
import img06 from "@/assets/testimonials/img-06.jpg";
import img08 from "@/assets/testimonials/img-08.jpg";
import img09 from "@/assets/testimonials/img-09.jpg";
import img10 from "@/assets/testimonials/img-10.jpg";

const FALLBACK_IMAGES = [cap01, cap02, cap03, cap04, img05, img06, img08, img09, img10];

const BUCKET = "testimonial-screenshots";

export function useTestimonialScreenshots() {
  const [images, setImages] = useState<string[]>(FALLBACK_IMAGES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFromStorage = async () => {
      try {
        const { data: files, error } = await supabase.storage
          .from(BUCKET)
          .list("", { limit: 200, sortBy: { column: "name", order: "asc" } });

        if (error || !files || files.length === 0) {
          setIsLoading(false);
          return;
        }

        const imageFiles = files.filter(
          (f) => !f.name.startsWith(".") && f.id
        );

        if (imageFiles.length === 0) {
          setIsLoading(false);
          return;
        }

        const { data: { publicUrl: baseUrl } } = supabase.storage
          .from(BUCKET)
          .getPublicUrl("");

        const urls = imageFiles.map(
          (f) => `${baseUrl.replace(/\/$/, "")}/${f.name}`
        );

        setImages(urls);
      } catch {
        // Keep fallback images
      } finally {
        setIsLoading(false);
      }
    };

    fetchFromStorage();
  }, []);

  return { images, isLoading };
}
