import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Users, 
  Check, 
  X, 
  UserCheck,
  Phone,
  Calendar,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Reservation {
  id: string;
  reservation_number: string;
  guests: number;
  reservation_date: string;
  reservation_time: string;
  status: string;
  deposit_status: string;
  deposit_amount: number;
  table?: {
    table_number: number;
    location: string;
  } | null;
  private_details?: {
    full_name: string;
    phone: string;
    email: string | null;
    special_requests: string | null;
  };
}

interface TodayReservationsProps {
  reservations: Reservation[];
  onStatusChange: (id: string, status: string) => void;
  onViewAll: () => void;
}

export function TodayReservations({ reservations, onStatusChange, onViewAll }: TodayReservationsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const today = new Date().toISOString().split('T')[0];
  const todayReservations = reservations
    .filter(r => r.reservation_date === today)
    .sort((a, b) => a.reservation_time.localeCompare(b.reservation_time));

  const arrivedCount = todayReservations.filter(r => r.status === 'arrived' || r.status === 'checked_in').length;
  const confirmedCount = todayReservations.filter(r => r.status === 'confirmed').length;
  const pendingCount = todayReservations.filter(r => r.status === 'pending').length;
  const totalGuests = todayReservations.reduce((sum, r) => sum + r.guests, 0);
  const arrivedGuests = todayReservations
    .filter(r => r.status === 'arrived' || r.status === 'checked_in')
    .reduce((sum, r) => sum + r.guests, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'arrived':
      case 'checked_in':
        return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'confirmed':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'pending':
        return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
      case 'cancelled':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'arrived':
      case 'checked_in':
        return <UserCheck className="w-3.5 h-3.5" />;
      case 'confirmed':
        return <Check className="w-3.5 h-3.5" />;
      case 'pending':
        return <Clock className="w-3.5 h-3.5" />;
      case 'cancelled':
        return <X className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isUpcoming = (time: string) => {
    const now = new Date();
    const [hours, minutes] = time.split(':');
    const resTime = new Date();
    resTime.setHours(parseInt(hours), parseInt(minutes), 0);
    return resTime > now;
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Today's Reservations</h3>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View All
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-px bg-border/50">
        <div className="bg-card p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{todayReservations.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="bg-card p-3 text-center">
          <p className="text-2xl font-bold text-green-500">{arrivedCount}</p>
          <p className="text-xs text-muted-foreground">Arrived</p>
        </div>
        <div className="bg-card p-3 text-center">
          <p className="text-2xl font-bold text-primary">{confirmedCount}</p>
          <p className="text-xs text-muted-foreground">Expected</p>
        </div>
        <div className="bg-card p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{arrivedGuests}/{totalGuests}</p>
          <p className="text-xs text-muted-foreground">Guests</p>
        </div>
      </div>

      {/* Reservations List */}
      <div className="max-h-[400px] overflow-y-auto">
        {todayReservations.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No reservations for today</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {todayReservations.map((res) => {
              const isExpanded = expandedId === res.id;
              const upcoming = isUpcoming(res.reservation_time);
              const isArrived = res.status === 'arrived' || res.status === 'checked_in';

              return (
                <div 
                  key={res.id}
                  className={`transition-colors ${
                    isArrived 
                      ? 'bg-green-500/5' 
                      : upcoming 
                        ? 'bg-card' 
                        : 'bg-muted/30'
                  }`}
                >
                  {/* Main Row */}
                  <div 
                    className="p-4 flex items-center gap-4 cursor-pointer hover:bg-secondary/50"
                    onClick={() => setExpandedId(isExpanded ? null : res.id)}
                  >
                    {/* Time */}
                    <div className="w-20 shrink-0">
                      <p className={`font-mono font-bold ${upcoming ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {formatTime(res.reservation_time)}
                      </p>
                    </div>

                    {/* Guest Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {res.private_details?.full_name || 'Guest'}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        <span>{res.guests} guest{res.guests > 1 ? 's' : ''}</span>
                        {res.table && (
                          <>
                            <span>•</span>
                            <span>Table {res.table.table_number}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <Badge 
                      variant="outline" 
                      className={`${getStatusColor(res.status)} flex items-center gap-1.5`}
                    >
                      {getStatusIcon(res.status)}
                      <span className="capitalize">{res.status === 'checked_in' ? 'Arrived' : res.status}</span>
                    </Badge>

                    {/* Quick Actions */}
                    {!isArrived && res.status !== 'cancelled' && (
                      <div className="flex items-center gap-1">
                        {res.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStatusChange(res.id, 'confirmed');
                            }}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-green-500 hover:bg-green-500/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(res.id, 'arrived');
                          }}
                        >
                          <UserCheck className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {/* Expand Arrow */}
                    <div className="text-muted-foreground">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 space-y-3 animate-fade-in">
                      <div className="ml-24 p-3 rounded-lg bg-secondary/50 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Reservation:</span>
                          <span className="font-mono text-foreground">{res.reservation_number}</span>
                        </div>
                        {res.private_details?.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <a 
                              href={`tel:${res.private_details.phone}`} 
                              className="text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {res.private_details.phone}
                            </a>
                          </div>
                        )}
                        {res.private_details?.special_requests && (
                          <div className="flex items-start gap-2 text-sm">
                            <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <span className="text-foreground">{res.private_details.special_requests}</span>
                          </div>
                        )}
                        {res.deposit_amount > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Deposit:</span>
                            <Badge 
                              variant="outline" 
                              className={res.deposit_status === 'paid' 
                                ? 'bg-green-500/20 text-green-500 border-green-500/30' 
                                : 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                              }
                            >
                              {res.deposit_amount} AED - {res.deposit_status}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Summary */}
      {todayReservations.length > 0 && (
        <div className="p-4 border-t border-border bg-secondary/30">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {pendingCount > 0 && (
                <span className="text-amber-500 font-medium">{pendingCount} pending confirmation</span>
              )}
            </span>
            <span className="text-muted-foreground">
              {todayReservations.length - arrivedCount} still expected
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
