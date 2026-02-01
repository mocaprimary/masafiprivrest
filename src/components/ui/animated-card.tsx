import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  children: React.ReactNode;
  delay?: number;
  hoverEffect?: boolean;
}

const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, children, delay = 0, hoverEffect = false, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "glass-card rounded-xl transition-all duration-300",
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.4, 
          delay,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
        whileHover={hoverEffect ? { 
          y: -4, 
          boxShadow: "0 20px 40px -15px hsl(var(--primary) / 0.15)",
          transition: { type: "spring", stiffness: 300, damping: 20 }
        } : undefined}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
AnimatedCard.displayName = "AnimatedCard";

// Step indicator with pulse animation
interface StepIndicatorProps {
  step: number;
  isActive?: boolean;
  isCompleted?: boolean;
}

const StepIndicator = ({ step, isActive = false, isCompleted = false }: StepIndicatorProps) => {
  return (
    <motion.span
      className={cn(
        "w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all",
        isCompleted 
          ? "bg-primary text-primary-foreground" 
          : isActive 
            ? "bg-primary/20 text-primary ring-2 ring-primary/30" 
            : "bg-muted text-muted-foreground"
      )}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      whileHover={{ scale: 1.1 }}
    >
      {isCompleted ? "✓" : step}
    </motion.span>
  );
};

export { AnimatedCard, StepIndicator };
