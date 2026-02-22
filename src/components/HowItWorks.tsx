import { motion } from "framer-motion";
import { UserCheck, Brain, MessageCircle, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: UserCheck,
    title: "Register & Verify",
    description: "Sign up with your details and verify your identity with Aadhaar/PAN and a live selfie.",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: Brain,
    title: "Get Smart Matches",
    description: "Our algorithm matches you based on college, profession, hometown, and preferences.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: MessageCircle,
    title: "Connect Safely",
    description: "Chat securely in-app, check ratings, and move in with confidence.",
    color: "from-pink-500 to-orange-500",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 bg-background relative overflow-hidden">
      {/* Animated background */}
      <motion.div 
        className="absolute top-0 left-1/4 w-96 h-96 bg-violet-300/10 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, 50, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            How It <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Works</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Three simple steps to your perfect room.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
          {/* Connection lines */}
          <div className="hidden md:block absolute top-8 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-200 via-purple-200 to-pink-200 dark:from-violet-900 dark:via-purple-900 dark:to-pink-900" style={{ top: '32px', left: '16.666%', right: '16.666%' }} />

          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="text-center relative"
            >
              <motion.div 
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} mx-auto mb-5 flex items-center justify-center shadow-lg relative z-10`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <step.icon className="w-7 h-7 text-white" />
              </motion.div>
              
              <motion.div 
                className="text-sm font-semibold text-secondary mb-2"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              >
                Step {i + 1}
              </motion.div>
              
              <h3 className="font-display text-xl font-bold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>

              {/* Arrow between steps */}
              {i < steps.length - 1 && (
                <motion.div 
                  className="hidden md:block absolute top-8 -right-4 text-violet-300 dark:text-violet-700"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
