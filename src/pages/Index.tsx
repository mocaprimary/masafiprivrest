import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { CategoryTabs } from '@/components/CategoryTabs';
import { MenuItemCard } from '@/components/MenuItemCard';
import { MenuItemModal } from '@/components/MenuItemModal';
import { ReservationCTA } from '@/components/ReservationCTA';
import { ReviewsSection } from '@/components/ReviewsSection';
import { MenuChatbot } from '@/components/MenuChatbot';
import { menuItems, MenuItem } from '@/data/menuData';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { CartProvider } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';

// Import menu images
import hummusTrio from '@/assets/menu/hummus-trio.jpg';
import lambKibbeh from '@/assets/menu/lamb-kibbeh.jpg';
import tabbouleh from '@/assets/menu/tabbouleh.jpg';
import saffronShrimp from '@/assets/menu/saffron-shrimp.jpg';
import lambShank from '@/assets/menu/lamb-shank.jpg';
import grilledHammour from '@/assets/menu/grilled-hammour.jpg';
import wagyuMedallions from '@/assets/menu/wagyu-medallions.jpg';
import mixedGrill from '@/assets/menu/mixed-grill.jpg';
import vegetableTagine from '@/assets/menu/vegetable-tagine.jpg';
import kunafa from '@/assets/menu/kunafa.jpg';
import datePudding from '@/assets/menu/date-pudding.jpg';
import saffronCremeBrulee from '@/assets/menu/saffron-creme-brulee.jpg';
import arabicCoffee from '@/assets/menu/arabic-coffee.jpg';
import mintLemonade from '@/assets/menu/mint-lemonade.jpg';
import rosePomegranateMocktail from '@/assets/menu/rose-pomegranate-mocktail.jpg';
import karakChai from '@/assets/menu/karak-chai.jpg';
import chefsTastingMenu from '@/assets/menu/chefs-tasting-menu.jpg';
import wholeOuzi from '@/assets/menu/whole-ouzi.jpg';

// Map item IDs to imported images
const imageMap: Record<string, string> = {
  'starter-1': hummusTrio,
  'starter-2': lambKibbeh,
  'starter-3': tabbouleh,
  'starter-4': saffronShrimp,
  'main-1': lambShank,
  'main-2': grilledHammour,
  'main-3': wagyuMedallions,
  'main-4': mixedGrill,
  'main-5': vegetableTagine,
  'dessert-1': kunafa,
  'dessert-2': datePudding,
  'dessert-3': saffronCremeBrulee,
  'drink-1': arabicCoffee,
  'drink-2': mintLemonade,
  'drink-3': rosePomegranateMocktail,
  'drink-4': karakChai,
  'special-1': chefsTastingMenu,
  'special-2': wholeOuzi,
};

// Map database categories to local categories
const categoryMap: Record<string, string> = {
  'starters': 'starters',
  'main': 'main',
  'desserts': 'desserts', 
  'drinks': 'drinks',
  'specials': 'specials',
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

  // Apply real images to menu items
  const itemsWithImages = filteredItems.map(item => ({
    ...item,
    image: imageMap[item.id] || item.image,
  }));

  // Handle chatbot navigation to category
  const handleNavigateToCategory = useCallback((category: string) => {
    setActiveCategory(category);
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
      const category = categoryMap[dbItem.category] || dbItem.category;
      handleNavigateToCategory(category);
    }
  }, [dbMenuItems, handleNavigateToCategory]);

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
