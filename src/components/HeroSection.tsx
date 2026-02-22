import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Search, Home, LayoutDashboard, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import heroImage from "@/assets/hero-illustration.png";

const HeroSection = () => {
  const { user } = useAuth();
  
  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-violet-950/20 dark:via-purple-950/20 dark:to-pink-950/20" />
      
      {/* Animated orbs */}
      <motion.div 
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-violet-400/20 to-purple-600/20 blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, -30, 0]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{ transform: "translate(25%, -50%)" }}
      />
      <motion.div 
        className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-pink-400/20 to-orange-500/20 blur-3xl"
        animate={{ 
          scale: [1, 1.3, 1],
          x: [0, -40, 0],
          y: [0, 40, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{ transform: "translate(-25%, 50%)" }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <motion.div 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-full px-4 py-1.5 mb-6 border border-violet-200 dark:border-violet-800"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.span 
                className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-xs font-semibold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Verified & Safe Platform</span>
              <Sparkles className="w-3 h-3 text-violet-500" />
            </motion.div>

            <motion.h1 
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Find Safe Rooms.{" "}
              <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                Match Smartly.
              </span>{" "}
              Move Confidently.
            </motion.h1>

            <motion.p 
              className="text-lg text-muted-foreground max-w-lg mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              India's first trust-first room & roommate platform for students, interns, and young professionals. No brokers. Verified users only.
            </motion.p>

            <motion.div 
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {user ? (
                <>
                  <Button variant="action" size="lg" className="text-base px-8 shadow-lg hover:shadow-xl transition-all" asChild>
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
                  <Button variant="action" size="lg" className="text-base px-8 shadow-lg hover:shadow-xl transition-all" asChild>
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
            </motion.div>

            {/* Trust badges with animation */}
            <motion.div 
              className="flex flex-wrap gap-4 mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              {["ID Verified", "Smart Matching", "In-App Chat", "No Brokers"].map((badge, i) => (
                <motion.div 
                  key={badge} 
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 + i * 0.1 }}
                >
                  <motion.span 
                    className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  />
                  {badge}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Image with floating animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="hidden lg:block relative"
          >
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <img
                src={heroImage}
                alt="Students finding rooms together"
                className="w-full rounded-2xl shadow-2xl border border-violet-100 dark:border-violet-900"
              />
            </motion.div>
            
            {/* Floating badges */}
            <motion.div
              className="absolute -top-4 -right-4 bg-white dark:bg-gray-900 rounded-xl shadow-lg px-4 py-2 border border-violet-100 dark:border-violet-900"
              animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="text-xs font-semibold text-violet-600">🔥 2,400+ Listings</div>
            </motion.div>
            
            <motion.div
              className="absolute -bottom-4 -left-4 bg-white dark:bg-gray-900 rounded-xl shadow-lg px-4 py-2 border border-purple-100 dark:border-purple-900"
              animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <div className="text-xs font-semibold text-purple-600">✨ 100% Verified</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
