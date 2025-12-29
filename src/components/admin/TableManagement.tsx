import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Plus, 
  Trash2, 
  Users, 
  MapPin, 
  Edit2, 
  Check, 
  X,
  RefreshCw 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Table {
  id: string;
  table_number: number;
  capacity: number;
  location: string;
  is_active: boolean;
  position_x: number;
  position_y: number;
}

interface Reservation {
  id: string;
  table_id: string | null;
  full_name: string;
  reservation_date: string;
  reservation_time: string;
  status: string;
}

export function TableManagement() {
  const [tables, setTables] = useState<Table[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [newTable, setNewTable] = useState({
    table_number: 1,
    capacity: 4,
    location: 'main'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [tablesRes, reservationsRes] = await Promise.all([
      supabase.from('tables').select('*').order('table_number'),
      supabase.from('reservations')
        .select('id, table_id, full_name, reservation_date, reservation_time, status')
        .gte('reservation_date', new Date().toISOString().split('T')[0])
        .not('status', 'eq', 'cancelled')
    ]);

    if (tablesRes.data) setTables(tablesRes.data);
    if (reservationsRes.data) setReservations(reservationsRes.data);
    setLoading(false);
  };

  const addTable = async () => {
    const { error } = await supabase.from('tables').insert({
      table_number: newTable.table_number,
      capacity: newTable.capacity,
      location: newTable.location,
      position_x: tables.length % 4,
      position_y: Math.floor(tables.length / 4)
    });

    if (error) {
      if (error.code === '23505') {
        toast.error('Table number already exists');
      } else {
        toast.error('Failed to add table');
      }
    } else {
      toast.success('Table added');
      setShowAddDialog(false);
      setNewTable({ table_number: tables.length + 2, capacity: 4, location: 'main' });
      fetchData();
    }
  };

  const updateTable = async (table: Table) => {
    const { error } = await supabase
      .from('tables')
      .update({
        capacity: table.capacity,
        location: table.location,
        is_active: table.is_active
      })
      .eq('id', table.id);

    if (error) {
      toast.error('Failed to update table');
    } else {
      toast.success('Table updated');
      setEditingTable(null);
      fetchData();
    }
  };

  const toggleTableActive = async (table: Table) => {
    const { error } = await supabase
      .from('tables')
      .update({ is_active: !table.is_active })
      .eq('id', table.id);

    if (error) {
      toast.error('Failed to update table');
    } else {
      toast.success(table.is_active ? 'Table deactivated' : 'Table activated');
      fetchData();
    }
  };

  const deleteTable = async (tableId: string) => {
    // Check if table has reservations
    const hasReservations = reservations.some(r => r.table_id === tableId);
    if (hasReservations) {
      toast.error('Cannot delete table with active reservations');
      return;
    }

    const { error } = await supabase.from('tables').delete().eq('id', tableId);
    if (error) {
      toast.error('Failed to delete table');
    } else {
      toast.success('Table deleted');
      fetchData();
    }
  };

  const assignTableToReservation = async (reservationId: string, tableId: string | null) => {
    const { error } = await supabase
      .from('reservations')
      .update({ table_id: tableId })
      .eq('id', reservationId);

    if (error) {
      toast.error('Failed to assign table');
    } else {
      toast.success(tableId ? 'Table assigned' : 'Table unassigned');
      fetchData();
    }
  };

  const getTableReservation = (tableId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return reservations.find(
      r => r.table_id === tableId && r.reservation_date === today
    );
  };

  const locationLabels: Record<string, string> = {
    main: 'Main Dining',
    terrace: 'Terrace',
    private: 'Private Room'
  };

  const stats = {
    total: tables.length,
    active: tables.filter(t => t.is_active).length,
    totalCapacity: tables.filter(t => t.is_active).reduce((sum, t) => sum + t.capacity, 0),
    occupiedToday: reservations.filter(r => 
      r.reservation_date === new Date().toISOString().split('T')[0] && 
      r.table_id
    ).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Table Management</h2>
          <p className="text-muted-foreground">Manage restaurant tables and assignments</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button variant="gold">
              <Plus className="w-4 h-4 mr-2" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Table</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Table Number</Label>
                <Input
                  type="number"
                  min={1}
                  value={newTable.table_number}
                  onChange={(e) => setNewTable({ ...newTable, table_number: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Capacity</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={newTable.capacity}
                  onChange={(e) => setNewTable({ ...newTable, capacity: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Location</Label>
                <Select value={newTable.location} onValueChange={(v) => setNewTable({ ...newTable, location: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main Dining</SelectItem>
                    <SelectItem value="terrace">Terrace</SelectItem>
                    <SelectItem value="private">Private Room</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addTable} className="w-full">Add Table</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-xs text-muted-foreground uppercase">Total Tables</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-500">{stats.active}</p>
          <p className="text-xs text-muted-foreground uppercase">Active</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-primary">{stats.totalCapacity}</p>
          <p className="text-xs text-muted-foreground uppercase">Total Seats</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">{stats.occupiedToday}</p>
          <p className="text-xs text-muted-foreground uppercase">Reserved Today</p>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/30">
          <h3 className="font-semibold text-foreground">All Tables</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {tables.map((table) => {
              const reservation = getTableReservation(table.id);
              const isOccupied = !!reservation;
              
              return (
                <div
                  key={table.id}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all",
                    !table.is_active && "opacity-50 bg-muted",
                    isOccupied 
                      ? "border-amber-500/50 bg-amber-500/10" 
                      : "border-green-500/30 bg-green-500/5"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg text-foreground">T{table.table_number}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingTable(table)}
                        className="p-1 hover:bg-secondary rounded"
                      >
                        <Edit2 className="w-3 h-3 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => toggleTableActive(table)}
                        className={cn(
                          "p-1 rounded",
                          table.is_active ? "hover:bg-destructive/20" : "hover:bg-green-500/20"
                        )}
                      >
                        {table.is_active ? (
                          <X className="w-3 h-3 text-destructive" />
                        ) : (
                          <Check className="w-3 h-3 text-green-500" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="w-3 h-3" />
                      {table.capacity} seats
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {locationLabels[table.location]}
                    </div>
                  </div>

                  {isOccupied && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <p className="text-xs font-medium text-amber-500 truncate">
                        {reservation.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {reservation.reservation_time}
                      </p>
                    </div>
                  )}

                  {!isOccupied && table.is_active && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <span className="text-xs text-green-500 font-medium">Available</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTable} onOpenChange={() => setEditingTable(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Table {editingTable?.table_number}</DialogTitle>
          </DialogHeader>
          {editingTable && (
            <div className="space-y-4 pt-4">
              <div>
                <Label>Capacity</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={editingTable.capacity}
                  onChange={(e) => setEditingTable({ ...editingTable, capacity: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Location</Label>
                <Select 
                  value={editingTable.location} 
                  onValueChange={(v) => setEditingTable({ ...editingTable, location: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main Dining</SelectItem>
                    <SelectItem value="terrace">Terrace</SelectItem>
                    <SelectItem value="private">Private Room</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => updateTable(editingTable)} className="flex-1">
                  Save Changes
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    deleteTable(editingTable.id);
                    setEditingTable(null);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
