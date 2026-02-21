import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Search, Home, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import heroImage from "@/assets/hero-illustration.png";

const HeroSection = () => {
  const { user } = useAuth();
  
  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-accent/40" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-3xl translate-y-1/2 -translate-x-1/4" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 bg-accent rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse-glow" />
              <span className="text-xs font-semibold text-accent-foreground">Verified & Safe Platform</span>
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground mb-6">
              Find Safe Rooms.{" "}
              <span className="text-gradient-brand">Match Smartly.</span>{" "}
              Move Confidently.
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg mb-8">
              India's first trust-first room & roommate platform for students, interns, and young professionals. No brokers. Verified users only.
            </p>

            <div className="flex flex-wrap gap-4">
              {user ? (
                <>
                  <Button variant="action" size="lg" className="text-base px-8" asChild>
                    <Link to="/dashboard">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Go to Dashboard
                    </Link>
                  </Button>
                  <Button variant="brand-outline" size="lg" className="text-base px-8" asChild>
                    <Link to="/dashboard/browse">
                      <Search className="w-4 h-4 mr-2" />
                      Browse Rooms
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="action" size="lg" className="text-base px-8" asChild>
                    <Link to="/register">
                      <Search className="w-4 h-4 mr-2" />
                      Get Started
                    </Link>
                  </Button>
                  <Button variant="brand-outline" size="lg" className="text-base px-8" asChild>
                    <Link to="/login">
                      <Home className="w-4 h-4 mr-2" />
                      Log In
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4 mt-8">
              {["ID Verified", "Smart Matching", "In-App Chat", "No Brokers"].map((badge) => (
                <div key={badge} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {badge}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="hidden lg:block"
          >
            <img
              src={heroImage}
              alt="Students finding rooms together"
              className="w-full rounded-2xl shadow-card"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
