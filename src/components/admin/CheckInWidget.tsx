import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QRScanner } from '@/components/QRScanner';
import { 
  Check, 
  X, 
  Loader2, 
  Camera, 
  Keyboard,
  UserCheck,
  RefreshCw
} from 'lucide-react';

interface CheckInResult {
  success: boolean;
  message: string;
  guest?: string;
  guests?: number;
  reservationNumber?: string;
  time?: string;
}

interface CheckInWidgetProps {
  onCheckin: () => void;
}

export function CheckInWidget({ onCheckin }: CheckInWidgetProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [activeTab, setActiveTab] = useState<'manual' | 'scan'>('manual');

  const handleVerify = async (inputCode: string, isQrCode = false) => {
    const trimmedCode = inputCode.trim();
    if (!trimmedCode) {
      toast.error('Please enter a reservation number or scan a QR code');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const body = isQrCode 
        ? { qrCode: trimmedCode }
        : { reservationNumber: trimmedCode.toUpperCase() };

      const { data, error } = await supabase.functions.invoke('validate-qr', {
        body
      });

      if (error) {
        throw new Error(error.message || 'Check-in failed');
      }

      if (data.success) {
        const reservation = data.reservation;
        setResult({ 
          success: true, 
          message: 'Guest checked in successfully!',
          guest: reservation?.full_name,
          guests: reservation?.guests,
          reservationNumber: reservation?.reservation_number,
          time: reservation?.reservation_time
        });
        toast.success(`${reservation?.full_name || 'Guest'} checked in!`);
        onCheckin();
        setCode('');
      } else {
        setResult({ 
          success: false, 
          message: data.error || 'Verification failed' 
        });
        toast.error(data.error || 'Check-in failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Check-in failed';
      setResult({ success: false, message: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerify = () => {
    handleVerify(code, false);
  };

  const handleQRScan = (data: string) => {
    handleVerify(data, true);
  };

  const handleReset = () => {
    setResult(null);
    setCode('');
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Show result view when check-in is successful
  if (result?.success) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/30">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">{result.guest || 'Guest'}</h3>
              <p className="text-sm text-muted-foreground">Checked in successfully</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-background/50">
              <p className="text-muted-foreground">Party Size</p>
              <p className="font-semibold text-foreground">{result.guests || 1} guests</p>
            </div>
            <div className="p-3 rounded-lg bg-background/50">
              <p className="text-muted-foreground">Reservation</p>
              <p className="font-mono font-semibold text-foreground text-xs">{result.reservationNumber}</p>
            </div>
            {result.time && (
              <div className="p-3 rounded-lg bg-background/50 col-span-2">
                <p className="text-muted-foreground">Booked Time</p>
                <p className="font-semibold text-foreground">{formatTime(result.time)}</p>
              </div>
            )}
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full" 
          onClick={handleReset}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Check In Another Guest
        </Button>
      </div>
    );
  }

  // Show error result
  if (result && !result.success) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="p-6 rounded-xl bg-destructive/10 border border-destructive/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
              <X className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">Check-in Failed</h3>
              <p className="text-sm text-muted-foreground">{result.message}</p>
            </div>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full" 
          onClick={handleReset}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'manual' | 'scan')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Keyboard className="w-4 h-4" />
            Enter Code
          </TabsTrigger>
          <TabsTrigger value="scan" className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Scan QR
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-4">
          <div className="space-y-4">
            <Input
              placeholder="RES-20260102-1234"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="input-field text-center text-lg font-mono"
              onKeyDown={(e) => e.key === 'Enter' && handleManualVerify()}
              disabled={loading}
            />
            <Button 
              variant="gold" 
              size="lg"
              className="w-full" 
              onClick={handleManualVerify} 
              disabled={loading || !code.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Verify & Check In
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="scan" className="mt-4">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Verifying reservation...</p>
            </div>
          ) : (
            <QRScanner 
              onScan={handleQRScan}
              onError={(err) => toast.error(err)}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
