import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Calendar, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ReservationCTA() {
  const { t } = useLanguage();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-background via-background to-transparent">
      <div className="container mx-auto max-w-lg">
        <Link to="/reserve">
          <Button variant="gold" size="xl" className="w-full gap-3 group">
            <Calendar className="w-5 h-5" />
            <span>{t('reservation.cta')}</span>
            <Sparkles className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
          </Button>
        </Link>
        <p className="text-center text-xs text-muted-foreground mt-2">
          {t('reservation.subtitle')}
        </p>
      </div>
    </div>
  );
}
