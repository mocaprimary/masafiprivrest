import { useLanguage } from '@/contexts/LanguageContext';
import { motion, Variants, useScroll, useTransform } from 'framer-motion';
import { ChevronDown, MapPin } from 'lucide-react';
import heroImage from '@/assets/hero-restaurant.jpg';

export function HeroSection() {
  const { t } = useLanguage();
  const { scrollY } = useScroll();
  
  const backgroundY = useTransform(scrollY, [0, 500], [0, 100]);
  const contentOpacity = useTransform(scrollY, [0, 300], [1, 0.5]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.18,
        delayChildren: 0.3,
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.25, 0.4, 0.25, 1]
      }
    }
  };

  const scrollToMenu = () => {
    const menuSection = document.querySelector('section.container');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with parallax */}
      <motion.div 
        className="absolute inset-0 z-0"
        style={{ y: backgroundY }}
      >
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        {/* Layered overlays for depth */}
        <div className="absolute inset-0 bg-background/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-background/40" />
      </motion.div>

      {/* Content */}
      <motion.div 
        className="container mx-auto px-4 text-center relative z-10"
        style={{ opacity: contentOpacity }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-3xl mx-auto"
        >
          {/* Location tag */}
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card/60 backdrop-blur-sm border border-border/40 mb-8"
          >
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">Masafi, UAE</span>
          </motion.div>
          
          {/* Welcome text */}
          <motion.p 
            variants={itemVariants}
            className="text-primary text-sm uppercase tracking-[0.3em] mb-4 font-medium"
          >
            {t('welcome')}
          </motion.p>
          
          {/* Restaurant name */}
          <motion.h1 
            variants={itemVariants}
            className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold mb-4 text-foreground leading-[0.9]"
          >
            {t('restaurantName')}
          </motion.h1>
          
          {/* Decorative divider */}
          <motion.div
            variants={itemVariants}
            className="flex justify-center items-center gap-4 mb-6"
          >
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-primary/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-primary/80" />
            <div className="w-16 h-px bg-gradient-to-l from-transparent to-primary/50" />
          </motion.div>
          
          {/* Tagline */}
          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto mb-12 leading-relaxed"
          >
            {t('tagline')}
          </motion.p>

          {/* CTA Button */}
          <motion.button
            variants={itemVariants}
            onClick={scrollToMenu}
            className="inline-flex items-center gap-3 px-10 py-4 rounded-full bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-all duration-300 shadow-gold"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            Explore Menu
            <ChevronDown className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">Scroll</span>
          <ChevronDown className="w-5 h-5 text-muted-foreground/40" />
        </motion.div>
      </motion.div>
    </section>
  );
}
