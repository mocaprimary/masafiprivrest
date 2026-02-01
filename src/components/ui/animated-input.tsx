import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedInputProps extends Omit<React.ComponentProps<"input">, "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"> {
  containerClassName?: string;
}

const AnimatedInput = React.forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ className, containerClassName, type, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <motion.div
        className={cn("relative", containerClassName)}
        animate={isFocused ? { scale: 1.01 } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-200",
            isFocused && "border-primary/50 shadow-sm shadow-primary/10",
            className,
          )}
          ref={ref}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {/* Focus glow effect */}
        <motion.div
          className="absolute inset-0 rounded-md pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: isFocused ? 1 : 0,
            boxShadow: isFocused 
              ? "0 0 0 2px hsl(var(--primary) / 0.1), 0 4px 12px -2px hsl(var(--primary) / 0.15)"
              : "0 0 0 0 transparent"
          }}
          transition={{ duration: 0.2 }}
        />
      </motion.div>
    );
  },
);
AnimatedInput.displayName = "AnimatedInput";

export { AnimatedInput };
