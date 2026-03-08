import { useState, useEffect } from "react";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Star, Loader2, Award, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

const AdminReviews = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const ratingsRef = collection(db, "ratings");
        const q = query(ratingsRef, orderBy("created_at", "desc"), limit(50));
        const snapshot = await getDocs(q);
        
        const reviewsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setReviews(reviewsData);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (loading) {
    return (
      <AdminDashboardLayout>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-64"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-12 h-12 text-primary" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-muted-foreground mt-4"
          >
            Loading reviews...
          </motion.p>
        </motion.div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header with gradient */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 rounded-2xl blur-xl" />
          <div className="relative bg-card/80 backdrop-blur-sm border rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-lg"
              >
                <Award className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">User Reviews & Ratings</h2>
                <p className="text-sm text-muted-foreground">Monitor and moderate user reviews</p>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl p-4 border border-yellow-500/20"
              >
                <p className="text-xs text-muted-foreground mb-1">Total Reviews</p>
                <p className="text-2xl font-bold text-foreground">{reviews.length}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20"
              >
                <p className="text-xs text-muted-foreground mb-1">Average Rating</p>
                <p className="text-2xl font-bold text-foreground flex items-center gap-1">
                  {reviews.length > 0 
                    ? (reviews.reduce((acc, r) => acc + (r.stars || 0), 0) / reviews.length).toFixed(1)
                    : "0.0"}
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-xl p-4 border border-red-500/20"
              >
                <p className="text-xs text-muted-foreground mb-1">Flagged</p>
                <p className="text-2xl font-bold text-foreground">
                  {reviews.filter(r => r.status === "flagged").length}
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {reviews.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="mb-6"
            >
              <Award className="w-20 h-20 mx-auto text-muted-foreground/40" />
            </motion.div>
            <p className="text-muted-foreground text-lg">No reviews found</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {reviews.map((r, index) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.1)" }}
                  className={`bg-card rounded-2xl border p-6 shadow-card transition-all duration-300 ${
                    r.status === "flagged" 
                      ? "border-red-500/40 bg-gradient-to-br from-red-500/5 to-transparent" 
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <motion.div
                              key={s}
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ delay: index * 0.05 + s * 0.05 }}
                            >
                              <Star 
                                className={`w-5 h-5 ${
                                  s <= r.stars 
                                    ? "text-yellow-500 fill-yellow-500" 
                                    : "text-muted-foreground/30"
                                }`} 
                              />
                            </motion.div>
                          ))}
                        </div>
                        <span className="text-sm font-bold text-foreground">
                          {r.stars}.0
                        </span>
                      </div>
                      <div className="text-sm mb-3">
                        <span className="font-semibold text-foreground px-2.5 py-1 bg-violet-500/10 rounded-full border border-violet-500/20">
                          {r.reviewer_id}
                        </span>
                        <span className="text-muted-foreground mx-2">→</span>
                        <span className="font-semibold text-foreground px-2.5 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                          {r.reviewee_id}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs text-muted-foreground px-2.5 py-1 bg-muted rounded-full">
                        {r.created_at?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </span>
                      {r.status === "flagged" && (
                        <motion.span
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="text-xs font-bold text-red-600 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/30"
                        >
                          🚩 Flagged
                        </motion.span>
                      )}
                    </div>
                  </div>
                  
                  {r.review_text && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 + 0.2 }}
                      className="bg-muted/30 rounded-xl p-4 mb-4"
                    >
                      <p className="text-sm text-foreground leading-relaxed">{r.review_text}</p>
                    </motion.div>
                  )}
                  
                  {r.status === "flagged" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 + 0.3 }}
                      className="flex gap-2"
                    >
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button variant="destructive" size="sm">Remove Review</Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button variant="ghost" size="sm">Dismiss Flag</Button>
                      </motion.div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminReviews;
