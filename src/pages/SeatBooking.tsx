import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Minus, Plus, Armchair } from 'lucide-react';

const BASE_URL = 'http://ec2-98-84-15-104.compute-1.amazonaws.com:8080';

const SeatBooking = () => {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [availableSeats, setAvailableSeats] = useState<string[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [hours, setHours] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  // Generate all 60 seats
  const allSeats = [
    ...Array.from({ length: 20 }, (_, i) => `G-${i + 1}`),
    ...Array.from({ length: 20 }, (_, i) => `F-${i + 21}`),
    ...Array.from({ length: 20 }, (_, i) => `S-${i + 41}`),
  ];

  const fetchAvailableSeats = async () => {
    try {
      // GET request to /seat/available
      const response = await fetch(`${BASE_URL}/seat/available`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch available seats');

      const seats = await response.json();
      setAvailableSeats(seats);
    } catch (error) {
      toast.error('Failed to fetch available seats');
      console.error(error);
    }
  };

  const handleBookSeat = async () => {
    if (!selectedSeat) {
      toast.error('Please select a seat');
      return;
    }

    setLoading(true);
    try {
      // POST request to /booking/seat
      const response = await fetch(`${BASE_URL}/booking/seat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          seatNumber: selectedSeat,
          hours: hours,
        }),
      });

      if (!response.ok) {
        const txt = await response.text().catch(() => '');
        throw new Error(`Booking failed (${response.status}) ${txt}`);
      }

      toast.success('Seat booked successfully! Redirecting to payment...');

      // Try to parse booking response for payment info
      let bookingData: any = null;
      try {
        bookingData = await response.clone().json().catch(() => null);
      } catch (e) {
        bookingData = null;
      }

      // Inspect common response headers for payment info
      const headerSession = response.headers.get('location') || response.headers.get('x-session-url') || response.headers.get('x-checkout-url');
      const headerBookingId = response.headers.get('x-booking-id') || response.headers.get('x-payment-id');

      // If booking response already contains a redirect URL, use it
      const bookingSessionUrl = bookingData?.sessionUrl || bookingData?.url || bookingData?.checkoutUrl;
      if (bookingSessionUrl) {
        window.location.href = bookingSessionUrl;
        return;
      }

      // header may contain a URL
      if (headerSession && /^https?:\/\//.test(headerSession)) {
        window.location.href = headerSession;
        return;
      }

      // Determine bookingId if provided by body or header
      const bookingId = bookingData?.bookingId || bookingData?.paymentId || headerBookingId;

      // helper to attempt payment init with retries
      const initPayment = async (attempt = 1): Promise<any> => {
        // If we have a bookingId, POST it to /payment/seat (some backends expect this)
        if (bookingId) {
          const resp = await fetch(`${BASE_URL}/payment/seat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ bookingId }),
          });
          if (!resp.ok) {
            // If server signals conflict due to existing pending bookings, try to reuse them
            if (resp.status === 409) {
              // Try to fetch pending bookings for this user and reuse the most recent one
              try {
                const pendingResp = await fetch(`${BASE_URL}/booking/pending`, {
                  headers: { 'Authorization': `Bearer ${token}` },
                });
                if (pendingResp.ok) {
                  const pendings = await pendingResp.json();
                  if (Array.isArray(pendings) && pendings.length > 0) {
                    const reuseId = pendings[0].bookingId || pendings[0].id || pendings[0].bookingIdString || pendings[0].paymentId;
                    if (reuseId) {
                      toast('Reusing existing pending booking for payment', { type: 'info' } as any);
                      const r2 = await fetch(`${BASE_URL}/payment/seat`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({ bookingId: reuseId }),
                      });
                      if (r2.ok) return r2.json();
                      const t2 = await r2.text().catch(() => '');
                      throw new Error(`Payment init (reused) failed (${r2.status}) ${t2}`);
                    }
                  }
                }
              } catch (e) {
                console.error('Failed to fetch pending bookings', e);
              }
            }

            if (attempt < 3 && resp.status >= 500) {
              await new Promise((r) => setTimeout(r, 500 * attempt));
              return initPayment(attempt + 1);
            }
            const t = await resp.text().catch(() => '');
            throw new Error(`Payment init failed (${resp.status}) ${t}`);
          }
          return resp.json();
        }

        // Fallback: call GET /payment/seat
        const resp = await fetch(`${BASE_URL}/payment/seat`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!resp.ok) {
          if (attempt < 3 && resp.status >= 500) {
            await new Promise((r) => setTimeout(r, 500 * attempt));
            return initPayment(attempt + 1);
          }
          const t = await resp.text().catch(() => '');
          throw new Error(`Payment initialization failed (${resp.status}) ${t}`);
        }
        return resp.json();
      };

      const paymentData = await initPayment();

      // Redirect to Stripe payment URL (support different property names)
      const sessionUrl = paymentData?.sessionUrl || paymentData?.url || paymentData?.checkoutUrl;
      if (sessionUrl) {
        window.location.href = sessionUrl;
        return;
      }

      console.error('Payment init response', paymentData);
      throw new Error('Payment initialization failed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const getSeatStatus = (seatNumber: string) => {
    if (selectedSeat === seatNumber) return 'selected';
    if (availableSeats.includes(seatNumber)) return 'available';
    return 'booked';
  };

  const getSeatColor = (status: string) => {
    if (status === 'selected') return 'bg-accent text-accent-foreground';
    if (status === 'available') return 'bg-primary text-primary-foreground hover:bg-primary/90';
    return 'bg-destructive/20 text-muted-foreground cursor-not-allowed';
  };

  const amount = hours * 50 + 9*hours; // ₹50/hour + ₹9 GST

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Armchair className="h-6 w-6" />
                Book Your Seat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center">
                <Button onClick={fetchAvailableSeats} variant="outline">
                  Check Available Seats
                </Button>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-primary rounded" />
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-destructive/20 rounded" />
                    <span>Booked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-accent rounded" />
                    <span>Selected</span>
                  </div>
                </div>
              </div>

              {/* Ground Floor (G-1 to G-20) */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">Ground Floor</h3>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {allSeats.slice(0, 20).map((seat) => (
                    <Button
                      key={seat}
                      variant="outline"
                      size="sm"
                      className={getSeatColor(getSeatStatus(seat))}
                      onClick={() => {
                        if (availableSeats.includes(seat)) {
                          setSelectedSeat(seat);
                        }
                      }}
                      disabled={!availableSeats.includes(seat) && selectedSeat !== seat}
                    >
                      {seat}
                    </Button>
                  ))}
                </div>
              </div>

              {/* First Floor (F-21 to F-40) */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">First Floor</h3>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {allSeats.slice(20, 40).map((seat) => (
                    <Button
                      key={seat}
                      variant="outline"
                      size="sm"
                      className={getSeatColor(getSeatStatus(seat))}
                      onClick={() => {
                        if (availableSeats.includes(seat)) {
                          setSelectedSeat(seat);
                        }
                      }}
                      disabled={!availableSeats.includes(seat) && selectedSeat !== seat}
                    >
                      {seat}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Special Floor (S-41 to S-60) */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">Special Floor</h3>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {allSeats.slice(40, 60).map((seat) => (
                    <Button
                      key={seat}
                      variant="outline"
                      size="sm"
                      className={getSeatColor(getSeatStatus(seat))}
                      onClick={() => {
                        if (availableSeats.includes(seat)) {
                          setSelectedSeat(seat);
                        }
                      }}
                      disabled={!availableSeats.includes(seat) && selectedSeat !== seat}
                    >
                      {seat}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Selected Seat</label>
                  <div className="text-2xl font-bold text-primary">
                    {selectedSeat || 'None'}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Duration (Hours)</label>
                  <div className="flex items-center gap-4 mt-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setHours(Math.max(1, hours - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-2xl font-bold w-12 text-center">{hours}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setHours(hours + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Rate (₹50/hour)</span>
                    <span>₹{hours * 50}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>GST</span>
                    <span>₹9</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount</span>
                    <span className="text-primary">₹{amount}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleBookSeat}
                  disabled={!selectedSeat || loading}
                >
                  {loading ? 'Processing...' : 'Confirm & Pay'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SeatBooking;
