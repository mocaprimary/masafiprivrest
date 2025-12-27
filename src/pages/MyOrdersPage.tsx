import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, AuthProvider } from '@/hooks/useAuth';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { CartProvider } from '@/contexts/CartContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Clock, 
  ChefHat, 
  Check, 
  Utensils,
  Calendar,
  CreditCard,
  Receipt
} from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  name_ar: string | null;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  order_number: string;
  table_number: number;
  status: string;
  subtotal: number;
  total: number;
  deposit_applied: number;
  payment_status: string;
  created_at: string;
  items: OrderItem[];
}

interface Reservation {
  id: string;
  reservation_number: string;
  reservation_date: string;
  reservation_time: string;
  guests: number;
  status: string;
  deposit_amount: number;
  deposit_status: string;
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  placed: { label: 'Order Placed', icon: ShoppingBag, color: 'text-primary' },
  preparing: { label: 'Preparing', icon: ChefHat, color: 'text-amber' },
  ready: { label: 'Ready', icon: Utensils, color: 'text-success' },
  served: { label: 'Served', icon: Check, color: 'text-success' },
  completed: { label: 'Completed', icon: Check, color: 'text-muted-foreground' },
};

function MyOrdersContent() {
  const { t, language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCustomerData();
    }
  }, [user]);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      // Fetch reservations (RLS filters to customer's own)
      const { data: reservationsData, error: resError } = await supabase
        .from('reservations')
        .select('id, reservation_number, reservation_date, reservation_time, guests, status, deposit_amount, deposit_status')
        .order('reservation_date', { ascending: false });

      if (resError) {
        console.error('Error fetching reservations:', resError);
      } else {
        setReservations(reservationsData || []);
      }

      // Fetch orders (RLS filters to customer's own via reservation email)
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number, table_number, status, subtotal, total, deposit_applied, payment_status, created_at')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
      } else if (ordersData) {
        // Fetch order items for each order
        const ordersWithItems: Order[] = await Promise.all(
          ordersData.map(async (order) => {
            const { data: items } = await supabase
              .from('order_items')
              .select('id, name, name_ar, quantity, price')
              .eq('order_id', order.id);
            
            return { ...order, items: items || [] };
          })
        );
        setOrders(ordersWithItems);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-AE', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getDepositStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending', className: 'bg-amber/20 text-amber' },
      paid: { label: 'Paid', className: 'bg-success/20 text-success' },
      refunded: { label: 'Refunded', className: 'bg-primary/20 text-primary' },
      applied: { label: 'Applied to Bill', className: 'bg-success/20 text-success' },
      forfeited: { label: 'Forfeited', className: 'bg-destructive/20 text-destructive' },
    };
    const { label, className } = config[status] || config.pending;
    return <span className={`text-xs px-2 py-1 rounded-full ${className}`}>{label}</span>;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </Link>

        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            My Orders & Reservations
          </h1>
          <p className="text-muted-foreground">
            Track your orders and view your reservation history
          </p>
        </div>

        {/* Reservations Section */}
        <div className="mb-8">
          <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            My Reservations
          </h2>
          
          {reservations.length === 0 ? (
            <div className="glass-card rounded-xl p-6 text-center">
              <p className="text-muted-foreground">No reservations found</p>
              <Link to="/reserve">
                <Button variant="gold" className="mt-4">Make a Reservation</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {reservations.map((res) => (
                <div key={res.id} className="glass-card rounded-xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-foreground">{res.reservation_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(res.reservation_date)} at {formatTime(res.reservation_time)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      res.status === 'confirmed' ? 'bg-success/20 text-success' :
                      res.status === 'arrived' ? 'bg-primary/20 text-primary' :
                      res.status === 'cancelled' ? 'bg-destructive/20 text-destructive' :
                      'bg-amber/20 text-amber'
                    }`}>
                      {res.status.charAt(0).toUpperCase() + res.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{res.guests} guests</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Deposit: {res.deposit_amount} AED</span>
                      {getDepositStatusBadge(res.deposit_status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Orders Section */}
        <div>
          <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            My Orders
          </h2>
          
          {orders.length === 0 ? (
            <div className="glass-card rounded-xl p-6 text-center">
              <p className="text-muted-foreground">No orders found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Orders placed during your reservation will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const statusInfo = statusConfig[order.status] || statusConfig.placed;
                const StatusIcon = statusInfo.icon;
                
                return (
                  <div key={order.id} className="glass-card rounded-xl p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-medium text-foreground">{order.order_number}</p>
                        <p className="text-sm text-muted-foreground">
                          Table {order.table_number} • {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className={`flex items-center gap-1 text-sm ${statusInfo.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        {statusInfo.label}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="border-t border-border pt-3 mb-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-1 text-sm">
                          <span className="text-foreground">
                            {item.quantity}x {language === 'ar' && item.name_ar ? item.name_ar : item.name}
                          </span>
                          <span className="text-muted-foreground">{item.price * item.quantity} AED</span>
                        </div>
                      ))}
                    </div>

                    {/* Order Totals */}
                    <div className="border-t border-border pt-3 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="text-foreground">{order.subtotal} AED</span>
                      </div>
                      {order.deposit_applied > 0 && (
                        <div className="flex justify-between text-sm text-success">
                          <span>Deposit Applied</span>
                          <span>-{order.deposit_applied} AED</span>
                        </div>
                      )}
                      <div className="flex justify-between font-medium">
                        <span className="text-foreground">Total</span>
                        <span className="gold-text">{order.total} AED</span>
                      </div>
                      <div className="flex justify-between text-sm pt-1">
                        <span className="text-muted-foreground">Payment</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          order.payment_status === 'paid' ? 'bg-success/20 text-success' :
                          order.payment_status === 'pending' ? 'bg-amber/20 text-amber' :
                          'bg-destructive/20 text-destructive'
                        }`}>
                          {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const MyOrdersPage = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <CartProvider>
          <Header />
          <MyOrdersContent />
        </CartProvider>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default MyOrdersPage;