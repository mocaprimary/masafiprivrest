import { useMemo } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Reservation {
  id: string;
  reservation_number: string;
  full_name: string;
  guests: number;
  reservation_date: string;
  reservation_time: string;
  status: string;
}

interface WeeklyCalendarProps {
  reservations: Reservation[];
  onReservationClick?: (reservation: Reservation) => void;
}

const TIME_SLOTS = [
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00'
];

export function WeeklyCalendar({ reservations, onReservationClick }: WeeklyCalendarProps) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const getReservationsForSlot = (date: Date, timeSlot: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const slotHour = parseInt(timeSlot.split(':')[0]);
    
    return reservations.filter(res => {
      if (res.reservation_date !== dateStr) return false;
      const resHour = parseInt(res.reservation_time.split(':')[0]);
      return resHour === slotHour;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'arrived':
      case 'checked_in':
        return 'bg-green-500/20 border-green-500/40 text-green-400';
      case 'confirmed':
        return 'bg-primary/20 border-primary/40 text-primary';
      case 'cancelled':
        return 'bg-destructive/20 border-destructive/40 text-destructive';
      default:
        return 'bg-amber-500/20 border-amber-500/40 text-amber-400';
    }
  };

  const today = new Date();

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border bg-secondary/30">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Weekly Calendar
          <span className="text-sm font-normal text-muted-foreground ml-2">
            {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </span>
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="grid grid-cols-8 border-b border-border">
            <div className="p-3 text-sm font-medium text-muted-foreground border-r border-border bg-secondary/20">
              Time
            </div>
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "p-3 text-center border-r border-border last:border-r-0",
                  isSameDay(day, today) && "bg-primary/10"
                )}
              >
                <div className={cn(
                  "text-xs uppercase tracking-wider",
                  isSameDay(day, today) ? "text-primary font-semibold" : "text-muted-foreground"
                )}>
                  {format(day, 'EEE')}
                </div>
                <div className={cn(
                  "text-lg font-bold",
                  isSameDay(day, today) ? "text-primary" : "text-foreground"
                )}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* Time Slots */}
          <div className="max-h-[400px] overflow-y-auto">
            {TIME_SLOTS.map((timeSlot) => (
              <div key={timeSlot} className="grid grid-cols-8 border-b border-border/50 last:border-b-0">
                <div className="p-2 text-xs font-medium text-muted-foreground border-r border-border bg-secondary/10 flex items-start justify-center">
                  {timeSlot}
                </div>
                {weekDays.map((day) => {
                  const slotReservations = getReservationsForSlot(day, timeSlot);
                  return (
                    <div
                      key={`${day.toISOString()}-${timeSlot}`}
                      className={cn(
                        "p-1 min-h-[60px] border-r border-border/50 last:border-r-0",
                        isSameDay(day, today) && "bg-primary/5"
                      )}
                    >
                      {slotReservations.map((res) => (
                        <button
                          key={res.id}
                          onClick={() => onReservationClick?.(res)}
                          className={cn(
                            "w-full text-left p-1.5 rounded text-xs border mb-1 transition-all hover:scale-[1.02] cursor-pointer",
                            getStatusColor(res.status)
                          )}
                        >
                          <div className="font-medium truncate">{res.full_name}</div>
                          <div className="flex items-center gap-1 opacity-80">
                            <Users className="w-3 h-3" />
                            <span>{res.guests}</span>
                            <span className="ml-1">{res.reservation_time}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-3 border-t border-border bg-secondary/20 flex items-center gap-4 flex-wrap text-xs">
        <span className="text-muted-foreground">Status:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/50"></div>
          <span className="text-muted-foreground">Pending</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-primary/30 border border-primary/50"></div>
          <span className="text-muted-foreground">Confirmed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-500/30 border border-green-500/50"></div>
          <span className="text-muted-foreground">Arrived</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-destructive/30 border border-destructive/50"></div>
          <span className="text-muted-foreground">Cancelled</span>
        </div>
      </div>
    </div>
  );
}
