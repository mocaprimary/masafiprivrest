import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const hapticButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-md",
        outline: "border border-border bg-transparent text-foreground",
        ghost: "text-foreground hover:bg-secondary",
        chip: "bg-muted/70 text-muted-foreground border border-transparent",
        chipActive: "bg-primary text-primary-foreground shadow-lg",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-lg px-6",
        chip: "h-10 sm:h-9 px-3 sm:px-4 rounded-full text-xs sm:text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface HapticButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref">,
    VariantProps<typeof hapticButtonVariants> {
  children: React.ReactNode;
  hapticIntensity?: "light" | "medium" | "strong";
}

const HapticButton = React.forwardRef<HTMLButtonElement, HapticButtonProps>(
  ({ className, variant, size, hapticIntensity = "medium", children, ...props }, ref) => {
    const getHapticScale = () => {
      switch (hapticIntensity) {
        case "light": return { tap: 0.98, hover: 1.02 };
        case "strong": return { tap: 0.92, hover: 1.06 };
        default: return { tap: 0.95, hover: 1.04 };
      }
    };

    const scales = getHapticScale();

    return (
      <motion.button
        ref={ref}
        className={cn(hapticButtonVariants({ variant, size, className }))}
        whileHover={{ 
          scale: scales.hover,
          transition: { type: "spring", stiffness: 400, damping: 17 }
        }}
        whileTap={{ 
          scale: scales.tap,
          transition: { type: "spring", stiffness: 500, damping: 15 }
        }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
HapticButton.displayName = "HapticButton";

export { HapticButton, hapticButtonVariants };
