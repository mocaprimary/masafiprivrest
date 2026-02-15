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
      viewport={{ once: true, margin: "-40px" }}
      transition={{ 
        duration: 0.5, 
        delay: (index % 3) * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      className="group cursor-pointer rounded-2xl overflow-hidden bg-card border border-border/40 shadow-card hover:shadow-elevated hover:border-primary/20 transition-all duration-400"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        <motion.img
          src={item.image}
          alt={name}
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
        />
        
        {/* Bottom gradient for text readability */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {!item.available && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm">
            <span className="text-muted-foreground font-medium px-4 py-2 bg-background/60 rounded-full text-sm">
              Sold Out
            </span>
          </div>
        )}
        
        {/* Dietary badges */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          {item.isVegan && (
            <span className="w-7 h-7 rounded-full bg-success/90 text-success-foreground flex items-center justify-center backdrop-blur-sm shadow-sm">
              <Leaf className="w-3.5 h-3.5" />
            </span>
          )}
          {item.isSpicy && (
            <span className="w-7 h-7 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center backdrop-blur-sm shadow-sm">
              <Flame className="w-3.5 h-3.5" />
            </span>
          )}
          {item.isGlutenFree && (
            <span className="w-7 h-7 rounded-full bg-accent/90 text-accent-foreground flex items-center justify-center backdrop-blur-sm shadow-sm">
              <WheatOff className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        {/* Price tag overlay */}
        <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-card/95 backdrop-blur-sm shadow-sm border border-border/30">
          <span className="text-primary font-bold text-sm">
            {item.price} {t('currency')}
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 pb-5">
        <h3 className="font-display text-lg font-semibold text-foreground leading-tight group-hover:text-primary transition-colors duration-300 mb-1.5">
          {name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {description}
        </p>
        
        {item.allergens.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {item.allergens.slice(0, 2).map((allergen) => (
              <span 
                key={allergen} 
                className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted/60 text-muted-foreground"
              >
                {allergen}
              </span>
            ))}
            {item.allergens.length > 2 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted/60 text-muted-foreground">
                +{item.allergens.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
