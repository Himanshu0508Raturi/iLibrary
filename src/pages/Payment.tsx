import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CreditCard, Loader2 } from 'lucide-react';

const BASE_URL = 'http://localhost:8080';

const Payment = () => {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const type = searchParams.get('type');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (!type) {
      toast.error('No subscription type specified');
      navigate('/subscriptions');
      return;
    }
  }, [isAuthenticated, navigate, type]);

  const handleConfirmAndPay = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${BASE_URL}/payment/subscription`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (resp.status === 401) {
        toast.error('Unauthorized. Please login again.');
        navigate('/auth');
        return;
      }

      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        throw new Error(`Payment initialization failed (${resp.status}) ${txt}`);
      }

      const paymentData = await resp.json();
      console.log('Payment response:', paymentData);

      const sessionUrl = paymentData?.sessionUrl || paymentData?.url || paymentData?.checkoutUrl;

      if (sessionUrl && /^https?:\/\//.test(sessionUrl)) {
        toast.success('Redirecting to payment...');
        window.location.href = sessionUrl;
      } else {
        console.error('Payment init response', paymentData);
        throw new Error('Payment initialization failed: no redirect URL returned');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  if (!type) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-glow">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center">
              <CreditCard className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Complete Your Payment</CardTitle>
          <CardDescription>
            Subscription Type: <span className="font-semibold">{type}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              Your subscription has been initiated. Click below to proceed with payment.
            </p>
            <p className="text-sm text-muted-foreground">
              You will be redirected to Stripe for secure payment processing.
            </p>
          </div>

          <Button
            onClick={handleConfirmAndPay}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm & Pay'
            )}
          </Button>

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/subscriptions')}
              disabled={loading}
            >
              Back to Subscriptions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Payment;
