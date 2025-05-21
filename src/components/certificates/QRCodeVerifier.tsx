import React, {useState, useRef, useEffect } from 'react';
import {useRouter } from 'next/router';
import Button from '@/components/ui/Button';
import {toast } from 'react-hot-toast';

// Import QR code scanner library dynamically to avoid SSR issues
let QrScanner: any = null;

interface QRCodeVerifierProps {
  onVerify?: (code: string) => void;
  onClose?: () => void;
}

const QRCodeVerifier: React.FC<QRCodeVerifierProps> = ({onVerify, onClose }) => {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [scanner, setScanner] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load QR scanner library on client side
  useEffect(() => {
    const loadScanner = async () => {
      try {
        // Dynamically import the QR scanner library
        const QrScannerModule = await import('qr-scanner');
        QrScanner = QrScannerModule.default;
        
        // Check if camera is available
        const hasCamera = await QrScanner.hasCamera();
        setHasCamera(hasCamera);
        
        if (!hasCamera) {
          setError('No camera found on this device');
      }
    } catch (err) {
        console.error('Error loading QR scanner:', err);
        setError('Failed to load QR scanner');
    }
  };
    
    loadScanner();
    
    // Clean up on unmount
    return () => {
      if (scanner) {
        scanner.stop();
    }
  };
}, []);

  // Start scanning
  const startScanning = () => {
    if (!videoRef.current || !QrScanner) return;
    
    try {
      setIsScanning(true);
      setError(null);
      
      const qrScanner = new QrScanner(
        videoRef.current,
        (result: {data: string }) => {
          handleScanResult(result.data);
      },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
      }
      );
      
      qrScanner.start();
      setScanner(qrScanner);
  } catch (err) {
      console.error('Error starting QR scanner:', err);
      setError('Failed to start camera');
      setIsScanning(false);
  }
};

  // Stop scanning
  const stopScanning = () => {
    if (scanner) {
      scanner.stop();
      setScanner(null);
  }
    setIsScanning(false);
};

  // Handle scan result
  const handleScanResult = (result: string) => {
    stopScanning();
    
    // Check if the result is a valid URL
    try {
      const url = new URL(result);
      
      // Extract verification code from URL
      const pathParts = url.pathname.split('/');
      const verificationCode = pathParts[pathParts.length - 1];
      
      if (verificationCode) {
        if (onVerify) {
          onVerify(verificationCode);
      } else {
          // Navigate to verification page
          router.push(`/verify-certificate/${verificationCode}`);
      }
        
        toast.success('QR code scanned successfully');
    } else {
        setError('Invalid QR code format');
    }
  } catch (err) {
      // If not a URL, check if it's a direct verification code
      if (/^[A-Z0-9]{8,}$/.test(result)) {
        if (onVerify) {
          onVerify(result);
      } else {
          router.push(`/verify-certificate/${result}`);
      }
        
        toast.success('QR code scanned successfully');
    } else {
        setError('Invalid QR code');
    }
  }
};

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-4">
        <h2 className="text-xl font-semibold text-neutral-900">Scan Certificate QR Code</h2>
        <p className="text-neutral-600 mt-1">
          Position the QR code within the camera view to verify the certificate
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <div className="relative aspect-square bg-neutral-100 rounded-lg overflow-hidden mb-4">
        {!hasCamera ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-neutral-600">Camera not available on this device</p>
            </div>
          </div>
        ) : isScanning ? (
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-neutral-600">Camera is ready</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-center space-x-3">
        {isScanning ? (
          <Button variant="outline" onClick={stopScanning}>
            Cancel
          </Button>
        ) : (
          <>
            <Button variant="primary" onClick={startScanning} disabled={!hasCamera}>
              Start Scanning
            </Button>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
          </>
        )}
      </div>
      
      <div className="mt-4 text-center text-sm text-neutral-500">
        <p>You can also enter the verification code manually on the verification page</p>
      </div>
    </div>
  );
};

export default QRCodeVerifier;
