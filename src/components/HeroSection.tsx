import { useLanguage } from '@/contexts/LanguageContext';
import { motion, Variants, useScroll, useTransform } from 'framer-motion';
import { Sparkles, UtensilsCrossed, Star, MapPin } from 'lucide-react';
import heroImage from '@/assets/hero-restaurant.jpg';

export function HeroSection() {
  const { t } = useLanguage();
  const { scrollY } = useScroll();
  
  // Parallax effects
  const backgroundY = useTransform(scrollY, [0, 500], [0, 150]);
  const contentY = useTransform(scrollY, [0, 500], [0, 50]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.3,
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.4, 0.25, 1]
      }
    }
  };

  const floatingVariants: Variants = {
    animate: {
      y: [-8, 8, -8],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Parallax */}
      <motion.div 
        className="absolute inset-0 z-0"
        style={{ y: backgroundY }}
      >
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/70 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
      </motion.div>

      {/* Animated golden particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Animated decorative rings */}
      <motion.div 
        className="absolute top-1/4 left-[10%] w-32 h-32 border border-primary/10 rounded-full hidden md:block"
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.25, 0.1],
          rotate: [0, 180, 360]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />
      <motion.div 
        className="absolute bottom-1/4 right-[10%] w-48 h-48 border border-amber/10 rounded-full hidden md:block"
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.15, 0.3, 0.15],
          rotate: [360, 180, 0]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />
      <motion.div 
        className="absolute top-[60%] left-[20%] w-20 h-20 border border-primary/15 rounded-full hidden lg:block"
        variants={floatingVariants}
        animate="animate"
      />

      {/* Main Content */}
      <motion.div 
        className="container mx-auto px-4 text-center relative z-10"
        style={{ y: contentY, opacity }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto"
        >
          {/* Top badge */}
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium tracking-wide">
              {t('welcome')}
            </span>
            <Sparkles className="w-4 h-4 text-primary" />
          </motion.div>
          
          {/* Restaurant name */}
          <motion.h1 
            variants={itemVariants}
            className="font-display text-6xl md:text-8xl lg:text-9xl font-bold mb-6 relative"
          >
            <motion.span 
              className="gold-text inline-block relative"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {t('restaurantName')}
              {/* Shimmer effect on text */}
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              />
            </motion.span>
          </motion.h1>
          
          {/* Tagline */}
          <motion.p 
            variants={itemVariants}
            className="text-xl md:text-2xl lg:text-3xl text-muted-foreground max-w-2xl mx-auto font-light mb-8"
          >
            {t('tagline')}
          </motion.p>

          {/* Feature badges */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-wrap justify-center gap-4 mb-10"
          >
            <motion.div 
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50"
              whileHover={{ scale: 1.05, borderColor: 'hsl(var(--primary))' }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <UtensilsCrossed className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground/80">Fine Dining</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50"
              whileHover={{ scale: 1.05, borderColor: 'hsl(var(--primary))' }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Star className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground/80">Award Winning</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50"
              whileHover={{ scale: 1.05, borderColor: 'hsl(var(--primary))' }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground/80">Masafi, UAE</span>
            </motion.div>
          </motion.div>
          
          {/* Decorative line */}
          <motion.div
            variants={itemVariants}
            className="flex justify-center items-center gap-4"
          >
            <motion.div 
              className="w-16 md:w-24 h-px bg-gradient-to-r from-transparent to-primary/50"
              initial={{ scaleX: 0, originX: 1 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
            />
            <motion.div
              className="w-2 h-2 rounded-full bg-primary"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.2, type: "spring", stiffness: 300 }}
            />
            <motion.div 
              className="w-16 md:w-24 h-px bg-gradient-to-l from-transparent to-primary/50"
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
            />
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-xs text-muted-foreground/60 uppercase tracking-widest">
              Explore Menu
            </span>
            <div className="w-6 h-10 border-2 border-primary/30 rounded-full flex justify-center pt-2">
              <motion.div 
                className="w-1.5 h-1.5 bg-primary rounded-full"
                animate={{ 
                  y: [0, 16, 0],
                  opacity: [1, 0.3, 1],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
