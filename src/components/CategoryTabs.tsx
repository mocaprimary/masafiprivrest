import { useLanguage } from '@/contexts/LanguageContext';
import { categories } from '@/data/menuData';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  const { t } = useLanguage();

  return (
    <motion.div 
      className="overflow-x-auto scrollbar-hide -mx-4 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex gap-1 pb-2 min-w-max">
        {categories.map((category, index) => (
          <motion.button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              "category-tab relative",
              activeCategory === category.id && "active"
            )}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.3 }}
            whileTap={{ scale: 0.97 }}
          >
            {activeCategory === category.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              />
            )}
            <span className="relative z-10">{t(category.labelKey)}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
