import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Users, Armchair, Calendar, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const BASE_URL = 'http://localhost:8080';

const Admin = () => {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.roles.includes('ROLE_ADMIN')) {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  // GET request to /admin/allSubscription
  const fetchAllSubscriptions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/admin/allSubscription`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const subscriptions = await response.json();
        setData(subscriptions);
        setActiveView('subscriptions');
      }
    } catch (error) {
      toast.error('Failed to fetch subscriptions');
    } finally {
      setLoading(false);
    }
  };

  // GET request to /admin/allSeats
  const fetchAllSeats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/admin/allSeats`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const seats = await response.json();
        setData(seats);
        setActiveView('seats');
      }
    } catch (error) {
      toast.error('Failed to fetch seats');
    } finally {
      setLoading(false);
    }
  };

  // GET request to /admin/allBooking
  const fetchAllBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/admin/allBooking`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const bookings = await response.json();
        setData(bookings);
        setActiveView('bookings');
      }
    } catch (error) {
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  // GET request to /admin/allUsers
  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/admin/allUsers`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const users = await response.json();
        setData(users);
        setActiveView('users');
      }
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return <div className="text-center py-8">Loading...</div>;
    }

    if (!activeView) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          Select an option above to view data
        </div>
      );
    }

    if (activeView === 'subscriptions') {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Period</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((sub: any) => (
              <TableRow key={sub.id}>
                <TableCell>{sub.id}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{sub.user?.username}</p>
                    <p className="text-xs text-muted-foreground">{sub.user?.email}</p>
                  </div>
                </TableCell>
                <TableCell>{sub.type}</TableCell>
                <TableCell>
                  <Badge variant={sub.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {sub.status}
                  </Badge>
                </TableCell>
                <TableCell>₹{sub.price}</TableCell>
                <TableCell className="text-sm">
                  {new Date(sub.startDate).toLocaleDateString()} - {new Date(sub.endDate).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    if (activeView === 'seats') {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Seat Number</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((seat: any) => (
              <TableRow key={seat.id}>
                <TableCell>{seat.id}</TableCell>
                <TableCell className="font-medium">{seat.seatNumber}</TableCell>
                <TableCell>{seat.location}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      seat.status?.toLowerCase() === 'available' ? 'default' :
                      seat.status?.toLowerCase() === 'booked' ? 'destructive' :
                      'secondary'
                    }
                  >
                    {seat.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    if (activeView === 'bookings') {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Seat</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((booking: any) => (
              <TableRow key={booking.id}>
                <TableCell>{booking.id}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{booking.user?.username}</p>
                    <p className="text-xs text-muted-foreground">{booking.user?.email}</p>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{booking.seat?.seatNumber}</TableCell>
                <TableCell className="text-sm">
                  <div>{new Date(booking.bookingDate).toLocaleDateString()}</div>
                  <div className="text-muted-foreground">{booking.startTime} - {booking.endTime}</div>
                </TableCell>
                <TableCell>{booking.hrs}h</TableCell>
                <TableCell>
                  <Badge variant={booking.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                    {booking.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    if (activeView === 'users') {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((user: any) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {user.roles?.map((role: string) => (
                      <Badge key={role} variant="outline">
                        {role.replace('ROLE_', '')}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage all library resources and users
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={fetchAllSubscriptions}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-primary" />
                All Subscriptions
              </CardTitle>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={fetchAllSeats}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Armchair className="h-5 w-5 text-primary" />
                All Seats
              </CardTitle>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={fetchAllBookings}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                All Bookings
              </CardTitle>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={fetchAllUsers}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                All Users
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {activeView === 'subscriptions' && 'All Subscriptions'}
              {activeView === 'seats' && 'All Seats'}
              {activeView === 'bookings' && 'All Bookings'}
              {activeView === 'users' && 'All Users'}
              {!activeView && 'Dashboard'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
