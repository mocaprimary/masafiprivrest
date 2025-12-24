import { useState } from 'react';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { CategoryTabs } from '@/components/CategoryTabs';
import { MenuItemCard } from '@/components/MenuItemCard';
import { MenuItemModal } from '@/components/MenuItemModal';
import { ReservationCTA } from '@/components/ReservationCTA';
import { ReviewsSection } from '@/components/ReviewsSection';
import { menuItems, MenuItem } from '@/data/menuData';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { CartProvider } from '@/contexts/CartContext';

// Import menu images
import hummusTrio from '@/assets/menu/hummus-trio.jpg';
import lambKibbeh from '@/assets/menu/lamb-kibbeh.jpg';
import lambShank from '@/assets/menu/lamb-shank.jpg';
import grilledHammour from '@/assets/menu/grilled-hammour.jpg';
import kunafa from '@/assets/menu/kunafa.jpg';
import arabicCoffee from '@/assets/menu/arabic-coffee.jpg';

// Map item IDs to imported images
const imageMap: Record<string, string> = {
  'starter-1': hummusTrio,
  'starter-2': lambKibbeh,
  'main-1': lambShank,
  'main-2': grilledHammour,
  'dessert-1': kunafa,
  'drink-1': arabicCoffee,
};

function MenuContent() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const filteredItems = activeCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category === activeCategory);

  // Apply real images to menu items
  const itemsWithImages = filteredItems.map(item => ({
    ...item,
    image: imageMap[item.id] || item.image,
  }));

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
