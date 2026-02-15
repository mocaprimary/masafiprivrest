import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function ReservationCTA() {
  const { t } = useLanguage();

  return (
    <motion.div 
      className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-background via-background/95 to-transparent"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
    >
      <div className="container mx-auto max-w-md">
        <Link to="/reserve">
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button variant="gold" size="lg" className="w-full gap-3 rounded-full text-base font-semibold">
              <Calendar className="w-5 h-5" />
              {t('reservation.cta')}
            </Button>
          </motion.div>
        </Link>
        <p className="text-center text-xs text-muted-foreground mt-2">
          {t('reservation.subtitle')}
        </p>
      </div>
    </motion.div>
  );
}
