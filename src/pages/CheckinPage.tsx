import { useState } from 'react';
import { useLanguage, LanguageProvider } from '@/contexts/LanguageContext';
import { CartProvider } from '@/contexts/CartContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScanLine, Check, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

function CheckinContent() {
  const { t } = useLanguage();
  const [reservationCode, setReservationCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [guestInfo, setGuestInfo] = useState<{
    name: string;
    guests: number;
    deposit: number;
  } | null>(null);

  const handleVerify = () => {
    if (!reservationCode.trim()) {
      toast.error('Please enter a reservation number');
      return;
    }

    toast.loading('Verifying reservation...');
    
    setTimeout(() => {
      toast.dismiss();
      
      // Simulate verification
      if (reservationCode.toUpperCase().startsWith('OAS')) {
        setStatus('success');
        setGuestInfo({
          name: 'John Doe',
          guests: 4,
          deposit: 100,
        });
        toast.success('Reservation verified!');
      } else {
        setStatus('error');
        toast.error('Reservation not found');
      }
    }, 1500);
  };

  const handleCheckin = () => {
    toast.loading('Checking in guest...');
    setTimeout(() => {
      toast.dismiss();
      toast.success('Guest checked in successfully!');
      setReservationCode('');
      setStatus('idle');
      setGuestInfo(null);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-8">
      <div className="container mx-auto px-4 max-w-md">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full gold-gradient flex items-center justify-center">
            <ScanLine className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            {t('checkin.title')}
          </h1>
          <p className="text-muted-foreground">
            Verify guest reservations at entry
          </p>
        </div>

        {status === 'idle' && (
          <>
            <div className="glass-card rounded-xl p-6 mb-6">
              <div className="w-full aspect-square bg-secondary rounded-lg flex items-center justify-center mb-6">
                <div className="text-center">
                  <ScanLine className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{t('checkin.scan')}</p>
                </div>
              </div>

              <div className="relative flex items-center my-6">
                <div className="flex-1 border-t border-border"></div>
                <span className="px-4 text-sm text-muted-foreground">{t('checkin.or')}</span>
                <div className="flex-1 border-t border-border"></div>
              </div>

              <div className="space-y-4">
                <Input
                  placeholder="OAS-2024-1234"
                  value={reservationCode}
                  onChange={(e) => setReservationCode(e.target.value)}
                  className="input-field text-center text-lg"
                />
                <Button variant="gold" size="lg" className="w-full" onClick={handleVerify}>
                  {t('checkin.verify')}
                </Button>
              </div>
            </div>
          </>
        )}

        {status === 'success' && guestInfo && (
          <div className="glass-card rounded-xl p-6 animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-success" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Reservation Found
              </h2>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between py-3 border-b border-border/50">
                <span className="text-muted-foreground">Guest Name</span>
                <span className="font-medium text-foreground">{guestInfo.name}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-border/50">
                <span className="text-muted-foreground">Party Size</span>
                <span className="font-medium text-foreground">{guestInfo.guests} guests</span>
              </div>
              <div className="flex justify-between py-3 border-b border-border/50">
                <span className="text-muted-foreground">Deposit Paid</span>
                <span className="font-medium text-success">{guestInfo.deposit} AED</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-muted-foreground">Reservation #</span>
                <span className="font-medium text-foreground">{reservationCode.toUpperCase()}</span>
              </div>
            </div>

            <div className="bg-amber/10 border border-amber/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-foreground">
                {t('checkin.depositNote')}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setStatus('idle');
                  setGuestInfo(null);
                  setReservationCode('');
                }}
              >
                Cancel
              </Button>
              <Button variant="gold" className="flex-1" onClick={handleCheckin}>
                Check In Guest
              </Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="glass-card rounded-xl p-6 animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                Reservation Not Found
              </h2>
              <p className="text-muted-foreground">
                The code "{reservationCode}" doesn't match any active reservation.
              </p>
            </div>

            <Button
              variant="gold"
              className="w-full"
              onClick={() => {
                setStatus('idle');
                setReservationCode('');
              }}
            >
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

const CheckinPage = () => {
  return (
    <LanguageProvider>
      <CartProvider>
        <Header />
        <CheckinContent />
      </CartProvider>
    </LanguageProvider>
  );
};

export default CheckinPage;
