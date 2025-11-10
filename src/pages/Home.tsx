import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Users, Clock, Shield, Smartphone, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleAction = (path: string) => {
    if (isAuthenticated) {
      navigate(path);
    } else {
      navigate('/auth');
    }
  };

  const features = [
    {
      icon: BookOpen,
      title: 'Smart Seat Management',
      description: 'Choose from 60 premium study seats across Ground, First, and Special floors',
    },
    {
      icon: Users,
      title: 'Flexible Subscriptions',
      description: 'Weekly, monthly, or yearly plans tailored to your study schedule',
    },
    {
      icon: Clock,
      title: 'Real-time Availability',
      description: 'Check seat availability instantly and book your preferred spot',
    },
    {
      icon: Shield,
      title: 'Secure Authentication',
      description: 'Role-based access for students, librarians, and administrators',
    },
    {
      icon: Smartphone,
      title: 'QR Code Verification',
      description: 'Quick and contactless entry with QR code scanning',
    },
    {
      icon: CreditCard,
      title: 'Easy Payments',
      description: 'Secure online payment integration with Stripe',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Welcome to <span className="bg-gradient-primary bg-clip-text text-transparent">iLibrary</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your comprehensive private library management system. Book seats, manage subscriptions, 
              and enjoy a seamless study experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                className="text-lg shadow-glow"
                onClick={() => handleAction('/seat-booking')}
              >
                Book a Seat
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg"
                onClick={() => handleAction('/subscriptions')}
              >
                Get Subscription
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose iLibrary?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Modern technology meets traditional learning spaces
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card className="border-2">
              <CardContent className="pt-6 space-y-4">
                <h2 className="text-2xl font-bold">About iLibrary</h2>
                <p className="text-muted-foreground leading-relaxed">
                  iLibrary is a comprehensive private library management system designed to streamline 
                  the experience for students, librarians, and administrators. Our platform offers 
                  flexible seat booking with hourly rates, subscription plans ranging from weekly to 
                  yearly options, and secure role-based authentication.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  With features like real-time seat availability checking, QR code verification for 
                  quick entry, and integrated payment processing through Stripe, we make library 
                  management effortless and efficient. Whether you're a student looking for a quiet 
                  study space, a librarian managing daily operations, or an administrator overseeing 
                  the entire system, iLibrary has the tools you need.
                </p>
                <div className="pt-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-primary">60</div>
                    <div className="text-sm text-muted-foreground">Study Seats</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">3</div>
                    <div className="text-sm text-muted-foreground">Subscription Plans</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">₹50</div>
                    <div className="text-sm text-muted-foreground">Per Hour</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join iLibrary today and experience the future of library management
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="text-lg"
            onClick={() => navigate('/auth')}
          >
            Get Started Now
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Home;
