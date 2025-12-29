import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanner = async () => {
    if (!containerRef.current) return;

    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Successfully scanned
          onScan(decodedText);
          stopScanner();
        },
        (errorMessage) => {
          // Ignore scan errors (no QR found in frame)
        }
      );

      setIsScanning(true);
      setHasPermission(true);
    } catch (err) {
      console.error('Scanner start error:', err);
      setHasPermission(false);
      onError?.('Camera permission denied or not available');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error('Scanner stop error:', err);
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="w-full">
      <div 
        id="qr-reader" 
        ref={containerRef}
        className="w-full aspect-square bg-secondary rounded-lg overflow-hidden relative"
      >
        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {hasPermission === false ? (
              <>
                <CameraOff className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground text-center px-4">
                  Camera access denied. Please enable camera permissions.
                </p>
              </>
            ) : (
              <>
                <Camera className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Tap to start scanning
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-4">
        {!isScanning ? (
          <Button 
            variant="gold" 
            className="w-full" 
            onClick={startScanner}
            disabled={hasPermission === false}
          >
            <Camera className="w-4 h-4 mr-2" />
            Start Camera
          </Button>
        ) : (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={stopScanner}
          >
            <CameraOff className="w-4 h-4 mr-2" />
            Stop Camera
          </Button>
        )}
      </div>
    </div>
  );
}
