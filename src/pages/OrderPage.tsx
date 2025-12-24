import { useState } from 'react';
import { useLanguage, LanguageProvider } from '@/contexts/LanguageContext';
import { CartProvider, useCart } from '@/contexts/CartContext';
import { Header } from '@/components/Header';
import { CategoryTabs } from '@/components/CategoryTabs';
import { MenuItemCard } from '@/components/MenuItemCard';
import { MenuItemModal } from '@/components/MenuItemModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { menuItems, MenuItem } from '@/data/menuData';
import { ShoppingBag, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';

// Import menu images
import hummusTrio from '@/assets/menu/hummus-trio.jpg';
import lambKibbeh from '@/assets/menu/lamb-kibbeh.jpg';
import lambShank from '@/assets/menu/lamb-shank.jpg';
import grilledHammour from '@/assets/menu/grilled-hammour.jpg';
import kunafa from '@/assets/menu/kunafa.jpg';
import arabicCoffee from '@/assets/menu/arabic-coffee.jpg';

const imageMap: Record<string, string> = {
  'starter-1': hummusTrio,
  'starter-2': lambKibbeh,
  'main-1': lambShank,
  'main-2': grilledHammour,
  'dessert-1': kunafa,
  'drink-1': arabicCoffee,
};

function TableSelector() {
  const { t } = useLanguage();
  const { tableNumber, setTableNumber } = useCart();
  const [inputValue, setInputValue] = useState('');

  if (tableNumber) {
    return (
      <div className="glass-card rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center">
              <span className="text-primary-foreground font-bold">{tableNumber}</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('order.table')}</p>
              <p className="font-semibold text-foreground">Table {tableNumber}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setTableNumber(null)}>
            Change
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6 mb-6">
      <h2 className="font-display text-xl font-semibold text-foreground mb-4">
        {t('order.selectTable')}
      </h2>
      <div className="flex gap-3 mb-4">
        <Input
          type="number"
          placeholder="Enter table number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="input-field"
        />
        <Button
          variant="gold"
          onClick={() => inputValue && setTableNumber(parseInt(inputValue))}
        >
          Confirm
        </Button>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <QrCode className="w-4 h-4" />
        <span>Or scan the QR code on your table</span>
      </div>
    </div>
  );
}

function OrderContent() {
  const { t } = useLanguage();
  const { totalItems, subtotal, tableNumber } = useCart();
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const filteredItems = activeCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category === activeCategory);

  const itemsWithImages = filteredItems.map(item => ({
    ...item,
    image: imageMap[item.id] || item.image,
  }));

  return (
    <div className="min-h-screen bg-background pt-16 pb-32">
      <div className="container mx-auto px-4 py-6">
        <TableSelector />

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
      </div>

      {totalItems > 0 && tableNumber && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <div className="container mx-auto max-w-lg">
            <Link to="/order/cart">
              <Button variant="gold" size="xl" className="w-full justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5" />
                  <span>View Order ({totalItems} items)</span>
                </div>
                <span className="font-bold">{subtotal} {t('currency')}</span>
              </Button>
            </Link>
          </div>
        </div>
      )}

      <MenuItemModal
        item={selectedItem}
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}

const OrderPage = () => {
  return (
    <LanguageProvider>
      <CartProvider>
        <Header />
        <OrderContent />
      </CartProvider>
    </LanguageProvider>
  );
};

export default OrderPage;
