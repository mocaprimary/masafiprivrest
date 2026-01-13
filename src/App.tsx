import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CartProvider } from "@/contexts/CartContext";
import { GuestSessionProvider } from "@/contexts/GuestSessionContext";
import { SplashScreen } from "@/components/SplashScreen";
import { AnimatedRoutes } from "@/components/AnimatedRoutes";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    // Check if splash was already shown in this session
    const splashShown = sessionStorage.getItem('splashShown');
    if (splashShown) {
      setShowSplash(false);
      setIsFirstLoad(false);
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem('splashShown', 'true');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <CartProvider>
            <GuestSessionProvider>
              <Toaster />
              <Sonner />
              <AnimatePresence mode="wait">
                {showSplash && isFirstLoad ? (
                  <SplashScreen key="splash" onComplete={handleSplashComplete} />
                ) : (
                  <BrowserRouter>
                    <AnimatedRoutes />
                  </BrowserRouter>
                )}
              </AnimatePresence>
            </GuestSessionProvider>
          </CartProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
