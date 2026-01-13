import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { MenuItemCard } from './MenuItemCard';
import { MenuItem, subcategories } from '@/data/menuData';
import { cn } from '@/lib/utils';

interface MenuSectionProps {
  category: 'starters' | 'main' | 'desserts' | 'drinks';
  items: MenuItem[];
  onItemClick: (item: MenuItem) => void;
  imageMap: Record<string, string>;
}

export function MenuSection({ category, items, onItemClick, imageMap }: MenuSectionProps) {
  const { t, dir } = useLanguage();
  
  const categorySubcategories = subcategories[category];
  
  return (
    <div className="space-y-12">
      {categorySubcategories.map((sub, sectionIndex) => {
        const sectionItems = items.filter(item => item.subcategory === sub.id);
        
        if (sectionItems.length === 0) return null;
        
        return (
          <motion.div
            key={sub.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative"
          >
            {/* Subcategory Header */}
            <motion.div 
              className={cn(
                "flex items-center gap-3 mb-6",
                dir === 'rtl' && "flex-row-reverse"
              )}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <motion.span 
                className="text-3xl" 
                role="img" 
                aria-label={sub.id}
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              >
                {sub.icon}
              </motion.span>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground">
                  {t(sub.labelKey)}
                </h3>
                <motion.div 
                  className="h-0.5 mt-2 bg-gradient-to-r from-primary/60 via-primary/30 to-transparent rounded-full"
                  initial={{ scaleX: 0, originX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                />
              </div>
              <motion.span 
                className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                {sectionItems.length} {sectionItems.length === 1 ? 'item' : 'items'}
              </motion.span>
            </motion.div>
            
            {/* Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sectionItems.map((item, index) => (
                <MenuItemCard
                  key={item.id}
                  item={{
                    ...item,
                    image: imageMap[item.id] || item.image,
                  }}
                  index={index}
                  onClick={() => onItemClick({
                    ...item,
                    image: imageMap[item.id] || item.image,
                  })}
                />
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
