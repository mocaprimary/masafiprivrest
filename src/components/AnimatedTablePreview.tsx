import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimatedTablePreviewProps {
  guests: number;
  date?: string;
  time?: string;
  className?: string;
  compact?: boolean;
}

export function AnimatedTablePreview({ guests, date, time, className, compact = false }: AnimatedTablePreviewProps) {
  const maxSeats = 8;
  const displaySeats = Math.min(guests, maxSeats);
  const isLargeParty = guests > maxSeats;
  
  // Calculate table size based on guests - smaller on compact mode
  const tableSize = guests <= 2 ? 'sm' : guests <= 4 ? 'md' : guests <= 6 ? 'lg' : 'xl';
  
  const tableSizes = compact ? {
    sm: { width: 60, height: 60 },
    md: { width: 90, height: 75 },
    lg: { width: 120, height: 90 },
    xl: { width: 140, height: 100 },
  } : {
    sm: { width: 80, height: 80 },
    md: { width: 120, height: 100 },
    lg: { width: 160, height: 120 },
    xl: { width: 200, height: 140 },
  };

  const { width, height } = tableSizes[tableSize];
  const seatSize = compact ? 24 : 32;
  const padding = compact ? 18 : 24;

  // Generate seat positions around the table
  const generateSeatPositions = (count: number) => {
    const positions: { x: number; y: number; rotation: number }[] = [];
    
    if (count <= 2) {
      positions.push({ x: width / 2, y: -padding, rotation: 0 });
      if (count > 1) positions.push({ x: width / 2, y: height + padding, rotation: 180 });
    } else if (count <= 4) {
      positions.push({ x: width / 2, y: -padding, rotation: 0 });
      positions.push({ x: width / 2, y: height + padding, rotation: 180 });
      if (count > 2) positions.push({ x: -padding, y: height / 2, rotation: -90 });
      if (count > 3) positions.push({ x: width + padding, y: height / 2, rotation: 90 });
    } else {
      const seatsTop = Math.ceil(count / 4);
      const seatsBottom = Math.ceil(count / 4);
      const seatsLeft = Math.floor((count - seatsTop - seatsBottom) / 2);
      const seatsRight = count - seatsTop - seatsBottom - seatsLeft;
      
      for (let i = 0; i < seatsTop; i++) {
        const spacing = width / (seatsTop + 1);
        positions.push({ x: spacing * (i + 1), y: -padding, rotation: 0 });
      }
      
      for (let i = 0; i < seatsBottom; i++) {
        const spacing = width / (seatsBottom + 1);
        positions.push({ x: spacing * (i + 1), y: height + padding, rotation: 180 });
      }
      
      for (let i = 0; i < seatsLeft; i++) {
        const spacing = height / (seatsLeft + 1);
        positions.push({ x: -padding, y: spacing * (i + 1), rotation: -90 });
      }
      
      for (let i = 0; i < seatsRight; i++) {
        const spacing = height / (seatsRight + 1);
        positions.push({ x: width + padding, y: spacing * (i + 1), rotation: 90 });
      }
    }
    
    return positions.slice(0, count);
  };

  const seatPositions = generateSeatPositions(displaySeats);
  const containerWidth = width + (compact ? 60 : 80);
  const containerHeight = height + (compact ? 60 : 80);

  return (
    <div className={cn(
      "relative flex flex-col items-center justify-center",
      compact ? "py-4" : "py-6 sm:py-8",
      className
    )}>
      {/* Ambient glow - hidden on compact */}
      {!compact && (
        <motion.div
          className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
      
      {/* Table and seats container */}
      <div 
        className="relative"
        style={{ 
          width: containerWidth, 
          height: containerHeight,
        }}
      >
        {/* Animated seats */}
        <AnimatePresence mode="popLayout">
          {seatPositions.map((pos, index) => (
            <motion.div
              key={`seat-${index}-${guests}`}
              className="absolute"
              initial={{ 
                scale: 0, 
                opacity: 0,
                x: pos.x - seatSize/2 + containerWidth / 2 - width / 2,
                y: pos.y - seatSize/2 + containerHeight / 2 - height / 2,
              }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                x: pos.x - seatSize/2 + containerWidth / 2 - width / 2,
                y: pos.y - seatSize/2 + containerHeight / 2 - height / 2,
              }}
              exit={{ 
                scale: 0, 
                opacity: 0,
              }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: index * 0.06,
              }}
            >
              <motion.div
                className={cn(
                  "rounded-full bg-gradient-to-br from-primary/80 to-primary border-2 border-primary-foreground/20 shadow-lg flex items-center justify-center",
                  compact ? "w-6 h-6" : "w-8 h-8"
                )}
                animate={{
                  y: [0, -2, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.15,
                  ease: "easeInOut",
                }}
              >
                <span className={cn(
                  "font-bold text-primary-foreground",
                  compact ? "text-[10px]" : "text-xs"
                )}>
                  {index + 1}
                </span>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Main table */}
        <motion.div
          className="absolute left-1/2 top-1/2 bg-gradient-to-br from-amber-800/80 via-amber-900/90 to-amber-950/80 shadow-2xl border-4 border-amber-700/50"
          style={{
            width,
            height,
          }}
          initial={{ scale: 0.8, opacity: 0, x: "-50%", y: "-50%" }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            x: "-50%",
            y: "-50%",
            borderRadius: guests <= 2 ? "50%" : guests <= 4 ? "16px" : "20px",
          }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          {/* Table surface reflection */}
          <motion.div
            className="absolute inset-1 sm:inset-2 rounded-lg bg-gradient-to-br from-amber-600/20 via-transparent to-amber-950/30"
            animate={{
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Table center decoration */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className={cn(
                "rounded-full bg-gradient-to-br from-primary/60 to-primary/30 flex items-center justify-center shadow-inner",
                compact ? "w-5 h-5" : "w-8 h-8"
              )}
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Users className={cn(
                "text-primary-foreground/80",
                compact ? "w-3 h-3" : "w-4 h-4"
              )} />
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Guest count display */}
      <motion.div
        className={cn("text-center", compact ? "mt-2" : "mt-4")}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        key={guests}
      >
        <motion.p
          className={cn(
            "font-bold gold-text",
            compact ? "text-xl" : "text-2xl sm:text-3xl"
          )}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.3 }}
          key={guests}
        >
          {guests} {guests === 1 ? 'Guest' : 'Guests'}
        </motion.p>
        {isLargeParty && (
          <motion.p
            className="text-xs sm:text-sm text-muted-foreground mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Large party - multiple tables
          </motion.p>
        )}
      </motion.div>

      {/* Date/Time display - only on non-compact */}
      {!compact && date && time && (
        <motion.div
          className="mt-2 sm:mt-3 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span className="px-2 sm:px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            📅 {date}
          </span>
          <span className="px-2 sm:px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            🕐 {time}
          </span>
        </motion.div>
      )}

      {/* Floating decorative elements - hidden on compact */}
      {!compact && (
        <>
          <motion.div
            className="absolute top-2 sm:top-4 left-2 sm:left-4 text-lg sm:text-2xl opacity-40"
            animate={{
              y: [0, -8, 0],
              rotate: [0, 10, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            ✨
          </motion.div>
          <motion.div
            className="absolute top-4 sm:top-8 right-4 sm:right-6 text-base sm:text-xl opacity-30"
            animate={{
              y: [0, -6, 0],
              rotate: [0, -15, 0],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          >
            🍷
          </motion.div>
          <motion.div
            className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 text-sm sm:text-lg opacity-25"
            animate={{
              y: [0, -5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          >
            🍽️
          </motion.div>
        </>
      )}
    </div>
  );
}
