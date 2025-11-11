import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Check, Sparkles } from 'lucide-react';

const BASE_URL = 'http://ec2-98-84-15-104.compute-1.amazonaws.com:8080';

const Subscriptions = () => {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  const plans = [
    {
      type: 'WEEKLY',
      price: 600,
      duration: '7 days',
      features: [
        'Access to all study areas',
        'Valid for 7 consecutive days',
        'Flexible hourly bookings',
        'QR code entry',
      ],
    },
    {
      type: 'MONTHLY',
      price: 3500,
      duration: '30 days',
      popular: true,
      features: [
        'Access to all study areas',
        'Valid for 30 consecutive days',
        'Flexible hourly bookings',
        'QR code entry',
        'Priority seat selection',
        'Best value for regular users',
      ],
    },
    {
      type: 'YEARLY',
      price: 12000,
      duration: '365 days',
      features: [
        'Access to all study areas',
        'Valid for full year',
        'Flexible hourly bookings',
        'QR code entry',
        'Priority seat selection',
        'Maximum savings',
        'Transferable (one time)',
      ],
    },
  ];

  const handleBuySubscription = async (type: string) => {
    setLoading(type);
    try {
      if (!isAuthenticated) {
        toast.error('Please login to purchase a subscription');
        navigate('/auth');
        return;
      }

      // First, buy the subscription
      const buyResp = await fetch(`${BASE_URL}/subscription/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ type }),
      });

      if (buyResp.status === 401) {
        toast.error('Unauthorized. Please login again.');
        navigate('/auth');
        return;
      }

      if (!buyResp.ok) {
        const txt = await buyResp.text().catch(() => '');
        throw new Error(`Subscription purchase failed (${buyResp.status}) ${txt}`);
      }

      if (buyResp.status === 202) {
        toast.success('Subscription initiated successfully');
        // Navigate to payment page with type
        navigate(`/payment?type=${type}`);
      } else {
        throw new Error('Unexpected response from subscription buy');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to process subscription');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Subscription Plan</h1>
          <p className="text-muted-foreground text-lg">
            Select the plan that fits your study schedule
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.type}
              className={`relative ${
                plan.popular ? 'border-primary shadow-glow' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-gradient-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Sparkles className="h-4 w-4" />
                    Most Popular
                  </div>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.type}</CardTitle>
                <CardDescription>{plan.duration}</CardDescription>
                <div className="pt-4">
                  <div className="text-4xl font-bold text-primary">
                    ₹{plan.price.toLocaleString()}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  size="lg"
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleBuySubscription(plan.type)}
                  disabled={loading === plan.type}
                >
                  {loading === plan.type ? 'Processing...' : 'Buy Now'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Benefits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• All subscriptions grant unlimited access during the validity period</p>
              <p>• You can still book specific seats on an hourly basis with your subscription</p>
              <p>• Subscriptions can be renewed before expiry</p>
              <p>• Cancel anytime with pro-rated refunds (terms apply)</p>
              <p>• Instant QR code generation for easy entry</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;
