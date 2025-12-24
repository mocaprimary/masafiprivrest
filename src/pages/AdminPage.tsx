import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, AuthProvider } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Calendar, 
  ShoppingBag, 
  Users, 
  Settings,
  LogOut,
  Plus,
  Search,
  Check,
  X,
  Clock,
  DollarSign,
  ChefHat,
  UserCheck
} from 'lucide-react';

type Tab = 'dashboard' | 'menu' | 'reservations' | 'orders' | 'users' | 'settings';

interface Reservation {
  id: string;
  reservation_number: string;
  full_name: string;
  phone: string;
  email: string | null;
  guests: number;
  reservation_date: string;
  reservation_time: string;
  status: string;
  deposit_status: string;
  deposit_amount: number;
}

interface Order {
  id: string;
  order_number: string;
  table_number: number;
  status: string;
  subtotal: number;
  total: number;
  payment_status: string;
  created_at: string;
}

interface UserWithRole {
  id: string;
  full_name: string | null;
  created_at: string;
  roles: string[];
}

function AdminContent() {
  const { user, isAdmin, isStaff, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && isStaff) {
      fetchReservations();
      fetchOrders();
      if (isAdmin) {
        fetchUsers();
      }
    }
  }, [user, isStaff, isAdmin]);

  // Real-time orders subscription
  useEffect(() => {
    if (!user || !isStaff) return;

    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isStaff]);

  const fetchReservations = async () => {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('reservation_date', { ascending: true })
      .order('reservation_time', { ascending: true });
    
    if (!error && data) {
      setReservations(data);
    }
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setOrders(data);
    }
  };

  const fetchUsers = async () => {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, created_at');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return;
    }

    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
    }

    const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => ({
      id: profile.id,
      full_name: profile.full_name,
      created_at: profile.created_at,
      roles: rolesData?.filter(r => r.user_id === profile.id).map(r => r.role) || []
    }));

    setUsers(usersWithRoles);
  };

  const updateReservationStatus = async (id: string, status: string) => {
    const updateData: Record<string, unknown> = { status };
    if (status === 'arrived') {
      updateData.checked_in_at = new Date().toISOString();
      updateData.checked_in_by = user?.id;
    }

    const { error } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update reservation');
    } else {
      toast.success('Reservation updated');
      fetchReservations();
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update order');
    } else {
      toast.success('Order status updated');
    }
  };

  const assignRole = async (userId: string, role: 'admin' | 'staff') => {
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role });

    if (error) {
      if (error.code === '23505') {
        toast.error('User already has this role');
      } else {
        toast.error('Failed to assign role');
      }
    } else {
      toast.success(`${role} role assigned`);
      fetchUsers();
    }
  };

  const removeRole = async (userId: string, role: 'admin' | 'staff') => {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role as 'admin' | 'staff');

    if (error) {
      toast.error('Failed to remove role');
    } else {
      toast.success('Role removed');
      fetchUsers();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">You don't have permission to access the admin panel.</p>
          <Button variant="gold" onClick={handleSignOut}>Sign Out</Button>
        </div>
      </div>
    );
  }

  const stats = {
    todayReservations: reservations.filter(r => r.reservation_date === new Date().toISOString().split('T')[0]).length,
    pendingOrders: orders.filter(o => ['placed', 'preparing'].includes(o.status)).length,
    totalRevenue: orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + Number(o.total), 0),
    arrivedToday: reservations.filter(r => r.status === 'arrived' && r.reservation_date === new Date().toISOString().split('T')[0]).length,
  };

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'reservations' as Tab, label: 'Reservations', icon: Calendar },
    { id: 'orders' as Tab, label: 'Orders', icon: ShoppingBag },
    ...(isAdmin ? [
      { id: 'menu' as Tab, label: 'Menu', icon: UtensilsCrossed },
      { id: 'users' as Tab, label: 'Users', icon: Users },
      { id: 'settings' as Tab, label: 'Settings', icon: Settings },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border p-4 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center">
            <span className="font-display text-lg font-bold text-primary-foreground">O</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-foreground">The Oasis</h1>
            <p className="text-xs text-muted-foreground">{isAdmin ? 'Admin' : 'Staff'} Panel</p>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {activeTab === 'dashboard' && (
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.todayReservations}</p>
                    <p className="text-sm text-muted-foreground">Today's Reservations</p>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.pendingOrders}</p>
                    <p className="text-sm text-muted-foreground">Pending Orders</p>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalRevenue} AED</p>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.arrivedToday}</p>
                    <p className="text-sm text-muted-foreground">Checked In Today</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4">Recent Orders</h3>
              {orders.length === 0 ? (
                <p className="text-muted-foreground">No orders yet</p>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{order.order_number}</p>
                        <p className="text-sm text-muted-foreground">Table {order.table_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground">{order.total} AED</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          order.status === 'ready' ? 'bg-success/20 text-success' :
                          order.status === 'preparing' ? 'bg-amber/20 text-amber' :
                          'bg-primary/20 text-primary'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reservations' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold text-foreground">Reservations</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search reservations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 input-field w-64"
                />
              </div>
            </div>

            <div className="glass-card rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Reservation</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Guest</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date & Time</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Deposit</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations
                    .filter(r => 
                      r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      r.reservation_number.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((reservation) => (
                    <tr key={reservation.id} className="border-t border-border">
                      <td className="p-4">
                        <p className="font-medium text-foreground">{reservation.reservation_number}</p>
                        <p className="text-sm text-muted-foreground">{reservation.guests} guests</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-foreground">{reservation.full_name}</p>
                        <p className="text-sm text-muted-foreground">{reservation.phone}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-foreground">{reservation.reservation_date}</p>
                        <p className="text-sm text-muted-foreground">{reservation.reservation_time}</p>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          reservation.status === 'arrived' ? 'bg-success/20 text-success' :
                          reservation.status === 'confirmed' ? 'bg-primary/20 text-primary' :
                          reservation.status === 'cancelled' ? 'bg-destructive/20 text-destructive' :
                          'bg-amber/20 text-amber'
                        }`}>
                          {reservation.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-foreground">{reservation.deposit_amount} AED</p>
                        <span className={`text-xs ${
                          reservation.deposit_status === 'paid' ? 'text-success' :
                          reservation.deposit_status === 'refunded' ? 'text-primary' :
                          'text-muted-foreground'
                        }`}>
                          {reservation.deposit_status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {reservation.status === 'confirmed' && (
                          <Button
                            size="sm"
                            variant="gold"
                            onClick={() => updateReservationStatus(reservation.id, 'arrived')}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Check In
                          </Button>
                        )}
                        {reservation.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateReservationStatus(reservation.id, 'confirmed')}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => updateReservationStatus(reservation.id, 'cancelled')}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {reservations.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No reservations found
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">Kitchen Orders</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['placed', 'preparing', 'ready'].map((status) => (
                <div key={status} className="glass-card rounded-xl p-4">
                  <h3 className="font-semibold text-foreground mb-4 capitalize flex items-center gap-2">
                    {status === 'placed' && <ShoppingBag className="w-5 h-5 text-primary" />}
                    {status === 'preparing' && <ChefHat className="w-5 h-5 text-amber" />}
                    {status === 'ready' && <Check className="w-5 h-5 text-success" />}
                    {status}
                    <span className="ml-auto text-sm text-muted-foreground">
                      {orders.filter(o => o.status === status).length}
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {orders
                      .filter((o) => o.status === status)
                      .map((order) => (
                        <div key={order.id} className="bg-secondary/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-foreground">{order.order_number}</p>
                            <span className="text-sm text-muted-foreground">Table {order.table_number}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{order.total} AED</p>
                          {status !== 'ready' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => updateOrderStatus(
                                order.id,
                                status === 'placed' ? 'preparing' : 'ready'
                              )}
                            >
                              {status === 'placed' ? 'Start Preparing' : 'Mark Ready'}
                            </Button>
                          )}
                          {status === 'ready' && (
                            <Button
                              size="sm"
                              variant="gold"
                              className="w-full"
                              onClick={() => updateOrderStatus(order.id, 'served')}
                            >
                              Mark Served
                            </Button>
                          )}
                        </div>
                      ))}
                    {orders.filter((o) => o.status === status).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No orders
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && isAdmin && (
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">User Management</h2>

            <div className="glass-card rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Roles</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Joined</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-border">
                      <td className="p-4">
                        <p className="font-medium text-foreground">{u.full_name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{u.id.slice(0, 8)}...</p>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {u.roles.length === 0 ? (
                            <span className="text-sm text-muted-foreground">No roles</span>
                          ) : (
                            u.roles.map((role) => (
                              <span
                                key={role}
                                className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                                  role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-secondary text-foreground'
                                }`}
                              >
                                {role}
                                <button
                                  onClick={() => removeRole(u.id, role as 'admin' | 'staff')}
                                  className="hover:text-destructive"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {!u.roles.includes('staff') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => assignRole(u.id, 'staff')}
                          >
                            Make Staff
                          </Button>
                        )}
                        {!u.roles.includes('admin') && (
                          <Button
                            size="sm"
                            variant="gold"
                            onClick={() => assignRole(u.id, 'admin')}
                          >
                            Make Admin
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No users found
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'menu' && isAdmin && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold text-foreground">Menu Management</h2>
              <Button variant="gold">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
            <div className="glass-card rounded-xl p-8 text-center">
              <p className="text-muted-foreground">Menu management coming soon</p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && isAdmin && (
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">Settings</h2>
            <div className="glass-card rounded-xl p-8 text-center">
              <p className="text-muted-foreground">Settings coming soon</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AuthProvider>
      <AdminContent />
    </AuthProvider>
  );
}
