import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, AuthProvider } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { AdminMenuManagement } from '@/components/admin/AdminMenuManagement';
import { WeeklyCalendar } from '@/components/admin/WeeklyCalendar';
import { TableManagement } from '@/components/admin/TableManagement';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Calendar, 
  ShoppingBag, 
  Users, 
  Settings,
  LogOut,
  Search,
  Check,
  X,
  Clock,
  DollarSign,
  ChefHat,
  UserCheck,
  Eye,
  Phone,
  Mail,
  CalendarDays,
  Filter,
  ScanLine,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  UserPlus,
  Shield,
  Briefcase,
  LayoutGrid
} from 'lucide-react';

type Tab = 'dashboard' | 'menu' | 'reservations' | 'orders' | 'users' | 'settings' | 'checkin' | 'tables';
type ReservationStatusFilter = 'all' | 'pending' | 'confirmed' | 'arrived' | 'cancelled';
type AppRole = 'admin' | 'manager' | 'staff';

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
  special_requests: string | null;
  created_at: string;
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
  const { user, isAdmin, isManager, isStaff, loading, signOut, roles } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReservationStatusFilter>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // Real-time subscriptions
  useEffect(() => {
    if (!user || !isStaff) return;

    const ordersChannel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchOrders()
      )
      .subscribe();

    const reservationsChannel = supabase
      .channel('reservations-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservations' },
        () => fetchReservations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(reservationsChannel);
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchReservations(), fetchOrders()]);
    setIsRefreshing(false);
    toast.success('Data refreshed');
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
      if (selectedReservation?.id === id) {
        setSelectedReservation(prev => prev ? { ...prev, status } : null);
      }
    }
  };

  const updateDepositStatus = async (id: string, depositStatus: string) => {
    const { error } = await supabase
      .from('reservations')
      .update({ deposit_status: depositStatus })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update deposit status');
    } else {
      toast.success('Deposit status updated');
      fetchReservations();
      if (selectedReservation?.id === id) {
        setSelectedReservation(prev => prev ? { ...prev, deposit_status: depositStatus } : null);
      }
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

  const assignRole = async (userId: string, role: AppRole) => {
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

  const removeRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role);

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

  const filteredReservations = reservations.filter(r => {
    const matchesSearch = 
      r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reservation_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesDate = !dateFilter || r.reservation_date === dateFilter;
    return matchesSearch && matchesStatus && matchesDate;
  });

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

  const today = new Date().toISOString().split('T')[0];
  const todayReservations = reservations.filter(r => r.reservation_date === today);
  const upcomingReservations = reservations.filter(r => r.reservation_date >= today && r.status !== 'cancelled');
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];
  const thisWeekReservations = reservations.filter(r => r.reservation_date >= today && r.reservation_date <= nextWeekStr && r.status !== 'cancelled');
  
  const stats = {
    totalReservations: reservations.length,
    upcomingReservations: upcomingReservations.length,
    upcomingGuests: upcomingReservations.reduce((sum, r) => sum + r.guests, 0),
    todayReservations: todayReservations.length,
    todayGuests: todayReservations.reduce((sum, r) => sum + r.guests, 0),
    pendingReservations: reservations.filter(r => r.status === 'pending').length,
    confirmedReservations: reservations.filter(r => r.status === 'confirmed').length,
    arrivedReservations: reservations.filter(r => r.status === 'arrived').length,
    pendingOrders: orders.filter(o => ['placed', 'preparing'].includes(o.status)).length,
    totalRevenue: orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + Number(o.total), 0),
    arrivedToday: todayReservations.filter(r => r.status === 'arrived').length,
    confirmedToday: todayReservations.filter(r => r.status === 'confirmed').length,
    activeOrders: orders.filter(o => !['served', 'cancelled'].includes(o.status)).length,
    thisWeekGuests: thisWeekReservations.reduce((sum, r) => sum + r.guests, 0),
  };

  const getRoleLabel = () => {
    if (isAdmin) return 'Admin';
    if (isManager) return 'Manager';
    return 'Staff';
  };

  const getRoleIcon = () => {
    if (isAdmin) return Shield;
    if (isManager) return Briefcase;
    return UserCheck;
  };

  const RoleIcon = getRoleIcon();

  // Define tabs based on role
  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutDashboard, roles: ['staff', 'manager', 'admin'] },
    { id: 'reservations' as Tab, label: 'Reservations', icon: Calendar, roles: ['staff', 'manager', 'admin'] },
    { id: 'orders' as Tab, label: 'Orders', icon: ShoppingBag, roles: ['staff', 'manager', 'admin'] },
    { id: 'checkin' as Tab, label: 'Check-In', icon: ScanLine, roles: ['staff', 'manager', 'admin'] },
    { id: 'tables' as Tab, label: 'Tables', icon: LayoutGrid, roles: ['manager', 'admin'] },
    { id: 'menu' as Tab, label: 'Menu', icon: UtensilsCrossed, roles: ['manager', 'admin'] },
    { id: 'users' as Tab, label: 'Users', icon: Users, roles: ['admin'] },
    { id: 'settings' as Tab, label: 'Settings', icon: Settings, roles: ['admin'] },
  ].filter(tab => {
    if (isAdmin) return true;
    if (isManager) return tab.roles.includes('manager');
    return tab.roles.includes('staff');
  });

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
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <RoleIcon className="w-3 h-3" />
              {getRoleLabel()} Panel
            </div>
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

        <div className="pt-4 border-t border-border space-y-2">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors w-full">
            <Eye className="w-5 h-5" />
            View Restaurant
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-destructive transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-3xl font-bold text-foreground">Dashboard</h2>
                <p className="text-muted-foreground">Overview of your restaurant operations</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            
            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 p-6">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm font-medium">Total Reservations</span>
                  </div>
                  <p className="text-4xl font-bold text-foreground">{stats.totalReservations}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats.upcomingReservations} upcoming
                  </p>
                </div>
                <Calendar className="absolute -right-4 -bottom-4 w-24 h-24 text-primary/10" />
              </div>

              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/20 p-6">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-green-500 mb-2">
                    <UserCheck className="w-5 h-5" />
                    <span className="text-sm font-medium">Guests Expected</span>
                  </div>
                  <p className="text-4xl font-bold text-foreground">{stats.upcomingGuests}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats.thisWeekGuests} this week
                  </p>
                </div>
                <Users className="absolute -right-4 -bottom-4 w-24 h-24 text-green-500/10" />
              </div>

              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20 p-6">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-amber-500 mb-2">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm font-medium">Pending Actions</span>
                  </div>
                  <p className="text-4xl font-bold text-foreground">{stats.pendingReservations}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    reservations to confirm
                  </p>
                </div>
                <AlertCircle className="absolute -right-4 -bottom-4 w-24 h-24 text-amber-500/10" />
              </div>

              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20 p-6">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-blue-500 mb-2">
                    <ChefHat className="w-5 h-5" />
                    <span className="text-sm font-medium">Active Orders</span>
                  </div>
                  <p className="text-4xl font-bold text-foreground">{stats.activeOrders}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats.pendingOrders} in kitchen
                  </p>
                </div>
                <ShoppingBag className="absolute -right-4 -bottom-4 w-24 h-24 text-blue-500/10" />
              </div>
            </div>

            {/* Status Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="glass-card rounded-xl p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.pendingReservations}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Pending</p>
              </div>
              <div className="glass-card rounded-xl p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.confirmedReservations}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Confirmed</p>
              </div>
              <div className="glass-card rounded-xl p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-green-500/20 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.arrivedReservations}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Arrived</p>
              </div>
              <div className="glass-card rounded-xl p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.totalRevenue}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Revenue (AED)</p>
              </div>
            </div>

            {/* Alerts Section */}
            {stats.pendingReservations > 0 && (
              <div className="rounded-xl p-4 border border-amber-500/30 bg-amber-500/10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Action Required</p>
                  <p className="text-sm text-muted-foreground">
                    You have {stats.pendingReservations} pending reservation{stats.pendingReservations > 1 ? 's' : ''} awaiting confirmation
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                  onClick={() => {
                    setActiveTab('reservations');
                    setStatusFilter('pending');
                  }}
                >
                  Review Now
                </Button>
              </div>
            )}

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Reservations */}
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/30">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Upcoming Reservations
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('reservations')}>
                    View All
                  </Button>
                </div>
                <div className="p-4">
                  {upcomingReservations.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground">No upcoming reservations</p>
                      <p className="text-sm text-muted-foreground/70">New bookings will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingReservations.slice(0, 6).map((res) => (
                        <div key={res.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">{res.guests}</span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{res.full_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(res.reservation_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {res.reservation_time}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                              res.status === 'arrived' ? 'bg-green-500/20 text-green-500' :
                              res.status === 'confirmed' ? 'bg-primary/20 text-primary' :
                              res.status === 'cancelled' ? 'bg-destructive/20 text-destructive' :
                              'bg-amber-500/20 text-amber-500'
                            }`}>
                              {res.status}
                            </span>
                            {res.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-green-500 hover:bg-green-500/10"
                                onClick={() => updateReservationStatus(res.id, 'confirmed')}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Active Orders / Quick Actions */}
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/30">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <ChefHat className="w-4 h-4 text-amber-500" />
                    Active Orders
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('orders')}>
                    View Kitchen
                  </Button>
                </div>
                <div className="p-4">
                  {orders.filter(o => !['served', 'cancelled'].includes(o.status)).length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground">No active orders</p>
                      <p className="text-sm text-muted-foreground/70">Orders will appear here when placed</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders
                        .filter(o => !['served', 'cancelled'].includes(o.status))
                        .slice(0, 6)
                        .map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                            <div>
                              <p className="font-medium text-foreground">{order.order_number}</p>
                              <p className="text-sm text-muted-foreground">Table {order.table_number} • {order.total} AED</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                order.status === 'ready' ? 'bg-green-500/20 text-green-500' :
                                order.status === 'preparing' ? 'bg-amber-500/20 text-amber-500' :
                                'bg-primary/20 text-primary'
                              }`}>
                                {order.status}
                              </span>
                              {order.status !== 'ready' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 px-3"
                                  onClick={() => updateOrderStatus(
                                    order.id,
                                    order.status === 'placed' ? 'preparing' : 'ready'
                                  )}
                                >
                                  {order.status === 'placed' ? 'Start' : 'Ready'}
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Weekly Calendar */}
            <WeeklyCalendar 
              reservations={reservations} 
              onReservationClick={(res) => {
                setSelectedReservation(res as Reservation);
                setShowReservationModal(true);
              }}
            />

            {/* Quick Actions */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => setActiveTab('checkin')}
                >
                  <ScanLine className="w-6 h-6 text-primary" />
                  <span>Check-In Guest</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => setActiveTab('reservations')}
                >
                  <Calendar className="w-6 h-6 text-green-500" />
                  <span>View Reservations</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => setActiveTab('orders')}
                >
                  <ShoppingBag className="w-6 h-6 text-amber-500" />
                  <span>Manage Orders</span>
                </Button>
                {(isManager || isAdmin) && (
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col gap-2"
                    onClick={() => setActiveTab('menu')}
                  >
                    <UtensilsCrossed className="w-6 h-6 text-blue-500" />
                    <span>Edit Menu</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Check-In Tab */}
        {activeTab === 'checkin' && (
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full gold-gradient flex items-center justify-center">
                <ScanLine className="w-10 h-10 text-primary-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">Quick Check-In</h2>
              <p className="text-muted-foreground">Verify guest reservations by number</p>
            </div>

            <div className="glass-card rounded-xl p-6">
              <CheckInWidget onCheckin={() => fetchReservations()} />
            </div>

            {/* Today's Awaiting Check-ins */}
            <div className="mt-8">
              <h3 className="font-semibold text-foreground mb-4">Awaiting Check-in Today</h3>
              <div className="space-y-2">
                {todayReservations
                  .filter(r => r.status === 'confirmed')
                  .map(res => (
                    <div key={res.id} className="glass-card rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{res.full_name}</p>
                        <p className="text-sm text-muted-foreground">{res.reservation_time} • {res.guests} guests</p>
                      </div>
                      <Button
                        size="sm"
                        variant="gold"
                        onClick={() => updateReservationStatus(res.id, 'arrived')}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Check In
                      </Button>
                    </div>
                  ))}
                {todayReservations.filter(r => r.status === 'confirmed').length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No guests awaiting check-in</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tables Tab */}
        {activeTab === 'tables' && (
          <TableManagement />
        )}

        {/* Reservations Tab */}
        {activeTab === 'reservations' && (
          <div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <h2 className="font-display text-2xl font-bold text-foreground">Reservations</h2>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 input-field w-48"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ReservationStatusFilter)}>
                  <SelectTrigger className="w-36">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="arrived">Arrived</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="input-field w-40"
                />
                {dateFilter && (
                  <Button variant="ghost" size="sm" onClick={() => setDateFilter('')}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {(['pending', 'confirmed', 'arrived', 'cancelled'] as const).map((status) => {
                const count = reservations.filter(r => r.status === status).length;
                const colors = {
                  pending: 'border-amber-500/30 bg-amber-500/5 text-amber-500',
                  confirmed: 'border-primary/30 bg-primary/5 text-primary',
                  arrived: 'border-green-500/30 bg-green-500/5 text-green-500',
                  cancelled: 'border-destructive/30 bg-destructive/5 text-destructive',
                };
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
                    className={`p-4 rounded-xl border transition-all ${
                      statusFilter === status ? colors[status] + ' ring-2 ring-offset-2' : 'glass-card hover:bg-secondary/50'
                    }`}
                  >
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm capitalize">{status}</p>
                  </button>
                );
              })}
            </div>

            {/* Reservations Table */}
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
                  {filteredReservations.map((reservation) => (
                    <tr key={reservation.id} className="border-t border-border hover:bg-secondary/30 transition-colors">
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
                          reservation.status === 'arrived' ? 'bg-green-500/20 text-green-500' :
                          reservation.status === 'confirmed' ? 'bg-primary/20 text-primary' :
                          reservation.status === 'cancelled' ? 'bg-destructive/20 text-destructive' :
                          'bg-amber-500/20 text-amber-500'
                        }`}>
                          {reservation.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-foreground">{reservation.deposit_amount} AED</p>
                        <span className={`text-xs ${
                          reservation.deposit_status === 'paid' ? 'text-green-500' :
                          reservation.deposit_status === 'refunded' ? 'text-primary' :
                          'text-muted-foreground'
                        }`}>
                          {reservation.deposit_status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedReservation(reservation);
                              setShowReservationModal(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
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
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredReservations.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No reservations found
                </div>
              )}
            </div>

            {/* Reservation Detail Modal */}
            <Dialog open={showReservationModal} onOpenChange={setShowReservationModal}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Reservation Details
                  </DialogTitle>
                </DialogHeader>
                {selectedReservation && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Reservation #</p>
                        <p className="font-bold text-lg">{selectedReservation.reservation_number}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedReservation.status === 'arrived' ? 'bg-green-500/20 text-green-500' :
                        selectedReservation.status === 'confirmed' ? 'bg-primary/20 text-primary' :
                        selectedReservation.status === 'cancelled' ? 'bg-destructive/20 text-destructive' :
                        'bg-amber-500/20 text-amber-500'
                      }`}>
                        {selectedReservation.status}
                      </span>
                    </div>

                    <div className="glass-card rounded-lg p-4 space-y-3">
                      <h4 className="font-semibold text-foreground">Guest Information</h4>
                      <div className="grid gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{selectedReservation.full_name}</span>
                          <span className="text-muted-foreground">({selectedReservation.guests} guests)</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <a href={`tel:${selectedReservation.phone}`} className="text-primary hover:underline">
                            {selectedReservation.phone}
                          </a>
                        </div>
                        {selectedReservation.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <a href={`mailto:${selectedReservation.email}`} className="text-primary hover:underline">
                              {selectedReservation.email}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="glass-card rounded-lg p-4 space-y-3">
                      <h4 className="font-semibold text-foreground">Date & Time</h4>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarDays className="w-4 h-4 text-muted-foreground" />
                          <span>{selectedReservation.reservation_date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{selectedReservation.reservation_time}</span>
                        </div>
                      </div>
                    </div>

                    {selectedReservation.special_requests && (
                      <div className="glass-card rounded-lg p-4 space-y-2">
                        <h4 className="font-semibold text-foreground">Special Requests</h4>
                        <p className="text-sm text-muted-foreground">{selectedReservation.special_requests}</p>
                      </div>
                    )}

                    <div className="glass-card rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-foreground">Deposit</h4>
                        <span className="font-bold text-lg">{selectedReservation.deposit_amount} AED</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <Select 
                          value={selectedReservation.deposit_status} 
                          onValueChange={(v) => updateDepositStatus(selectedReservation.id, v)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="refunded">Refunded</SelectItem>
                            <SelectItem value="forfeited">Forfeited</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      {selectedReservation.status === 'pending' && (
                        <>
                          <Button 
                            variant="gold" 
                            className="flex-1"
                            onClick={() => {
                              updateReservationStatus(selectedReservation.id, 'confirmed');
                              setShowReservationModal(false);
                            }}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Confirm
                          </Button>
                          <Button 
                            variant="outline" 
                            className="text-destructive"
                            onClick={() => {
                              updateReservationStatus(selectedReservation.id, 'cancelled');
                              setShowReservationModal(false);
                            }}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </>
                      )}
                      {selectedReservation.status === 'confirmed' && (
                        <Button 
                          variant="gold" 
                          className="flex-1"
                          onClick={() => {
                            updateReservationStatus(selectedReservation.id, 'arrived');
                            setShowReservationModal(false);
                          }}
                        >
                          <UserCheck className="w-4 h-4 mr-2" />
                          Check In Guest
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">Kitchen Orders</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['placed', 'preparing', 'ready'].map((status) => (
                <div key={status} className="glass-card rounded-xl p-4">
                  <h3 className="font-semibold text-foreground mb-4 capitalize flex items-center gap-2">
                    {status === 'placed' && <ShoppingBag className="w-5 h-5 text-primary" />}
                    {status === 'preparing' && <ChefHat className="w-5 h-5 text-amber-500" />}
                    {status === 'ready' && <Check className="w-5 h-5 text-green-500" />}
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

        {/* Menu Tab (Manager + Admin) */}
        {activeTab === 'menu' && isManager && (
          <AdminMenuManagement />
        )}

        {/* Users Tab (Admin Only) */}
        {activeTab === 'users' && isAdmin && (
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">User Management</h2>

            <div className="glass-card rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Joined</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Roles</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-border hover:bg-secondary/30">
                      <td className="p-4">
                        <p className="font-medium text-foreground">{u.full_name || 'No name'}</p>
                        <p className="text-xs text-muted-foreground font-mono">{u.id.slice(0, 8)}...</p>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.length === 0 && (
                            <span className="text-xs text-muted-foreground">Customer</span>
                          )}
                          {u.roles.map(role => (
                            <span 
                              key={role}
                              className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                                role === 'admin' ? 'bg-destructive/20 text-destructive' :
                                role === 'manager' ? 'bg-primary/20 text-primary' :
                                'bg-amber-500/20 text-amber-500'
                              }`}
                            >
                              {role}
                              <button
                                onClick={() => removeRole(u.id, role as AppRole)}
                                className="hover:opacity-70"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!u.roles.includes('staff') && (
                            <Button size="sm" variant="outline" onClick={() => assignRole(u.id, 'staff')}>
                              <UserPlus className="w-4 h-4 mr-1" />
                              Staff
                            </Button>
                          )}
                          {!u.roles.includes('manager') && (
                            <Button size="sm" variant="outline" onClick={() => assignRole(u.id, 'manager')}>
                              <Briefcase className="w-4 h-4 mr-1" />
                              Manager
                            </Button>
                          )}
                          {!u.roles.includes('admin') && (
                            <Button size="sm" variant="outline" onClick={() => assignRole(u.id, 'admin')}>
                              <Shield className="w-4 h-4 mr-1" />
                              Admin
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab (Admin Only) */}
        {activeTab === 'settings' && isAdmin && (
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">Settings</h2>
            <div className="glass-card rounded-xl p-6">
              <p className="text-muted-foreground">Restaurant settings coming soon...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Check-In Widget Component
function CheckInWidget({ onCheckin }: { onCheckin: () => void }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; guest?: string } | null>(null);

  const handleVerify = async () => {
    if (!code.trim()) {
      toast.error('Please enter a reservation number');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('validate-qr', {
        body: { reservationNumber: code.trim().toUpperCase() }
      });

      if (error) throw new Error(error.message);

      if (data.success) {
        setResult({ 
          success: true, 
          message: 'Guest checked in successfully!',
          guest: data.reservation?.full_name 
        });
        toast.success('Guest checked in!');
        onCheckin();
        setCode('');
      } else {
        setResult({ success: false, message: data.error || 'Verification failed' });
      }
    } catch (err) {
      setResult({ success: false, message: err instanceof Error ? err.message : 'Failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Enter reservation number (e.g., RES-20241227-1234)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="input-field"
          onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
        />
        <Button variant="gold" onClick={handleVerify} disabled={loading}>
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </Button>
      </div>
      
      {result && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          result.success ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'
        }`}>
          {result.success ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          <div>
            <p className="font-medium">{result.message}</p>
            {result.guest && <p className="text-sm opacity-80">Welcome, {result.guest}!</p>}
          </div>
        </div>
      )}
    </div>
  );
}

const AdminPage = () => {
  return (
    <AuthProvider>
      <AdminContent />
    </AuthProvider>
  );
};

export default AdminPage;
