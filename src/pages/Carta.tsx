import { useEffect } from "react";
import SalesLetter from "@/components/carta/SalesLetter";
import CartaCTA from "@/components/carta/CartaCTA";
import TestimonialsMarquee from "@/components/roadmap/TestimonialsMarquee";
import FeaturedInterview from "@/components/roadmap/FeaturedInterview";
import { successCases, featuredInterview } from "@/data/roadmap";
import { quizAnalytics } from "@/lib/analytics";

const Carta = () => {
  useEffect(() => {
    document.title = "La Carta - El Círculo";
    quizAnalytics.trackEvent({
      event_type: 'page_view',
      step_id: 'carta',
    });
    return () => {
      document.title = "El Círculo – Recorre la Senda";
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#1c1c1e]">
      {/* Sales letter */}
      <div className="max-w-2xl mx-auto px-6 py-16 md:py-24">
        <SalesLetter />
      </div>

      {/* Separator */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-white/10" />
      </div>

      {/* Testimonials */}
      <div className="py-16">
        <TestimonialsMarquee cases={successCases} />
      </div>

      {/* Featured interview */}
      <div className="py-8">
        <FeaturedInterview
          name={featuredInterview.name}
          role={featuredInterview.role}
          videoUrl={featuredInterview.videoUrl}
        />
      </div>

      {/* Payment CTA */}
      <CartaCTA />
    </div>
  );
};

export default Carta;
