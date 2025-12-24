import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-[40vh] flex items-center justify-center overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--primary)) 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, hsl(var(--amber)) 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* Decorative elements */}
      <div className="absolute top-1/4 left-10 w-20 h-20 border border-primary/20 rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 right-10 w-32 h-32 border border-amber/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-muted-foreground text-sm uppercase tracking-[0.3em] mb-4">
            {t('welcome')}
          </p>
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-4">
            <span className="gold-text">{t('restaurantName')}</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto">
            {t('tagline')}
          </p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
        >
          <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
