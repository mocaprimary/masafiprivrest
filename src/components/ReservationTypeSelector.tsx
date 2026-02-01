import { motion } from 'framer-motion';
import { UtensilsCrossed, CalendarCheck, Sparkles, Check, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ReservationType = 'preorder' | 'reserve-only';

interface ReservationTypeSelectorProps {
  selectedType: ReservationType | null;
  onSelect: (type: ReservationType) => void;
  onContinue: () => void;
}

export function ReservationTypeSelector({
  selectedType,
  onSelect,
  onContinue,
}: ReservationTypeSelectorProps) {
  const options = [
    {
      id: 'preorder' as ReservationType,
      title: 'Pre-Order & Reserve',
      subtitle: 'Recommended',
      description: 'Browse our menu, pre-order your meal, and your food will be ready when you arrive.',
      deposit: '50% of menu total',
      depositNote: 'Pay half now, rest on arrival',
      icon: UtensilsCrossed,
      recommended: true,
      benefits: [
        'Food ready on arrival',
        'Skip the wait time',
        'Deposit applied to your bill',
      ],
    },
    {
      id: 'reserve-only' as ReservationType,
      title: 'Reserve Only',
      subtitle: 'Quick booking',
      description: 'Just secure your table. Order when you arrive at the restaurant.',
      deposit: '100 AED',
      depositNote: 'Security deposit',
      icon: CalendarCheck,
      recommended: false,
      benefits: [
        'Flexible dining',
        'Order at the restaurant',
        'Deposit refunded on purchase',
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">Choose Your Experience</span>
        </motion.div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
          How would you like to dine?
        </h2>
        <p className="text-muted-foreground">
          Select your preferred reservation type
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2">
        {options.map((option, index) => {
          const Icon = option.icon;
          const isSelected = selectedType === option.id;

          return (
            <motion.button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={cn(
                "relative text-left p-5 sm:p-6 rounded-2xl border-2 transition-all duration-300",
                isSelected
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border bg-card/50 hover:border-primary/50 hover:bg-card"
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Recommended Badge */}
              {option.recommended && (
                <motion.div
                  className="absolute -top-3 left-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Sparkles className="w-3 h-3" />
                  Recommended
                </motion.div>
              )}

              {/* Selection Indicator */}
              <motion.div
                className={cn(
                  "absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                  isSelected
                    ? "bg-primary border-primary"
                    : "border-muted-foreground/30"
                )}
                animate={isSelected ? { scale: [1, 1.2, 1] } : {}}
              >
                {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
              </motion.div>

              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                    {option.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {option.description}
                  </p>
                </div>
              </div>

              {/* Deposit Info */}
              <div className={cn(
                "mt-4 p-3 rounded-xl transition-colors",
                isSelected ? "bg-primary/10" : "bg-muted/50"
              )}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Deposit</span>
                  <span className="font-bold text-foreground gold-text">{option.deposit}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{option.depositNote}</p>
              </div>

              {/* Benefits */}
              <ul className="mt-4 space-y-2">
                {option.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center text-[10px]",
                      isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      ✓
                    </span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </motion.button>
          );
        })}
      </div>

      {/* Policy Note */}
      <motion.div
        className="glass-card rounded-xl p-4 flex items-start gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground mb-1">Deposit Policy</p>
          <p className="text-xs text-muted-foreground">
            Your deposit is fully refundable if you cancel 24 hours before, or applied to your final bill when you dine with us.
          </p>
        </div>
      </motion.div>

      {/* Continue Button */}
      <motion.button
        onClick={onContinue}
        disabled={!selectedType}
        className={cn(
          "w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300",
          selectedType
            ? "bg-gradient-to-r from-primary to-amber text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        whileHover={selectedType ? { scale: 1.02 } : {}}
        whileTap={selectedType ? { scale: 0.98 } : {}}
      >
        {selectedType ? 'Continue' : 'Select an option'}
      </motion.button>
    </div>
  );
}
