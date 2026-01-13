import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import Index from "@/pages/Index";
import ReservationPage from "@/pages/ReservationPage";
import OrderPage from "@/pages/OrderPage";
import CartPage from "@/pages/CartPage";
import CheckinPage from "@/pages/CheckinPage";
import AdminPage from "@/pages/AdminPage";
import AuthPage from "@/pages/AuthPage";
import MyOrdersPage from "@/pages/MyOrdersPage";
import GuestLoginPage from "@/pages/GuestLoginPage";
import PreorderPage from "@/pages/PreorderPage";
import KitchenDisplayPage from "@/pages/KitchenDisplayPage";
import TestQRPage from "@/pages/TestQRPage";
import NotFound from "@/pages/NotFound";

export function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <Index />
            </PageTransition>
          }
        />
        <Route
          path="/reserve"
          element={
            <PageTransition>
              <ReservationPage />
            </PageTransition>
          }
        />
        <Route
          path="/order"
          element={
            <PageTransition>
              <OrderPage />
            </PageTransition>
          }
        />
        <Route
          path="/order/cart"
          element={
            <PageTransition>
              <CartPage />
            </PageTransition>
          }
        />
        <Route
          path="/checkin"
          element={
            <PageTransition>
              <CheckinPage />
            </PageTransition>
          }
        />
        <Route
          path="/admin"
          element={
            <PageTransition>
              <AdminPage />
            </PageTransition>
          }
        />
        <Route
          path="/auth"
          element={
            <PageTransition>
              <AuthPage />
            </PageTransition>
          }
        />
        <Route
          path="/my-orders"
          element={
            <PageTransition>
              <MyOrdersPage />
            </PageTransition>
          }
        />
        <Route
          path="/guest-login"
          element={
            <PageTransition>
              <GuestLoginPage />
            </PageTransition>
          }
        />
        <Route
          path="/preorder"
          element={
            <PageTransition>
              <PreorderPage />
            </PageTransition>
          }
        />
        <Route
          path="/kitchen"
          element={
            <PageTransition>
              <KitchenDisplayPage />
            </PageTransition>
          }
        />
        <Route
          path="/test-qr"
          element={
            <PageTransition>
              <TestQRPage />
            </PageTransition>
          }
        />
        <Route
          path="*"
          element={
            <PageTransition>
              <NotFound />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}
