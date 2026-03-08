import { useState, useEffect } from "react";
import UserDashboardLayout from "@/components/UserDashboardLayout";
import { Clock, MapPin, Loader2, MessageCircle, AlertTriangle, User, Star, Zap, Search, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, where, onSnapshot, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserDocument } from "@/lib/firebase/types";
import { getUser } from "@/lib/firebase/users";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { createChatSession } from "@/lib/firebase/chats";
import { useToast } from "@/hooks/use-toast";
import { UserProfileModal } from "@/components/UserProfileModal";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { matchRequestScore } from "@/lib/matchScore";
import { getCurrentLocation, calculateDistance } from "@/lib/geocoding";

// Extended type that matches what's actually stored in Firestore
interface RoomRequest {
  request_id: string;
  searcher_id: string;
  title: string;
  description?: string;
  request_type: string;
  duration?: string;
  location?: string;
  city: string;
  latitude?: number;
  longitude?: number;
  budget_min: number;
  budget_max: number;
  status: string;
  created_at: any;
  needed_from?: any;
  preferences?: {
    gender_preference?: string;
    location_preference?: string;
    amenities_required?: string[];
    other_requirements?: string;
  };
  userData?: UserDocument;
}

const RoomRequests = () => {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<RoomRequest[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const [selectedRequestType, setSelectedRequestType] = useState<string>("all");
  const [sortByMatch, setSortByMatch] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RoomRequest | null>(null);
  const [messagingUser, setMessagingUser] = useState<string | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  const getMatchBadgeClass = (color: string) => {
    if (color === "green") return "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20";
    if (color === "yellow") return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20";
    if (color === "orange") return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20";
    return "bg-muted text-muted-foreground border border-border";
  };

  const handleMessage = async (searcherId: string) => {
    if (!user) return;
    setMessagingUser(searcherId);
    try {
      const chat = await createChatSession(user.uid, searcherId);
      navigate(`/dashboard/messages?chat=${chat.chat_id}`);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Could not open chat. Try again.", variant: "destructive" });
    } finally {
      setMessagingUser(null);
    }
  };

  // Automatically get user's current location on component mount
  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const location = await getCurrentLocation();
        if (location) {
          setUserLocation(location);
          console.log("User location detected:", location);
        }
      } catch (error) {
        console.error("Error getting user location:", error);
        // Silently fail - location is optional
      }
    };

    fetchUserLocation();
  }, []);

  useEffect(() => {
    // Real-time listener for ALL active room requests (simplified query while index builds)
    const requestsQuery = query(
      collection(db, "room_requests"),
      where("status", "==", "active"),
      limit(50)
    );

    const unsubscribe = onSnapshot(requestsQuery, async (snapshot) => {
      const requestsData = snapshot.docs.map((doc) => ({
        ...doc.data(),
        request_id: doc.id,
      })) as RoomRequest[];

      // Filter out user's own requests
      const othersRequests = requestsData.filter(req => req.searcher_id !== user?.uid);

      // Fetch unique user IDs
      const uniqueUserIds = [...new Set(othersRequests.map(r => r.searcher_id))];
      
      // Fetch all user data in parallel
      const usersMap = new Map<string, UserDocument>();
      await Promise.all(
        uniqueUserIds.map(async (userId) => {
          const userData = await getUser(userId);
          if (userData) {
            usersMap.set(userId, userData);
          }
        })
      );

      const requestsWithUserData = othersRequests
        .map(request => ({
          ...request,
          userData: usersMap.get(request.searcher_id)
        }))
        .sort((a, b) => {
          const aTime = a.created_at?.toMillis?.() || 0;
          const bTime = b.created_at?.toMillis?.() || 0;
          return bTime - aTime;
        });

      setRequests(requestsWithUserData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getDurationLabel = (d?: string) => {
    if (!d) return "";
    const map: Record<string, string> = {
      "1_day": "1 Day", "2_days": "2 Days", "3_days": "3 Days",
      "4_days": "4 Days", "5_days": "5 Days", "6_days": "6 Days",
      "7_days": "1 Week", "1_month": "1 Month",
      "3_months": "3 Months", "6_months": "6 Months", "12_months": "12 Months",
    };
    return map[d] || d.replace(/_/g, " ");
  };

  const getRequestTypeLabel = (type: string) => {
    return type === "emergency" ? "Emergency" : "Long-Term";
  };

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <UserDashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with gradient search bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-xl" />
          <div className="relative bg-card/80 backdrop-blur-sm border rounded-2xl p-6 shadow-lg">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search by title, location, or city..."
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

            {/* Area and Request Type Filters */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-3 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {/* Area Filter */}
              <div className="flex-1">
                <Select value={selectedArea} onValueChange={setSelectedArea}>
                  <SelectTrigger className="w-full rounded-xl bg-background border-border focus:ring-2 focus:ring-primary/50">
                    <SelectValue placeholder="Filter by Area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Areas</SelectItem>
                    {(() => {
                      // Extract unique cities and locations from requests
                      const areas = new Set<string>();
                      requests.forEach(request => {
                        areas.add(request.city);
                        // Add location if it's different from city
                        if (request.location && request.location.toLowerCase() !== request.city.toLowerCase()) {
                          areas.add(request.location);
                        }
                      });
                      return Array.from(areas).sort().map(area => (
                        <SelectItem key={area} value={area.toLowerCase()}>
                          {area}
                        </SelectItem>
                      ));
                    })()}
                  </SelectContent>
                </Select>
              </div>

              {/* Request Type Filter */}
              <div className="flex-1">
                <Select value={selectedRequestType} onValueChange={setSelectedRequestType}>
                  <SelectTrigger className="w-full rounded-xl bg-background border-border focus:ring-2 focus:ring-primary/50">
                    <SelectValue placeholder="Filter by Request Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Request Types</SelectItem>
                    <SelectItem value="normal">Long-Term</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>

            {/* Actions Row */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex gap-2 items-center flex-wrap">
                {userData && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSortByMatch((v) => !v)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-md ${
                      sortByMatch
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                        : "bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-foreground border border-violet-500/20 hover:border-violet-500/40"
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    {sortByMatch ? "Sorted by Match" : "Sort by Match"}
                  </motion.button>
                )}
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="action" size="sm" onClick={() => navigate("/dashboard/post-request")}>
                  Post Your Request
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Results Count */}
        {!loading && (() => {
          const filteredCount = requests.filter((req) => {
            const matchesSearch =
              searchTerm === "" ||
              req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (req.location && req.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
              req.city.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesArea =
              selectedArea === "all" ||
              req.city.toLowerCase().includes(selectedArea.toLowerCase()) ||
              (req.location && req.location.toLowerCase().includes(selectedArea.toLowerCase()));

            const matchesRequestType =
              selectedRequestType === "all" ||
              req.request_type === selectedRequestType;

            return matchesSearch && matchesArea && matchesRequestType;
          }).length;

          return (
            <motion.div 
              className="flex items-center justify-between"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <p className="text-sm text-muted-foreground font-medium">
                <span className="text-primary font-bold">{filteredCount}</span> request{filteredCount !== 1 ? "s" : ""} found
                {sortByMatch && userData && <span className="text-violet-600 dark:text-violet-400"> · sorted by match</span>}
              </p>
            </motion.div>
          );
        })()}

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 space-y-4"
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
              className="text-sm text-muted-foreground"
            >
              Loading room requests...
            </motion.p>
          </motion.div>
        )}

        {!loading && requests.length === 0 && (
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
              <Search className="w-20 h-20 mx-auto text-muted-foreground/40" />
            </motion.div>
            <p className="text-muted-foreground text-lg">No active room requests at the moment.</p>
          </motion.div>
        )}

        {!loading && requests.length > 0 && (() => {
          // Apply filters
          let filteredRequests = requests.filter((req) => {
            const matchesSearch =
              searchTerm === "" ||
              req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (req.location && req.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
              req.city.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesArea =
              selectedArea === "all" ||
              req.city.toLowerCase().includes(selectedArea.toLowerCase()) ||
              (req.location && req.location.toLowerCase().includes(selectedArea.toLowerCase()));

            const matchesRequestType =
              selectedRequestType === "all" ||
              req.request_type === selectedRequestType;

            return matchesSearch && matchesArea && matchesRequestType;
          });

          // Show empty state if no results after filtering
          if (filteredRequests.length === 0) {
            return (
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
                  <Search className="w-20 h-20 mx-auto text-muted-foreground/40" />
                </motion.div>
                <p className="text-muted-foreground text-lg mb-2">No requests match your filters</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
              </motion.div>
            );
          }

          // Apply sorting
          let displayRequests = filteredRequests;
          if (sortByMatch && userData) {
            displayRequests = [...filteredRequests].sort((a, b) => {
              const matchA = matchRequestScore(userData, a);
              const matchB = matchRequestScore(userData, b);
              
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
              
              // Priority 1: Nearby requests (within 5km get huge boost)
              const nearbyBoostA = distanceA < 5 ? 50 : (distanceA < 10 ? 25 : 0);
              const nearbyBoostB = distanceB < 5 ? 50 : (distanceB < 10 ? 25 : 0);
              
              // Priority 2: Match score
              const totalScoreA = matchA.score + nearbyBoostA;
              const totalScoreB = matchB.score + nearbyBoostB;
              
              // Priority 3: If scores are equal, prefer closer requests
              if (totalScoreA === totalScoreB) {
                return distanceA - distanceB;
              }
              
              return totalScoreB - totalScoreA;
            });
          }
          return (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {displayRequests.map((req, index) => {
                const isEmergency = req.request_type === "emergency";
                const match = userData ? matchRequestScore(userData, req) : null;
                
                return (
                  <motion.div
                    key={req.request_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
                    className={`bg-card rounded-2xl border p-6 shadow-card transition-all duration-300 ${
                      isEmergency ? "border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-transparent" : ""
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* User info with avatar */}
                        <div className="flex items-center gap-3 mb-3">
                          <motion.div whileHover={{ scale: 1.1 }} className="relative">
                            {req.userData?.selfie_url ? (
                              <img
                                src={req.userData.selfie_url}
                                alt={req.userData.name}
                                className="w-12 h-12 rounded-full object-cover ring-2 ring-violet-500/20"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                                {req.userData?.name?.charAt(0) || "U"}
                              </div>
                            )}
                            {req.userData?.verification_badges && req.userData.verification_badges.length > 0 && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-background"
                              >
                                <span className="text-white text-[10px]">✓</span>
                              </motion.div>
                            )}
                          </motion.div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-foreground">
                                {req.userData?.name || "User"}
                              </span>
                              {isEmergency && (
                                <motion.span
                                  animate={{ scale: [1, 1.05, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                                >
                                  <AlertTriangle className="w-3 h-3" />
                                  Emergency
                                </motion.span>
                              )}
                              {!isEmergency && (
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-600 border border-violet-500/20">
                                  Long-Term
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {getTimeAgo(req.created_at)}
                            </p>
                          </div>
                        </div>

                        {/* Title and description */}
                        <h3 className="font-display font-bold text-foreground text-lg mb-2">{req.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{req.description}</p>

                        {/* Details badges */}
                        <div className="flex flex-wrap gap-2 text-xs">
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-600 rounded-full border border-blue-500/20 font-medium"
                          >
                            <Clock className="w-3 h-3" />
                            {getDurationLabel(req.duration)}
                          </motion.span>
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-600 rounded-full border border-green-500/20 font-medium"
                          >
                            <MapPin className="w-3 h-3" />
                            {req.location || req.city}
                          </motion.span>
                          {userLocation && req.latitude && req.longitude && req.latitude !== 0 && (() => {
                            const distance = calculateDistance(
                              userLocation.latitude,
                              userLocation.longitude,
                              req.latitude,
                              req.longitude
                            );
                            return (
                              <motion.span
                                whileHover={{ scale: 1.05 }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-600 rounded-full border border-blue-500/20 font-semibold"
                              >
                                <Navigation className="w-3 h-3" />
                                {distance}km away
                              </motion.span>
                            );
                          })()}
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            className="px-3 py-1.5 bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-600 rounded-full border border-violet-500/20 font-bold"
                          >
                            ₹{req.budget_min.toLocaleString()} - ₹{req.budget_max.toLocaleString()}
                          </motion.span>
                          {req.preferences?.gender_preference && req.preferences.gender_preference !== "any" && (
                            <motion.span
                              whileHover={{ scale: 1.05 }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-pink-500/10 text-pink-600 rounded-full border border-pink-500/20 font-medium"
                            >
                              <User className="w-3 h-3" />
                              {req.preferences.gender_preference}
                            </motion.span>
                          )}
                        </div>
                      </div>

                      {/* Right side - Match score and actions */}
                      <div className="flex flex-col items-end gap-3 min-w-[140px]">
                        {req.needed_from && (
                          <motion.span
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-xs font-bold text-orange-600 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20"
                          >
                            Needed: {(req.needed_from?.toDate ? req.needed_from.toDate() : new Date(req.needed_from)).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </motion.span>
                        )}
                        {match && (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileHover={{ scale: 1.05 }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${
                              match.color === "green" ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-600 border border-green-500/30" :
                              match.color === "yellow" ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-600 border border-yellow-500/30" :
                              match.color === "orange" ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-600 border border-orange-500/30" :
                              "bg-muted text-muted-foreground border border-border"
                            }`}
                          >
                            <Zap className="w-3 h-3" />
                            {match.score}% {match.label}
                          </motion.div>
                        )}
                        <div className="flex flex-col gap-2 w-full">
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => setSelectedRequest(req)}
                            >
                              View Details
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              variant="action"
                              size="sm"
                              className="w-full"
                              disabled={messagingUser === req.searcher_id}
                              onClick={() => handleMessage(req.searcher_id)}
                            >
                              {messagingUser === req.searcher_id ? (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              ) : (
                                <MessageCircle className="w-3 h-3 mr-1" />
                              )}
                              Message
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          );
        })()}
      </div>

      {/* View Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0" aria-describedby={undefined}>
          {selectedRequest && (() => {
            const r = selectedRequest;
            const isEmergency = r.request_type === "emergency";
            return (
              <>
                {/* Header Banner */}
                <div className={`relative px-6 pt-6 pb-5 rounded-t-xl ${
                  isEmergency ? "bg-secondary/10 border-b border-secondary/20" : "bg-primary/5 border-b border-primary/10"
                }`}>
                  {/* User info row */}
                  <div className="flex items-center gap-3 mb-3">
                    {r.userData?.selfie_url ? (
                      <img src={r.userData.selfie_url} alt={r.userData.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-background" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-primary-foreground font-bold text-sm">
                        {r.userData?.name?.charAt(0) || "U"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">{r.userData?.name || "User"}</p>
                      {r.userData?.verification_badges && r.userData.verification_badges.length > 0 && (
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">✔ Verified</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        isEmergency ? "bg-secondary text-white" : "bg-accent text-accent-foreground"
                      }`}>
                        {isEmergency ? "🚨 Emergency" : "Long-Term"}
                      </span>
                    </div>
                  </div>
                  <DialogTitle className="text-xl font-bold text-foreground leading-snug pr-6">{r.title}</DialogTitle>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {r.location || r.city}{r.location && r.location !== r.city ? `, ${r.city}` : ""}
                    </p>
                    {r.created_at && (
                      <span className="text-xs text-muted-foreground">
                        {(() => {
                          const d = r.created_at?.toDate ? r.created_at.toDate() : new Date(r.created_at);
                          const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
                          return diff === 0 ? "Posted today" : diff === 1 ? "Posted yesterday" : `Posted ${diff}d ago`;
                        })()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  {/* Synergy Match Score */}
                  {(() => {
                    const m = userData ? matchRequestScore(userData, r) : null;
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

                  {/* Budget Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Min Budget</p>
                      <p className="font-display font-bold text-primary text-xl">₹{r.budget_min?.toLocaleString()}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Max Budget</p>
                      <p className="font-display font-bold text-foreground text-xl">₹{r.budget_max?.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Key Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {r.duration && (
                      <div className="bg-muted/60 rounded-lg p-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Duration</p>
                        <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />{getDurationLabel(r.duration)}
                        </p>
                      </div>
                    )}
                    {r.needed_from && (
                      <div className="bg-muted/60 rounded-lg p-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Needed From</p>
                        <p className="text-sm font-semibold text-foreground">
                          {(r.needed_from?.toDate ? r.needed_from.toDate() : new Date(r.needed_from)).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    )}
                    <div className="bg-muted/60 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">City</p>
                      <p className="text-sm font-semibold text-foreground">{r.city}</p>
                    </div>
                    <div className="bg-muted/60 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Gender Pref.</p>
                      <p className="text-sm font-semibold text-foreground capitalize flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {r.preferences?.gender_preference && r.preferences.gender_preference !== "any"
                          ? `${r.preferences.gender_preference} only`
                          : "Any"}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {r.description && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">About this request</p>
                      <p className="text-sm text-foreground leading-relaxed">{r.description}</p>
                    </div>
                  )}

                  {/* Amenities Required */}
                  {r.preferences?.amenities_required && r.preferences.amenities_required.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Amenities Needed</p>
                      <div className="flex flex-wrap gap-2">
                        {r.preferences.amenities_required.map((a) => (
                          <span key={a} className="text-xs bg-accent text-accent-foreground px-2.5 py-1 rounded-full font-medium">{a}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other Requirements */}
                  {r.preferences?.other_requirements && (
                    <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Requirements</p>
                      <p className="text-sm text-foreground">{r.preferences.other_requirements}</p>
                    </div>
                  )}

                  {isEmergency && (
                    <div className="flex items-start gap-2 bg-secondary/5 border border-secondary/20 rounded-lg p-3">
                      <AlertTriangle className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-secondary">
                        <strong>Emergency Request:</strong> This person needs a room urgently within {getDurationLabel(r.duration)}.
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="action"
                      size="sm"
                      className="flex-1"
                      disabled={messagingUser === r.searcher_id}
                      onClick={() => { setSelectedRequest(null); handleMessage(r.searcher_id); }}
                    >
                      {messagingUser === r.searcher_id ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <MessageCircle className="w-3 h-3 mr-1" />
                      )}
                      Message {r.userData?.name?.split(" ")[0] || "User"}
                    </Button>
                    <Button
                      variant="brand-outline"
                      size="sm"
                      onClick={() => { setSelectedRequest(null); setProfileUserId(r.searcher_id); }}
                    >
                      <Star className="w-3 h-3 mr-1" />
                      View Profile & Rate
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedRequest(null)}>Close</Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* User Profile & Rating Modal */}
      <UserProfileModal
        userId={profileUserId}
        open={!!profileUserId}
        onOpenChange={(open) => !open && setProfileUserId(null)}
      />
    </UserDashboardLayout>
  );
};

export default RoomRequests;
