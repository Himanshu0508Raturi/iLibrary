import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { User, History, CreditCard, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

const BASE_URL = 'http://localhost:8080';

interface Booking {
  id: number;
  seat_id: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  hrs: number;
  amt: number;
  isPaymentDone: boolean;
}

interface Subscription {
  id: number;
  type: string;
  status: string;
  startTime: string;
  amount: number;
  startDate: string;
  endDate: string;
}

const Profile = () => {
  const { user, token, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [bookingHistory, setBookingHistory] = useState<Booking[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);
  const [allSubscriptions, setAllSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);

  // Helper function to convert 24-hour time to 12-hour format with AM/PM
  const formatTime = (timeString: string) => {
    try {
      // Handle different time formats: "HH:MM", "HH:MM:SS", or already formatted
      const timeParts = timeString.split(':');
      let hours = parseInt(timeParts[0]);
      let minutes = parseInt(timeParts[1]);

      // Validate hours and minutes
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.warn('Invalid time format:', timeString);
        return timeString; // Return original if invalid
      }

      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (error) {
      console.error('Error formatting time:', timeString, error);
      return timeString; // Return original on error
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  // GET request to /changeDetail/bookingHistory
  const fetchBookingHistory = async () => {
    try {
      const response = await fetch(`${BASE_URL}/changeDetail/bookingHistory`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBookingHistory(data);
      }
    } catch (error) {
      toast.error('Failed to fetch booking history');
    }
  };

  // GET request to /changeDetail/activeSubscription
  const fetchActiveSubscription = async () => {
    try {
      const response = await fetch(`${BASE_URL}/changeDetail/activeSubscription`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setActiveSubscription(data);
      }
    } catch (error) {
      console.log('No active subscription');
    }
  };

  // GET request to /changeDetail/allSubscription
  const fetchAllSubscriptions = async () => {
    try {
      const response = await fetch(`${BASE_URL}/changeDetail/allSubscription`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAllSubscriptions(data);
      }
    } catch (error) {
      toast.error('Failed to fetch subscriptions');
    }
  };

  // DELETE request to /booking/cancel
  const cancelBooking = async (bookingId: number) => {
    try {
      const response = await fetch(`${BASE_URL}/booking/cancel?bookingId=${bookingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        toast.success('Booking cancelled successfully');
        fetchBookingHistory();
      }
    } catch (error) {
      toast.error('Failed to cancel booking');
    }
  };

  // PUT request to /subscription/renew
  const renewSubscription = async () => {
    try {
      const response = await fetch(`${BASE_URL}/subscription/renew`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const message = await response.text();
        toast.success(message);
        fetchActiveSubscription();
      }
    } catch (error) {
      toast.error('Failed to renew subscription');
    }
  };

  // PUT request to /subscription/cancel
  const cancelSubscription = async () => {
    try {
      const response = await fetch(`${BASE_URL}/subscription/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const message = await response.text();
        toast.success(message);
        fetchActiveSubscription();
      }
    } catch (error) {
      toast.error('Failed to cancel subscription');
    }
  };

  // GET request to /subscription/status
  const checkSubscriptionStatus = async () => {
    try {
      const response = await fetch(`${BASE_URL}/subscription/status`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const message = await response.text();
        toast.info(message);
      }
    } catch (error) {
      toast.error('Failed to check status');
    }
  };

  // DELETE request to /changeDetail/deleteUser
  const deleteAccount = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/changeDetail/deleteUser`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        toast.success('Account deleted successfully');
        logout();
      }
    } catch (error) {
      toast.error('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="space-y-6">
          {/* Profile Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-2xl text-primary-foreground font-bold">
                  {user?.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <CardTitle className="text-2xl">{user?.username}</CardTitle>
                  <CardDescription>{user?.email}</CardDescription>
                  <div className="flex gap-2 mt-2">
                    {user?.roles.map(role => (
                      <Badge key={role} variant="secondary">
                        {role.replace('ROLE_', '')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Action Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={fetchBookingHistory}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Booking History
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={fetchActiveSubscription}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Active Subscription
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={fetchAllSubscriptions}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  All Subscriptions
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Booking History */}
          {bookingHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Booking History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookingHistory.map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-semibold text-lg">Booking #{booking.id}</p>
                          <p className="text-sm text-muted-foreground">
                            Seat ID: {booking.seat_id}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge variant={booking.status === 'CONFIRMED' ? 'default' : booking.status === 'CANCELLED' ? 'destructive' : 'secondary'}>
                            {booking.status}
                          </Badge>
                          <p className="text-sm text-muted-foreground">
                            Payment: {booking.isPaymentDone ? 'Paid' : 'Pending'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p className="font-medium">
                            {new Date(booking.bookingDate).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Start Time</p>
                          <p className="font-medium">{formatTime(booking.startTime)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">End Time</p>
                          <p className="font-medium">{formatTime(booking.endTime)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-bold text-xl text-green-600">
                            ₹{booking.amt ? booking.amt.toLocaleString() : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {booking.status !== 'CANCELLED' && (
                        <div className="flex justify-end pt-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => cancelBooking(booking.id)}
                          >
                            Cancel Booking
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Subscription */}
          {activeSubscription && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Active Subscription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium">{activeSubscription.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge>{activeSubscription.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">{new Date(activeSubscription.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-medium">{new Date(activeSubscription.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={renewSubscription}>Renew</Button>
                  <Button variant="outline" onClick={cancelSubscription}>Cancel</Button>
                  <Button variant="secondary" onClick={checkSubscriptionStatus}>Check Status</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Subscriptions */}
          {allSubscriptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>All Subscriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allSubscriptions.map((sub) => (
                    <div key={sub.id} className="border-b pb-4">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">{sub.type}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(sub.startDate).toLocaleDateString()} - {new Date(sub.endDate).toLocaleDateString()}
                          </p>
                          <p className="text-sm">Amount: ₹{sub.amount}</p>
                        </div>
                        <Badge variant={sub.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {sub.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delete Account */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteAccount} disabled={loading}>
                      {loading ? 'Deleting...' : 'Delete Account'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
