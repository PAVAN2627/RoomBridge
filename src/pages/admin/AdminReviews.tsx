import { useState, useEffect } from "react";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <p className="text-sm text-muted-foreground">Monitor and moderate user reviews</p>

        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No reviews found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className={`bg-card rounded-xl border p-5 shadow-card ${r.status === "flagged" ? "border-destructive/40" : "border-border"}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm">
                    <span className="font-medium text-foreground">{r.reviewer_id}</span>
                    <span className="text-muted-foreground"> → </span>
                    <span className="font-medium text-foreground">{r.reviewee_id}</span>
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
                  <p className="text-sm text-muted-foreground mb-3">{r.review_text}</p>
                )}
                {r.status === "flagged" && (
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm">Remove Review</Button>
                    <Button variant="ghost" size="sm">Dismiss Flag</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminReviews;
