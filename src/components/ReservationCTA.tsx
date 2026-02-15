import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function ReservationCTA() {
  const { t } = useLanguage();

  return (
    <motion.div 
      className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-background via-background/95 to-transparent"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="container mx-auto max-w-lg">
        <Link to="/reserve">
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Button variant="gold" size="xl" className="w-full gap-3 group">
              <span className="uppercase tracking-wider text-sm">{t('reservation.cta')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </Link>
        <motion.p 
          className="text-center text-xs text-muted-foreground mt-2 tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {t('reservation.subtitle')}
        </motion.p>
      </div>
    </motion.div>
  );
}
