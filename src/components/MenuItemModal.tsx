import { MenuItem } from '@/data/menuData';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Leaf, Flame, WheatOff, Share2, Plus, Minus, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

interface MenuItemModalProps {
  item: MenuItem | null;
  open: boolean;
  onClose: () => void;
}

export function MenuItemModal({ item, open, onClose }: MenuItemModalProps) {
  const { language, t } = useLanguage();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const location = useLocation();
  const isOrderPage = location.pathname.startsWith('/order') || location.pathname.startsWith('/preorder');

  if (!item) return null;

  const name = language === 'ar' ? item.nameAr : item.name;
  const description = language === 'ar' ? item.descriptionAr : item.description;
  const ingredients = language === 'ar' ? item.ingredientsAr : item.ingredients;

  const handleAddToOrder = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: item.id,
        name: item.name,
        nameAr: item.nameAr,
        price: item.price,
        image: item.image,
      });
    }
    toast.success(`Added ${quantity}x ${name} to your order`);
    setQuantity(1);
    onClose();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: name,
          text: description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0 bg-card border-border">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative aspect-video overflow-hidden rounded-t-lg">
          <img
            src={item.image}
            alt={name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        </div>

        <div className="p-6 -mt-12 relative">
          <DialogHeader className="text-left mb-4">
            <div className="flex items-start justify-between gap-4">
              <DialogTitle className="font-display text-2xl font-bold text-foreground">
                {name}
              </DialogTitle>
              <span className="gold-text text-2xl font-bold whitespace-nowrap">
                {item.price} {t('currency')}
              </span>
            </div>
          </DialogHeader>

          <div className="flex flex-wrap gap-2 mb-4">
            {item.isVegan && (
              <span className="badge-vegan">
                <Leaf className="w-3 h-3" />
                {t('item.vegan')}
              </span>
            )}
            {item.isVegetarian && !item.isVegan && (
              <span className="badge-vegan">
                <Leaf className="w-3 h-3" />
                {t('item.vegetarian')}
              </span>
            )}
            {item.isGlutenFree && (
              <span className="bg-amber/20 text-amber inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium">
                <WheatOff className="w-3 h-3" />
                {t('item.glutenFree')}
              </span>
            )}
            {item.isSpicy && (
              <span className="bg-destructive/20 text-destructive inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium">
                <Flame className="w-3 h-3" />
                {t('item.spicy')}
              </span>
            )}
          </div>

          <p className="text-muted-foreground mb-6">{description}</p>

          <div className="space-y-4 mb-6">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">{t('item.ingredients')}</h4>
              <p className="text-sm text-muted-foreground">{ingredients.join(', ')}</p>
            </div>

            {item.allergens.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">{t('item.allergens')}</h4>
                <div className="flex flex-wrap gap-1">
                  {item.allergens.map((allergen) => (
                    <span key={allergen} className="badge-allergen">
                      {allergen}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {item.calories && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">{t('item.calories')}</h4>
                <p className="text-sm text-muted-foreground">{item.calories} kcal</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isOrderPage && item.available && (
              <>
                <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-8 w-8"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-8 text-center font-semibold">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-8 w-8"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <Button variant="gold" className="flex-1" onClick={handleAddToOrder}>
                  {t('item.addToOrder')} · {item.price * quantity} {t('currency')}
                </Button>
              </>
            )}
            <Button variant="outline" size="icon" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
