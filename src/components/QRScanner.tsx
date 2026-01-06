import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Camera, CameraOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(true);
  const scannerIdRef = useRef(`qr-reader-${Date.now()}`);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) {
      setIsScanning(false);
      return;
    }

    try {
      const state = scanner.getState();
      if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
        await scanner.stop();
      }
    } catch (err) {
      // Ignore stop errors - the scanner might already be stopped
      console.log('Scanner cleanup:', err);
    } finally {
      try {
        scanner.clear();
      } catch (e) {
        // Ignore clear errors
      }
      scannerRef.current = null;
      if (mountedRef.current) {
        setIsScanning(false);
      }
    }
  }, []);

  const startScanner = async () => {
    // Don't start if already starting or scanning
    if (isStarting || isScanning) return;
    
    setIsStarting(true);

    try {
      // Stop any existing scanner first
      await stopScanner();
      
      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!mountedRef.current) return;

      const scannerId = scannerIdRef.current;
      const scannerElement = document.getElementById(scannerId);
      
      if (!scannerElement) {
        throw new Error('Scanner container not found');
      }

      const scanner = new Html5Qrcode(scannerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          if (mountedRef.current) {
            onScan(decodedText);
            stopScanner();
          }
        },
        () => {
          // Ignore frame errors (no QR found)
        }
      );

      if (mountedRef.current) {
        setIsScanning(true);
        setHasPermission(true);
      }
    } catch (err) {
      console.error('Scanner start error:', err);
      if (mountedRef.current) {
        setHasPermission(false);
        const errorMessage = err instanceof Error ? err.message : 'Camera not available';
        if (errorMessage.includes('Permission') || errorMessage.includes('denied')) {
          onError?.('Camera permission denied. Please allow camera access.');
        } else if (errorMessage.includes('NotFoundError') || errorMessage.includes('not found')) {
          onError?.('No camera found on this device.');
        } else {
          onError?.('Could not start camera. Please try again.');
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsStarting(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      // Cleanup on unmount
      const scanner = scannerRef.current;
      if (scanner) {
        try {
          const state = scanner.getState();
          if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
            scanner.stop().catch(() => {});
          }
          scanner.clear();
        } catch (e) {
          // Ignore cleanup errors on unmount
        }
        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full">
      <div 
        id={scannerIdRef.current}
        className="w-full aspect-square bg-secondary rounded-lg overflow-hidden relative"
        style={{ minHeight: '280px' }}
      >
        {!isScanning && !isStarting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            {hasPermission === false ? (
              <>
                <CameraOff className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground text-center px-4">
                  Camera access denied. Please enable camera permissions in your browser settings.
                </p>
              </>
            ) : (
              <>
                <Camera className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Tap below to start scanning
                </p>
              </>
            )}
          </div>
        )}
        {isStarting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-secondary">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">Starting camera...</p>
          </div>
        )}
      </div>

      <div className="mt-4">
        {!isScanning ? (
          <Button 
            variant="gold" 
            className="w-full" 
            onClick={startScanner}
            disabled={isStarting || hasPermission === false}
          >
            {isStarting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 mr-2" />
                Start Camera
              </>
            )}
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
