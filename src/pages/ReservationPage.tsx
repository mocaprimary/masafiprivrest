import { useState } from 'react';
import { useLanguage, LanguageProvider } from '@/contexts/LanguageContext';
import { CartProvider } from '@/contexts/CartContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, Clock, Users, CreditCard, Shield, ArrowLeft, Check, Table, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { QRCodeSVG } from 'qrcode.react';
import { TableLayoutVisual } from '@/components/TableLayoutVisual';
import { AnimatedTablePreview } from '@/components/AnimatedTablePreview';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays } from 'date-fns';

const DEPOSIT_AMOUNT = 100; // AED - configurable deposit amount
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
    <div className="min-h-screen bg-background pt-16 sm:pt-20 pb-6 sm:pb-8 overflow-hidden">
      {/* Background decorations - hidden on mobile for performance */}
      <div className="hidden sm:block fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-20 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 -right-20 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl"
          animate={{
            x: [0, -20, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="container mx-auto px-3 sm:px-4 max-w-4xl relative">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 sm:mb-6 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </Link>

        {/* Header - Compact on mobile */}
        <motion.div 
          className="text-center mb-4 sm:mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 mb-2 sm:mb-4"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
            <span className="text-xs sm:text-sm text-primary font-medium">Reserve Your Experience</span>
          </motion.div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2">
            {t('reservation.title')}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t('reservation.subtitle')}
          </p>
        </motion.div>

        {/* Mobile: Inline compact table preview with form */}
        {/* Desktop: Side by side layout */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-8">
          
          {/* Form Section - Always first on mobile */}
          <motion.div
            className="order-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              
              {/* Mobile: Compact inline table preview */}
              <motion.div 
                className="lg:hidden glass-card rounded-xl p-3 sm:p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <AnimatedTablePreview 
                      guests={formData.guests}
                      compact={true}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-base font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Table className="w-4 h-4 text-primary" />
                      Your Booking
                    </h3>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        <span className="text-foreground font-medium">{formData.guests} Guest{formData.guests !== 1 ? 's' : ''}</span>
                      </div>
                      {formData.date && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                          <span>{format(new Date(formData.date), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                      {formData.time && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          <span>{formData.time}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Personal Details */}
              <motion.div 
                className="glass-card rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="font-display text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] sm:text-xs text-primary font-bold">1</span>
                  Personal Details
                </h3>
                <div>
                  <Label htmlFor="fullName" className="text-sm">{t('reservation.fullName')} *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="input-field mt-1 h-11"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm">{t('reservation.phone')} *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field mt-1 h-11"
                    placeholder="+971 50 123 4567"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm">{t('reservation.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field mt-1 h-11"
                    placeholder="john@example.com"
                  />
                </div>
              </motion.div>

              {/* Reservation Details */}
              <motion.div 
                className="glass-card rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h3 className="font-display text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] sm:text-xs text-primary font-bold">2</span>
                  Reservation Details
                </h3>
                
                {/* Guest selector - bigger touch targets */}
                <div>
                  <Label className="flex items-center gap-2 text-sm mb-2">
                    <Users className="w-4 h-4 text-primary" />
                    {t('reservation.guests')} *
                  </Label>
                  <div className="flex flex-wrap items-center gap-2">
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <motion.button
                        key={num}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFormData({ ...formData, guests: num })}
                        className={cn(
                          "w-11 h-11 sm:w-10 sm:h-10 rounded-full font-bold transition-all text-sm",
                          formData.guests === num
                            ? 'bg-primary text-primary-foreground shadow-lg'
                            : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                        )}
                      >
                        {num}
                      </motion.button>
                    ))}
                    <Input
                      id="guests"
                      type="number"
                      min={7}
                      max={20}
                      value={formData.guests > 6 ? formData.guests : ''}
                      onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) || 1 })}
                      className="input-field w-16 h-11 text-center"
                      placeholder="7+"
                    />
                  </div>
                </div>

                {/* Date Picker */}
                <div>
                  <Label className="flex items-center gap-2 text-sm mb-2">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                    {t('reservation.date')} *
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "w-full h-12 px-4 rounded-lg border text-left font-medium transition-all flex items-center justify-between",
                          formData.date
                            ? "bg-primary/10 border-primary/30 text-foreground"
                            : "bg-muted/50 border-border text-muted-foreground hover:border-primary/30"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          {formData.date ? format(new Date(formData.date), 'EEEE, MMMM d, yyyy') : 'Select date'}
                        </span>
                        {formData.date && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                          >
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </motion.span>
                        )}
                      </motion.button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.date ? new Date(formData.date) : undefined}
                        onSelect={(date) => setFormData({ ...formData, date: date ? format(date, 'yyyy-MM-dd') : '' })}
                        disabled={(date) => date < new Date() || date > addDays(new Date(), 60)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  
                  {/* Quick date buttons */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[
                      { label: 'Today', date: new Date() },
                      { label: 'Tomorrow', date: addDays(new Date(), 1) },
                      { label: 'This Weekend', date: (() => {
                        const today = new Date();
                        const dayOfWeek = today.getDay();
                        const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
                        return addDays(today, daysUntilSaturday);
                      })() },
                    ].map((option) => (
                      <motion.button
                        key={option.label}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFormData({ ...formData, date: format(option.date, 'yyyy-MM-dd') })}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                          formData.date === format(option.date, 'yyyy-MM-dd')
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/70 text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {option.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Time Picker */}
                <div>
                  <Label className="flex items-center gap-2 text-sm mb-2">
                    <Clock className="w-4 h-4 text-primary" />
                    {t('reservation.time')} *
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "w-full h-12 px-4 rounded-lg border text-left font-medium transition-all flex items-center justify-between",
                          formData.time
                            ? "bg-primary/10 border-primary/30 text-foreground"
                            : "bg-muted/50 border-border text-muted-foreground hover:border-primary/30"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {formData.time ? (
                            <span className="flex items-center gap-1">
                              <span className="text-lg font-semibold">{formData.time.split(':')[0]}</span>
                              <span className="text-muted-foreground">:</span>
                              <span className="text-lg font-semibold">{formData.time.split(':')[1]}</span>
                            </span>
                          ) : 'Select time'}
                        </span>
                        {formData.time && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                          >
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </motion.span>
                        )}
                      </motion.button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-4" align="start">
                      <div className="space-y-4">
                        <div className="text-center text-sm font-medium text-muted-foreground mb-2">
                          Select Time
                        </div>
                        
                        {/* Hour and Minute Selectors */}
                        <div className="flex items-center justify-center gap-2">
                          {/* Hour Selector */}
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-muted-foreground mb-1">Hour</span>
                            <div className="relative h-32 w-16 overflow-hidden rounded-lg border border-border bg-muted/30">
                              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 bg-primary/20 border-y border-primary/30 pointer-events-none z-10" />
                              <div className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory py-11">
                                {Array.from({ length: 13 }, (_, i) => i + 12).map((hour) => (
                                  <motion.button
                                    key={hour}
                                    type="button"
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                      const currentMinute = formData.time?.split(':')[1] || '00';
                                      setFormData({ ...formData, time: `${hour.toString().padStart(2, '0')}:${currentMinute}` });
                                    }}
                                    className={cn(
                                      "w-full h-10 flex items-center justify-center text-lg font-medium snap-center transition-all",
                                      formData.time?.split(':')[0] === hour.toString().padStart(2, '0')
                                        ? "text-primary font-bold"
                                        : "text-muted-foreground hover:text-foreground"
                                    )}
                                  >
                                    {hour.toString().padStart(2, '0')}
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <span className="text-2xl font-bold text-muted-foreground mt-5">:</span>
                          
                          {/* Minute Selector */}
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-muted-foreground mb-1">Min</span>
                            <div className="relative h-32 w-16 overflow-hidden rounded-lg border border-border bg-muted/30">
                              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 bg-primary/20 border-y border-primary/30 pointer-events-none z-10" />
                              <div className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory py-11">
                                {['00', '15', '30', '45'].map((minute) => (
                                  <motion.button
                                    key={minute}
                                    type="button"
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                      const currentHour = formData.time?.split(':')[0] || '19';
                                      setFormData({ ...formData, time: `${currentHour}:${minute}` });
                                    }}
                                    className={cn(
                                      "w-full h-10 flex items-center justify-center text-lg font-medium snap-center transition-all",
                                      formData.time?.split(':')[1] === minute
                                        ? "text-primary font-bold"
                                        : "text-muted-foreground hover:text-foreground"
                                    )}
                                  >
                                    {minute}
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Quick time presets */}
                        <div className="border-t border-border pt-3">
                          <span className="text-xs text-muted-foreground mb-2 block">Popular times</span>
                          <div className="grid grid-cols-4 gap-1.5">
                            {['18:00', '19:00', '20:00', '21:00'].map((time) => (
                              <motion.button
                                key={time}
                                type="button"
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setFormData({ ...formData, time })}
                                className={cn(
                                  "py-2 rounded-md text-sm font-medium transition-all",
                                  formData.time === time
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted/70 text-muted-foreground hover:bg-muted"
                                )}
                              >
                                {time}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="requests" className="text-sm">{t('reservation.requests')}</Label>
                  <Textarea
                    id="requests"
                    value={formData.requests}
                    onChange={(e) => setFormData({ ...formData, requests: e.target.value })}
                    className="input-field mt-1 min-h-[70px] sm:min-h-[80px]"
                    placeholder="Any dietary requirements or special occasions?"
                  />
                </div>
              </motion.div>

              {/* Policy - Collapsible style on mobile */}
              <motion.div 
                className="glass-card rounded-xl p-3 sm:p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <h3 className="font-semibold text-foreground mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <Shield className="w-4 h-4 text-primary" />
                  {t('reservation.policy')}
                </h3>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-success">✓</span>
                    <span className="line-clamp-2">{t('reservation.policyCancel')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive">✗</span>
                    <span className="line-clamp-2">{t('reservation.policyNoShow')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive">✗</span>
                    <span className="line-clamp-2">{t('reservation.policyNoPurchase')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success">✓</span>
                    <span className="line-clamp-2">{t('reservation.policyPurchase')}</span>
                  </li>
                </ul>
              </motion.div>

              {/* Submit section - Fixed on mobile for easy access */}
              <motion.div 
                className="glass-card rounded-xl p-4 sm:sticky sm:bottom-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{t('reservation.deposit')}</p>
                    <p className="text-xl sm:text-2xl font-bold gold-text">{DEPOSIT_AMOUNT} {t('currency')}</p>
                  </div>
                  <Button type="submit" variant="gold" size="lg" className="shadow-lg h-12 px-6 sm:px-8 text-sm sm:text-base">
                    {t('reservation.confirm')}
                  </Button>
                </div>
              </motion.div>
            </form>
          </motion.div>

          {/* Desktop: Full Table Preview - Hidden on mobile */}
          <motion.div
            className="hidden lg:block order-2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="glass-card rounded-2xl p-6 sticky top-24 overflow-hidden">
              <div className="text-center mb-4">
                <h3 className="font-display text-xl font-semibold text-foreground flex items-center justify-center gap-2">
                  <Table className="w-5 h-5 text-primary" />
                  Your Table Preview
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  See your seating arrangement come to life
                </p>
              </div>
              
              <AnimatedTablePreview 
                guests={formData.guests}
                date={formData.date}
                time={formData.time}
              />

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                <motion.div 
                  className="text-center p-3 rounded-xl bg-primary/5 border border-primary/10"
                  whileHover={{ scale: 1.02 }}
                >
                  <Users className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{formData.guests}</p>
                  <p className="text-xs text-muted-foreground">Guests</p>
                </motion.div>
                <motion.div 
                  className="text-center p-3 rounded-xl bg-primary/5 border border-primary/10"
                  whileHover={{ scale: 1.02 }}
                >
                  <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{formData.date || '--'}</p>
                  <p className="text-xs text-muted-foreground">Date</p>
                </motion.div>
                <motion.div 
                  className="text-center p-3 rounded-xl bg-primary/5 border border-primary/10"
                  whileHover={{ scale: 1.02 }}
                >
                  <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{formData.time || '--'}</p>
                  <p className="text-xs text-muted-foreground">Time</p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
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
