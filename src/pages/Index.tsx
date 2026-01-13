import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { CategoryTabs } from '@/components/CategoryTabs';
import { MenuSection } from '@/components/MenuSection';
import { MenuItemCard } from '@/components/MenuItemCard';
import { MenuItemModal } from '@/components/MenuItemModal';
import { ReservationCTA } from '@/components/ReservationCTA';
import { ReviewsSection } from '@/components/ReviewsSection';
import { MenuChatbot } from '@/components/MenuChatbot';
import { menuItems, MenuItem } from '@/data/menuData';
import { LanguageProvider } from '@/contexts/LanguageContext';
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
  // Hot Starters
  'starter-1': bruschettaPomodoro,
  'starter-2': bruschettaGarlic,
  'starter-3': polpetteCarne,
  'starter-4': crocchettePatate,
  'starter-5': panzerottoSemplice,
  'starter-6': panzerottoProsciutto,
  'appetizer-hot-1': polpoPatate,
  'appetizer-hot-2': gamberiBurrata,
  'appetizer-hot-3': parmigianaMelanzane,
  'soup-1': zuppaMare,
  'soup-2': zuppaMinestrone,
  'soup-3': zuppaFunghi,
  // Cold Starters (Salads)
  'salad-1': caesarSalad,
  'salad-2': rucolaPomodorini,
  'salad-3': quinoaAvocado,
  // Risotto
  'risotto-1': risottoMare,
  'risotto-2': risottoPolloFunghi,
  'risotto-3': risottoBurrata,
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
  'main-1': grilledSalmon,
  'main-2': seaBream,
  // Meat
  'main-3': grilledSteak,
  'main-4': grilledLambChops,
  // Chicken
  'main-5': chickenMilanese,
  'main-6': grilledChicken,
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

// Map subcategory to main category for navigation
const subcategoryToCategory: Record<string, 'starters' | 'main' | 'desserts' | 'drinks'> = {
  'hot-starters': 'starters',
  'cold-starters': 'starters',
  'risotto': 'main',
  'pizza': 'main',
  'fish': 'main',
  'meat': 'main',
  'chicken': 'main',
  'sweet': 'desserts',
  'fresh-juices': 'drinks',
};

function MenuContent() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [dbMenuItems, setDbMenuItems] = useState<Array<{ id: string; name: string; category: string }>>([]);

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

  const filteredItems = activeCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category === activeCategory);

  // Handle chatbot navigation to category
  const handleNavigateToCategory = useCallback((category: string) => {
    // Check if it's a subcategory and map to main category
    const mainCategory = subcategoryToCategory[category] || category;
    if (mainCategory === 'starters' || mainCategory === 'main' || mainCategory === 'desserts' || mainCategory === 'drinks') {
      setActiveCategory(mainCategory);
    } else {
      setActiveCategory('all');
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

  const renderContent = () => {
    if (activeCategory === 'all') {
      // Show all items with category sections
      return (
        <div className="space-y-16">
          <MenuSection
            category="starters"
            items={menuItems.filter(item => item.category === 'starters')}
            onItemClick={setSelectedItem}
            imageMap={imageMap}
          />
          <MenuSection
            category="main"
            items={menuItems.filter(item => item.category === 'main')}
            onItemClick={setSelectedItem}
            imageMap={imageMap}
          />
          <MenuSection
            category="desserts"
            items={menuItems.filter(item => item.category === 'desserts')}
            onItemClick={setSelectedItem}
            imageMap={imageMap}
          />
          <MenuSection
            category="drinks"
            items={menuItems.filter(item => item.category === 'drinks')}
            onItemClick={setSelectedItem}
            imageMap={imageMap}
          />
        </div>
      );
    }

    // Show filtered category with subcategory sections
    return (
      <MenuSection
        category={activeCategory as 'starters' | 'main' | 'desserts' | 'drinks'}
        items={filteredItems}
        onItemClick={setSelectedItem}
        imageMap={imageMap}
      />
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16 pb-32">
        <HeroSection />
        
        <section className="container mx-auto px-4 py-8">
          <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm py-4 -mx-4 px-4">
            <CategoryTabs
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </div>

          <div className="mt-6">
            {renderContent()}
          </div>
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
