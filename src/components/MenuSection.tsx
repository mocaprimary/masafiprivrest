import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { MenuItemCard } from './MenuItemCard';
import { MenuItem, subcategoryLabels } from '@/data/menuData';

interface MenuSectionProps {
  category: string;
  items: MenuItem[];
  onItemClick: (item: MenuItem) => void;
  imageMap: Record<string, string>;
}

export function MenuSection({ category, items, onItemClick, imageMap }: MenuSectionProps) {
  const { language, dir } = useLanguage();
  
  const categoryItems = items.filter(item => item.category === category);
  
  if (categoryItems.length === 0) return null;

  const groupedItems = categoryItems.reduce((acc, item) => {
    const subcategory = item.subcategory || 'default';
    if (!acc[subcategory]) {
      acc[subcategory] = [];
    }
    acc[subcategory].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const subcategoryOrder = ['hot-starters', 'cold-starters', 'soups', 'salads', 'risotto', 'default'];
  const sortedSubcategories = Object.keys(groupedItems).sort((a, b) => {
    const indexA = subcategoryOrder.indexOf(a);
    const indexB = subcategoryOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });
  
  return (
    <div className="space-y-10">
      {sortedSubcategories.map((subcategory) => (
        <div key={subcategory} className="space-y-5">
          {subcategory !== 'default' && subcategoryLabels[subcategory] && (
            <motion.div
              initial={{ opacity: 0, x: dir === 'rtl' ? 20 : -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-4"
            >
              <h3 className="text-xl font-display font-semibold text-foreground whitespace-nowrap">
                {language === 'ar' ? subcategoryLabels[subcategory].ar : subcategoryLabels[subcategory].en}
              </h3>
              <div className="flex-1 h-px bg-border/60" />
            </motion.div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {groupedItems[subcategory].map((item, index) => (
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
        </div>
      ))}
    </div>
  );
}
