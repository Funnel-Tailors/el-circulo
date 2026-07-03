import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Senda from "./pages/Senda";
import LaBrecha from "./pages/LaBrecha";
import WebinardoRegistro from "./pages/WebinardoRegistro";
import WebinardoGracias from "./pages/WebinardoGracias";
import WebinardoVer from "./pages/WebinardoVer";
import Gracias from "./pages/Gracias";
import Artefacto from "./pages/Artefacto";
import NotFound from "./pages/NotFound";

// Consultoría DFY (público, lazy para no engordar el bundle principal)
const Consultoria = lazy(() => import("./pages/Consultoria"));
const ConsultoriaOnboarding = lazy(() => import("./pages/ConsultoriaOnboarding"));
const Portal = lazy(() => import("./pages/Portal"));

// Lazy load admin (legacy public landings killed — redirect to /)
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminQuizFunnel = lazy(() => import("./pages/admin/AdminQuizFunnel"));
const AdminMetaPixel = lazy(() => import("./pages/admin/AdminMetaPixel"));
const AdminSenda = lazy(() => import("./pages/admin/AdminSenda"));
const AdminBrecha = lazy(() => import("./pages/admin/AdminBrecha"));
const AdminWebinar = lazy(() => import("./pages/admin/AdminWebinar"));
const AdminDevTools = lazy(() => import("./pages/admin/AdminDevTools"));
const Showcase = lazy(() => import("./pages/admin/Showcase"));
const PremiumEffectsDemo = lazy(() => import("./components/premium/PremiumEffectsDemo"));
const AdminTestimonials = lazy(() => import("./pages/admin/AdminTestimonials"));
const AdminConsultoria = lazy(() => import("./pages/admin/AdminConsultoria"));
const AdminConfirmation = lazy(() => import("./pages/admin/AdminConfirmation"));
const AdminClientes = lazy(() => import("./pages/admin/AdminClientes"));

const queryClient = new QueryClient();

const AdminFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/senda" element={<Senda />} />
          <Route path="/la-brecha" element={<LaBrecha />} />
          <Route path="/gracias" element={<Gracias />} />

          {/* Consultoría DFY */}
          <Route path="/consultoria" element={<Suspense fallback={<AdminFallback />}><Consultoria /></Suspense>} />
          <Route path="/consultoria/onboarding" element={<Suspense fallback={<AdminFallback />}><ConsultoriaOnboarding /></Suspense>} />
          <Route path="/portal" element={<Suspense fallback={<AdminFallback />}><Portal /></Suspense>} />

          {/* Webinardo Creativos */}
          <Route path="/webinardo" element={<WebinardoRegistro />} />
          <Route path="/webinardo/gracias" element={<WebinardoGracias />} />
          <Route path="/webinardo/ver" element={<WebinardoVer />} />

          {/* Admin routes */}
          <Route path="/admin" element={
            <Suspense fallback={<AdminFallback />}>
              <AdminLayout />
            </Suspense>
          }>
            <Route index element={<Suspense fallback={<AdminFallback />}><AdminOverview /></Suspense>} />
            <Route path="quiz" element={<Suspense fallback={<AdminFallback />}><AdminQuizFunnel /></Suspense>} />
            <Route path="meta" element={<Suspense fallback={<AdminFallback />}><AdminMetaPixel /></Suspense>} />
            <Route path="senda" element={<Suspense fallback={<AdminFallback />}><AdminSenda /></Suspense>} />
            <Route path="brecha" element={<Suspense fallback={<AdminFallback />}><AdminBrecha /></Suspense>} />
            <Route path="webinar" element={<Suspense fallback={<AdminFallback />}><AdminWebinar /></Suspense>} />
            <Route path="dev" element={<Suspense fallback={<AdminFallback />}><AdminDevTools /></Suspense>} />
            <Route path="showcase" element={<Suspense fallback={<AdminFallback />}><Showcase /></Suspense>} />
            <Route path="premium" element={<Suspense fallback={<AdminFallback />}><PremiumEffectsDemo /></Suspense>} />
            <Route path="testimonials" element={<Suspense fallback={<AdminFallback />}><AdminTestimonials /></Suspense>} />
            <Route path="consultoria" element={<Suspense fallback={<AdminFallback />}><AdminConsultoria /></Suspense>} />
            <Route path="gracias" element={<Suspense fallback={<AdminFallback />}><AdminConfirmation /></Suspense>} />
            <Route path="clientes" element={<Suspense fallback={<AdminFallback />}><AdminClientes /></Suspense>} />
          </Route>
          
          {/* Redirects */}
          <Route path="/analytics" element={<Navigate to="/admin" replace />} />
          <Route path="/test-vault" element={<Navigate to="/admin/dev" replace />} />
          <Route path="/roadmap" element={<Navigate to="/" replace />} />
          {/* Legacy public landings — redirect to home */}
          <Route path="/v2" element={<Navigate to="/" replace />} />
          <Route path="/quiz" element={<Navigate to="/" replace />} />
          <Route path="/carta" element={<Navigate to="/" replace />} />
          
          <Route path="/artefacto" element={<Artefacto />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
