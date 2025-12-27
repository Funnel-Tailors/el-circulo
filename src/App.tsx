import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import Quiz from "./pages/Quiz";
import Auth from "./pages/Auth";
import Analytics from "./pages/Analytics";
import Senda from "./pages/Senda";
import Artefacto from "./pages/Artefacto";
import TestVault from "./pages/TestVault";
import NotFound from "./pages/NotFound";

// Lazy load La Brecha
const LaBrecha = lazy(() => import("./pages/LaBrecha"));

const queryClient = new QueryClient();

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
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/senda" element={<Senda />} />
          <Route path="/artefacto" element={<Artefacto />} />
          <Route path="/test-vault" element={<TestVault />} />
          <Route path="/la-brecha" element={
            <Suspense fallback={<div className="min-h-screen bg-background" />}>
              <LaBrecha />
            </Suspense>
          } />
          <Route path="/roadmap" element={<Navigate to="/" replace />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
