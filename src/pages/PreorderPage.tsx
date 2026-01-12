import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGuestSession } from '@/contexts/GuestSessionContext';
import { useCart } from '@/contexts/CartContext';
import { Header } from '@/components/Header';
import { CategoryTabs } from '@/components/CategoryTabs';
import { MenuItemCard } from '@/components/MenuItemCard';
import { MenuItemModal } from '@/components/MenuItemModal';
import { PreorderCartReview } from '@/components/PreorderCartReview';
import { Button } from '@/components/ui/button';
import { menuItems, MenuItem } from '@/data/menuData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ShoppingBag, Calendar, Clock, Users, LogOut, ArrowLeft, Loader2, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

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
  'starter-1': bruschettaPomodoro, 'starter-2': bruschettaGarlic, 'starter-3': polpetteCarne,
  'starter-4': crocchettePatate, 'starter-5': panzerottoSemplice, 'starter-6': panzerottoProsciutto,
  'appetizer-1': polpoPatate, 'appetizer-2': gamberiBurrata, 'appetizer-3': parmigianaMelanzane,
  'soup-1': zuppaMare, 'soup-2': zuppaMinestrone, 'soup-3': zuppaFunghi,
  'salad-1': caesarSalad, 'salad-2': rucolaPomodorini, 'salad-3': quinoaAvocado,
  'risotto-1': risottoMare, 'risotto-2': risottoPolloFunghi, 'risotto-3': risottoBurrata,
  'pizza-1': pizzaMargherita, 'pizza-2': pizzaChickenMushroom, 'pizza-3': pizzaAlfredo,
  'pizza-4': pizzaQuattroFormaggi, 'pizza-5': pizzaTonnoCipolla, 'pizza-6': pizzaSalmone,
  'pizza-7': pizzaNapoletana, 'pizza-8': pizzaHawaiian, 'pizza-9': pizzaVegetariana, 'pizza-10': pizzaFruttiMare,
  'main-1': grilledSalmon, 'main-2': seaBream, 'main-3': grilledSteak,
  'main-4': grilledLambChops, 'main-5': chickenMilanese, 'main-6': grilledChicken,
  'dessert-1': pannaCotta, 'dessert-2': tiramisu, 'dessert-3': cremeBrulee,
  'dessert-4': nutellaPizza, 'dessert-5': fruitSalad,
};

interface PreorderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Preorder {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  total: number;
  created_at: string;
  items: PreorderItem[];
}

function PreorderContent() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { guestReservation, logout, isGuestLoggedIn } = useGuestSession();
  const { items, totalItems, subtotal, clearCart } = useCart();
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [existingPreorders, setExistingPreorders] = useState<Preorder[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreorders, setShowPreorders] = useState(false);
  const [showCartReview, setShowCartReview] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!isGuestLoggedIn) {
      navigate('/guest-login');
    }
  }, [isGuestLoggedIn, navigate]);

  // Fetch existing preorders
  useEffect(() => {
    if (guestReservation?.id) {
      fetchPreorders();
    }
  }, [guestReservation?.id]);

  const fetchPreorders = async () => {
    if (!guestReservation?.id) return;
    
    try {
      const { data, error } = await supabase.rpc('get_reservation_preorders', {
        p_reservation_id: guestReservation.id
      });

      if (error) {
        console.error('Error fetching preorders:', error);
        return;
      }

      const result = data as unknown as { success: boolean; orders: Preorder[] };
      if (result?.success) {
        setExistingPreorders(result.orders || []);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handlePlacePreorder = async () => {
    if (!guestReservation?.id || items.length === 0) return;

    setIsSubmitting(true);

    try {
      // Map cart items to menu item IDs - we need to fetch from DB
      const { data: menuItemsData } = await supabase
        .from('menu_items')
        .select('id, name')
        .in('name', items.map(i => i.name));

      if (!menuItemsData || menuItemsData.length === 0) {
        toast.error('Could not find menu items');
        setIsSubmitting(false);
        return;
      }

      const orderItems = items.map(item => {
        const dbItem = menuItemsData.find(m => m.name === item.name);
        return {
          menu_item_id: dbItem?.id,
          quantity: item.quantity,
          modifiers: item.modifiers || []
        };
      }).filter(i => i.menu_item_id);

      const { data, error } = await supabase.rpc('create_preorder', {
        p_reservation_id: guestReservation.id,
        p_items: orderItems,
        p_notes: null
      });

      if (error) {
        console.error('Error creating preorder:', error);
        toast.error('Failed to place pre-order');
        return;
      }

      const result = data as { success: boolean; error?: string; order?: any };

      if (!result.success) {
        toast.error(result.error || 'Failed to place pre-order');
        return;
      }

      toast.success(`Pre-order ${result.order.order_number} placed successfully!`);
      clearCart();
      fetchPreorders();
      setShowPreorders(true);
    } catch (err) {
      console.error('Error:', err);
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    clearCart();
    navigate('/');
  };

  if (!guestReservation) return null;

  const filteredItems = activeCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category === activeCategory);

  const itemsWithImages = filteredItems.map(item => ({
    ...item,
    image: imageMap[item.id] || item.image,
  }));

  const reservationDate = new Date(guestReservation.reservation_date);

  if (showPreorders && existingPreorders.length > 0) {
    return (
      <div className="min-h-screen bg-background pt-16 pb-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <button
            onClick={() => setShowPreorders(false)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Menu
          </button>

          <div className="text-center mb-8">
            <Package className="w-12 h-12 mx-auto text-primary mb-4" />
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              Your Pre-Orders
            </h1>
            <p className="text-muted-foreground">
              These will be ready for you on {format(reservationDate, 'MMMM d, yyyy')}
            </p>
          </div>

          <div className="space-y-4">
            {existingPreorders.map((order) => (
              <motion.div
                key={order.id}
                className="glass-card rounded-xl p-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-semibold text-foreground">{order.order_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs bg-amber-500/20 text-amber-500">
                    Pre-ordered
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="text-foreground">{item.price * item.quantity} AED</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-medium text-foreground">Total</span>
                  <span className="font-bold gold-text">{order.total} AED</span>
                </div>
              </motion.div>
            ))}
          </div>

          <Button
            variant="outline"
            className="w-full mt-6"
            onClick={() => setShowPreorders(false)}
          >
            Add More Items
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16 pb-32">
      <div className="container mx-auto px-4 py-6">
        {/* Guest Info Card */}
        <motion.div 
          className="glass-card rounded-xl p-4 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">
                Welcome, {guestReservation.full_name}!
              </p>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  {format(reservationDate, 'MMM d, yyyy')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  {guestReservation.reservation_time}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  {guestReservation.guests} guests
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {existingPreorders.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowPreorders(true)}
                >
                  <Package className="w-4 h-4 mr-1" />
                  {existingPreorders.length}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="text-center mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Pre-Order Your Meal
          </h1>
          <p className="text-muted-foreground text-sm">
            Your order will be ready when you arrive
          </p>
        </div>

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

      {/* Floating Cart Button */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <div className="container mx-auto max-w-lg">
            <Button 
              variant="gold" 
              size="xl" 
              className="w-full justify-between"
              onClick={() => setShowCartReview(true)}
              disabled={isSubmitting}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5" />
                <span>Review Pre-Order ({totalItems} items)</span>
              </div>
              <span className="font-bold">{subtotal} {t('currency')}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Cart Review Modal */}
      <PreorderCartReview
        open={showCartReview}
        onClose={() => setShowCartReview(false)}
        onConfirm={() => {
          setShowCartReview(false);
          handlePlacePreorder();
        }}
        isSubmitting={isSubmitting}
        reservationDate={format(reservationDate, 'MMMM d, yyyy')}
        reservationTime={guestReservation.reservation_time}
      />

      <MenuItemModal
        item={selectedItem}
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}

export default function PreorderPage() {
  return (
    <>
      <Header />
      <PreorderContent />
    </>
  );
}
