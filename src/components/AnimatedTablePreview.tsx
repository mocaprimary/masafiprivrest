import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimatedTablePreviewProps {
  guests: number;
  date?: string;
  time?: string;
  className?: string;
}

export function AnimatedTablePreview({ guests, date, time, className }: AnimatedTablePreviewProps) {
  const maxSeats = 8;
  const displaySeats = Math.min(guests, maxSeats);
  const isLargeParty = guests > maxSeats;
  
  // Calculate table size based on guests
  const tableSize = guests <= 2 ? 'sm' : guests <= 4 ? 'md' : guests <= 6 ? 'lg' : 'xl';
  
  const tableSizes = {
    sm: { width: 80, height: 80 },
    md: { width: 120, height: 100 },
    lg: { width: 160, height: 120 },
    xl: { width: 200, height: 140 },
  };

  const { width, height } = tableSizes[tableSize];

  // Generate seat positions around the table
  const generateSeatPositions = (count: number) => {
    const positions: { x: number; y: number; rotation: number }[] = [];
    const padding = 24;
    
    if (count <= 2) {
      // Two seats opposite each other
      positions.push({ x: width / 2, y: -padding, rotation: 0 });
      if (count > 1) positions.push({ x: width / 2, y: height + padding, rotation: 180 });
    } else if (count <= 4) {
      // Seats on all sides
      positions.push({ x: width / 2, y: -padding, rotation: 0 });
      positions.push({ x: width / 2, y: height + padding, rotation: 180 });
      if (count > 2) positions.push({ x: -padding, y: height / 2, rotation: -90 });
      if (count > 3) positions.push({ x: width + padding, y: height / 2, rotation: 90 });
    } else {
      // Multiple seats per side
      const seatsTop = Math.ceil(count / 4);
      const seatsBottom = Math.ceil(count / 4);
      const seatsLeft = Math.floor((count - seatsTop - seatsBottom) / 2);
      const seatsRight = count - seatsTop - seatsBottom - seatsLeft;
      
      // Top seats
      for (let i = 0; i < seatsTop; i++) {
        const spacing = width / (seatsTop + 1);
        positions.push({ x: spacing * (i + 1), y: -padding, rotation: 0 });
      }
      
      // Bottom seats
      for (let i = 0; i < seatsBottom; i++) {
        const spacing = width / (seatsBottom + 1);
        positions.push({ x: spacing * (i + 1), y: height + padding, rotation: 180 });
      }
      
      // Left seats
      for (let i = 0; i < seatsLeft; i++) {
        const spacing = height / (seatsLeft + 1);
        positions.push({ x: -padding, y: spacing * (i + 1), rotation: -90 });
      }
      
      // Right seats
      for (let i = 0; i < seatsRight; i++) {
        const spacing = height / (seatsRight + 1);
        positions.push({ x: width + padding, y: spacing * (i + 1), rotation: 90 });
      }
    }
    
    return positions.slice(0, count);
  };

  const seatPositions = generateSeatPositions(displaySeats);

  return (
    <div className={cn("relative flex flex-col items-center justify-center py-8", className)}>
      {/* Ambient glow */}
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
      
      {/* Table and seats container */}
      <div 
        className="relative"
        style={{ 
          width: width + 80, 
          height: height + 80,
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
                x: pos.x - 16 + (width + 80) / 2 - width / 2,
                y: pos.y - 16 + (height + 80) / 2 - height / 2,
              }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                x: pos.x - 16 + (width + 80) / 2 - width / 2,
                y: pos.y - 16 + (height + 80) / 2 - height / 2,
              }}
              exit={{ 
                scale: 0, 
                opacity: 0,
              }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: index * 0.08,
              }}
            >
              <motion.div
                className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary border-2 border-primary-foreground/20 shadow-lg flex items-center justify-center"
                animate={{
                  y: [0, -3, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: "easeInOut",
                }}
              >
                <span className="text-xs font-bold text-primary-foreground">
                  {index + 1}
                </span>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Main table */}
        <motion.div
          className="absolute left-1/2 top-1/2 bg-gradient-to-br from-amber-800/80 via-amber-900/90 to-amber-950/80 rounded-xl shadow-2xl border-4 border-amber-700/50"
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
            className="absolute inset-2 rounded-lg bg-gradient-to-br from-amber-600/20 via-transparent to-amber-950/30"
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
              className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/60 to-primary/30 flex items-center justify-center shadow-inner"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Users className="w-4 h-4 text-primary-foreground/80" />
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Guest count display */}
      <motion.div
        className="mt-4 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        key={guests}
      >
        <motion.p
          className="text-3xl font-bold gold-text"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.3 }}
          key={guests}
        >
          {guests} {guests === 1 ? 'Guest' : 'Guests'}
        </motion.p>
        {isLargeParty && (
          <motion.p
            className="text-sm text-muted-foreground mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Large party - we'll arrange multiple tables
          </motion.p>
        )}
      </motion.div>

      {/* Date/Time display */}
      {date && time && (
        <motion.div
          className="mt-3 flex items-center gap-3 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            📅 {date}
          </span>
          <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            🕐 {time}
          </span>
        </motion.div>
      )}

      {/* Floating decorative elements */}
      <motion.div
        className="absolute top-4 left-4 text-2xl opacity-40"
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
        className="absolute top-8 right-6 text-xl opacity-30"
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
        className="absolute bottom-8 left-8 text-lg opacity-25"
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
    </div>
  );
}
