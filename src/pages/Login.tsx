import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Eye, EyeOff, User, UserCog, ArrowLeft } from "lucide-react";
import { signInWithGoogle, signInWithEmail } from "@/lib/firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { getUser } from "@/lib/firebase/users";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await signInWithEmail(email, password);
      
      // Check if user is admin
      const userData = await getUser(result.user.uid);
      
      toast({
        title: "Success!",
        description: "You have been logged in successfully.",
      });
      
      // Redirect based on role
      if (userData?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    
    try {
      const result = await signInWithGoogle();
      
      // Check if user has completed registration
      const userData = await getUser(result.user.uid);
      
      if (!userData) {
        // User signed in with Google but hasn't completed registration
        toast({
          title: "Complete Registration",
          description: "Please complete your profile to continue.",
        });
        navigate('/register');
      } else {
        toast({
          title: "Success!",
          description: "You have been logged in with Google.",
        });
        
        // Redirect based on role
        if (userData.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with Google.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: 'user' | 'admin') => {
    if (role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ background: "linear-gradient(160deg, hsl(263 70% 28%) 0%, hsl(263 70% 40%) 50%, hsl(330 81% 50%) 100%)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-bold text-primary-foreground">RoomBridge</span>
        </div>

        <div>
          <h1 className="font-display text-4xl font-bold text-primary-foreground leading-tight mb-4">
            Find Safe Rooms.<br />
            Match Smartly.<br />
            Move Confidently.
          </h1>
          <p className="text-primary-foreground/70 text-lg max-w-md">
            India's first trust-first, verified room & roommate platform for students and professionals.
          </p>
        </div>

        <div className="flex gap-6">
          {["No Brokers", "Verified Users", "Smart Matching", "Safe Chat"].map((item) => (
            <div key={item} className="flex items-center gap-1.5 text-sm text-primary-foreground/60">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 justify-center mb-4">
            <div className="w-9 h-9 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-gradient-brand">RoomBridge</span>
          </div>

          <div className="text-center lg:text-left">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <h2 className="font-display text-3xl font-bold text-foreground">Welcome Back</h2>
            <p className="text-muted-foreground mt-2">Sign in to continue to your dashboard</p>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-foreground">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring pr-10 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="action" size="lg" className="w-full text-base" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-3 text-muted-foreground">or continue with</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            size="lg" 
            className="w-full text-sm font-medium"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {loading ? "Connecting..." : "Continue with Google"}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-3 text-muted-foreground">Quick Demo Access</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full text-sm font-medium"
              onClick={() => handleDemoLogin('user')}
              disabled={loading}
            >
              <User className="w-4 h-4 mr-2" />
              User Demo
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full text-sm font-medium"
              onClick={() => handleDemoLogin('admin')}
              disabled={loading}
            >
              <UserCog className="w-4 h-4 mr-2" />
              Admin Demo
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary font-semibold hover:underline">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
