import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, MapPin, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Table {
  id: string;
  table_number: number;
  capacity: number;
  location: string;
  position_x: number;
  position_y: number;
  is_active: boolean;
}

interface TableLayoutVisualProps {
  date: string;
  time: string;
  guests: number;
  selectedTableId?: string;
  onTableSelect?: (table: Table | null) => void;
  showLegend?: boolean;
  compact?: boolean;
}

export function TableLayoutVisual({
  date,
  time,
  guests,
  selectedTableId,
  onTableSelect,
  showLegend = true,
  compact = false
}: TableLayoutVisualProps) {
  const [allTables, setAllTables] = useState<Table[]>([]);
  const [availableTableIds, setAvailableTableIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (date && time && guests) {
      fetchAvailableTables();
    } else {
      setAvailableTableIds(new Set(allTables.map(t => t.id)));
    }
  }, [date, time, guests, allTables]);

  const fetchTables = async () => {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('is_active', true)
      .order('table_number');
    
    if (!error && data) {
      setAllTables(data);
      setAvailableTableIds(new Set(data.map(t => t.id)));
    }
    setLoading(false);
  };

  const fetchAvailableTables = async () => {
    const { data, error } = await supabase
      .rpc('get_available_tables', {
        p_date: date,
        p_time: time,
        p_guests: guests
      });
    
    if (!error && data) {
      setAvailableTableIds(new Set(data.map((t: Table) => t.id)));
    }
  };

  const getLocationTables = (location: string) => {
    return allTables.filter(t => t.location === location);
  };

  const getTableStatus = (table: Table) => {
    if (selectedTableId === table.id) return 'selected';
    if (!availableTableIds.has(table.id)) return 'occupied';
    if (table.capacity < guests) return 'too-small';
    return 'available';
  };

  const getTableStyles = (status: string) => {
    switch (status) {
      case 'selected':
        return 'bg-primary border-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background';
      case 'occupied':
        return 'bg-destructive/20 border-destructive/40 text-destructive cursor-not-allowed opacity-60';
      case 'too-small':
        return 'bg-muted border-muted-foreground/30 text-muted-foreground cursor-not-allowed opacity-50';
      default:
        return 'bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30 cursor-pointer';
    }
  };

  const handleTableClick = (table: Table) => {
    const status = getTableStatus(table);
    if (status === 'occupied' || status === 'too-small') return;
    
    if (onTableSelect) {
      if (selectedTableId === table.id) {
        onTableSelect(null);
      } else {
        onTableSelect(table);
      }
    }
  };

  const availableCount = allTables.filter(t => availableTableIds.has(t.id) && t.capacity >= guests).length;
  const totalTables = allTables.length;

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-6 animate-pulse">
        <div className="h-40 bg-muted rounded"></div>
      </div>
    );
  }

  const locations = [
    { id: 'main', label: 'Main Dining', icon: '🍽️' },
    { id: 'terrace', label: 'Terrace', icon: '🌿' },
    { id: 'private', label: 'Private Room', icon: '👑' },
  ];

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      {/* Availability Status */}
      <div className={cn(
        "rounded-xl p-4 flex items-center justify-between",
        availableCount === 0 
          ? "bg-destructive/10 border border-destructive/30" 
          : "bg-green-500/10 border border-green-500/30"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-xl",
            availableCount === 0 ? "bg-destructive/20" : "bg-green-500/20"
          )}>
            {availableCount === 0 ? '😔' : '🎉'}
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {availableCount === 0 
                ? 'Fully Booked' 
                : `${availableCount} Table${availableCount !== 1 ? 's' : ''} Available`
              }
            </p>
            <p className="text-sm text-muted-foreground">
              {availableCount === 0 
                ? 'Try a different date or time'
                : `For ${guests} guest${guests !== 1 ? 's' : ''} on ${date} at ${time}`
              }
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">{availableCount}/{totalTables}</p>
          <p className="text-xs text-muted-foreground">tables free</p>
        </div>
      </div>

      {/* Table Layout by Location */}
      {locations.map(location => {
        const locationTables = getLocationTables(location.id);
        if (locationTables.length === 0) return null;

        return (
          <div key={location.id} className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{location.icon}</span>
              <h4 className="font-medium text-foreground">{location.label}</h4>
              <span className="text-xs text-muted-foreground ml-auto">
                {locationTables.filter(t => availableTableIds.has(t.id) && t.capacity >= guests).length} available
              </span>
            </div>
            
            <div className={cn(
              "grid gap-3",
              compact ? "grid-cols-4" : "grid-cols-3 sm:grid-cols-4 md:grid-cols-6"
            )}>
              <AnimatePresence>
                {locationTables.map((table) => {
                  const status = getTableStatus(table);
                  return (
                    <motion.button
                      key={table.id}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      whileHover={status === 'available' ? { scale: 1.05 } : {}}
                      whileTap={status === 'available' ? { scale: 0.95 } : {}}
                      onClick={() => handleTableClick(table)}
                      disabled={status === 'occupied' || status === 'too-small'}
                      className={cn(
                        "relative p-3 rounded-lg border-2 transition-all",
                        getTableStyles(status)
                      )}
                    >
                      {status === 'selected' && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                      <div className="text-center">
                        <p className="text-lg font-bold">T{table.table_number}</p>
                        <div className="flex items-center justify-center gap-1 text-xs opacity-80">
                          <Users className="w-3 h-3" />
                          {table.capacity}
                        </div>
                      </div>
                      {/* Visual table shape */}
                      <div className={cn(
                        "absolute inset-0 -z-10 rounded-lg opacity-20",
                        table.capacity <= 2 && "rounded-full",
                        table.capacity >= 6 && "rounded-[24px]"
                      )} />
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        );
      })}

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-green-500/30 border-2 border-green-500/50"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-primary border-2 border-primary"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-destructive/30 border-2 border-destructive/50 opacity-60"></div>
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-muted border-2 border-muted-foreground/30 opacity-50"></div>
            <span>Too Small</span>
          </div>
        </div>
      )}
    </div>
  );
}
