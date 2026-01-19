import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { MenuItemCard } from './MenuItemCard';
import { MenuItem } from '@/data/menuData';

interface MenuSectionProps {
  category: string;
  items: MenuItem[];
  onItemClick: (item: MenuItem) => void;
  imageMap: Record<string, string>;
}

export function MenuSection({ category, items, onItemClick, imageMap }: MenuSectionProps) {
  const { t, dir } = useLanguage();
  
  // Filter items by category
  const categoryItems = items.filter(item => item.category === category);
  
  if (categoryItems.length === 0) return null;
  
  return (
    <div className="space-y-6">
      {/* Items Grid */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryItems.map((item, index) => (
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
    </div>
  );
}
