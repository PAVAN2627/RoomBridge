import { motion } from "framer-motion";
import { Building, Users, Clock, AlertTriangle, Sparkles } from "lucide-react";

const categories = [
  {
    icon: Building,
    title: "Long-Term Rental",
    description: "Furnished & unfurnished rooms for 6+ months stays.",
    count: "2,400+ listings",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: Users,
    title: "PG Accommodation",
    description: "Paying guest rooms with meals and amenities included.",
    count: "1,800+ listings",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Clock,
    title: "Short Stay",
    description: "1–3 day stays for exams, interviews, or quick visits.",
    count: "600+ listings",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: AlertTriangle,
    title: "Emergency Rooms",
    description: "Verified rooms available for immediate move-in.",
    count: "Available now",
    emergency: true,
    color: "from-orange-500 to-red-500",
  },
];

const CategoriesSection = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-muted/50 via-muted/30 to-background relative overflow-hidden">
      {/* Animated background elements */}
      <motion.div 
        className="absolute top-10 right-10 w-64 h-64 bg-purple-300/10 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.3, 1],
          rotate: [0, 90, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
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
            Find What <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">You Need</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Browse rooms by category tailored to your situation.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className={`group relative rounded-2xl p-6 cursor-pointer transition-all duration-300 overflow-hidden ${
                cat.emergency
                  ? "bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-2 border-orange-200 dark:border-orange-900 shadow-lg"
                  : "bg-card border border-border shadow-md hover:shadow-xl"
              }`}
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

              {/* Emergency badge */}
              {cat.emergency && (
                <motion.div 
                  className="absolute top-3 right-3"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-4 h-4 text-orange-500" />
                </motion.div>
              )}

              <div className="relative z-10">
                <motion.div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${cat.color} shadow-lg`}
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                >
                  <cat.icon className="w-6 h-6 text-white" />
                </motion.div>
                
                <h3 className="font-display text-lg font-bold text-foreground mb-1 group-hover:text-violet-600 transition-colors">
                  {cat.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{cat.description}</p>
                
                <motion.span
                  className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
                    cat.emergency 
                      ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" 
                      : "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  {cat.count}
                </motion.span>
              </div>

              {/* Corner decoration */}
              <motion.div 
                className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${cat.color} opacity-10`}
                animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                transition={{ duration: 10, repeat: Infinity, delay: i * 0.5 }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
