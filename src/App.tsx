import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CartProvider } from "@/contexts/CartContext";
import { GuestSessionProvider } from "@/contexts/GuestSessionContext";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <CartProvider>
          <GuestSessionProvider>
            <Toaster />
            <Sonner />
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
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </GuestSessionProvider>
        </CartProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
