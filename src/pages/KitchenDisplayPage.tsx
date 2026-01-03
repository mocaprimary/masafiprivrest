import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { format, parseISO, isToday } from 'date-fns';
import { toast } from 'sonner';
import {
  ChefHat,
  Clock,
  Users,
  Check,
  RefreshCw,
  Utensils,
  ArrowLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

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
  scheduled_for: string;
  reservation?: {
    reservation_time: string;
    guests: number;
    private_details?: {
      full_name: string;
    };
  };
  items: PreorderItem[];
}

export default function KitchenDisplayPage() {
  const [preorders, setPreorders] = useState<Preorder[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchPreorders();

    // Auto-refresh every 30 seconds
    const refreshInterval = setInterval(fetchPreorders, 30000);

    // Update clock every second
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Real-time subscription
    const channel = supabase
      .channel('kitchen-preorders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: 'is_preorder=eq.true' },
        () => {
          fetchPreorders();
          // Play notification sound for new orders
          const audio = new Audio('/notification.mp3');
          audio.play().catch(() => {});
        }
      )
      .subscribe();

    return () => {
      clearInterval(refreshInterval);
      clearInterval(clockInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPreorders = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          id, order_number, status, scheduled_for, reservation_id
        `)
        .eq('is_preorder', true)
        .not('scheduled_for', 'is', null)
        .gte('scheduled_for', `${today}T00:00:00`)
        .lte('scheduled_for', `${today}T23:59:59`)
        .neq('status', 'served')
        .neq('status', 'cancelled')
        .order('scheduled_for', { ascending: true });

      if (error) {
        console.error('Error fetching preorders:', error);
        return;
      }

      const enrichedPreorders = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: itemsData } = await supabase
            .from('order_items')
            .select('id, name, quantity, price')
            .eq('order_id', order.id);

          let reservation = undefined;
          if (order.reservation_id) {
            const { data: resData } = await supabase
              .from('reservations')
              .select(`
                reservation_time, guests,
                reservation_private_details(full_name)
              `)
              .eq('id', order.reservation_id)
              .maybeSingle();

            if (resData) {
              reservation = {
                reservation_time: resData.reservation_time,
                guests: resData.guests,
                private_details: resData.reservation_private_details as any,
              };
            }
          }

          return {
            ...order,
            items: itemsData || [],
            reservation,
          };
        })
      );

      setPreorders(enrichedPreorders);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      toast.error('Failed to update');
    } else {
      fetchPreorders();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500 text-white';
      case 'preparing':
        return 'bg-blue-500 text-white';
      case 'ready':
        return 'bg-green-500 text-white';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getCardBorderColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'border-amber-500 shadow-amber-500/20';
      case 'preparing':
        return 'border-blue-500 shadow-blue-500/20';
      case 'ready':
        return 'border-green-500 shadow-green-500/20 animate-pulse';
      default:
        return 'border-border';
    }
  };

  const pendingOrders = preorders.filter(p => p.status === 'pending');
  const preparingOrders = preorders.filter(p => p.status === 'preparing');
  const readyOrders = preorders.filter(p => p.status === 'ready');

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <ChefHat className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Kitchen Display</h1>
              <p className="text-white/60 text-sm">Pre-Orders for Today</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-4xl md:text-5xl font-mono font-bold text-primary">
              {format(currentTime, 'HH:mm')}
            </p>
            <p className="text-white/60">{format(currentTime, 'EEEE, MMM d')}</p>
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={fetchPreorders}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4 text-center">
          <p className="text-5xl font-bold text-amber-500">{pendingOrders.length}</p>
          <p className="text-amber-500/80 font-medium">Pending</p>
        </div>
        <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4 text-center">
          <p className="text-5xl font-bold text-blue-500">{preparingOrders.length}</p>
          <p className="text-blue-500/80 font-medium">Preparing</p>
        </div>
        <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 text-center">
          <p className="text-5xl font-bold text-green-500">{readyOrders.length}</p>
          <p className="text-green-500/80 font-medium">Ready</p>
        </div>
      </div>

      {/* Orders Grid */}
      {preorders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Utensils className="w-24 h-24 text-white/20 mb-4" />
          <p className="text-2xl text-white/40">No pre-orders for today</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {preorders.map((order) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, x: 100 }}
                className={`rounded-2xl border-2 bg-white/5 backdrop-blur overflow-hidden shadow-lg ${getCardBorderColor(order.status)}`}
              >
                {/* Card Header */}
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-3 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className="text-lg font-mono text-white/60">
                      {order.order_number.split('-').pop()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xl">
                      <Clock className="w-5 h-5 text-primary" />
                      <span className="font-bold">
                        {order.reservation?.reservation_time || 
                          (order.scheduled_for && format(parseISO(order.scheduled_for), 'HH:mm'))}
                      </span>
                    </div>
                    {order.reservation && (
                      <div className="flex items-center gap-2 text-white/70">
                        <Users className="w-5 h-5" />
                        <span className="font-medium">{order.reservation.guests}</span>
                      </div>
                    )}
                  </div>
                  
                  {order.reservation?.private_details?.full_name && (
                    <p className="text-lg text-white/80 mt-1 truncate">
                      {order.reservation.private_details.full_name}
                    </p>
                  )}
                </div>

                {/* Order Items */}
                <div className="p-4 space-y-2 max-h-48 overflow-y-auto">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
                        {item.quantity}
                      </span>
                      <span className="text-lg text-white/90 leading-tight">
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <div className="p-4 border-t border-white/10">
                  {order.status === 'pending' && (
                    <Button
                      size="lg"
                      className="w-full text-lg font-bold bg-blue-500 hover:bg-blue-600"
                      onClick={() => updateStatus(order.id, 'preparing')}
                    >
                      <ChefHat className="w-5 h-5 mr-2" />
                      Start Preparing
                    </Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button
                      size="lg"
                      className="w-full text-lg font-bold bg-green-500 hover:bg-green-600"
                      onClick={() => updateStatus(order.id, 'ready')}
                    >
                      <Check className="w-5 h-5 mr-2" />
                      Mark Ready
                    </Button>
                  )}
                  {order.status === 'ready' && (
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full text-lg font-bold border-green-500 text-green-500 hover:bg-green-500/10"
                      onClick={() => updateStatus(order.id, 'served')}
                    >
                      <Check className="w-5 h-5 mr-2" />
                      Served
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
