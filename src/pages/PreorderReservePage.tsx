import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useLanguage, LanguageProvider } from '@/contexts/LanguageContext';
import { CartProvider, useCart } from '@/contexts/CartContext';
import { Header } from '@/components/Header';
import { CategoryTabs } from '@/components/CategoryTabs';
import { MenuItemCard } from '@/components/MenuItemCard';
import { MenuItemModal } from '@/components/MenuItemModal';
import { Button } from '@/components/ui/button';
import { menuItems, MenuItem } from '@/data/menuData';
import { ShoppingBag, ArrowLeft, ArrowRight, Sparkles, Info, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HapticButton } from '@/components/ui/haptic-button';
import { AnimatedCard } from '@/components/ui/animated-card';

// Import menu images
import bruschettaPomodoro from '@/assets/menu/bruschetta-pomodoro.jpg';
import bruschettaGarlic from '@/assets/menu/bruschetta-garlic.jpg';
import polpetteCarne from '@/assets/menu/polpette-carne.jpg';
import crocchettePatate from '@/assets/menu/crocchette-patate.jpg';
import panzerottoSemplice from '@/assets/menu/panzerotto-semplice.jpg';
import panzerottoProsciutto from '@/assets/menu/panzerotto-prosciutto.jpg';
import polpoPatate from '@/assets/menu/polpo-patate.jpg';
import gamberiBurrata from '@/assets/menu/gamberi-burrata.jpg';
import parmigianaMelanzane from '@/assets/menu/parmigiana-melanzane.jpg';
import zuppaMare from '@/assets/menu/zuppa-mare.jpg';
import zuppaMinestrone from '@/assets/menu/zuppa-minestrone.jpg';
import zuppaFunghi from '@/assets/menu/zuppa-funghi.jpg';
import caesarSalad from '@/assets/menu/caesar-salad.jpg';
import rucolaPomodorini from '@/assets/menu/rucola-pomodorini.jpg';
import quinoaAvocado from '@/assets/menu/quinoa-avocado.jpg';
import risottoMare from '@/assets/menu/risotto-mare.jpg';
import risottoPolloFunghi from '@/assets/menu/risotto-pollo-funghi.jpg';
import risottoBurrata from '@/assets/menu/risotto-burrata.jpg';
import pizzaMargherita from '@/assets/menu/pizza-margherita.jpg';
import pizzaChickenMushroom from '@/assets/menu/pizza-chicken-mushroom.jpg';
import pizzaAlfredo from '@/assets/menu/pizza-alfredo.jpg';
import pizzaQuattroFormaggi from '@/assets/menu/pizza-quattro-formaggi.jpg';
import pizzaTonnoCipolla from '@/assets/menu/pizza-tonno-cipolla.jpg';
import pizzaSalmone from '@/assets/menu/pizza-salmone.jpg';
import pizzaNapoletana from '@/assets/menu/pizza-napoletana.jpg';
import pizzaHawaiian from '@/assets/menu/pizza-hawaiian.jpg';
import pizzaVegetariana from '@/assets/menu/pizza-vegetariana.jpg';
import pizzaFruttiMare from '@/assets/menu/pizza-frutti-mare.jpg';
import grilledSalmon from '@/assets/menu/grilled-salmon.jpg';
import seaBream from '@/assets/menu/sea-bream.jpg';
import grilledSteak from '@/assets/menu/grilled-steak.jpg';
import grilledLambChops from '@/assets/menu/grilled-lamb-chops.jpg';
import chickenMilanese from '@/assets/menu/chicken-milanese.jpg';
import grilledChicken from '@/assets/menu/grilled-chicken.jpg';
import pannaCotta from '@/assets/menu/panna-cotta.jpg';
import tiramisu from '@/assets/menu/tiramisu.jpg';
import cremeBrulee from '@/assets/menu/creme-brulee.jpg';
import nutellaPizza from '@/assets/menu/nutella-pizza.jpg';
import fruitSalad from '@/assets/menu/fruit-salad.jpg';
import strawberryJuice from '@/assets/menu/strawberry-juice.jpg';
import pineappleJuice from '@/assets/menu/pineapple-juice.jpg';
import grapeJuice from '@/assets/menu/grape-juice.jpg';
import watermelonJuice from '@/assets/menu/watermelon-juice.jpg';

const imageMap: Record<string, string> = {
  'starter-1': bruschettaPomodoro, 'starter-2': bruschettaGarlic, 'starter-3': polpetteCarne,
  'starter-4': crocchettePatate, 'starter-5': panzerottoSemplice, 'starter-6': panzerottoProsciutto,
  'starter-7': polpoPatate, 'starter-8': gamberiBurrata, 'starter-9': parmigianaMelanzane,
  'starter-10': zuppaMare, 'starter-11': zuppaMinestrone, 'starter-12': zuppaFunghi,
  'starter-13': caesarSalad, 'starter-14': rucolaPomodorini, 'starter-15': quinoaAvocado,
  'risotto-1': risottoMare, 'risotto-2': risottoPolloFunghi, 'risotto-3': risottoBurrata,
  'pizza-1': pizzaMargherita, 'pizza-2': pizzaChickenMushroom, 'pizza-3': pizzaAlfredo,
  'pizza-4': pizzaQuattroFormaggi, 'pizza-5': pizzaTonnoCipolla, 'pizza-6': pizzaSalmone,
  'pizza-7': pizzaNapoletana, 'pizza-8': pizzaHawaiian, 'pizza-9': pizzaVegetariana,
  'pizza-10': pizzaFruttiMare,
  'fish-1': grilledSalmon, 'fish-2': seaBream,
  'meat-1': grilledSteak, 'meat-2': grilledLambChops,
  'chicken-1': chickenMilanese, 'chicken-2': grilledChicken,
  'dessert-1': pannaCotta, 'dessert-2': tiramisu, 'dessert-3': cremeBrulee,
  'dessert-4': nutellaPizza, 'dessert-5': fruitSalad,
  'drink-1': strawberryJuice, 'drink-2': pineappleJuice, 'drink-3': grapeJuice, 'drink-4': watermelonJuice,
};

function PreorderReserveContent() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { items, totalItems, subtotal, clearCart } = useCart();
  const [activeCategory, setActiveCategory] = useState('starters');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const filteredItems = menuItems.filter(item => item.category === activeCategory);

  const itemsWithImages = filteredItems.map(item => ({
    ...item,
    image: imageMap[item.id] || item.image,
  }));

  const depositAmount = Math.ceil(subtotal * 0.5);
  const minOrderForPreorder = 50; // Minimum order amount in AED

  const handleContinue = () => {
    if (subtotal < minOrderForPreorder) {
      return;
    }
    // Navigate to reservation form with preorder flag
    navigate('/reserve?type=preorder');
  };

  const handleBack = () => {
    clearCart();
    navigate('/reserve');
  };

  return (
    <div className="min-h-screen bg-background pt-16 pb-32">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <HapticButton
            variant="ghost"
            hapticIntensity="light"
            onClick={handleBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 p-0 h-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reservation Options
          </HapticButton>

          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-3"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="w-4 h-4 text-primary" />
              </motion.span>
              <span className="text-sm text-primary font-medium">Pre-Order & Reserve</span>
            </motion.div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              Build Your Pre-Order
            </h1>
            <p className="text-muted-foreground text-sm">
              Select items from our menu. You'll pay 50% as deposit.
            </p>
          </motion.div>
        </div>

        {/* Info Banner */}
        <AnimatedCard className="p-4 mb-6 flex items-start gap-3" delay={0.2} hoverEffect>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          </motion.div>
          <div>
            <p className="text-sm font-medium text-foreground">How it works</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add items to your order → Pay 50% deposit → Your food will be ready when you arrive
            </p>
          </div>
        </AnimatedCard>

        {/* Category Tabs */}
        <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm py-4 -mx-4 px-4">
          <CategoryTabs
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {itemsWithImages.map((item, index) => (
            <MenuItemCard
              key={item.id}
              item={item}
              index={index}
              onClick={() => setSelectedItem(item)}
            />
          ))}
        </div>
      </div>

      {/* Floating Cart Summary */}
      <AnimatePresence>
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-background via-background to-transparent"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
        >
          <div className="container mx-auto max-w-lg">
            <motion.div 
              className="glass-card rounded-xl p-4 border border-border/50"
              whileHover={{ y: -2, boxShadow: "0 12px 30px -10px hsl(var(--primary) / 0.2)" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {totalItems > 0 ? (
                <>
                  <div className="flex justify-between items-center mb-3">
                    <motion.div 
                      className="flex items-center gap-2"
                      key={totalItems}
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                    >
                      <motion.span
                        animate={{ rotate: totalItems > 0 ? [0, -10, 10, 0] : 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <ShoppingBag className="w-5 h-5 text-primary" />
                      </motion.span>
                      <span className="font-medium text-foreground">{totalItems} items</span>
                    </motion.div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Order Total</p>
                      <motion.p 
                        className="font-bold text-foreground"
                        key={subtotal}
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                      >
                        {subtotal} {t('currency')}
                      </motion.p>
                    </div>
                  </div>
                  
                  <motion.div 
                    className="flex justify-between items-center p-3 rounded-lg bg-primary/10 mb-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <span className="text-sm font-medium text-foreground">50% Deposit</span>
                    <motion.span 
                      className="font-bold gold-text"
                      key={depositAmount}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                    >
                      {depositAmount} {t('currency')}
                    </motion.span>
                  </motion.div>

                  <AnimatePresence>
                    {subtotal < minOrderForPreorder && (
                      <motion.p 
                        className="text-xs text-amber-500 mb-3 text-center"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        Minimum order of {minOrderForPreorder} AED required for pre-order
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <HapticButton
                    variant="chipActive"
                    hapticIntensity="strong"
                    className={`w-full h-12 text-base font-semibold rounded-xl ${
                      subtotal >= minOrderForPreorder 
                        ? 'bg-gradient-to-r from-primary to-amber shadow-lg shadow-primary/30' 
                        : 'bg-muted/50 text-muted-foreground'
                    }`}
                    onClick={handleContinue}
                    disabled={subtotal < minOrderForPreorder}
                  >
                    <span>Continue to Details</span>
                    <motion.span
                      animate={subtotal >= minOrderForPreorder ? { x: [0, 4, 0] } : {}}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </motion.span>
                  </HapticButton>
                </>
              ) : (
                <motion.div 
                  className="text-center py-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-muted-foreground text-sm">
                    Add items to your pre-order to continue
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      <MenuItemModal
        item={selectedItem}
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}

export default function PreorderReservePage() {
  return (
    <LanguageProvider>
      <CartProvider>
        <Header />
        <PreorderReserveContent />
      </CartProvider>
    </LanguageProvider>
  );
}
