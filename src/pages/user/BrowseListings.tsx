import { useState, useEffect } from "react";
import UserDashboardLayout from "@/components/UserDashboardLayout";
import { Search, MapPin, AlertTriangle, Loader2, Home, MessageCircle, ChevronLeft, ChevronRight, Calendar, IndianRupee, BedDouble, Users, Sofa, Clock, Star, Zap, Sparkles, Navigation, Flame, GraduationCap, Globe, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import { collection, query, where, onSnapshot, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ListingDocument } from "@/lib/firebase/types";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { createChatSession } from "@/lib/firebase/chats";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserProfileModal } from "@/components/UserProfileModal";
import { matchListingScore } from "@/lib/matchScore";
import { getCurrentLocation, calculateDistance } from "@/lib/geocoding";
import { ListingSection } from "@/components/ListingSection";

const BrowseListings = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [listings, setListings] = useState<ListingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [sortByMatch, setSortByMatch] = useState(true); // Default to true - sort by match score
  const [viewMode, setViewMode] = useState<"sections" | "grid">("grid"); // Default to grid view
  const [selectedListing, setSelectedListing] = useState<ListingDocument | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [contactingOwner, setContactingOwner] = useState(false);
  const [profileOwnerId, setProfileOwnerId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const handleContactOwner = async (posterId: string) => {
    if (!user) return;
    if (user.uid === posterId) {
      toast({ title: "That's your own listing!", variant: "destructive" });
      return;
    }
    setContactingOwner(true);
    try {
      const chat = await createChatSession(user.uid, posterId);
      navigate(`/dashboard/messages?chat=${chat.chat_id}`);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Could not open chat. Try again.", variant: "destructive" });
    } finally {
      setContactingOwner(false);
    }
  };

  // Automatically get user's current location on component mount
  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const location = await getCurrentLocation();
        if (location) {
          setUserLocation(location);
          console.log("✅ User location detected:", location);
          toast({
            title: "Location Detected",
            description: `Showing distances from your location`,
          });
        } else {
          console.log("❌ User location not available");
          toast({
            title: "Location Not Available",
            description: "Enable location to see distances to listings",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error getting user location:", error);
      }
    };

    fetchUserLocation();
  }, [toast]);

  useEffect(() => {
    // Real-time listener for active listings (simplified query while index builds)
    const listingsQuery = query(
      collection(db, "listings"),
      where("status", "==", "active"),
      limit(50)
    );

    const unsubscribe = onSnapshot(listingsQuery, (snapshot) => {
      const listingsData = snapshot.docs.map((doc) => ({
        ...doc.data(),
        listing_id: doc.id,
      })) as ListingDocument[];
      
      // Debug: Log listings with coordinates
      const withCoords = listingsData.filter(l => l.latitude && l.longitude && l.latitude !== 0);
      const withoutCoords = listingsData.filter(l => !l.latitude || !l.longitude || l.latitude === 0);
      console.log(`📍 Listings with coordinates: ${withCoords.length}/${listingsData.length}`);
      if (withoutCoords.length > 0) {
        console.log(`⚠️ Listings without coordinates: ${withoutCoords.length}`, withoutCoords.map(l => l.title));
      }
      
      // Filter out user's own listings and sort in memory
      const othersListings = listingsData
        .filter(listing => listing.poster_id !== user?.uid)
        .sort((a, b) => {
          const aTime = a.created_at?.toMillis?.() || 0;
          const bTime = b.created_at?.toMillis?.() || 0;
          return bTime - aTime;
        });
      setListings(othersListings);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

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

  const getMatchBadgeClass = (color: string) => {
    if (color === "green") return "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20";
    if (color === "yellow") return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20";
    if (color === "orange") return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20";
    return "bg-muted text-muted-foreground border border-border";
  };

  let displayListings = filteredListings;
  if (sortByMatch && userData) {
    displayListings = [...filteredListings].sort((a, b) => {
      const matchA = matchListingScore(userData, a);
      const matchB = matchListingScore(userData, b);
      
      // Calculate distance if user location is available
      let distanceA = Infinity;
      let distanceB = Infinity;
      
      if (userLocation && a.latitude && a.longitude && a.latitude !== 0) {
        distanceA = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          a.latitude,
          a.longitude
        );
      }
      
      if (userLocation && b.latitude && b.longitude && b.latitude !== 0) {
        distanceB = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          b.latitude,
          b.longitude
        );
      }
      
      // Priority 1: Nearby listings (within 5km get huge boost)
      const nearbyBoostA = distanceA < 5 ? 50 : (distanceA < 10 ? 25 : 0);
      const nearbyBoostB = distanceB < 5 ? 50 : (distanceB < 10 ? 25 : 0);
      
      // Priority 2: Match score
      const totalScoreA = matchA.score + nearbyBoostA;
      const totalScoreB = matchB.score + nearbyBoostB;
      
      // Priority 3: If scores are equal, prefer closer listings
      if (totalScoreA === totalScoreB) {
        return distanceA - distanceB;
      }
      
      return totalScoreB - totalScoreA;
    });
  }

  // Categorize listings into sections
  const categorizedListings = {
    bestMatches: [] as ListingDocument[],
    sameCollege: [] as ListingDocument[],
    sameHometown: [] as ListingDocument[],
    emergency: [] as ListingDocument[],
    nearby: [] as ListingDocument[],
  };

  // Track which listings have been added to avoid duplicates
  const addedListingIds = new Set<string>();

  if (userData && viewMode === "sections") {
    displayListings.forEach((listing) => {
      const match = matchListingScore(userData, listing);
      const isEmergency = listing.listing_type === "emergency";
      
      // Calculate distance
      let distance = Infinity;
      if (userLocation && listing.latitude && listing.longitude && listing.latitude !== 0) {
        distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          listing.latitude,
          listing.longitude
        );
      }

      // Emergency listings (highest priority) - add to emergency section
      if (isEmergency && !addedListingIds.has(listing.listing_id)) {
        categorizedListings.emergency.push(listing);
        addedListingIds.add(listing.listing_id);
      }

      // Nearby listings (within 10km)
      if (distance < 10 && !addedListingIds.has(listing.listing_id)) {
        categorizedListings.nearby.push(listing);
        addedListingIds.add(listing.listing_id);
      }

      // Best matches (score >= 70%)
      if (match.score >= 70 && !addedListingIds.has(listing.listing_id)) {
        categorizedListings.bestMatches.push(listing);
        addedListingIds.add(listing.listing_id);
      }

      // Same college
      if (userData.college && !addedListingIds.has(listing.listing_id)) {
        const listingLocation = (listing.location + " " + listing.city).toLowerCase();
        const userCollege = userData.college.toLowerCase();
        if (listingLocation.includes(userCollege) || userCollege.includes(listingLocation.split(" ")[0])) {
          categorizedListings.sameCollege.push(listing);
          addedListingIds.add(listing.listing_id);
        }
      }

      // Same hometown
      if (userData.home_district && !addedListingIds.has(listing.listing_id)) {
        const listingLocation = (listing.location + " " + listing.city).toLowerCase();
        const userHometown = userData.home_district.toLowerCase();
        if (listingLocation.includes(userHometown) || userHometown.includes(listingLocation.split(" ")[0])) {
          categorizedListings.sameHometown.push(listing);
          addedListingIds.add(listing.listing_id);
        }
      }
    });

    // Sort each category
    Object.keys(categorizedListings).forEach((key) => {
      const category = key as keyof typeof categorizedListings;
      categorizedListings[category] = categorizedListings[category].sort((a, b) => {
        const matchA = matchListingScore(userData, a);
        const matchB = matchListingScore(userData, b);
        return matchB.score - matchA.score;
      });
    });
  }

  // Check if any sections have listings
  const hasSections = userData && viewMode === "sections" && (
    categorizedListings.emergency.length > 0 ||
    categorizedListings.bestMatches.length > 0 ||
    categorizedListings.nearby.length > 0 ||
    categorizedListings.sameCollege.length > 0 ||
    categorizedListings.sameHometown.length > 0
  );

  return (
    <UserDashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Search Bar with Animation */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-card via-card to-violet-50/30 dark:to-violet-950/10 rounded-2xl border border-border p-6 shadow-lg"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search by location, college, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
            <Button variant="action" size="default" className="shadow-lg hover:shadow-xl transition-all">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
          
          {/* Filter Chips with Animation */}
          <motion.div 
            className="flex flex-wrap gap-2 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {["All", "Long-Term", "PG", "Short Stay", "Emergency", "Flatmate"].map((filter, index) => (
              <motion.button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  filter === selectedFilter
                    ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg"
                    : filter === "Emergency"
                    ? "bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 text-orange-600 dark:text-orange-400 hover:from-orange-200 hover:to-red-200 dark:hover:from-orange-900/50 dark:hover:to-red-900/50"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {filter === "Emergency" && <Sparkles className="w-3 h-3 inline mr-1" />}
                {filter}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {/* Results Header with Animation */}
        <motion.div 
          className="flex items-center justify-between flex-wrap gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <p className="text-sm text-muted-foreground font-medium">
            <span className="text-primary font-bold">{displayListings.length}</span> listing{displayListings.length !== 1 ? "s" : ""} found
            {sortByMatch && userData && <span className="text-violet-600 dark:text-violet-400"> · sorted by match</span>}
          </p>
          <div className="flex items-center gap-2">
            {userData && (
              <>
                <motion.button
                  onClick={() => setViewMode(viewMode === "sections" ? "grid" : "sections")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all border shadow-sm ${
                    viewMode === "sections"
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-blue-600 shadow-blue-500/30"
                      : "bg-background text-muted-foreground border-border hover:bg-accent hover:border-primary/30"
                  }`}
                >
                  <Sparkles className={`w-4 h-4 ${viewMode === "sections" ? "animate-pulse" : ""}`} />
                  {viewMode === "sections" ? "Smart Sections" : "Show Sections"}
                </motion.button>
                <motion.button
                  onClick={() => setSortByMatch((v) => !v)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all border shadow-sm ${
                    sortByMatch
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-600 shadow-green-500/30"
                      : "bg-background text-muted-foreground border-border hover:bg-accent hover:border-primary/30"
                  }`}
                >
                  <Zap className={`w-4 h-4 ${sortByMatch ? "animate-pulse" : ""}`} />
                  {sortByMatch ? "Sorted by Match" : "Sort by Match"}
                </motion.button>
              </>
            )}
          </div>
        </motion.div>

        {/* Location Info Banner */}
        {!loading && displayListings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <Navigation className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                {userLocation ? (
                  <>
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      📍 Location Enabled
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      {(() => {
                        const withCoords = displayListings.filter(l => l.latitude && l.longitude && l.latitude !== 0);
                        const withoutCoords = displayListings.length - withCoords.length;
                        return withCoords.length > 0 
                          ? `Showing distances for ${withCoords.length} listing${withCoords.length !== 1 ? 's' : ''}${withoutCoords > 0 ? `. ${withoutCoords} listing${withoutCoords !== 1 ? 's' : ''} need${withoutCoords === 1 ? 's' : ''} geocoding.` : '.'}`
                          : `None of the listings have location coordinates yet. ${userData?.role === 'admin' ? 'Use Admin → Geocoding Utility to add coordinates.' : 'Contact admin to geocode listings.'}`;
                      })()}
                    </p>
                    {userData?.role === 'admin' && displayListings.some(l => !l.latitude || !l.longitude || l.latitude === 0) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 h-7 text-xs"
                        onClick={() => navigate('/admin/geocoding')}
                      >
                        Go to Geocoding Utility
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      📍 Enable Location for Distance Info
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Allow location access to see how far listings are from you. Click the location icon in your browser's address bar.
                    </p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading State with Animation */}
        {loading && (
          <motion.div 
            className="flex flex-col items-center justify-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-12 h-12 text-primary" />
            </motion.div>
            <p className="text-muted-foreground mt-4">Loading amazing rooms...</p>
          </motion.div>
        )}

        {/* Empty State with Animation */}
        {!loading && filteredListings.length === 0 && (
          <motion.div 
            className="text-center py-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Home className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            </motion.div>
            <p className="text-lg font-semibold text-foreground mb-2">No listings found</p>
            <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
          </motion.div>
        )}

        {/* Listings - Sections View */}
        {!loading && displayListings.length > 0 && hasSections && (
          <div className="space-y-12">
            {/* Emergency Rooms */}
            {categorizedListings.emergency.length > 0 && (
              <ListingSection
                title="🚨 Emergency Rooms"
                icon={<AlertTriangle className="w-5 h-5 text-white" />}
                listings={categorizedListings.emergency}
                userData={userData}
                userLocation={userLocation}
                onListingClick={(listing) => { setSelectedListing(listing); setImageIndex(0); }}
              />
            )}

            {/* Best Matches */}
            {categorizedListings.bestMatches.length > 0 && (
              <ListingSection
                title="🔥 Best Matches For You"
                icon={<Flame className="w-5 h-5 text-white" />}
                listings={categorizedListings.bestMatches}
                userData={userData}
                userLocation={userLocation}
                onListingClick={(listing) => { setSelectedListing(listing); setImageIndex(0); }}
              />
            )}

            {/* Nearby Rooms */}
            {categorizedListings.nearby.length > 0 && (
              <ListingSection
                title="📍 Nearby Rooms"
                icon={<MapPinned className="w-5 h-5 text-white" />}
                listings={categorizedListings.nearby}
                userData={userData}
                userLocation={userLocation}
                onListingClick={(listing) => { setSelectedListing(listing); setImageIndex(0); }}
              />
            )}

            {/* Same College */}
            {categorizedListings.sameCollege.length > 0 && (
              <ListingSection
                title="🎓 Same College Rooms"
                icon={<GraduationCap className="w-5 h-5 text-white" />}
                listings={categorizedListings.sameCollege}
                userData={userData}
                userLocation={userLocation}
                onListingClick={(listing) => { setSelectedListing(listing); setImageIndex(0); }}
              />
            )}

            {/* Same Hometown */}
            {categorizedListings.sameHometown.length > 0 && (
              <ListingSection
                title="🌍 Same Hometown Rooms"
                icon={<Globe className="w-5 h-5 text-white" />}
                listings={categorizedListings.sameHometown}
                userData={userData}
                userLocation={userLocation}
                onListingClick={(listing) => { setSelectedListing(listing); setImageIndex(0); }}
              />
            )}
          </div>
        )}

        {/* No sections message - when sections view is active but no sections match */}
        {!loading && displayListings.length > 0 && viewMode === "sections" && userData && !hasSections && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 bg-card rounded-2xl border border-border p-8"
          >
            <Sparkles className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">No Smart Matches Found</p>
            <p className="text-muted-foreground mb-4">
              We couldn't find listings matching your profile criteria. Try switching to Grid View to see all available listings.
            </p>
            <Button
              variant="action"
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              Switch to Grid View
            </Button>
          </motion.div>
        )}

        {/* Listings - Grid View (Original) - Show when not in sections mode OR when sections are empty */}
        {!loading && displayListings.length > 0 && (!hasSections || viewMode === "grid" || !userData) && (
          <motion.div 
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            <AnimatePresence>
              {displayListings.map((listing, index) => {
                const isEmergency = listing.listing_type === "emergency";
                const match = userData ? matchListingScore(userData, listing) : null;
                return (
                  <motion.div
                    key={listing.listing_id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                    onClick={() => { setSelectedListing(listing); setImageIndex(0); }}
                    className={`group bg-card rounded-2xl border overflow-hidden shadow-md hover:shadow-2xl transition-all cursor-pointer relative ${
                      isEmergency ? "border-orange-300 dark:border-orange-900 ring-2 ring-orange-500/20" : "border-border hover:border-primary/30"
                    }`}
                  >
                    {/* Image with Overlay Effect */}
                    <div className="h-48 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 relative overflow-hidden">
                      {listing.images && listing.images.length > 0 ? (
                        <>
                          <img
                            src={listing.images[0]}
                            alt={listing.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Home className="w-16 h-16 opacity-20" />
                        </div>
                      )}
                      
                      {/* Type Badge */}
                      <motion.span 
                        className="absolute bottom-3 left-3 text-xs font-bold bg-white/95 dark:bg-gray-900/95 text-foreground px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm"
                        whileHover={{ scale: 1.05 }}
                      >
                        {getListingTypeLabel(listing.listing_type)}
                      </motion.span>
                      
                      {/* Emergency Badge */}
                      {isEmergency && (
                        <motion.span 
                          className="absolute top-3 right-3 flex items-center gap-1.5 text-xs font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-full shadow-lg"
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Urgent
                        </motion.span>
                      )}
                      
                      {/* Image Count Badge */}
                      {listing.images && listing.images.length > 1 && (
                        <span className="absolute top-3 left-3 text-xs font-semibold bg-black/60 text-white px-2 py-1 rounded-full backdrop-blur-sm">
                          {listing.images.length} photos
                        </span>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="p-5">
                      <h3 className="font-display font-bold text-foreground text-base mb-2 truncate group-hover:text-primary transition-colors">
                        {listing.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-4">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{listing.location}, {listing.city}</span>
                        {userLocation && listing.latitude && listing.longitude && listing.latitude !== 0 && (() => {
                          const distance = calculateDistance(
                            userLocation.latitude,
                            userLocation.longitude,
                            listing.latitude,
                            listing.longitude
                          );
                          return (
                            <span className="ml-auto flex items-center gap-1 text-xs font-semibold bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full border border-blue-500/20">
                              <Navigation className="w-3 h-3" />
                              {distance}km
                            </span>
                          );
                        })()}
                      </div>
                      
                      {/* Price */}
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="font-display font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent text-2xl">
                          ₹{listing.rent_amount.toLocaleString()}
                        </span>
                        <span className="text-sm text-muted-foreground">/month</span>
                      </div>
                      
                      {/* Amenities */}
                      {listing.amenities && listing.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {listing.amenities.slice(0, 3).map((amenity) => (
                            <span
                              key={amenity}
                              className="text-[10px] bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-2 py-1 rounded-full font-semibold"
                            >
                              {amenity}
                            </span>
                          ))}
                          {listing.amenities.length > 3 && (
                            <span className="text-[10px] bg-muted text-muted-foreground px-2 py-1 rounded-full font-semibold">
                              +{listing.amenities.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Match Badge */}
                      {match && (
                        <motion.div 
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${getMatchBadgeClass(match.color)}`}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Zap className="w-4 h-4" />
                          <span>{match.score}% {match.label} Match</span>
                        </motion.div>
                      )}
                    </div>
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Listing Details Dialog */}
      <Dialog open={!!selectedListing} onOpenChange={(open) => !open && setSelectedListing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0" aria-describedby={undefined}>
          {selectedListing && (() => {
            const l = selectedListing;
            const images = l.images || [];
            const isEmergency = l.listing_type === "emergency";
            return (
              <>
                {/* Image Carousel */}
                <div className="relative h-56 bg-muted">
                  {images.length > 0 ? (
                    <img
                      src={images[imageIndex]}
                      alt={l.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Home className="w-16 h-16" />
                    </div>
                  )}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setImageIndex((imageIndex - 1 + images.length) % images.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center hover:bg-background"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setImageIndex((imageIndex + 1) % images.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center hover:bg-background"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {images.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setImageIndex(i)}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${
                              i === imageIndex ? "bg-white" : "bg-white/50"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                  {isEmergency && (
                    <span className="absolute top-3 left-3 flex items-center gap-1 text-xs font-bold bg-secondary text-primary-foreground px-2 py-1 rounded">
                      <AlertTriangle className="w-3 h-3" />
                      Urgent
                    </span>
                  )}
                  <span className="absolute bottom-3 right-3 text-xs font-semibold bg-background/90 text-foreground px-2 py-1 rounded">
                    {getListingTypeLabel(l.listing_type)}
                  </span>
                </div>

                {/* Details */}
                <div className="p-5 space-y-5">
                  <DialogHeader>
                    <DialogTitle className="text-xl leading-snug">{l.title}</DialogTitle>
                  </DialogHeader>

                  {/* Location + Posted date */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>{l.location}, {l.city}</span>
                      {userLocation && l.latitude && l.longitude && l.latitude !== 0 && (() => {
                        const distance = calculateDistance(
                          userLocation.latitude,
                          userLocation.longitude,
                          l.latitude,
                          l.longitude
                        );
                        return (
                          <span className="flex items-center gap-1 text-xs font-semibold bg-blue-500/10 text-blue-600 px-2 py-1 rounded-full border border-blue-500/20">
                            <Navigation className="w-3 h-3" />
                            {distance}km away
                          </span>
                        );
                      })()}
                    </div>
                    {l.created_at && (
                      <span className="text-xs text-muted-foreground">
                        Posted {(() => {
                          const date = l.created_at?.toDate ? l.created_at.toDate() : new Date(l.created_at);
                          const diff = Math.floor((Date.now() - date.getTime()) / 86400000);
                          return diff === 0 ? "today" : diff === 1 ? "yesterday" : `${diff} days ago`;
                        })()}
                      </span>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Monthly Rent</p>
                      <p className="font-display font-bold text-primary text-xl">₹{l.rent_amount.toLocaleString()}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Security Deposit</p>
                      <p className="font-display font-bold text-foreground text-xl">₹{l.deposit_amount?.toLocaleString() || "—"}</p>
                    </div>
                  </div>

                  {/* Synergy Match Score */}
                  {(() => {
                    const m = userData ? matchListingScore(userData, l) : null;
                    if (!m) return null;
                    const barColor = m.color === "green" ? "bg-green-500" : m.color === "yellow" ? "bg-yellow-500" : m.color === "orange" ? "bg-orange-500" : "bg-muted-foreground";
                    const bgClass = m.color === "green" ? "bg-green-500/5 border-green-500/20" : m.color === "yellow" ? "bg-yellow-500/5 border-yellow-500/20" : m.color === "orange" ? "bg-orange-500/5 border-orange-500/20" : "bg-muted border-border";
                    return (
                      <div className={`border rounded-xl p-4 ${bgClass}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-primary" />
                            <span className="text-sm font-bold text-foreground">Synergy Match</span>
                          </div>
                          <span className="text-2xl font-display font-bold text-foreground">{m.score}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-muted mb-3">
                          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${m.score}%` }} />
                        </div>
                        {m.details.length > 0 && (
                          <ul className="space-y-0.5">
                            {m.details.map((d, i) => (
                              <li key={i} className="text-xs text-muted-foreground">{d}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })()}

                  {/* Key Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-muted/60 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Listing Type</p>
                      <p className="text-sm font-semibold text-foreground">{getListingTypeLabel(l.listing_type)}</p>
                    </div>
                    {l.room_type && (
                      <div className="bg-muted/60 rounded-lg p-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Room Type</p>
                        <p className="text-sm font-semibold text-foreground">{l.room_type?.toUpperCase()}</p>
                      </div>
                    )}
                    {l.preferences?.furnishing && (
                      <div className="bg-muted/60 rounded-lg p-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Furnishing</p>
                        <p className="text-sm font-semibold text-foreground capitalize">{l.preferences.furnishing}</p>
                      </div>
                    )}
                    {l.preferences?.gender_preference && (
                      <div className="bg-muted/60 rounded-lg p-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Preferred Tenant</p>
                        <p className="text-sm font-semibold text-foreground capitalize">
                          {l.preferences.gender_preference === "any" ? "Any Gender" : `${l.preferences.gender_preference} only`}
                        </p>
                      </div>
                    )}
                    <div className="bg-muted/60 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Available From</p>
                      <p className="text-sm font-semibold text-foreground">
                        {l.available_from
                          ? (l.available_from?.toDate ? l.available_from.toDate() : new Date(l.available_from as any))
                              .toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : "Immediately"}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {l.description && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">About this room</p>
                      <p className="text-sm text-foreground leading-relaxed">{l.description}</p>
                    </div>
                  )}

                  {/* Amenities */}
                  {l.amenities && l.amenities.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Amenities</p>
                      <div className="flex flex-wrap gap-2">
                        {l.amenities.map((amenity) => (
                          <span
                            key={amenity}
                            className="text-xs bg-accent text-accent-foreground px-2.5 py-1 rounded-full font-medium"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other Requirements */}
                  {l.preferences?.other_requirements && (
                    <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Owner's Requirements</p>
                      <p className="text-sm text-foreground">{l.preferences.other_requirements}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="action"
                      size="sm"
                      className="flex-1"
                      disabled={contactingOwner}
                      onClick={() => handleContactOwner(selectedListing!.poster_id)}
                    >
                      {contactingOwner ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <MessageCircle className="w-4 h-4 mr-1" />
                      )}
                      Contact Owner
                    </Button>
                    <Button
                      variant="brand-outline"
                      size="sm"
                      onClick={() => { setSelectedListing(null); setProfileOwnerId(selectedListing!.poster_id); }}
                    >
                      <Star className="w-3 h-3 mr-1" />
                      View Profile & Rate
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedListing(null)}>
                      Close
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Owner Profile & Rating Modal */}
      <UserProfileModal
        userId={profileOwnerId}
        open={!!profileOwnerId}
        onOpenChange={(open) => !open && setProfileOwnerId(null)}
      />
    </UserDashboardLayout>
  );
};

export default BrowseListings;
