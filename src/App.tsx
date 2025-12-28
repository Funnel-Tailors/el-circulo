import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import Quiz from "./pages/Quiz";
import Auth from "./pages/Auth";
import Senda from "./pages/Senda";
import Artefacto from "./pages/Artefacto";
import NotFound from "./pages/NotFound";

// Lazy load admin and heavy pages
const LaBrecha = lazy(() => import("./pages/LaBrecha"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminQuizFunnel = lazy(() => import("./pages/admin/AdminQuizFunnel"));
const AdminMetaPixel = lazy(() => import("./pages/admin/AdminMetaPixel"));
const AdminSenda = lazy(() => import("./pages/admin/AdminSenda"));
const AdminBrecha = lazy(() => import("./pages/admin/AdminBrecha"));
const AdminDevTools = lazy(() => import("./pages/admin/AdminDevTools"));

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
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/senda" element={<Senda />} />
          <Route path="/artefacto" element={<Artefacto />} />
          <Route path="/la-brecha" element={
            <Suspense fallback={<div className="min-h-screen bg-background" />}>
              <LaBrecha />
            </Suspense>
          } />
          
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
            <Route path="dev" element={<Suspense fallback={<AdminFallback />}><AdminDevTools /></Suspense>} />
          </Route>
          
          {/* Redirects */}
          <Route path="/analytics" element={<Navigate to="/admin" replace />} />
          <Route path="/test-vault" element={<Navigate to="/admin/dev" replace />} />
          <Route path="/roadmap" element={<Navigate to="/" replace />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
