import { useState, useEffect } from "react";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, X, ChevronLeft, ChevronRight, IndianRupee, Calendar, Home, User, Tag, Trash2, Building2 } from "lucide-react";
import { collection, query, getDocs, orderBy, limit, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const AdminListings = () => {
  const { toast } = useToast();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<any | null>(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [actioning, setActioning] = useState(false);

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

  const removeListing = async (listing: any) => {
    setActioning(true);
    try {
      await updateDoc(doc(db, "listings", listing.id), {
        status: "deleted",
        deleted_at: serverTimestamp(),
      });
      setListings((prev) => prev.map((l) => l.id === listing.id ? { ...l, status: "deleted" } : l));
      if (selected?.id === listing.id) setSelected((p: any) => ({ ...p, status: "deleted" }));
      toast({ title: "Listing removed", description: "The listing has been deleted." });
    } catch {
      toast({ title: "Error", description: "Failed to remove listing.", variant: "destructive" });
    } finally {
      setActioning(false);
    }
  };

  const formatDate = (ts: any) =>
    ts?.toDate?.()?.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) || "—";

  if (loading) {
    return (
      <AdminDashboardLayout>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-64 gap-3"
        >
          <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
          <p className="text-sm text-muted-foreground">Loading listings...</p>
        </motion.div>
      </AdminDashboardLayout>
    );
  }

  return (
    <>
    <AdminDashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section with Gradient */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-pink-500/10 p-6 border border-violet-500/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg"
              >
                <Building2 className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  Listings Management
                </h2>
                <p className="text-sm text-muted-foreground">Review and manage all property listings</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 flex-wrap"
        >
          {["All", "Active", "Flagged", "Removed"].map((f, idx) => (
            <motion.button
              key={f}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                f === filter 
                  ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30" 
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {f}
            </motion.button>
          ))}
        </motion.div>

        {/* Listings Grid */}
        <AnimatePresence mode="wait">
          {filteredListings.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-16"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Building2 className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              </motion.div>
              <p className="text-muted-foreground text-lg">No listings found</p>
            </motion.div>
          ) : (
            <motion.div 
              key="grid"
              className="grid sm:grid-cols-2 gap-4"
            >
              {filteredListings.map((listing, idx) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className={`bg-card rounded-2xl border p-5 shadow-lg hover:shadow-xl transition-all ${
                    listing.status === "flagged" 
                      ? "border-red-500/40 bg-gradient-to-br from-red-500/5 to-orange-500/5" 
                      : "border-border hover:border-violet-500/30"
                  }`}
                >
                  {/* Listing Image Preview */}
                  {listing.images?.[0] && (
                    <div className="relative rounded-xl overflow-hidden mb-4 aspect-video group">
                      <motion.img
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      {listing.images.length > 1 && (
                        <span className="absolute top-2 right-2 text-xs bg-black/70 text-white px-2 py-1 rounded-full backdrop-blur-sm">
                          {listing.images.length} photos
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-foreground text-base truncate">{listing.title}</h3>
                      <p className="text-xs text-muted-foreground truncate">by {listing.poster_id}</p>
                    </div>
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      className={`flex-shrink-0 ml-2 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                        listing.status === "active" 
                          ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-600 border border-green-500/30" :
                        listing.status === "flagged"
                          ? "bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-600 border border-red-500/30" :
                          "bg-muted text-muted-foreground"
                      }`}
                    >
                      {listing.status}
                    </motion.span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 flex-wrap">
                    <span className="flex items-center gap-1 bg-blue-500/10 text-blue-600 px-2 py-1 rounded-full">
                      <MapPin className="w-3 h-3" />{listing.city}
                    </span>
                    <span className="bg-violet-500/10 text-violet-600 px-2 py-1 rounded-full capitalize">
                      {listing.listing_type?.replace(/_/g, " ")}
                    </span>
                    <span className="font-semibold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                      ₹{listing.rent_amount?.toLocaleString("en-IN")}/mo
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => { setSelected(listing); setImgIdx(0); }}
                        className="w-full border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-600"
                      >
                        View Details
                      </Button>
                    </motion.div>
                    {listing.status === "flagged" && (
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => removeListing(listing)}
                          className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700"
                        >
                          Remove
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminDashboardLayout>

    {/* Listing Detail Modal */}
    <AnimatePresence>
      {selected && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" 
          onClick={() => setSelected(null)}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >

          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-border bg-card/95 backdrop-blur-sm">
            <h3 className="font-display font-bold text-foreground text-base">Listing Details</h3>
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelected(null)} 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          <div className="p-5 space-y-5">
            {/* Image gallery */}
            {selected.images?.length > 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-xl overflow-hidden bg-muted aspect-video group"
              >
                <motion.img
                  key={imgIdx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  src={selected.images[imgIdx]}
                  alt={`Image ${imgIdx + 1}`}
                  className="w-full h-full object-cover"
                />
                {selected.images.length > 1 && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.1, x: -2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setImgIdx((i) => (i - 1 + selected.images.length) % selected.images.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1, x: 2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setImgIdx((i) => (i + 1) % selected.images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </motion.button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {selected.images.map((_: any, i: number) => (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.2 }}
                          onClick={() => setImgIdx(i)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            i === imgIdx 
                              ? "bg-white w-6" 
                              : "bg-white/50 hover:bg-white/75"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="absolute top-3 right-3 text-xs bg-black/70 backdrop-blur-sm text-white px-2.5 py-1 rounded-full font-medium">
                      {imgIdx + 1} / {selected.images.length}
                    </span>
                  </>
                )}
              </motion.div>
            ) : (
              <div className="aspect-video rounded-xl bg-muted flex items-center justify-center text-muted-foreground text-sm">
                <div className="text-center">
                  <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No images uploaded</p>
                </div>
              </div>
            )}

            {/* Title + status */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-start justify-between gap-3"
            >
              <div>
                <h4 className="font-display font-bold text-foreground text-lg leading-tight">{selected.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Posted by: {selected.poster_id}</p>
              </div>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                  selected.status === "active" 
                    ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-600 border border-green-500/30" :
                  selected.status === "deleted" 
                    ? "bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-600 border border-red-500/30" :
                  selected.status === "flagged"
                    ? "bg-gradient-to-r from-orange-500/20 to-yellow-500/20 text-orange-600 border border-orange-500/30" :
                    "bg-muted text-muted-foreground"
                }`}
              >
                {selected.status}
              </motion.span>
            </motion.div>

            {/* Key details grid */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-3"
            >
              <DetailRow icon={<IndianRupee className="w-3.5 h-3.5" />} label="Rent" value={selected.rent_amount ? `₹${selected.rent_amount?.toLocaleString("en-IN")}/mo` : undefined} />
              <DetailRow icon={<IndianRupee className="w-3.5 h-3.5" />} label="Deposit" value={selected.deposit_amount ? `₹${selected.deposit_amount?.toLocaleString("en-IN")}` : undefined} />
              <DetailRow icon={<MapPin className="w-3.5 h-3.5" />} label="City" value={selected.city} />
              <DetailRow icon={<MapPin className="w-3.5 h-3.5" />} label="Location" value={selected.location} />
              <DetailRow icon={<Home className="w-3.5 h-3.5" />} label="Type" value={selected.listing_type?.replace(/_/g, " ")} />
              <DetailRow icon={<Home className="w-3.5 h-3.5" />} label="Room" value={selected.room_type?.toUpperCase()} />
              <DetailRow icon={<User className="w-3.5 h-3.5" />} label="Gender Pref" value={selected.preferences?.gender_preference} />
              <DetailRow icon={<Tag className="w-3.5 h-3.5" />} label="Furnishing" value={selected.preferences?.furnishing?.replace(/-/g, " ")} />
              <DetailRow icon={<Calendar className="w-3.5 h-3.5" />} label="Available From" value={formatDate(selected.available_from)} />
              <DetailRow icon={<Calendar className="w-3.5 h-3.5" />} label="Posted On" value={formatDate(selected.created_at)} />
            </motion.div>

            {/* Amenities */}
            {selected.amenities?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Amenities</p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.amenities.map((a: string, idx: number) => (
                    <motion.span
                      key={a}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + idx * 0.03 }}
                      whileHover={{ scale: 1.05 }}
                      className="text-xs bg-violet-500/10 text-violet-600 px-2.5 py-1 rounded-full capitalize border border-violet-500/20"
                    >
                      {a.replace(/_/g, " ")}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Description */}
            {selected.description && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-foreground leading-relaxed bg-muted/50 p-3 rounded-lg">{selected.description}</p>
              </motion.div>
            )}
          </div>

          {/* Footer actions */}
          <div className="sticky bottom-0 p-5 pt-0 flex gap-2 flex-wrap bg-gradient-to-t from-card via-card to-transparent">
            {selected.status !== "deleted" && (
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={actioning}
                  onClick={() => removeListing(selected)}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700"
                >
                  {actioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Trash2 className="w-3.5 h-3.5" /> Remove Listing</>}
                </Button>
              </motion.div>
            )}
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 }}
            >
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  </>
  );
};

const DetailRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) =>
  value ? (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-[10px] text-muted-foreground leading-none mb-0.5">{label}</p>
        <p className="text-sm text-foreground font-medium capitalize">{value}</p>
      </div>
    </div>
  ) : null;

export default AdminListings;

