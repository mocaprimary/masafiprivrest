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
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
      <div className="flex gap-2 pb-2 min-w-max">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              "category-tab relative",
              activeCategory === category.id && "active"
            )}
          >
            {activeCategory === category.id && (
              <motion.div
                layoutId="activeCategory"
                className="absolute inset-0 gold-gradient rounded-full"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{t(category.labelKey)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
