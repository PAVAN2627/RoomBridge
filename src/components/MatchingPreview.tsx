import { motion } from "framer-motion";
import { GraduationCap, MapPin, Briefcase, Users, Star, CheckCircle } from "lucide-react";

const matchTypes = [
  { icon: GraduationCap, label: "Same College Rooms", color: "from-violet-500 to-purple-500" },
  { icon: MapPin, label: "Same Hometown Rooms", color: "from-purple-500 to-pink-500" },
  { icon: Briefcase, label: "Same Profession", color: "from-pink-500 to-rose-500" },
  { icon: Users, label: "Best Matches For You", color: "from-rose-500 to-orange-500" },
  { icon: Star, label: "Nearby Rooms", color: "from-orange-500 to-amber-500" },
];

const MatchingPreview = () => {
  return (
    <section className="py-20 bg-background relative overflow-hidden">
      {/* Animated background */}
      <motion.div 
        className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-violet-300/10 to-purple-300/10 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, -30, 0],
          y: [0, 30, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Smart Matching,{" "}
              <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Not Random Listings
              </span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              Our algorithm personalizes your feed based on your education, profession, hometown, and preferences — so you find the perfect vibe match.
            </p>
            <div className="space-y-3">
              {matchTypes.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ x: 5, transition: { duration: 0.2 } }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 hover:from-muted hover:to-muted/50 transition-all duration-300 border border-transparent hover:border-violet-200 dark:hover:border-violet-900"
                >
                  <motion.div 
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center shadow-md flex-shrink-0`}
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <item.icon className="w-5 h-5 text-white" />
                  </motion.div>
                  <span className="font-medium text-foreground text-sm">{item.label}</span>
                  <CheckCircle className="w-4 h-4 text-violet-500 ml-auto" />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Mock preview card with enhanced animations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <motion.div
              whileHover={{ y: -5, transition: { duration: 0.3 } }}
              className="bg-card rounded-2xl border border-border shadow-xl p-6 relative overflow-hidden"
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-pink-500/5" />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <motion.span 
                    className="text-xs font-semibold bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-900"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🔥 Best Match
                  </motion.span>
                  <span className="text-xs font-semibold bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 text-violet-600 dark:text-violet-400 px-3 py-1 rounded-full border border-violet-200 dark:border-violet-900">
                    🎓 Same College
                  </span>
                </div>

                <motion.div 
                  className="h-48 rounded-xl bg-gradient-to-br from-violet-100 via-purple-100 to-pink-100 dark:from-violet-900/20 dark:via-purple-900/20 dark:to-pink-900/20 mb-4 flex items-center justify-center overflow-hidden relative"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-violet-400/20 to-pink-400/20"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 90, 0]
                    }}
                    transition={{ duration: 10, repeat: Infinity }}
                  />
                  <span className="text-muted-foreground text-sm font-medium relative z-10">Room Preview Image</span>
                </motion.div>

                <h3 className="font-display font-bold text-foreground mb-1 text-lg">Spacious Room near IIT Gate</h3>
                <p className="text-sm text-muted-foreground mb-3">2 BHK shared • Furnished • AC</p>

                <div className="flex items-center justify-between mb-4">
                  <span className="font-display font-bold text-2xl bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                    ₹6,500<span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </span>
                  <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400">4.8</span>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <motion.span 
                    className="text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2 py-1 rounded border border-green-200 dark:border-green-900"
                    whileHover={{ scale: 1.05 }}
                  >
                    ✔ ID Verified
                  </motion.span>
                  <motion.span 
                    className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded border border-blue-200 dark:border-blue-900"
                    whileHover={{ scale: 1.05 }}
                  >
                    ✔ Student Verified
                  </motion.span>
                </div>
              </div>

              {/* Floating badge */}
              <motion.div
                className="absolute -top-3 -right-3 bg-gradient-to-br from-violet-500 to-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                New
              </motion.div>
            </motion.div>

            {/* Decorative elements */}
            <motion.div
              className="absolute -bottom-4 -left-4 w-24 h-24 bg-gradient-to-br from-violet-400/20 to-purple-400/20 rounded-full blur-2xl"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div
              className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full blur-2xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default MatchingPreview;
