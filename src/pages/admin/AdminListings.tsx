import { useState, useEffect } from "react";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { MapPin, AlertTriangle, Loader2 } from "lucide-react";
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

const AdminListings = () => {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const listingsRef = collection(db, "listings");
        const q = query(listingsRef, orderBy("created_at", "desc"), limit(50));
        const snapshot = await getDocs(q);
        
        const listingsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setListings(listingsData);
      } catch (error) {
        console.error("Error fetching listings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  const filteredListings = listings.filter(listing => {
    if (filter === "All") return true;
    if (filter === "Active") return listing.status === "active";
    if (filter === "Flagged") return listing.status === "flagged";
    if (filter === "Removed") return listing.status === "deleted";
    return true;
  });

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
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Review and manage all listings</p>
          <div className="flex gap-2">
            {["All", "Active", "Flagged", "Removed"].map((f) => (
              <button 
                key={f} 
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  f === filter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filteredListings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No listings found</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filteredListings.map((listing) => (
              <div key={listing.id} className={`bg-card rounded-xl border p-5 shadow-card ${
                listing.status === "flagged" ? "border-destructive/40" : "border-border"
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display font-bold text-foreground text-sm">{listing.title}</h3>
                    <p className="text-xs text-muted-foreground">by {listing.poster_id}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    listing.status === "active" ? "bg-primary/10 text-primary" :
                    "bg-destructive/10 text-destructive"
                  }`}>{listing.status}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{listing.city}</span>
                  <span>{listing.listing_type}</span>
                  <span className="font-semibold text-foreground">₹{listing.rent_amount}/mo</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">View</Button>
                  {listing.status === "flagged" && <Button variant="destructive" size="sm">Remove</Button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminListings;
