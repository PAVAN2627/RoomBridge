import { useState, useEffect } from "react";
import UserDashboardLayout from "@/components/UserDashboardLayout";
import { Search, MapPin, Star, AlertTriangle, Loader2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { collection, query, where, orderBy, onSnapshot, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ListingDocument } from "@/lib/firebase/types";
import { useAuth } from "@/contexts/AuthContext";

const BrowseListings = () => {
  const { userData } = useAuth();
  const [listings, setListings] = useState<ListingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  useEffect(() => {
    // Real-time listener for active listings
    const listingsQuery = query(
      collection(db, "listings"),
      where("status", "==", "active"),
      orderBy("created_at", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(listingsQuery, (snapshot) => {
      const listingsData = snapshot.docs.map((doc) => ({
        ...doc.data(),
        listing_id: doc.id,
      })) as ListingDocument[];
      setListings(listingsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      searchTerm === "" ||
      listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      selectedFilter === "All" ||
      (selectedFilter === "Long-Term" && listing.listing_type === "long_term") ||
      (selectedFilter === "PG" && listing.listing_type === "pg") ||
      (selectedFilter === "Short Stay" && listing.listing_type === "short_stay") ||
      (selectedFilter === "Emergency" && listing.listing_type === "emergency") ||
      (selectedFilter === "Flatmate" && listing.listing_type === "flatmate");

    return matchesSearch && matchesFilter;
  });

  const getListingTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      long_term: "Long-Term",
      pg: "PG",
      short_stay: "Short Stay",
      emergency: "Emergency",
      flatmate: "Flatmate",
    };
    return labels[type] || type;
  };

  return (
    <UserDashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Search Bar */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-card">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by location, college, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button variant="action" size="default">Search</Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {["All", "Long-Term", "PG", "Short Stay", "Emergency", "Flatmate"].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  filter === selectedFilter
                    ? "bg-primary text-primary-foreground"
                    : filter === "Emergency"
                    ? "bg-secondary/10 text-secondary hover:bg-secondary/20"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredListings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No listings found. Try adjusting your filters.</p>
          </div>
        )}

        {/* Listings Grid */}
        {!loading && filteredListings.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredListings.map((listing) => {
              const isEmergency = listing.listing_type === "emergency";
              return (
                <div
                  key={listing.listing_id}
                  className={`bg-card rounded-xl border overflow-hidden shadow-card hover:shadow-card-hover transition-all hover:-translate-y-0.5 cursor-pointer ${
                    isEmergency ? "border-secondary" : "border-border"
                  }`}
                >
                  {/* Image */}
                  <div className="h-36 bg-muted relative">
                    {listing.images && listing.images.length > 0 ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Home className="w-12 h-12" />
                      </div>
                    )}
                    <span className="absolute bottom-2 left-2 text-xs font-semibold bg-background/90 text-foreground px-2 py-1 rounded">
                      {getListingTypeLabel(listing.listing_type)}
                    </span>
                    {isEmergency && (
                      <span className="absolute top-2 right-2 flex items-center gap-1 text-xs font-bold bg-secondary text-primary-foreground px-2 py-1 rounded">
                        <AlertTriangle className="w-3 h-3" />
                        Urgent
                      </span>
                    )}
                  </div>
                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-display font-bold text-foreground text-sm mb-1 truncate">
                      {listing.title}
                    </h3>
                    <div className="flex items-center gap-1 text-muted-foreground text-xs mb-3">
                      <MapPin className="w-3 h-3" />
                      {listing.location}, {listing.city}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-primary text-lg">
                        ₹{listing.rent_amount.toLocaleString()}/mo
                      </span>
                    </div>
                    {listing.amenities && listing.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {listing.amenities.slice(0, 3).map((amenity) => (
                          <span
                            key={amenity}
                            className="text-[10px] bg-accent text-accent-foreground px-2 py-0.5 rounded font-medium"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </UserDashboardLayout>
  );
};

export default BrowseListings;
