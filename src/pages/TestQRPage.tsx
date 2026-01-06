import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

// Test QR codes - these match reservations in your database
const testCodes = [
  {
    label: 'QR Token (64-char hex)',
    value: 'c97ca54840efd7d12c1ef3d774e10b376aa1e0b87dc167e0f30023cab79f3c2d',
    description: 'Scans as raw QR token from reservation RES-20260103-7680',
  },
  {
    label: 'Reservation Number',
    value: 'RES-20260103-7680',
    description: 'Scans as reservation number directly',
  },
  {
    label: 'URL with QR param',
    value: 'https://example.com/checkin?qr=c97ca54840efd7d12c1ef3d774e10b376aa1e0b87dc167e0f30023cab79f3c2d',
    description: 'URL format with qr query parameter',
  },
];

export default function TestQRPage() {
  const navigate = useNavigate();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (value: string, index: number) => {
    await navigator.clipboard.writeText(value);
    setCopiedIndex(index);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Test QR Codes</h1>
          <p className="text-muted-foreground">
            Scan these QR codes with your mobile device to test the check-in scanner
          </p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-8 flex items-start gap-3">
          <Smartphone className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-foreground mb-1">How to test:</p>
            <ol className="text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Open the Admin page on your mobile device</li>
              <li>Go to the "Check-In" tab and select "Scan QR"</li>
              <li>Point your camera at one of the QR codes below</li>
              <li>The scanner should detect and process the code</li>
            </ol>
          </div>
        </div>

        <div className="space-y-6">
          {testCodes.map((code, index) => (
            <div
              key={index}
              className="glass-card rounded-xl p-6 flex flex-col md:flex-row items-center gap-6"
            >
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG
                  value={code.value}
                  size={180}
                  level="H"
                  includeMargin
                />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="font-semibold text-lg text-foreground mb-1">
                  {code.label}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {code.description}
                </p>
                <div className="bg-secondary/50 rounded-lg p-3 mb-3">
                  <code className="text-xs text-foreground break-all">
                    {code.value}
                  </code>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(code.value, index)}
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Code
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Note: The reservation must exist and be in 'pending' or 'confirmed' status to check in successfully.
          </p>
        </div>
      </div>
    </div>
  );
}
