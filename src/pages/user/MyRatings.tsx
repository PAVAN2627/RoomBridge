import { useState, useEffect } from "react";
import UserDashboardLayout from "@/components/UserDashboardLayout";
import { Star, Loader2, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getUser } from "@/lib/firebase/users";
import { motion } from "framer-motion";

interface RatingWithReviewer {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  stars: number;
  review_text?: string;
  status: string;
  created_at: any;
  reviewer_name?: string;
  reviewer_photo?: string;
}

const MyRatings = () => {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<RatingWithReviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    const fetchRatings = async () => {
      if (!user) return;
      
      try {
        const ratingsRef = collection(db, "ratings");
        const q = query(ratingsRef, where("reviewee_id", "==", user.uid));
        const snapshot = await getDocs(q);
        
        const ratingsData = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((r: any) => r.status === "active")
          .sort((a: any, b: any) => {
            const aTime = a.created_at?.toMillis?.() ?? 0;
            const bTime = b.created_at?.toMillis?.() ?? 0;
            return bTime - aTime;
          }) as RatingWithReviewer[];
        
        // Fetch reviewer details for each rating
        const ratingsWithReviewers = await Promise.all(
          ratingsData.map(async (rating) => {
            try {
              const reviewerData = await getUser(rating.reviewer_id);
              return {
                ...rating,
                reviewer_name: reviewerData?.name || "Anonymous User",
                reviewer_photo: reviewerData?.selfie_url,
              };
            } catch (error) {
              console.error("Error fetching reviewer:", error);
              return {
                ...rating,
                reviewer_name: "Anonymous User",
              };
            }
          })
        );
        
        setRatings(ratingsWithReviewers);
        
        // Calculate average rating
        if (ratingsWithReviewers.length > 0) {
          const sum = ratingsWithReviewers.reduce((acc, r) => acc + r.stars, 0);
          setAverageRating(sum / ratingsWithReviewers.length);
        }
      } catch (error) {
        console.error("Error fetching ratings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [user]);

  if (loading) {
    return (
      <UserDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </UserDashboardLayout>
    );
  }

  return (
    <UserDashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">My Ratings</h1>
          <p className="text-muted-foreground">See what others think about you</p>
        </motion.div>

        {/* Overall rating */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-card via-card to-violet-50/30 dark:to-violet-950/10 rounded-2xl border border-border p-8 shadow-lg text-center"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 mb-4">
            <span className="font-display text-4xl font-bold text-white">
              {ratings.length > 0 ? averageRating.toFixed(1) : "0.0"}
            </span>
          </div>
          <div className="flex items-center justify-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star 
                key={s} 
                className={`w-6 h-6 ${
                  s <= Math.round(averageRating) 
                    ? "text-yellow-400 fill-yellow-400" 
                    : "text-muted-foreground/30"
                }`} 
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Based on <span className="font-bold text-primary">{ratings.length}</span> {ratings.length === 1 ? "review" : "reviews"}
          </p>
        </motion.div>

        {/* Reviews list */}
        {ratings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center py-16 bg-card rounded-2xl border border-border"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-foreground mb-2">No ratings yet</p>
            <p className="text-sm text-muted-foreground">
              When others rate you, their reviews will appear here
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {ratings.map((r, index) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
                className="bg-card rounded-2xl border border-border p-6 shadow-card transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {r.reviewer_photo ? (
                      <img
                        src={r.reviewer_photo}
                        alt={r.reviewer_name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-violet-500/20"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                        {r.reviewer_name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-foreground">{r.reviewer_name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star 
                            key={s} 
                            className={`w-4 h-4 ${
                              s <= r.stars 
                                ? "text-yellow-400 fill-yellow-400" 
                                : "text-muted-foreground/30"
                            }`} 
                          />
                        ))}
                        <span className="ml-1 text-sm font-bold text-foreground">
                          {r.stars}.0
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {r.created_at?.toDate?.()?.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) || 'N/A'}
                  </span>
                </div>
                {r.review_text && (
                  <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
                    <p className="text-sm text-foreground leading-relaxed italic">
                      "{r.review_text}"
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </UserDashboardLayout>
  );
};

export default MyRatings;
