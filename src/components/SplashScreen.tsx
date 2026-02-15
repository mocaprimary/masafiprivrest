import { motion } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, delay: 2.5 }}
      onAnimationComplete={(definition) => {
        if (definition === 'exit') {
          onComplete();
        }
      }}
    >
      {/* Minimal geometric background */}
      <motion.div
        className="absolute w-px h-64 bg-gradient-to-b from-transparent via-primary/30 to-transparent"
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />

      {/* Logo container */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        {/* Square logo mark */}
        <motion.div
          className="relative mb-8"
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 150, 
            damping: 15,
            delay: 0.4 
          }}
        >
          <div className="w-20 h-20 border-2 border-primary flex items-center justify-center">
            <span className="font-display text-3xl font-bold text-primary">O</span>
          </div>
        </motion.div>

        {/* Restaurant name */}
        <motion.h1
          className="text-4xl md:text-5xl font-display font-black text-foreground tracking-tighter mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          The Oasis
        </motion.h1>

        {/* Tagline */}
        <motion.p
          className="text-muted-foreground text-xs tracking-[0.4em] uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          Fine Dining
        </motion.p>

        {/* Loading line */}
        <motion.div
          className="mt-10 w-12 h-px bg-primary/50 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <motion.div
            className="h-full bg-primary"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      </motion.div>

      {/* Auto-complete after animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 2.8 }}
        onAnimationComplete={() => onComplete()}
      />
    </motion.div>
  );
}
