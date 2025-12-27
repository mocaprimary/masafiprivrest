import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Leaf, 
  Flame, 
  WheatOff,
  Eye,
  EyeOff,
  Sparkles,
  Loader2
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  name_ar: string;
  description: string | null;
  description_ar: string | null;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
  is_vegan: boolean;
  is_vegetarian: boolean;
  is_gluten_free: boolean;
  is_spicy: boolean;
  calories: number | null;
  ingredients: string[];
  ingredients_ar: string[];
  allergens: string[];
}

const emptyItem: Omit<MenuItem, 'id'> = {
  name: '',
  name_ar: '',
  description: '',
  description_ar: '',
  price: 0,
  category: 'starters',
  image_url: '',
  is_available: true,
  is_vegan: false,
  is_vegetarian: false,
  is_gluten_free: false,
  is_spicy: false,
  calories: null,
  ingredients: [],
  ingredients_ar: [],
  allergens: [],
};

const categories = [
  { id: 'starters', label: 'Starters' },
  { id: 'main', label: 'Main Course' },
  { id: 'desserts', label: 'Desserts' },
  { id: 'drinks', label: 'Drinks' },
  { id: 'specials', label: 'Specials' },
];

export function AdminMenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<Omit<MenuItem, 'id'>>(emptyItem);
  const [ingredientsInput, setIngredientsInput] = useState('');
  const [ingredientsArInput, setIngredientsArInput] = useState('');
  const [allergensInput, setAllergensInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);

  const generateAIDescription = async () => {
    if (!formData.name) {
      toast.error('Please enter a dish name first');
      return;
    }

    setGeneratingDescription(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-description', {
        body: {
          name: formData.name,
          category: formData.category,
          ingredients: ingredientsInput.split(',').map(s => s.trim()).filter(Boolean),
          isVegan: formData.is_vegan,
          isSpicy: formData.is_spicy,
          isGlutenFree: formData.is_gluten_free,
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      if (data.description) {
        setFormData(prev => ({
          ...prev,
          description: data.description,
          description_ar: data.description_ar || prev.description_ar,
        }));
        toast.success('Description generated successfully');
      }
    } catch (err) {
      console.error('Error generating description:', err);
      toast.error('Failed to generate description');
    } finally {
      setGeneratingDescription(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      toast.error('Failed to load menu items');
    } else {
      setMenuItems(data || []);
    }
    setLoading(false);
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name_ar.includes(searchQuery);
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const openAddModal = () => {
    setEditingItem(null);
    setFormData(emptyItem);
    setIngredientsInput('');
    setIngredientsArInput('');
    setAllergensInput('');
    setShowModal(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      name_ar: item.name_ar,
      description: item.description || '',
      description_ar: item.description_ar || '',
      price: item.price,
      category: item.category,
      image_url: item.image_url || '',
      is_available: item.is_available,
      is_vegan: item.is_vegan || false,
      is_vegetarian: item.is_vegetarian || false,
      is_gluten_free: item.is_gluten_free || false,
      is_spicy: item.is_spicy || false,
      calories: item.calories,
      ingredients: item.ingredients || [],
      ingredients_ar: item.ingredients_ar || [],
      allergens: item.allergens || [],
    });
    setIngredientsInput((item.ingredients || []).join(', '));
    setIngredientsArInput((item.ingredients_ar || []).join(', '));
    setAllergensInput((item.allergens || []).join(', '));
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.name_ar || formData.price <= 0) {
      toast.error('Please fill in required fields');
      return;
    }

    setSaving(true);
    const dataToSave = {
      ...formData,
      ingredients: ingredientsInput.split(',').map(s => s.trim()).filter(Boolean),
      ingredients_ar: ingredientsArInput.split(',').map(s => s.trim()).filter(Boolean),
      allergens: allergensInput.split(',').map(s => s.trim()).filter(Boolean),
    };

    if (editingItem) {
      const { error } = await supabase
        .from('menu_items')
        .update(dataToSave)
        .eq('id', editingItem.id);

      if (error) {
        toast.error('Failed to update item');
      } else {
        toast.success('Item updated');
        setShowModal(false);
        fetchMenuItems();
      }
    } else {
      const { error } = await supabase
        .from('menu_items')
        .insert(dataToSave);

      if (error) {
        toast.error('Failed to create item');
      } else {
        toast.success('Item created');
        setShowModal(false);
        fetchMenuItems();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', item.id);

    if (error) {
      toast.error('Failed to delete item');
    } else {
      toast.success('Item deleted');
      fetchMenuItems();
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: !item.is_available })
      .eq('id', item.id);

    if (error) {
      toast.error('Failed to update availability');
    } else {
      toast.success(item.is_available ? 'Item marked as unavailable' : 'Item marked as available');
      fetchMenuItems();
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
    <div>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground">Menu Management</h2>
        <Button variant="gold" onClick={openAddModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 input-field"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Menu Items Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Item</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Category</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Price</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Dietary</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} className="border-t border-border hover:bg-secondary/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {item.image_url && (
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.name_ar}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm capitalize text-muted-foreground">
                      {item.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-medium text-foreground">{item.price} AED</span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      {item.is_vegan && (
                        <span className="bg-success/20 text-success p-1 rounded" title="Vegan">
                          <Leaf className="w-3 h-3" />
                        </span>
                      )}
                      {item.is_gluten_free && (
                        <span className="bg-amber/20 text-amber p-1 rounded" title="Gluten-Free">
                          <WheatOff className="w-3 h-3" />
                        </span>
                      )}
                      {item.is_spicy && (
                        <span className="bg-destructive/20 text-destructive p-1 rounded" title="Spicy">
                          <Flame className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleAvailability(item)}
                      className={`flex items-center gap-2 text-xs px-2 py-1 rounded-full transition-colors ${
                        item.is_available 
                          ? 'bg-success/20 text-success hover:bg-success/30' 
                          : 'bg-destructive/20 text-destructive hover:bg-destructive/30'
                      }`}
                    >
                      {item.is_available ? (
                        <>
                          <Eye className="w-3 h-3" />
                          Available
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          Hidden
                        </>
                      )}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openEditModal(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredItems.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No menu items found
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name (English) *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Dish name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_ar">Name (Arabic) *</Label>
                <Input
                  id="name_ar"
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  placeholder="اسم الطبق"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Description (English)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateAIDescription}
                  disabled={generatingDescription || !formData.name}
                  className="gap-2"
                >
                  {generatingDescription ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the dish..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description_ar">Description (Arabic)</Label>
              <Textarea
                id="description_ar"
                value={formData.description_ar || ''}
                onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                placeholder="وصف الطبق..."
                dir="rtl"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (AED) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="calories">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  value={formData.calories || ''}
                  onChange={(e) => setFormData({ ...formData, calories: e.target.value ? parseInt(e.target.value) : null })}
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                value={formData.image_url || ''}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ingredients">Ingredients (comma-separated)</Label>
              <Input
                id="ingredients"
                value={ingredientsInput}
                onChange={(e) => setIngredientsInput(e.target.value)}
                placeholder="Chickpeas, Tahini, Olive oil..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ingredients_ar">Ingredients Arabic (comma-separated)</Label>
              <Input
                id="ingredients_ar"
                value={ingredientsArInput}
                onChange={(e) => setIngredientsArInput(e.target.value)}
                placeholder="حمص، طحينة، زيت زيتون..."
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergens">Allergens (comma-separated)</Label>
              <Input
                id="allergens"
                value={allergensInput}
                onChange={(e) => setAllergensInput(e.target.value)}
                placeholder="Dairy, Nuts, Gluten..."
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_available"
                  checked={formData.is_available}
                  onCheckedChange={(v) => setFormData({ ...formData, is_available: v })}
                />
                <Label htmlFor="is_available">Available</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_vegan"
                  checked={formData.is_vegan}
                  onCheckedChange={(v) => setFormData({ ...formData, is_vegan: v })}
                />
                <Label htmlFor="is_vegan">Vegan</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_gluten_free"
                  checked={formData.is_gluten_free}
                  onCheckedChange={(v) => setFormData({ ...formData, is_gluten_free: v })}
                />
                <Label htmlFor="is_gluten_free">Gluten-Free</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_spicy"
                  checked={formData.is_spicy}
                  onCheckedChange={(v) => setFormData({ ...formData, is_spicy: v })}
                />
                <Label htmlFor="is_spicy">Spicy</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}