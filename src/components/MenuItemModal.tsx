import { MenuItem } from '@/data/menuData';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Leaf, Flame, WheatOff, Share2, Plus, Minus, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface MenuItemModalProps {
  item: MenuItem | null;
  open: boolean;
  onClose: () => void;
}

export function MenuItemModal({ item, open, onClose }: MenuItemModalProps) {
  const { language, t } = useLanguage();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
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
        <motion.button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors"
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <X className="w-4 h-4" />
        </motion.button>

        <div className="relative aspect-video overflow-hidden rounded-t-lg">
          {/* Image loading skeleton */}
          <AnimatePresence>
            {!imageLoaded && (
              <motion.div 
                className="absolute inset-0 bg-muted"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.img
            src={item.image}
            alt={name}
            className="w-full h-full object-cover"
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: imageLoaded ? 1 : 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            onLoad={() => setImageLoaded(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        </div>

        <motion.div 
          className="p-6 -mt-12 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <DialogHeader className="text-left mb-4">
            <div className="flex items-start justify-between gap-4">
              <DialogTitle className="font-display text-2xl font-bold text-foreground">
                {name}
              </DialogTitle>
              <motion.span 
                className="gold-text text-2xl font-bold whitespace-nowrap"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                {item.price} {t('currency')}
              </motion.span>
            </div>
          </DialogHeader>

          <motion.div 
            className="flex flex-wrap gap-2 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            {item.isVegan && (
              <motion.span 
                className="badge-vegan"
                whileHover={{ scale: 1.05 }}
              >
                <Leaf className="w-3 h-3" />
                {t('item.vegan')}
              </motion.span>
            )}
            {item.isVegetarian && !item.isVegan && (
              <motion.span 
                className="badge-vegan"
                whileHover={{ scale: 1.05 }}
              >
                <Leaf className="w-3 h-3" />
                {t('item.vegetarian')}
              </motion.span>
            )}
            {item.isGlutenFree && (
              <motion.span 
                className="bg-amber/20 text-foreground inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                whileHover={{ scale: 1.05 }}
              >
                <WheatOff className="w-3 h-3" />
                {t('item.glutenFree')}
              </motion.span>
            )}
            {item.isSpicy && (
              <motion.span 
                className="bg-destructive/20 text-destructive inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                whileHover={{ scale: 1.05 }}
              >
                <Flame className="w-3 h-3" />
                {t('item.spicy')}
              </motion.span>
            )}
          </motion.div>

          <motion.p 
            className="text-muted-foreground mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {description}
          </motion.p>

          <motion.div 
            className="space-y-4 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">{t('item.ingredients')}</h4>
              <p className="text-sm text-muted-foreground">{ingredients.join(', ')}</p>
            </div>

            {item.allergens.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">{t('item.allergens')}</h4>
                <div className="flex flex-wrap gap-1">
                  {item.allergens.map((allergen, i) => (
                    <motion.span 
                      key={allergen} 
                      className="badge-allergen"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.05 }}
                    >
                      {allergen}
                    </motion.span>
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
          </motion.div>

          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {isOrderPage && item.available && (
              <>
                <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-8 w-8"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </motion.div>
                  <motion.span 
                    className="w-8 text-center font-semibold"
                    key={quantity}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {quantity}
                  </motion.span>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                      className="h-8 w-8"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </div>
                <motion.div 
                  className="flex-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button variant="gold" className="w-full" onClick={handleAddToOrder}>
                    {t('item.addToOrder')} · {item.price * quantity} {t('currency')}
                  </Button>
                </motion.div>
              </>
            )}
            <motion.div whileHover={{ scale: 1.1, rotate: 15 }} whileTap={{ scale: 0.9 }}>
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
