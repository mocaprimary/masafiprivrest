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
      <div className="flex gap-2 pb-1 min-w-max">
        {categories.map((category) => {
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "relative px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-300",
                isActive
                  ? "text-primary-foreground shadow-gold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeCategory"
                  className="absolute inset-0 bg-primary rounded-full"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <span className="relative z-10">{t(category.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
