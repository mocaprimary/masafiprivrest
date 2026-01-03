import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { toast } from 'sonner';
import {
  Package,
  Clock,
  Users,
  ChefHat,
  Check,
  AlertCircle,
  Calendar,
  RefreshCw,
  Bell,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  scheduled_for: string;
  created_at: string;
  preorder_notes: string | null;
  reservation_id: string;
  reservation?: {
    reservation_number: string;
    reservation_time: string;
    guests: number;
    table_id: string | null;
    private_details?: {
      full_name: string;
      phone: string;
    };
  };
  items: PreorderItem[];
}

export function PreordersPanel() {
  const [preorders, setPreorders] = useState<Preorder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'today' | 'tomorrow' | 'all'>('today');

  useEffect(() => {
    fetchPreorders();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('preorders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: 'is_preorder=eq.true' },
        () => fetchPreorders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPreorders = async () => {
    try {
      // Get preorders with order items
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id, order_number, status, subtotal, total, scheduled_for, 
          created_at, preorder_notes, reservation_id
        `)
        .eq('is_preorder', true)
        .not('scheduled_for', 'is', null)
        .order('scheduled_for', { ascending: true });

      if (ordersError) {
        console.error('Error fetching preorders:', ordersError);
        return;
      }

      // Fetch order items and reservation details for each preorder
      const enrichedPreorders = await Promise.all(
        (ordersData || []).map(async (order) => {
          // Get order items
          const { data: itemsData } = await supabase
            .from('order_items')
            .select('id, name, quantity, price')
            .eq('order_id', order.id);

          // Get reservation details
          let reservation = undefined;
          if (order.reservation_id) {
            const { data: resData } = await supabase
              .from('reservations')
              .select(`
                reservation_number, reservation_time, guests, table_id,
                reservation_private_details(full_name, phone)
              `)
              .eq('id', order.reservation_id)
              .single();

            if (resData) {
              reservation = {
                reservation_number: resData.reservation_number,
                reservation_time: resData.reservation_time,
                guests: resData.guests,
                table_id: resData.table_id,
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPreorders();
    setIsRefreshing(false);
    toast.success('Pre-orders refreshed');
  };

  const updatePreorderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`Pre-order marked as ${status}`);
      fetchPreorders();
    }
  };

  const getFilteredPreorders = () => {
    return preorders.filter((p) => {
      if (!p.scheduled_for) return false;
      const scheduledDate = parseISO(p.scheduled_for);
      
      if (filter === 'today') {
        return isToday(scheduledDate);
      } else if (filter === 'tomorrow') {
        return isTomorrow(scheduledDate);
      }
      return true;
    });
  };

  const filteredPreorders = getFilteredPreorders();
  const todayCount = preorders.filter(p => p.scheduled_for && isToday(parseISO(p.scheduled_for))).length;
  const pendingTodayCount = preorders.filter(
    p => p.scheduled_for && isToday(parseISO(p.scheduled_for)) && p.status === 'pending'
  ).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/20 text-amber-500';
      case 'preparing':
        return 'bg-blue-500/20 text-blue-500';
      case 'ready':
        return 'bg-green-500/20 text-green-500';
      case 'served':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-secondary text-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            Pre-Orders
          </h2>
          <p className="text-muted-foreground">Manage pre-orders for upcoming reservations</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Today's Alert Banner */}
      {pendingTodayCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30"
        >
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Bell className="w-5 h-5 text-amber-500 animate-pulse" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-500">
              {pendingTodayCount} Pre-Order{pendingTodayCount > 1 ? 's' : ''} Arriving Today!
            </p>
            <p className="text-sm text-muted-foreground">
              Start preparing these orders before guests arrive
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
            onClick={() => setFilter('today')}
          >
            View All
          </Button>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setFilter('today')}
          className={`p-4 rounded-xl border transition-all ${
            filter === 'today'
              ? 'bg-primary/10 border-primary/30 ring-2 ring-primary/20'
              : 'glass-card hover:bg-secondary/50'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Today</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{todayCount}</p>
        </button>

        <button
          onClick={() => setFilter('tomorrow')}
          className={`p-4 rounded-xl border transition-all ${
            filter === 'tomorrow'
              ? 'bg-primary/10 border-primary/30 ring-2 ring-primary/20'
              : 'glass-card hover:bg-secondary/50'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">Tomorrow</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {preorders.filter(p => p.scheduled_for && isTomorrow(parseISO(p.scheduled_for))).length}
          </p>
        </button>

        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-xl border transition-all ${
            filter === 'all'
              ? 'bg-primary/10 border-primary/30 ring-2 ring-primary/20'
              : 'glass-card hover:bg-secondary/50'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">All Upcoming</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{preorders.length}</p>
        </button>
      </div>

      {/* Pre-orders List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredPreorders.map((preorder, index) => (
            <motion.div
              key={preorder.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card rounded-xl p-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                {/* Order Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(preorder.status)}`}>
                      {preorder.status}
                    </span>
                    <span className="font-mono text-sm text-muted-foreground">
                      {preorder.order_number}
                    </span>
                    {preorder.scheduled_for && isToday(parseISO(preorder.scheduled_for)) && (
                      <span className="px-2 py-1 rounded-full text-xs bg-primary/20 text-primary font-medium">
                        TODAY
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-primary" />
                      {preorder.scheduled_for
                        ? format(parseISO(preorder.scheduled_for), 'MMM d, h:mm a')
                        : 'Not scheduled'}
                    </span>
                    {preorder.reservation && (
                      <>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-primary" />
                          {preorder.reservation.guests} guests
                        </span>
                        <span className="font-medium text-foreground">
                          {preorder.reservation.private_details?.full_name || 'Guest'}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Order Items */}
                  <div className="bg-secondary/30 rounded-lg p-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <ChefHat className="w-3 h-3" />
                      Order Items
                    </p>
                    {preorder.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-foreground">
                          <span className="font-medium text-primary">{item.quantity}x</span> {item.name}
                        </span>
                        <span className="text-muted-foreground">{item.price * item.quantity} AED</span>
                      </div>
                    ))}
                    <div className="border-t border-border pt-2 mt-2 flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="gold-text">{preorder.total} AED</span>
                    </div>
                  </div>

                  {preorder.preorder_notes && (
                    <div className="mt-3 p-2 rounded-lg bg-amber-500/10 text-sm text-amber-500">
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      {preorder.preorder_notes}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex lg:flex-col gap-2 lg:min-w-[120px]">
                  {preorder.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 lg:flex-none"
                      onClick={() => updatePreorderStatus(preorder.id, 'preparing')}
                    >
                      <ChefHat className="w-4 h-4 mr-1" />
                      Start Prep
                    </Button>
                  )}
                  {preorder.status === 'preparing' && (
                    <Button
                      size="sm"
                      variant="gold"
                      className="flex-1 lg:flex-none"
                      onClick={() => updatePreorderStatus(preorder.id, 'ready')}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Mark Ready
                    </Button>
                  )}
                  {preorder.status === 'ready' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 lg:flex-none border-green-500/50 text-green-500"
                      onClick={() => updatePreorderStatus(preorder.id, 'served')}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Mark Served
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredPreorders.length === 0 && (
          <div className="text-center py-12 glass-card rounded-xl">
            <Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">
              No pre-orders {filter === 'today' ? 'for today' : filter === 'tomorrow' ? 'for tomorrow' : 'found'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
