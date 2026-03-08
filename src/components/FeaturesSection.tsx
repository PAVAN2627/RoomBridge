import { motion } from "framer-motion";
import { 
  Shield, Search, MessageCircle, Star, FileText, PlusCircle, 
  Users, Home, Flag, Brain, Clock, CheckCircle, 
  LayoutDashboard, HandHelping, HelpCircle, UserCheck
} from "lucide-react";

const features = [
  {
    category: "For Users",
    icon: Users,
    color: "from-violet-500 to-purple-500",
    items: [
      { icon: Search, title: "Browse Listings", desc: "Search verified rooms with smart filters" },
      { icon: FileText, title: "Room Requests", desc: "Post what you need, let others find you" },
      { icon: PlusCircle, title: "Post Listings", desc: "List your room in minutes" },
      { icon: MessageCircle, title: "In-App Chat", desc: "Secure messaging with verified users" },
      { icon: Star, title: "Ratings & Reviews", desc: "Check ratings before you connect" },
      { icon: HandHelping, title: "Emergency Rooms", desc: "Find urgent stays for exams & interviews" },
    ]
  },
  {
    category: "Smart Features",
    icon: Brain,
    color: "from-pink-500 to-orange-500",
    items: [
      { icon: Brain, title: "AI Matching", desc: "Smart algorithm matches by college, profession & hometown" },
      { icon: Shield, title: "ID Verification", desc: "Aadhaar/PAN + live selfie verification" },
      { icon: UserCheck, title: "Profile Verification", desc: "Student & professional ID verification" },
      { icon: CheckCircle, title: "Auto Verification", desc: "Instant verification on registration" },
      { icon: Clock, title: "Real-Time Updates", desc: "Live notifications for messages & matches" },
      { icon: Flag, title: "Report System", desc: "Flag suspicious users for safety" },
    ]
  },
  {
    category: "Admin Controls",
    icon: LayoutDashboard,
    color: "from-blue-500 to-cyan-500",
    items: [
      { icon: LayoutDashboard, title: "Admin Dashboard", desc: "Complete platform overview & analytics" },
      { icon: Users, title: "User Management", desc: "Monitor & manage all users" },
      { icon: Home, title: "Listing Management", desc: "Review & moderate all listings" },
      { icon: Star, title: "Review Moderation", desc: "Monitor ratings & reviews" },
      { icon: Flag, title: "Reports & Flags", desc: "Handle user reports & safety issues" },
      { icon: HelpCircle, title: "Support System", desc: "Help users with issues & queries" },
    ]
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-background via-muted/30 to-background relative overflow-hidden">
      {/* Animated background elements */}
      <motion.div 
        className="absolute top-20 left-10 w-72 h-72 bg-violet-400/10 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, 30, 0],
          y: [0, -20, 0]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-20 right-10 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.3, 1],
          x: [0, -40, 0],
          y: [0, 30, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-block mb-4"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-4xl">✨</span>
          </motion.div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Everything You Need in{" "}
            <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              One Platform
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From smart matching to secure messaging, we've built every feature with your safety and convenience in mind.
          </p>
        </motion.div>

        <div className="space-y-16">
          {features.map((section, sectionIdx) => (
            <motion.div
              key={section.category}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: sectionIdx * 0.1 }}
            >
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-8">
                <motion.div 
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-lg`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <section.icon className="w-6 h-6 text-white" />
                </motion.div>
                <h3 className="font-display text-2xl font-bold text-foreground">{section.category}</h3>
              </div>

              {/* Feature Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {section.items.map((feature, idx) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className="group relative bg-card rounded-xl p-6 border border-border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    {/* Hover gradient effect */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                    
                    <div className="relative z-10">
                      <motion.div 
                        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${section.color} flex items-center justify-center mb-4 shadow-md`}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <feature.icon className="w-5 h-5 text-white" />
                      </motion.div>
                      <h4 className="font-display text-base font-bold text-foreground mb-2 group-hover:text-violet-600 transition-colors">
                        {feature.title}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.desc}
                      </p>
                    </div>

                    {/* Corner accent */}
                    <motion.div 
                      className={`absolute -top-8 -right-8 w-16 h-16 rounded-full bg-gradient-to-br ${section.color} opacity-10`}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 3, repeat: Infinity, delay: idx * 0.2 }}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div 
          className="mt-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {[
            { label: "Active Listings", value: "2,400+", icon: Home },
            { label: "Verified Users", value: "5,000+", icon: UserCheck },
            { label: "Successful Matches", value: "1,200+", icon: CheckCircle },
            { label: "Cities Covered", value: "50+", icon: Search },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 rounded-xl p-6 text-center border border-violet-100 dark:border-violet-900"
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: idx * 0.2 }}
              >
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-violet-600" />
              </motion.div>
              <div className="font-display text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
