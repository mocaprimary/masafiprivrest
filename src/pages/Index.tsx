import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { CategoryTabs } from '@/components/CategoryTabs';
import { MenuSection } from '@/components/MenuSection';
import { MenuItemCard } from '@/components/MenuItemCard';
import { MenuItemModal } from '@/components/MenuItemModal';
import { ReservationCTA } from '@/components/ReservationCTA';
import { ReviewsSection } from '@/components/ReviewsSection';
import { MenuChatbot } from '@/components/MenuChatbot';
import { menuItems, MenuItem, categories } from '@/data/menuData';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { CartProvider } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';

// Import Italian menu images
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
// Drinks
import strawberryJuice from '@/assets/menu/strawberry-juice.jpg';
import pineappleJuice from '@/assets/menu/pineapple-juice.jpg';
import grapeJuice from '@/assets/menu/grape-juice.jpg';
import watermelonJuice from '@/assets/menu/watermelon-juice.jpg';

// Map item IDs to imported images
const imageMap: Record<string, string> = {
  // Starters
  'starter-1': bruschettaPomodoro,
  'starter-2': bruschettaGarlic,
  'starter-3': polpetteCarne,
  'starter-4': crocchettePatate,
  'starter-5': panzerottoSemplice,
  'starter-6': panzerottoProsciutto,
  'starter-7': polpoPatate,
  'starter-8': gamberiBurrata,
  'starter-9': parmigianaMelanzane,
  'starter-10': zuppaMare,
  'starter-11': zuppaMinestrone,
  'starter-12': zuppaFunghi,
  'starter-13': caesarSalad,
  'starter-14': rucolaPomodorini,
  'starter-15': quinoaAvocado,
  // Pizza
  'pizza-1': pizzaMargherita,
  'pizza-2': pizzaChickenMushroom,
  'pizza-3': pizzaAlfredo,
  'pizza-4': pizzaQuattroFormaggi,
  'pizza-5': pizzaTonnoCipolla,
  'pizza-6': pizzaSalmone,
  'pizza-7': pizzaNapoletana,
  'pizza-8': pizzaHawaiian,
  'pizza-9': pizzaVegetariana,
  'pizza-10': pizzaFruttiMare,
  // Fish
  'fish-1': grilledSalmon,
  'fish-2': seaBream,
  // Meat
  'meat-1': grilledSteak,
  'meat-2': grilledLambChops,
  // Chicken
  'chicken-1': chickenMilanese,
  'chicken-2': grilledChicken,
  // Desserts
  'dessert-1': pannaCotta,
  'dessert-2': tiramisu,
  'dessert-3': cremeBrulee,
  'dessert-4': nutellaPizza,
  'dessert-5': fruitSalad,
  // Drinks
  'drink-1': strawberryJuice,
  'drink-2': pineappleJuice,
  'drink-3': grapeJuice,
  'drink-4': watermelonJuice,
};

function MenuContent() {
  const [activeCategory, setActiveCategory] = useState('starters');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [dbMenuItems, setDbMenuItems] = useState<Array<{ id: string; name: string; category: string }>>([]);
  const { t } = useLanguage();

  // Fetch database menu items for ID lookup
  useEffect(() => {
    const fetchDbMenuItems = async () => {
      const { data } = await supabase
        .from('menu_items')
        .select('id, name, category')
        .eq('is_available', true);
      if (data) {
        setDbMenuItems(data);
      }
    };
    fetchDbMenuItems();
  }, []);

  const filteredItems = menuItems.filter(item => item.category === activeCategory);

  // Handle chatbot navigation to category
  const handleNavigateToCategory = useCallback((category: string) => {
    const validCategories = categories.map(c => c.id);
    if (validCategories.includes(category as any)) {
      setActiveCategory(category);
    } else {
      setActiveCategory('starters');
    }
    // Scroll to menu section
    const menuSection = document.querySelector('section.container');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Handle chatbot showing a specific menu item
  const handleShowMenuItem = useCallback((itemId: string) => {
    // First try to find in local menu items
    const localItem = menuItems.find(item => item.id === itemId);
    if (localItem) {
      setSelectedItem({
        ...localItem,
        image: imageMap[localItem.id] || localItem.image,
      });
      return;
    }

    // Try to find by database ID and match by name
    const dbItem = dbMenuItems.find(item => item.id === itemId);
    if (dbItem) {
      // Find matching local item by name (case-insensitive)
      const matchingLocal = menuItems.find(
        item => item.name.toLowerCase() === dbItem.name.toLowerCase()
      );
      if (matchingLocal) {
        setSelectedItem({
          ...matchingLocal,
          image: imageMap[matchingLocal.id] || matchingLocal.image,
        });
        return;
      }
      
      // Navigate to the category if we can't show the item
      handleNavigateToCategory(dbItem.category);
    }
  }, [dbMenuItems, handleNavigateToCategory]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16 pb-32">
        <HeroSection />
        
        {/* Menu Section with enhanced styling */}
        <section className="container mx-auto px-4 py-12">
          {/* Section Header */}
          <motion.div 
            className="text-center mb-10"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.span 
              className="inline-block text-primary text-sm uppercase tracking-[0.3em] mb-3"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              {t('discoverMenu')}
            </motion.span>
            <motion.h2 
              className="font-display text-4xl md:text-5xl font-bold gold-text mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              {t('ourMenu')}
            </motion.h2>
            <motion.div 
              className="flex justify-center items-center gap-3"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-primary/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-primary/50" />
            </motion.div>
          </motion.div>

          {/* Sticky Category Tabs */}
          <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-md py-4 -mx-4 px-4 border-b border-border/30">
            <CategoryTabs
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </div>

          <motion.div 
            className="mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            key={activeCategory}
          >
            <MenuSection
              category={activeCategory}
              items={filteredItems}
              onItemClick={setSelectedItem}
              imageMap={imageMap}
            />
          </motion.div>
        </section>

        <ReviewsSection />
      </main>

      <ReservationCTA />

      <MenuItemModal
        item={selectedItem}
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      <MenuChatbot 
        onNavigateToCategory={handleNavigateToCategory}
        onShowMenuItem={handleShowMenuItem}
      />
    </div>
  );
}

const Index = () => {
  return (
    <LanguageProvider>
      <CartProvider>
        <MenuContent />
      </CartProvider>
    </LanguageProvider>
  );
};

export default Index;
