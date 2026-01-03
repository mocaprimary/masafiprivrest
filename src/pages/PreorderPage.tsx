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
