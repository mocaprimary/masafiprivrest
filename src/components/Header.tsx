import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Link, useLocation } from 'react-router-dom';

export function Header() {
  const { language, setLanguage, t } = useLanguage();
  const { totalItems } = useCart();
  const location = useLocation();
  const isOrderPage = location.pathname.startsWith('/order');

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/30">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center">
            <span className="text-primary-foreground font-display text-xl font-bold">O</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="font-display text-lg font-semibold text-foreground leading-tight">
              {t('restaurantName')}
            </h1>
            <p className="text-xs text-muted-foreground">{t('tagline')}</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="gap-2"
          >
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">{language === 'en' ? 'عربي' : 'EN'}</span>
          </Button>

          {isOrderPage && totalItems > 0 && (
            <Link to="/order/cart">
              <Button variant="gold" size="sm" className="relative">
                <ShoppingBag className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
