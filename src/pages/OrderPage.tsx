import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Header } from '@/components/Header';
import { CategoryTabs } from '@/components/CategoryTabs';
import { MenuItemCard } from '@/components/MenuItemCard';
import { MenuItemModal } from '@/components/MenuItemModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { menuItems, MenuItem } from '@/data/menuData';
import { ShoppingBag, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    <>
      <Header />
      <OrderContent />
    </>
  );
};

export default OrderPage;
