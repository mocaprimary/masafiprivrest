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
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.6, 
        delay: (index % 4) * 0.08,
        ease: [0.16, 1, 0.3, 1]
      }}
      whileHover={{ 
        y: -4,
        transition: { duration: 0.4, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.99 }}
      className="menu-item-card group cursor-pointer"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        <motion.img
          src={item.image}
          alt={name}
          className={`w-full h-full object-cover transition-all duration-700 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
        
        {/* Subtle bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-card to-transparent" />
        
        {!item.available && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm">
            <span className="text-muted-foreground font-medium text-xs uppercase tracking-widest">
              Sold Out
            </span>
          </div>
        )}
        
        {/* Dietary badges — minimal, top-right */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          {item.isVegan && (
            <span className="w-7 h-7 rounded-full bg-success/20 backdrop-blur-md flex items-center justify-center border border-success/30">
              <Leaf className="w-3.5 h-3.5 text-success" />
            </span>
          )}
          {item.isSpicy && (
            <span className="w-7 h-7 rounded-full bg-destructive/20 backdrop-blur-md flex items-center justify-center border border-destructive/30">
              <Flame className="w-3.5 h-3.5 text-destructive" />
            </span>
          )}
          {item.isGlutenFree && (
            <span className="w-7 h-7 rounded-full bg-primary/20 backdrop-blur-md flex items-center justify-center border border-primary/30">
              <WheatOff className="w-3.5 h-3.5 text-primary" />
            </span>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-display text-lg font-bold text-foreground leading-snug group-hover:text-primary transition-colors duration-500">
            {name}
          </h3>
          <span className="text-primary font-semibold whitespace-nowrap text-sm">
            {item.price} {t('currency')}
          </span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
        
        {item.allergens.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-border/30">
            {item.allergens.slice(0, 3).map((allergen) => (
              <span key={allergen} className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {allergen}
              </span>
            ))}
            {item.allergens.length > 3 && (
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">+{item.allergens.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
