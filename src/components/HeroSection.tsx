import { useLanguage } from '@/contexts/LanguageContext';
import { motion, Variants } from 'framer-motion';

export function HeroSection() {
  const { t } = useLanguage();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
      }
    }
  };

  return (
    <section className="relative min-h-[40vh] flex items-center justify-center overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              'radial-gradient(circle at 25% 25%, hsl(38 70% 50%) 0%, transparent 50%)',
              'radial-gradient(circle at 75% 75%, hsl(38 70% 50%) 0%, transparent 50%)',
              'radial-gradient(circle at 25% 25%, hsl(38 70% 50%) 0%, transparent 50%)',
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--primary)) 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, hsl(var(--amber)) 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* Animated decorative elements */}
      <motion.div 
        className="absolute top-1/4 left-10 w-20 h-20 border border-primary/20 rounded-full"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
          rotate: [0, 180, 360]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      <motion.div 
        className="absolute bottom-1/4 right-10 w-32 h-32 border border-amber/20 rounded-full"
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
          rotate: [360, 180, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />
      <motion.div 
        className="absolute top-1/2 left-1/4 w-16 h-16 border border-primary/10 rounded-full hidden md:block"
        animate={{ 
          y: [-10, 10, -10],
          x: [-5, 5, -5],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.p 
            variants={itemVariants}
            className="text-muted-foreground text-sm uppercase tracking-[0.3em] mb-4"
          >
            {t('welcome')}
          </motion.p>
          
          <motion.h1 
            variants={itemVariants}
            className="font-display text-5xl md:text-7xl font-bold mb-4"
          >
            <motion.span 
              className="gold-text inline-block"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {t('restaurantName')}
            </motion.span>
          </motion.h1>
          
          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto"
          >
            {t('tagline')}
          </motion.p>
          
          {/* Decorative line */}
          <motion.div
            variants={itemVariants}
            className="mt-8 flex justify-center"
          >
            <motion.div 
              className="w-24 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
            />
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2"
          >
            <motion.div 
              className="w-1.5 h-1.5 bg-primary rounded-full"
              animate={{ 
                opacity: [1, 0.3, 1],
                scale: [1, 0.8, 1]
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
