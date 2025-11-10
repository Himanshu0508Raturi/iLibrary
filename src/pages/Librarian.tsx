import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { QrCode, ScanLine, Camera, CameraOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

const BASE_URL = 'http://localhost:8080';

const Librarian = () => {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [qrToken, setQrToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const [verificationResult, setVerificationResult] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [activeView, setActiveView] = useState<'scan' | 'verify'>('scan');
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.roles.includes('ROLE_LIBRARIAN')) {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    codeReader.current = new BrowserMultiFormatReader();

    return () => {
      if (codeReader.current) {
        codeReader.current.reset();
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setCameraActive(true);
      setActiveView('scan');

      // Get available video devices
      const videoInputDevices = await codeReader.current?.getVideoInputDevices();
      if (!videoInputDevices || videoInputDevices.length === 0) {
        throw new Error('No camera devices found');
      }

      // Use the first available camera
      const selectedDeviceId = videoInputDevices[0].deviceId;

      // Start decoding from video device
      await codeReader.current?.decodeFromVideoDevice(selectedDeviceId, videoRef.current!, (result, err) => {
        if (result) {
          setQrToken(result.getText());
          setCameraActive(false);
          setActiveView('verify');
          toast.success('QR code scanned successfully!');
          codeReader.current?.reset();
        }
        if (err && !(err instanceof NotFoundException)) {
          console.error('QR Code scanning error:', err);
        }
      });

    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Failed to access camera. Please check permissions.');
      setCameraActive(false);
    }
  };

  const stopScanning = () => {
    if (codeReader.current) {
      codeReader.current.reset();
    }
    setCameraActive(false);
    setActiveView('verify');
  };

  useEffect(() => {
    return () => {
      if (codeReader.current) {
        codeReader.current.reset();
      }
    };
  }, []);

  // POST request to /librarian/verify-qr
  const handleVerifyQR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrToken.trim()) {
      toast.error('Please enter a QR token');
      return;
    }

    setScanning(true);
    try {
      const response = await fetch(`${BASE_URL}/librarian/verify-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ qrToken: qrToken.trim() }),
      });

      if (!response.ok) {
        throw new Error('Verification failed');
      }

      const message = await response.text();
      setVerificationResult(message);
      toast.success('Booking verified successfully!');

      // Clear the input after successful verification
      setQrToken('');

      // Redirect back to scan view after 3 seconds
      setTimeout(() => {
        setVerificationResult(null);
        setActiveView('scan');
      }, 3000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to verify QR code');
      setVerificationResult('Verification failed');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center">
              <QrCode className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Librarian Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome, {user?.username}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Button
            onClick={() => setActiveView('scan')}
            variant={activeView === 'scan' ? 'default' : 'outline'}
            className="h-16"
          >
            <Camera className="h-5 w-5 mr-2" />
            Scan QR Code
          </Button>
          <Button
            onClick={() => setActiveView('verify')}
            variant={activeView === 'verify' ? 'default' : 'outline'}
            className="h-16"
          >
            <ScanLine className="h-5 w-5 mr-2" />
            Verify Token
          </Button>
        </div>

        {activeView === 'scan' && (
          <Card className="shadow-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Scan QR Code
              </CardTitle>
              <CardDescription>
                Use your camera to scan the student's booking QR code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!cameraActive ? (
                <Button onClick={startScanning} className="w-full" size="lg">
                  <Camera className="h-5 w-5 mr-2" />
                  Start Camera
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      className="w-full h-64 bg-black rounded-lg"
                      autoPlay
                      playsInline
                      muted
                    />
                    <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white rounded-lg"></div>
                    </div>
                  </div>
                  <Button onClick={stopScanning} variant="destructive" className="w-full">
                    <CameraOff className="h-5 w-5 mr-2" />
                    Stop Camera
                  </Button>
                </div>
              )}

              {qrToken && (
                <div className="p-4 bg-primary/10 border border-primary rounded-lg">
                  <p className="text-sm font-medium text-primary">QR Code Scanned!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Token captured. Switch to "Verify Token" to proceed.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeView === 'verify' && (
          <Card className="shadow-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanLine className="h-5 w-5" />
                Verify Booking QR Code
              </CardTitle>
              <CardDescription>
                Paste or use the scanned JWT token to verify the booking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerifyQR} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="qr-token">QR Token (JWT)</Label>
                  <Input
                    id="qr-token"
                    type="text"
                    placeholder="Paste JWT token here..."
                    value={qrToken}
                    onChange={(e) => setQrToken(e.target.value)}
                    className="font-mono text-sm"
                    disabled={scanning}
                  />
                  <p className="text-xs text-muted-foreground">
                    The token should start with "eyJ..."
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={scanning || !qrToken.trim()}
                >
                  {scanning ? 'Verifying...' : 'Verify QR Code'}
                </Button>
              </form>

              {verificationResult && (
                <div className={`mt-6 p-4 rounded-lg ${
                  verificationResult.includes('successfully')
                    ? 'bg-primary/10 border border-primary text-primary'
                    : 'bg-destructive/10 border border-destructive text-destructive'
                }`}>
                  <p className="font-medium">{verificationResult}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Click "Scan QR Code" and allow camera access</p>
            <p>2. Point camera at student's QR code to scan automatically</p>
            <p>3. Or switch to "Verify Token" and paste the JWT token manually</p>
            <p>4. Click "Verify QR Code" to validate the booking</p>
            <p>5. System will show seat number and duration on successful verification</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Librarian;
