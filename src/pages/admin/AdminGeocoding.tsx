import { useState } from "react";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { geocodeLocation } from "@/lib/geocoding";
import { Loader2, MapPin, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

const AdminGeocoding = () => {
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, type: "" });
  const [results, setResults] = useState<{ success: number; failed: number; skipped: number }>({
    success: 0,
    failed: 0,
    skipped: 0,
  });

  const geocodeListings = async () => {
    setProcessing(true);
    setResults({ success: 0, failed: 0, skipped: 0 });
    
    try {
      const listingsSnapshot = await getDocs(collection(db, "listings"));
      const listings = listingsSnapshot.docs;
      setProgress({ current: 0, total: listings.length, type: "listings" });

      let success = 0;
      let failed = 0;
      let skipped = 0;

      for (let i = 0; i < listings.length; i++) {
        const listingDoc = listings[i];
        const data = listingDoc.data();
        
        setProgress({ current: i + 1, total: listings.length, type: "listings" });

        // Skip if already has valid coordinates
        if (data.latitude && data.latitude !== 0) {
          skipped++;
          continue;
        }

        // Skip if missing location data
        if (!data.location || !data.city) {
          skipped++;
          continue;
        }

        try {
          const coordinates = await geocodeLocation(data.location, data.city);
          
          if (coordinates) {
            await updateDoc(doc(db, "listings", listingDoc.id), {
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
            });
            success++;
          } else {
            failed++;
          }

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`Failed to geocode listing ${listingDoc.id}:`, error);
          failed++;
        }
      }

      setResults({ success, failed, skipped });
      toast({
        title: "Listings Geocoded",
        description: `Success: ${success}, Failed: ${failed}, Skipped: ${skipped}`,
      });
    } catch (error) {
      console.error("Error geocoding listings:", error);
      toast({
        title: "Error",
        description: "Failed to geocode listings",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setProgress({ current: 0, total: 0, type: "" });
    }
  };

  const geocodeRequests = async () => {
    setProcessing(true);
    setResults({ success: 0, failed: 0, skipped: 0 });
    
    try {
      const requestsSnapshot = await getDocs(collection(db, "room_requests"));
      const requests = requestsSnapshot.docs;
      setProgress({ current: 0, total: requests.length, type: "requests" });

      let success = 0;
      let failed = 0;
      let skipped = 0;

      for (let i = 0; i < requests.length; i++) {
        const requestDoc = requests[i];
        const data = requestDoc.data();
        
        setProgress({ current: i + 1, total: requests.length, type: "requests" });

        // Skip if already has valid coordinates
        if (data.latitude && data.latitude !== 0) {
          skipped++;
          continue;
        }

        // Skip if missing location data
        if (!data.city) {
          skipped++;
          continue;
        }

        try {
          const locationToGeocode = data.location || data.city;
          const coordinates = await geocodeLocation(locationToGeocode, data.city);
          
          if (coordinates) {
            await updateDoc(doc(db, "room_requests", requestDoc.id), {
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
            });
            success++;
          } else {
            failed++;
          }

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`Failed to geocode request ${requestDoc.id}:`, error);
          failed++;
        }
      }

      setResults({ success, failed, skipped });
      toast({
        title: "Requests Geocoded",
        description: `Success: ${success}, Failed: ${failed}, Skipped: ${skipped}`,
      });
    } catch (error) {
      console.error("Error geocoding requests:", error);
      toast({
        title: "Error",
        description: "Failed to geocode requests",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setProgress({ current: 0, total: 0, type: "" });
    }
  };

  const geocodeAll = async () => {
    await geocodeListings();
    await geocodeRequests();
  };

  return (
    <AdminDashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 rounded-2xl blur-xl" />
          <div className="relative bg-card/80 backdrop-blur-sm border rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg"
              >
                <MapPin className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h2 className="font-display text-xl font-bold text-foreground">Geocoding Utility</h2>
                <p className="text-sm text-muted-foreground">
                  Add location coordinates to existing listings and requests
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-600 dark:text-blue-400">
              <p className="font-semibold mb-1">What does this do?</p>
              <p>
                This utility adds latitude and longitude coordinates to listings and room requests that don't have them.
                This enables distance-based features like "X km away" badges and nearby sorting.
              </p>
              <p className="mt-2">
                <strong>Note:</strong> This process uses the Google Maps Geocoding API and may take a few minutes for large datasets.
                Items with existing coordinates will be skipped.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid sm:grid-cols-3 gap-4"
        >
          <Button
            onClick={geocodeListings}
            disabled={processing}
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
          >
            {processing && progress.type === "listings" ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : (
              <MapPin className="w-6 h-6 text-primary" />
            )}
            <span className="font-semibold">Geocode Listings</span>
            <span className="text-xs text-muted-foreground">Add coordinates to listings</span>
          </Button>

          <Button
            onClick={geocodeRequests}
            disabled={processing}
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
          >
            {processing && progress.type === "requests" ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : (
              <MapPin className="w-6 h-6 text-primary" />
            )}
            <span className="font-semibold">Geocode Requests</span>
            <span className="text-xs text-muted-foreground">Add coordinates to requests</span>
          </Button>

          <Button
            onClick={geocodeAll}
            disabled={processing}
            variant="action"
            className="h-auto py-4 flex flex-col items-center gap-2"
          >
            {processing ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <CheckCircle className="w-6 h-6" />
            )}
            <span className="font-semibold">Geocode All</span>
            <span className="text-xs">Process both listings & requests</span>
          </Button>
        </motion.div>

        {/* Progress */}
        {processing && progress.total > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">
                Processing {progress.type}...
              </span>
              <span className="text-sm text-muted-foreground">
                {progress.current} / {progress.total}
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                initial={{ width: 0 }}
                animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}

        {/* Results */}
        {!processing && (results.success > 0 || results.failed > 0 || results.skipped > 0) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border rounded-xl p-6"
          >
            <h3 className="font-semibold text-foreground mb-4">Results</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{results.success}</p>
                <p className="text-xs text-green-600/80">Success</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-600">{results.failed}</p>
                <p className="text-xs text-red-600/80">Failed</p>
              </div>
              <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4 text-center">
                <MapPin className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-600">{results.skipped}</p>
                <p className="text-xs text-gray-600/80">Skipped</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminGeocoding;
