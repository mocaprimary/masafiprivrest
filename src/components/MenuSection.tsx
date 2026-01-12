import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { MenuItemCard } from './MenuItemCard';
import { MenuItem, subcategories } from '@/data/menuData';
import { cn } from '@/lib/utils';

interface MenuSectionProps {
  category: 'starters' | 'main' | 'desserts';
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
            className="relative"
          >
            {/* Subcategory Header */}
            <div className={cn(
              "flex items-center gap-3 mb-6",
              dir === 'rtl' && "flex-row-reverse"
            )}>
              <span className="text-3xl" role="img" aria-label={sub.id}>
                {sub.icon}
              </span>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground">
                  {t(sub.labelKey)}
                </h3>
                <div className="h-0.5 mt-2 bg-gradient-to-r from-primary/60 via-primary/30 to-transparent rounded-full" />
              </div>
              <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {sectionItems.length} {sectionItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            
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
