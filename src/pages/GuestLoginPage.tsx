import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGuestSession } from '@/contexts/GuestSessionContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, KeyRound, CalendarCheck, Utensils, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GuestLoginPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { setGuestReservation } = useGuestSession();
  const [reservationNumber, setReservationNumber] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reservationNumber.trim() || !pin.trim()) {
      toast.error('Please enter reservation number and PIN');
      return;
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast.error('PIN must be 4 digits');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc('verify_guest_access', {
        p_reservation_number: reservationNumber.trim().toUpperCase(),
        p_pin: pin
      });

      if (error) {
        console.error('RPC error:', error);
        toast.error('Failed to verify. Please try again.');
        return;
      }

      const result = data as { success: boolean; error?: string; reservation?: any };

      if (!result.success) {
        toast.error(result.error || 'Invalid credentials');
        return;
      }

      // Set guest session
      setGuestReservation(result.reservation);
      toast.success(`Welcome, ${result.reservation.full_name}!`);
      navigate('/preorder');
    } catch (err) {
      console.error('Error:', err);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full gold-gradient flex items-center justify-center">
              <Utensils className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              Pre-Order Your Meal
            </h1>
            <p className="text-muted-foreground">
              Access your reservation to order ahead
            </p>
          </motion.div>

          <motion.form 
            onSubmit={handleSubmit}
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="glass-card rounded-xl p-6 space-y-4">
              <div>
                <Label htmlFor="reservationNumber" className="flex items-center gap-2 mb-2">
                  <CalendarCheck className="w-4 h-4 text-primary" />
                  Reservation Number
                </Label>
                <Input
                  id="reservationNumber"
                  value={reservationNumber}
                  onChange={(e) => setReservationNumber(e.target.value.toUpperCase())}
                  placeholder="RES-20260102-1234"
                  className="input-field uppercase"
                />
              </div>

              <div>
                <Label htmlFor="pin" className="flex items-center gap-2 mb-2">
                  <KeyRound className="w-4 h-4 text-primary" />
                  PIN (Last 4 digits of phone)
                </Label>
                <Input
                  id="pin"
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="input-field text-center text-2xl tracking-widest"
                />
              </div>
            </div>

            <div className="glass-card rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">How it works:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Enter your reservation number (from confirmation)</li>
                  <li>PIN is the last 4 digits of your phone number</li>
                  <li>Pre-order your meals before arrival</li>
                  <li>Your order will be ready when you arrive!</li>
                </ul>
              </div>
            </div>

            <Button 
              type="submit" 
              variant="gold" 
              size="xl" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Access Pre-Order'}
            </Button>
          </motion.form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have a reservation?{' '}
            <Link to="/reserve" className="text-primary hover:underline">
              Book a table
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
