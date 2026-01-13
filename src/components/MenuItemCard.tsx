import { MenuItem } from '@/data/menuData';
import { useLanguage } from '@/contexts/LanguageContext';
import { Leaf, Flame, WheatOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface MenuItemCardProps {
  item: MenuItem;
  onClick: () => void;
  index: number;
}

export function MenuItemCard({ item, onClick, index }: MenuItemCardProps) {
  const { language, t } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);
  const name = language === 'ar' ? item.nameAr : item.name;
  const description = language === 'ar' ? item.descriptionAr : item.description;

  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ 
        y: -8,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      className="menu-item-card group cursor-pointer"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {/* Image loading skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
          </div>
        )}
        <motion.img
          src={item.image}
          alt={name}
          className={`w-full h-full object-cover transition-all duration-700 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        
        {/* Gradient overlay on hover */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
        
        {!item.available && (
          <motion.div 
            className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="text-muted-foreground font-medium px-4 py-2 bg-background/50 rounded-full">
              Sold Out
            </span>
          </motion.div>
        )}
        
        {/* Dietary badges with stagger animation */}
        <div className="absolute top-2 right-2 flex gap-1.5">
          {item.isVegan && (
            <motion.span 
              className="badge-vegan backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.08 + 0.3, type: "spring", stiffness: 300 }}
            >
              <Leaf className="w-3 h-3" />
            </motion.span>
          )}
          {item.isSpicy && (
            <motion.span 
              className="bg-destructive/30 text-destructive-foreground backdrop-blur-sm inline-flex items-center px-2 py-0.5 rounded-full text-xs"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.08 + 0.35, type: "spring", stiffness: 300 }}
            >
              <Flame className="w-3 h-3" />
            </motion.span>
          )}
          {item.isGlutenFree && (
            <motion.span 
              className="bg-amber/30 text-foreground backdrop-blur-sm inline-flex items-center px-2 py-0.5 rounded-full text-xs"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.08 + 0.4, type: "spring", stiffness: 300 }}
            >
              <WheatOff className="w-3 h-3" />
            </motion.span>
          )}
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display text-lg font-semibold text-foreground leading-tight group-hover:text-primary transition-colors duration-300">
            {name}
          </h3>
          <motion.span 
            className="gold-text font-semibold whitespace-nowrap"
            whileHover={{ scale: 1.05 }}
          >
            {item.price} {t('currency')}
          </motion.span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 group-hover:text-foreground/70 transition-colors duration-300">
          {description}
        </p>
        
        {item.allergens.length > 0 && (
          <motion.div 
            className="flex flex-wrap gap-1 mt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.08 + 0.2 }}
          >
            {item.allergens.slice(0, 2).map((allergen, i) => (
              <motion.span 
                key={allergen} 
                className="badge-allergen"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 + 0.25 + i * 0.05 }}
              >
                {allergen}
              </motion.span>
            ))}
            {item.allergens.length > 2 && (
              <span className="badge-allergen">+{item.allergens.length - 2}</span>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
