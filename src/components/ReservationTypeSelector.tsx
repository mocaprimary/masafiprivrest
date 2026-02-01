import { motion, AnimatePresence } from 'framer-motion';
import { UtensilsCrossed, CalendarCheck, Sparkles, Check, Shield, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ReservationType = 'preorder' | 'reserve-only';

interface ReservationTypeSelectorProps {
  selectedType: ReservationType | null;
  onSelect: (type: ReservationType) => void;
  onContinue: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
};

const benefitVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.4 + i * 0.1 },
  }),
};

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
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="text-center mb-8" variants={itemVariants}>
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
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

      {/* Options Grid */}
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
                "relative text-left p-5 sm:p-6 rounded-2xl border-2 transition-all duration-300 overflow-hidden",
                isSelected
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/20"
                  : "border-border/50 bg-card/30 hover:border-primary/40 hover:bg-card/50"
              )}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Glow Effect when selected */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </AnimatePresence>

              {/* Recommended Badge */}
              {option.recommended && (
                <motion.div
                  className="absolute -top-px left-4 px-3 py-1 rounded-b-lg bg-gradient-to-r from-primary to-amber text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-md z-20"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                >
                  <Sparkles className="w-3 h-3" />
                  Recommended
                </motion.div>
              )}

              {/* Selection Indicator */}
              <motion.div
                className={cn(
                  "absolute top-4 right-4 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all",
                  isSelected
                    ? "bg-primary border-primary shadow-lg shadow-primary/30"
                    : "border-muted-foreground/30 bg-transparent"
                )}
                animate={isSelected ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Content */}
              <div className={cn("relative z-10", option.recommended && "pt-6")}>
                <div className="flex items-start gap-4 mb-4">
                  <motion.div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
                      isSelected 
                        ? "bg-gradient-to-br from-primary to-amber text-primary-foreground shadow-md" 
                        : "bg-muted/50 text-muted-foreground"
                    )}
                    animate={isSelected ? { rotate: [0, -10, 10, 0] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className="w-6 h-6" />
                  </motion.div>
                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                      {option.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {option.description}
                    </p>
                  </div>
                </div>

                {/* Deposit Info */}
                <motion.div
                  className={cn(
                    "p-3.5 rounded-xl transition-all duration-300",
                    isSelected 
                      ? "bg-primary/15 border border-primary/20" 
                      : "bg-muted/30 border border-transparent"
                  )}
                  layout
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Deposit</span>
                    <motion.span
                      className={cn(
                        "font-bold text-lg",
                        isSelected ? "gold-text" : "text-foreground"
                      )}
                      animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {option.deposit}
                    </motion.span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{option.depositNote}</p>
                </motion.div>

                {/* Benefits */}
                <ul className="mt-4 space-y-2.5">
                  {option.benefits.map((benefit, i) => (
                    <motion.li
                      key={i}
                      className="flex items-center gap-2.5 text-sm text-muted-foreground"
                      custom={i}
                      variants={benefitVariants}
                    >
                      <motion.span
                        className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                          isSelected 
                            ? "bg-primary/20 text-primary" 
                            : "bg-muted/50 text-muted-foreground"
                        )}
                        animate={isSelected ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ delay: i * 0.1 }}
                      >
                        ✓
                      </motion.span>
                      <span className={cn(isSelected && "text-foreground/80")}>
                        {benefit}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Policy Note */}
      <motion.div
        className="glass-card rounded-xl p-4 flex items-start gap-3 border border-border/30"
        variants={itemVariants}
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 4, repeatDelay: 2 }}
        >
          <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        </motion.div>
        <div>
          <p className="text-sm font-medium text-foreground mb-1">Deposit Policy</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your deposit is fully refundable if you cancel 24 hours before, or applied to your final bill when you dine with us.
          </p>
        </div>
      </motion.div>

      {/* Continue Button */}
      <motion.button
        onClick={onContinue}
        disabled={!selectedType}
        className={cn(
          "w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2 group",
          selectedType
            ? "bg-gradient-to-r from-primary to-amber text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40"
            : "bg-muted/50 text-muted-foreground cursor-not-allowed border border-border/30"
        )}
        variants={itemVariants}
        whileHover={selectedType ? { scale: 1.02, y: -2 } : {}}
        whileTap={selectedType ? { scale: 0.98 } : {}}
      >
        <span>{selectedType ? 'Continue' : 'Select an option'}</span>
        {selectedType && (
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.div>
        )}
      </motion.button>
    </motion.div>
  );
}
