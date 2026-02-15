import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe, ShoppingBag, Receipt, User, Utensils } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useGuestSession } from '@/contexts/GuestSessionContext';
import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
  const { language, setLanguage, t } = useLanguage();
  const { totalItems } = useCart();
  const { isGuestLoggedIn, guestReservation } = useGuestSession();
  const location = useLocation();
  const isOrderPage = location.pathname.startsWith('/order');
  const isPreorderPage = location.pathname.startsWith('/preorder');
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <motion.header 
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${
        scrolled 
          ? 'bg-background/95 backdrop-blur-md border-border/50 shadow-lg' 
          : 'bg-background/80 backdrop-blur-sm border-border/30'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <motion.div 
            className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <span className="text-primary-foreground font-display text-xl font-bold">O</span>
          </motion.div>
          <div className="hidden sm:block">
            <h1 className="font-display text-lg font-semibold text-foreground leading-tight group-hover:text-primary transition-colors duration-300">
              {t('restaurantName')}
            </h1>
            <p className="text-xs text-muted-foreground">{t('tagline')}</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {/* Pre-Order Link for guests with reservation */}
          <AnimatePresence>
            {isGuestLoggedIn && !isPreorderPage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Link to="/preorder">
                  <Button variant="ghost" size="sm" className="gap-2 text-primary">
                    <Utensils className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm">Pre-Order</span>
                  </Button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pre-Order link for users without login */}
          {!user && !isGuestLoggedIn && !location.pathname.includes('guest-login') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Link to="/guest-login">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Utensils className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">Pre-Order</span>
                </Button>
              </Link>
            </motion.div>
          )}

          {user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <Link to="/my-orders">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Receipt className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">My Orders</span>
                </Button>
              </Link>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="gap-2"
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">{language === 'en' ? 'عربي' : 'EN'}</span>
            </Button>
          </motion.div>

          {user ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => supabase.auth.signOut()}
                className="gap-2"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Logout</span>
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">Login</span>
                </Button>
              </Link>
            </motion.div>
          )}

          <AnimatePresence>
            {isOrderPage && totalItems > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0, rotate: -180 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0, rotate: 180 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Link to="/order/cart">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button variant="gold" size="sm" className="relative">
                      <ShoppingBag className="w-4 h-4" />
                      <motion.span 
                        className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center"
                        key={totalItems}
                        initial={{ scale: 1.5 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      >
                        {totalItems}
                      </motion.span>
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}
