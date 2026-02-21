import { useState, useEffect } from "react";
import UserDashboardLayout from "@/components/UserDashboardLayout";
import { Star, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

const MyRatings = () => {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    const fetchRatings = async () => {
      if (!user) return;
      
      try {
        const ratingsRef = collection(db, "ratings");
        const q = query(
          ratingsRef, 
          where("reviewee_id", "==", user.uid),
          where("status", "==", "active"),
          orderBy("created_at", "desc")
        );
        const snapshot = await getDocs(q);
        
        const ratingsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setRatings(ratingsData);
        
        // Calculate average rating
        if (ratingsData.length > 0) {
          const sum = ratingsData.reduce((acc, r) => acc + r.stars, 0);
          setAverageRating(sum / ratingsData.length);
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
        {/* Overall rating */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-card text-center">
          <span className="font-display text-5xl font-bold text-foreground">
            {ratings.length > 0 ? averageRating.toFixed(1) : "0.0"}
          </span>
          <div className="flex items-center justify-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`w-5 h-5 ${s <= Math.round(averageRating) ? "text-secondary fill-secondary" : "text-secondary fill-secondary/30"}`} />
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-2">Based on {ratings.length} reviews</p>
        </div>

        {/* Reviews list */}
        {ratings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No ratings yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ratings.map((r) => (
              <div key={r.id} className="bg-card rounded-xl border border-border p-5 shadow-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-primary-foreground text-xs font-bold">
                      {r.reviewer_id?.charAt(0) || 'U'}
                    </div>
                    <span className="font-medium text-sm text-foreground">{r.reviewer_id}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {r.created_at?.toDate?.()?.toLocaleDateString() || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-3.5 h-3.5 ${s <= r.stars ? "text-secondary fill-secondary" : "text-muted"}`} />
                  ))}
                </div>
                {r.review_text && (
                  <p className="text-sm text-muted-foreground">{r.review_text}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </UserDashboardLayout>
  );
};

export default MyRatings;
