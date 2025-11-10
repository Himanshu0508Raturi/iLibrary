import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BookOpen } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const { login, signup, isAuthenticated, user } = useAuth();

  // Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup state
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("Current user:", user);
      console.log("Current user roles:", user.roles);

      if (!Array.isArray(user.roles) || user.roles.length === 0) {
        toast.error("No roles assigned to user");
        return;
      }

      const userRoles = user.roles.map(role => role.toUpperCase());
      console.log("User roles (uppercase):", userRoles);

      if (userRoles.includes('ROLE_ADMIN')) {
        console.log("Redirecting admin user");
        navigate('/admin');
      } else if (userRoles.includes('ROLE_LIBRARIAN')) {
        console.log("Redirecting librarian user");
        navigate('/librarian');
      } else if (userRoles.includes('ROLE_STUDENT')) {
        console.log("Redirecting student user");
        navigate('/home');
      } else {
        console.log("Unknown role found:", userRoles);
        toast.error("Invalid role configuration");
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      await login(loginUsername, loginPassword);

      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('User data after login:', userData);

      if (!userData.roles || userData.roles.length === 0) {
        toast.error("No roles assigned to user");
        return;
      }

      const userRoles = userData.roles.map((r: string) => r.toUpperCase());
      console.log('User roles:', userRoles);

      if (userRoles.includes('ROLE_ADMIN')) {
        toast.success('Welcome, Admin!');
        navigate('/admin');
      } else if (userRoles.includes('ROLE_LIBRARIAN')) {
        toast.success('Welcome, Librarian!');
        navigate('/librarian');
      } else if (userRoles.includes('ROLE_STUDENT') || userRoles.includes('ROLE_USER')) {
        toast.success('Welcome!');
        navigate('/home');
      } else {
        toast.error("Invalid role configuration");
        console.error('Unknown roles:', userRoles);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
      console.error('Login error:', error);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    setSignupLoading(true);

    try {
      // Always send ROLE_STUDENT for every signup
      await signup(signupUsername, signupPassword, signupEmail, ['ROLE_STUDENT']);
      toast.success('Registration successful! Please login.');

      // Switch to login tab
      const loginTab = document.querySelector('[value="login"]') as HTMLElement;
      loginTab?.click();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Signup failed');
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-glow">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome to iLibrary</CardTitle>
          <CardDescription>Login or create an account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Username</Label>
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="Enter your username"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loginLoading}>
                  {loginLoading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder="Choose a username"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                  />
                </div>

                {/* Role selection removed — ROLE_STUDENT is sent by default */}
                <Button type="submit" className="w-full" disabled={signupLoading}>
                  {signupLoading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
