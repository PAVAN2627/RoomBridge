import { motion, AnimatePresence } from "framer-motion";
import { ListingDocument } from "@/lib/firebase/types";
import { UserDocument } from "@/lib/firebase/types";
import { matchListingScore } from "@/lib/matchScore";
import { calculateDistance } from "@/lib/geocoding";
import { MapPin, AlertTriangle, Home, Zap, Navigation } from "lucide-react";

interface ListingSectionProps {
  title: string;
  icon: React.ReactNode;
  listings: ListingDocument[];
  userData: UserDocument | null;
  userLocation: { latitude: number; longitude: number } | null;
  onListingClick: (listing: ListingDocument) => void;
  emptyMessage?: string;
}

export const ListingSection = ({
  title,
  icon,
  listings,
  userData,
  userLocation,
  onListingClick,
  emptyMessage = "No listings found in this category"
}: ListingSectionProps) => {
  if (listings.length === 0) return null;

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
          {icon}
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{listings.length} listing{listings.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {listings.map((listing, index) => {
            const isEmergency = listing.listing_type === "emergency";
            const match = userData ? matchListingScore(userData, listing) : null;
            
            return (
              <motion.div
                key={listing.listing_id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                onClick={() => onListingClick(listing)}
                className={`group bg-card rounded-2xl border overflow-hidden shadow-md hover:shadow-2xl transition-all cursor-pointer relative ${
                  isEmergency ? "border-orange-300 dark:border-orange-900 ring-2 ring-orange-500/20" : "border-border hover:border-primary/30"
                }`}
              >
                {/* Image */}
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
                  <span className="absolute bottom-3 left-3 text-xs font-bold bg-white/95 dark:bg-gray-900/95 text-foreground px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
                    {getListingTypeLabel(listing.listing_type)}
                  </span>
                  
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
      </div>
    </motion.div>
  );
};
