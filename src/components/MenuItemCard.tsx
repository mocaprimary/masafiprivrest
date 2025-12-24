import { MenuItem } from '@/data/menuData';
import { useLanguage } from '@/contexts/LanguageContext';
import { Leaf, Flame, WheatOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItemCardProps {
  item: MenuItem;
  onClick: () => void;
  index: number;
}

export function MenuItemCard({ item, onClick, index }: MenuItemCardProps) {
  const { language, t } = useLanguage();
  const name = language === 'ar' ? item.nameAr : item.name;
  const description = language === 'ar' ? item.descriptionAr : item.description;

  return (
    <div
      onClick={onClick}
      className="menu-item-card card-hover animate-slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={item.image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {!item.available && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <span className="text-muted-foreground font-medium">Sold Out</span>
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          {item.isVegan && (
            <span className="badge-vegan">
              <Leaf className="w-3 h-3" />
            </span>
          )}
          {item.isSpicy && (
            <span className="bg-destructive/20 text-destructive inline-flex items-center px-2 py-0.5 rounded-full text-xs">
              <Flame className="w-3 h-3" />
            </span>
          )}
          {item.isGlutenFree && (
            <span className="bg-amber/20 text-amber inline-flex items-center px-2 py-0.5 rounded-full text-xs">
              <WheatOff className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display text-lg font-semibold text-foreground leading-tight">
            {name}
          </h3>
          <span className="gold-text font-semibold whitespace-nowrap">
            {item.price} {t('currency')}
          </span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>
        
        {item.allergens.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {item.allergens.slice(0, 2).map((allergen) => (
              <span key={allergen} className="badge-allergen">
                {allergen}
              </span>
            ))}
            {item.allergens.length > 2 && (
              <span className="badge-allergen">+{item.allergens.length - 2}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
