import { useState } from 'react';
import { useLanguage, LanguageProvider } from '@/contexts/LanguageContext';
import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScanLine, Check, AlertTriangle, ArrowLeft, Loader2, Shield, Camera, Keyboard } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { QRScanner } from '@/components/QRScanner';

interface ReservationInfo {
  id: string;
  reservation_number: string;
  full_name: string;
  guests: number;
  reservation_date: string;
  reservation_time: string;
  special_requests?: string;
}

function CheckinContent() {
  const { t } = useLanguage();
  const { user, isStaff, isAdmin, loading: authLoading } = useAuth();
  const [reservationCode, setReservationCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string>('');
  const [reservationInfo, setReservationInfo] = useState<ReservationInfo | null>(null);

  // Redirect non-staff users
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isStaff && !isAdmin) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center">
            <Shield className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Access Denied
          </h1>
          <p className="text-muted-foreground mb-6">
            Only staff members can access the check-in system.
          </p>
          <Link to="/">
            <Button variant="gold">Return to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleVerify = async (codeOrQr: string, isQrCode = false) => {
    const code = codeOrQr.trim();
    if (!code) {
      toast.error('Please enter a reservation number');
      return;
    }

    setStatus('loading');
    setError('');
    
    try {
      const body = isQrCode 
        ? { qrCode: code }
        : { reservationNumber: code.toUpperCase() };

      const { data, error: fnError } = await supabase.functions.invoke('validate-qr', {
        body
      });

      if (fnError) {
        throw new Error(fnError.message || 'Verification failed');
      }

      if (!data.success) {
        setStatus('error');
        setError(data.error || 'Reservation not found');
        toast.error(data.error || 'Reservation not found');
        return;
      }

      setStatus('success');
      setReservationInfo(data.reservation);
      toast.success('Guest checked in successfully!');

    } catch (err) {
      console.error('Verification error:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Verification failed');
      toast.error(err instanceof Error ? err.message : 'Verification failed');
    }
  };

  const handleQRScan = (data: string) => {
    handleVerify(data, true);
  };

  const handleManualVerify = () => {
    handleVerify(reservationCode, false);
  };

  const handleReset = () => {
    setStatus('idle');
    setReservationInfo(null);
    setReservationCode('');
    setError('');
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
          <div className="glass-card rounded-xl p-6 mb-6">
            <Tabs defaultValue="scan" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="scan" className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Scan QR
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4" />
                  Enter Code
                </TabsTrigger>
              </TabsList>

              <TabsContent value="scan">
                <QRScanner 
                  onScan={handleQRScan}
                  onError={(err) => toast.error(err)}
                />
              </TabsContent>

              <TabsContent value="manual">
                <div className="space-y-4">
                  <Input
                    placeholder="RES-20241227-1234"
                    value={reservationCode}
                    onChange={(e) => setReservationCode(e.target.value)}
                    className="input-field text-center text-lg"
                    onKeyDown={(e) => e.key === 'Enter' && handleManualVerify()}
                  />
                  <Button variant="gold" size="lg" className="w-full" onClick={handleManualVerify}>
                    {t('checkin.verify')}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {status === 'loading' && (
          <div className="glass-card rounded-xl p-6 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Verifying reservation...</p>
          </div>
        )}

        {status === 'success' && reservationInfo && (
          <div className="glass-card rounded-xl p-6 animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-success" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Guest Checked In
              </h2>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between py-3 border-b border-border/50">
                <span className="text-muted-foreground">Guest Name</span>
                <span className="font-medium text-foreground">{reservationInfo.full_name}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-border/50">
                <span className="text-muted-foreground">Party Size</span>
                <span className="font-medium text-foreground">{reservationInfo.guests} guests</span>
              </div>
              <div className="flex justify-between py-3 border-b border-border/50">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium text-foreground">{reservationInfo.reservation_date}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-border/50">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium text-foreground">{reservationInfo.reservation_time}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-muted-foreground">Reservation #</span>
                <span className="font-medium text-foreground">{reservationInfo.reservation_number}</span>
              </div>
              {reservationInfo.special_requests && (
                <div className="py-3 border-t border-border/50">
                  <span className="text-muted-foreground block mb-2">Special Requests</span>
                  <span className="text-foreground">{reservationInfo.special_requests}</span>
                </div>
              )}
            </div>

            <Button variant="gold" className="w-full" onClick={handleReset}>
              Check In Another Guest
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="glass-card rounded-xl p-6 animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                Check-in Failed
              </h2>
              <p className="text-muted-foreground">
                {error}
              </p>
            </div>

            <Button
              variant="gold"
              className="w-full"
              onClick={handleReset}
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
    <AuthProvider>
      <LanguageProvider>
        <CartProvider>
          <Header />
          <CheckinContent />
        </CartProvider>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default CheckinPage;
