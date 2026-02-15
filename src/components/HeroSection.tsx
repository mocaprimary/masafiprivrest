import { useLanguage } from '@/contexts/LanguageContext';
import { motion, Variants, useScroll, useTransform } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import heroImage from '@/assets/hero-restaurant.jpg';

export function HeroSection() {
  const { t } = useLanguage();
  const { scrollY } = useScroll();
  
  const backgroundY = useTransform(scrollY, [0, 500], [0, 150]);
  const contentOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const contentY = useTransform(scrollY, [0, 400], [0, -50]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
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
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1]
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
    <section className="relative h-screen flex items-end justify-start overflow-hidden">
      {/* Full-bleed background with parallax */}
      <motion.div 
        className="absolute inset-0 z-0"
        style={{ y: backgroundY }}
      >
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        {/* Cinematic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent" />
      </motion.div>

      {/* Vertical line accent */}
      <motion.div
        className="absolute left-8 md:left-16 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent z-10"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
      />

      {/* Main Content — Bottom-left aligned, editorial style */}
      <motion.div 
        className="container mx-auto px-8 md:px-16 pb-32 relative z-10"
        style={{ opacity: contentOpacity, y: contentY }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-2xl"
        >
          {/* Thin uppercase label */}
          <motion.p 
            variants={itemVariants}
            className="text-primary text-xs uppercase tracking-[0.4em] mb-6 font-medium"
          >
            {t('welcome')}
          </motion.p>
          
          {/* Massive display heading */}
          <motion.h1 
            variants={itemVariants}
            className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black mb-8 text-foreground leading-[0.9] tracking-tighter"
          >
            <span className="block">{t('restaurantName')}</span>
          </motion.h1>
          
          {/* Gold line accent */}
          <motion.div
            variants={itemVariants}
            className="w-20 h-0.5 bg-primary mb-8"
          />
          
          {/* Tagline — subdued, elegant */}
          <motion.p 
            variants={itemVariants}
            className="text-lg text-muted-foreground max-w-md mb-10 font-light leading-relaxed"
          >
            {t('tagline')}
          </motion.p>

          {/* Minimal CTA */}
          <motion.button
            variants={itemVariants}
            onClick={scrollToMenu}
            className="group inline-flex items-center gap-4 text-primary text-sm uppercase tracking-[0.2em] font-medium hover:text-foreground transition-colors duration-500"
            whileHover={{ x: 5 }}
          >
            <span>Explore Menu</span>
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowDown className="w-4 h-4" />
            </motion.div>
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
}
