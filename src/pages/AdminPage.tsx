import { useState } from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { CartProvider } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  CalendarDays, 
  CreditCard, 
  Settings, 
  BarChart3, 
  Users, 
  LogOut,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

type Tab = 'dashboard' | 'menu' | 'reservations' | 'orders' | 'payments' | 'settings';

function AdminContent() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
    { id: 'reservations', label: 'Reservations', icon: CalendarDays },
    { id: 'orders', label: 'Orders', icon: Clock },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const stats = [
    { label: 'Today\'s Reservations', value: '24', change: '+12%', icon: CalendarDays },
    { label: 'Active Orders', value: '8', change: '+5%', icon: Clock },
    { label: 'Deposits Collected', value: '2,400 AED', change: '+18%', icon: CreditCard },
    { label: 'Revenue Today', value: '12,450 AED', change: '+8%', icon: BarChart3 },
  ];

  const recentReservations = [
    { id: 'OAS-2024-1234', name: 'John Doe', guests: 4, time: '7:00 PM', status: 'confirmed' },
    { id: 'OAS-2024-1235', name: 'Sarah Smith', guests: 2, time: '7:30 PM', status: 'arrived' },
    { id: 'OAS-2024-1236', name: 'Ahmed Hassan', guests: 6, time: '8:00 PM', status: 'pending' },
    { id: 'OAS-2024-1237', name: 'Maria Garcia', guests: 3, time: '8:30 PM', status: 'confirmed' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-success/20 text-success';
      case 'arrived': return 'bg-primary/20 text-primary';
      case 'pending': return 'bg-amber/20 text-amber';
      case 'cancelled': return 'bg-destructive/20 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-card border-r border-border transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-display text-xl font-bold">O</span>
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-display text-lg font-semibold text-foreground">The Oasis</h1>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id as Tab)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-border">
          <Link to="/">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">Exit Admin</span>}
            </button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="font-display text-xl font-semibold text-foreground capitalize">
              {activeTab}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-9 w-64 input-field" />
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
          </div>
        </header>

        <div className="p-6">
          {activeTab === 'dashboard' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, index) => (
                  <div key={index} className="glass-card rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <stat.icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-xs font-medium text-success">{stat.change}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Recent Reservations */}
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    Today's Reservations
                  </h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="gold" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-muted-foreground border-b border-border">
                        <th className="pb-3 font-medium">Reservation ID</th>
                        <th className="pb-3 font-medium">Guest Name</th>
                        <th className="pb-3 font-medium">Party Size</th>
                        <th className="pb-3 font-medium">Time</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentReservations.map((reservation) => (
                        <tr key={reservation.id} className="border-b border-border/50">
                          <td className="py-4 font-mono text-sm text-foreground">
                            {reservation.id}
                          </td>
                          <td className="py-4 text-foreground">{reservation.name}</td>
                          <td className="py-4 text-muted-foreground">{reservation.guests} guests</td>
                          <td className="py-4 text-muted-foreground">{reservation.time}</td>
                          <td className="py-4">
                            <span className={`status-badge capitalize ${getStatusColor(reservation.status)}`}>
                              {reservation.status}
                            </span>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:text-success">
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'menu' && (
            <div className="text-center py-12">
              <UtensilsCrossed className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                Menu Management
              </h3>
              <p className="text-muted-foreground mb-4">
                Add, edit, and manage menu items, categories, and pricing
              </p>
              <Button variant="gold">
                <Plus className="w-4 h-4 mr-2" />
                Add Menu Item
              </Button>
            </div>
          )}

          {activeTab === 'reservations' && (
            <div className="text-center py-12">
              <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                Reservation Management
              </h3>
              <p className="text-muted-foreground mb-4">
                View and manage all reservations, check-ins, and deposits
              </p>
              <Button variant="gold">View All Reservations</Button>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                Kitchen Orders
              </h3>
              <p className="text-muted-foreground mb-4">
                Live kitchen view with order tickets and status updates
              </p>
              <Button variant="gold">Open Kitchen View</Button>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                Payments & Reconciliation
              </h3>
              <p className="text-muted-foreground mb-4">
                View deposits, refunds, and transaction history
              </p>
              <Button variant="gold">View Transactions</Button>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="text-center py-12">
              <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                Settings
              </h3>
              <p className="text-muted-foreground mb-4">
                Configure deposit amount, working hours, and notifications
              </p>
              <Button variant="gold">Open Settings</Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const AdminPage = () => {
  return (
    <LanguageProvider>
      <CartProvider>
        <AdminContent />
      </CartProvider>
    </LanguageProvider>
  );
};

export default AdminPage;
