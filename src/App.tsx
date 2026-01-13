import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CartProvider } from "@/contexts/CartContext";
import { GuestSessionProvider } from "@/contexts/GuestSessionContext";
import { SplashScreen } from "@/components/SplashScreen";
import Index from "./pages/Index";
import ReservationPage from "./pages/ReservationPage";
import OrderPage from "./pages/OrderPage";
import CartPage from "./pages/CartPage";
import CheckinPage from "./pages/CheckinPage";
import AdminPage from "./pages/AdminPage";
import AuthPage from "./pages/AuthPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import GuestLoginPage from "./pages/GuestLoginPage";
import PreorderPage from "./pages/PreorderPage";
import KitchenDisplayPage from "./pages/KitchenDisplayPage";
import TestQRPage from "./pages/TestQRPage";
import NotFound from "./pages/NotFound";

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
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/reserve" element={<ReservationPage />} />
                      <Route path="/order" element={<OrderPage />} />
                      <Route path="/order/cart" element={<CartPage />} />
                      <Route path="/checkin" element={<CheckinPage />} />
                      <Route path="/admin" element={<AdminPage />} />
                      <Route path="/auth" element={<AuthPage />} />
                      <Route path="/my-orders" element={<MyOrdersPage />} />
                      <Route path="/guest-login" element={<GuestLoginPage />} />
                      <Route path="/preorder" element={<PreorderPage />} />
                      <Route path="/kitchen" element={<KitchenDisplayPage />} />
                      <Route path="/test-qr" element={<TestQRPage />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
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
