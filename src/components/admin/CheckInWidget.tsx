import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QRScanner } from '@/components/QRScanner';
import { parseCheckInCode } from '@/lib/checkinCode';
import {
  Check,
  X,
  Loader2,
  Camera,
  Keyboard,
  UserCheck,
  RefreshCw,
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

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleVerify = async (input: string) => {
    const parsed = parseCheckInCode(input);

    if (!parsed.qrCode && !parsed.reservationNumber) {
      toast.error('Please enter a reservation number or scan a QR code');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Use secure RPC directly (this call will:
      // - validate staff role
      // - return guest details on success
      // - mark the QR/code as used (qr_used_at) and set status=checked_in
      const { data, error } = await supabase.rpc(
        'validate_and_use_qr',
        {
          p_qr_code: parsed.qrCode ?? null,
          p_reservation_number: parsed.reservationNumber ?? null,
        } as any
      );

      if (error) throw new Error(error.message || 'Check-in failed');

      const rpcResult = data as any;
      if (!rpcResult?.success) {
        const msg = rpcResult?.error || 'Verification failed';
        setResult({ success: false, message: msg });
        toast.error(msg);
        return;
      }

      const reservation = rpcResult.reservation;
      setResult({
        success: true,
        message: 'Guest checked in successfully!',
        guest: reservation?.full_name,
        guests: reservation?.guests,
        reservationNumber: reservation?.reservation_number,
        time: reservation?.reservation_time,
      });

      toast.success(`${reservation?.full_name || 'Guest'} checked in!`);
      onCheckin();
      setCode('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Check-in failed';
      setResult({ success: false, message: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setCode('');
  };

  // Success view
  if (result?.success) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="p-6 rounded-xl bg-success/10 border border-success/30">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">{result.guest || 'Guest'}</h3>
              <p className="text-sm text-muted-foreground">Checked in successfully (QR now expired)</p>
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

        <Button variant="outline" className="w-full" onClick={handleReset}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Check In Another Guest
        </Button>
      </div>
    );
  }

  // Error view
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

        <Button variant="outline" className="w-full" onClick={handleReset}>
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
              onKeyDown={(e) => e.key === 'Enter' && handleVerify(code)}
              disabled={loading}
            />
            <Button
              variant="gold"
              size="lg"
              className="w-full"
              onClick={() => handleVerify(code)}
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
            <QRScanner onScan={(data) => handleVerify(data)} onError={(err) => toast.error(err)} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
