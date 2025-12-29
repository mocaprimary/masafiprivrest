import { useState } from 'react';
import { useLanguage, LanguageProvider } from '@/contexts/LanguageContext';
import { CartProvider } from '@/contexts/CartContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Users, CreditCard, Shield, ArrowLeft, Check, Table } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { QRCodeSVG } from 'qrcode.react';
import { TableLayoutVisual } from '@/components/TableLayoutVisual';

const DEPOSIT_AMOUNT = 100; // AED - configurable
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Client-side validation schema
const reservationSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  phone: z.string().regex(/^\+?[0-9\s\-]{8,15}$/, 'Invalid phone number'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  guests: z.number().min(1, 'At least 1 guest').max(20, 'Maximum 20 guests'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  requests: z.string().max(500, 'Special requests too long').optional(),
});

interface ReservationResponse {
  success: boolean;
  reservation?: {
    id: string;
    reservationNumber: string;
    depositAmount: number;
  };
  error?: string;
  details?: string[];
}

function ReservationContent() {
  const { t } = useLanguage();
  const [step, setStep] = useState<'form' | 'table' | 'payment' | 'success'>('form');
  const [reservationNumber, setReservationNumber] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTable, setSelectedTable] = useState<{ id: string; table_number: number } | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    guests: 2,
    date: '',
    time: '',
    requests: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation first
    const validation = reservationSchema.safeParse({
      ...formData,
      guests: Number(formData.guests)
    });

    if (!validation.success) {
      const errors = validation.error.errors.map(e => e.message);
      toast.error(errors[0]);
      return;
    }

    // Validate date/time is in future
    const now = new Date();
    const reservationDateTime = new Date(`${formData.date}T${formData.time}`);
    if (reservationDateTime <= now) {
      toast.error('Reservation must be in the future');
      return;
    }

    setStep('table');
  };

  const handleTableSelection = () => {
    setStep('payment');
  };

  const handlePayment = async () => {
    setIsSubmitting(true);
    toast.loading('Processing reservation...');

    try {
      // Call edge function for server-side validation and creation
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-reservation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || undefined,
          guests: Number(formData.guests),
          date: formData.date,
          time: formData.time,
          specialRequests: formData.requests.trim() || undefined,
          depositAmount: DEPOSIT_AMOUNT,
          tableId: selectedTable?.id,
        }),
      });

      const data: ReservationResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.details?.[0] || data.error || 'Failed to create reservation');
      }

      toast.dismiss();
      setReservationNumber(data.reservation?.reservationNumber || 'CONFIRMED');
      setStep('success');
    } catch (error) {
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : 'Failed to create reservation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-md">
          <div className="text-center animate-scale-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full gold-gradient flex items-center justify-center">
              <Check className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              {t('success')}
            </h1>
            <p className="text-muted-foreground mb-6">
              Thank you! Your reservation #{reservationNumber} is confirmed.
              {selectedTable && (
                <span className="block mt-1 text-primary font-medium">
                  Table {selectedTable.table_number} has been reserved for you.
                </span>
              )}
            </p>
            
            <div className="glass-card rounded-xl p-6 mb-6">
              <div className="w-40 h-40 mx-auto mb-4 bg-white rounded-lg p-3 flex items-center justify-center">
                <QRCodeSVG 
                  value={reservationNumber} 
                  size={136}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Show this QR code at the entrance
              </p>
            </div>

            <div className="glass-card rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-muted-foreground mb-2">{t('checkin.depositNote')}</p>
            </div>

            <Link to="/">
              <Button variant="gold" className="w-full">
                Back to Menu
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'table') {
    return (
      <div className="min-h-screen bg-background pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <button
            onClick={() => setStep('form')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Details
          </button>

          <div className="text-center mb-8">
            <Table className="w-12 h-12 mx-auto text-primary mb-4" />
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              Choose Your Table
            </h1>
            <p className="text-muted-foreground">
              Select your preferred table for {formData.guests} guest{formData.guests !== 1 ? 's' : ''} on {formData.date} at {formData.time}
            </p>
          </div>

          <TableLayoutVisual
            date={formData.date}
            time={formData.time}
            guests={formData.guests}
            selectedTableId={selectedTable?.id}
            onTableSelect={(table) => setSelectedTable(table ? { id: table.id, table_number: table.table_number } : null)}
          />

          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleTableSelection}
            >
              Skip Table Selection
            </Button>
            <Button
              variant="gold"
              className="flex-1"
              onClick={handleTableSelection}
              disabled={!selectedTable}
            >
              {selectedTable ? `Continue with Table ${selectedTable.table_number}` : 'Select a Table'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'payment') {
    return (
      <div className="min-h-screen bg-background pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-md">
          <button
            onClick={() => setStep('table')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="text-center mb-8">
            <CreditCard className="w-12 h-12 mx-auto text-primary mb-4" />
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              {t('reservation.deposit')}
            </h1>
            <p className="text-muted-foreground">
              {t('reservation.depositNote')}
            </p>
          </div>

          <div className="glass-card rounded-xl p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-muted-foreground">Security Deposit</span>
              <span className="text-xl font-bold gold-text">{DEPOSIT_AMOUNT} {t('currency')}</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Card Number</Label>
                <Input placeholder="1234 5678 9012 3456" className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Expiry</Label>
                  <Input placeholder="MM/YY" className="input-field" />
                </div>
                <div>
                  <Label>CVC</Label>
                  <Input placeholder="123" className="input-field" />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-success mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Secure Payment</p>
                <p className="text-xs text-muted-foreground">
                  Your payment is secured with PCI-compliant encryption
                </p>
              </div>
            </div>
          </div>

          <Button variant="gold" size="xl" className="w-full" onClick={handlePayment} disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : `Pay ${DEPOSIT_AMOUNT} ${t('currency')} Deposit`}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-8">
      <div className="container mx-auto px-4 max-w-md">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </Link>

        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            {t('reservation.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('reservation.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="glass-card rounded-xl p-6 space-y-4">
            <div>
              <Label htmlFor="fullName">{t('reservation.fullName')} *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="input-field mt-1"
                placeholder="John Doe"
              />
            </div>

            <div>
              <Label htmlFor="phone">{t('reservation.phone')} *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field mt-1"
                placeholder="+971 50 123 4567"
              />
            </div>

            <div>
              <Label htmlFor="email">{t('reservation.email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field mt-1"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="glass-card rounded-xl p-6 space-y-4">
            <div>
              <Label htmlFor="guests" className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                {t('reservation.guests')} *
              </Label>
              <Input
                id="guests"
                type="number"
                min={1}
                max={20}
                value={formData.guests}
                onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
                className="input-field mt-1"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  {t('reservation.date')} *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input-field mt-1"
                />
              </div>
              <div>
                <Label htmlFor="time" className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  {t('reservation.time')} *
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="input-field mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="requests">{t('reservation.requests')}</Label>
              <Textarea
                id="requests"
                value={formData.requests}
                onChange={(e) => setFormData({ ...formData, requests: e.target.value })}
                className="input-field mt-1 min-h-[80px]"
                placeholder="Any dietary requirements or special occasions?"
              />
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              {t('reservation.policy')}
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-success">✓</span>
                {t('reservation.policyCancel')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive">✗</span>
                {t('reservation.policyNoShow')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive">✗</span>
                {t('reservation.policyNoPurchase')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success">✓</span>
                {t('reservation.policyPurchase')}
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-between p-4 glass-card rounded-xl">
            <div>
              <p className="text-sm text-muted-foreground">{t('reservation.deposit')}</p>
              <p className="text-2xl font-bold gold-text">{DEPOSIT_AMOUNT} {t('currency')}</p>
            </div>
            <Button type="submit" variant="gold" size="lg">
              {t('reservation.confirm')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

const ReservationPage = () => {
  return (
    <LanguageProvider>
      <CartProvider>
        <Header />
        <ReservationContent />
      </CartProvider>
    </LanguageProvider>
  );
};

export default ReservationPage;
