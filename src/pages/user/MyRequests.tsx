import { useState, useEffect } from "react";
import UserDashboardLayout from "@/components/UserDashboardLayout";
import { Loader2, Trash2, Clock, MapPin, Eye, EyeOff, Edit, AlertTriangle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RoomRequest {
  request_id: string;
  title: string;
  description?: string;
  request_type: string;
  duration: string;
  budget_min: number;
  budget_max: number;
  city: string;
  location?: string;
  status: string;
  created_at: any;
  updated_at?: any;
  needed_from?: any;
  preferences?: {
    gender_preference?: string;
    other_requirements?: string;
    amenities_required?: string[];
  };
}

const MyRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<RoomRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RoomRequest | null>(null);

  const getDurationLabel = (d: string) => {
    const map: Record<string, string> = {
      "1_day": "1 Day", "2_days": "2 Days", "3_days": "3 Days",
      "4_days": "4 Days", "5_days": "5 Days", "6_days": "6 Days",
      "7_days": "1 Week", "1_month": "1 Month",
      "3_months": "3 Months", "6_months": "6 Months", "12_months": "12 Months",
    };
    return map[d] || d.replace(/_/g, " ");
  };

  useEffect(() => {
    if (!user) return;

    const requestsQuery = query(
      collection(db, "room_requests"),
      where("searcher_id", "==", user.uid)
    );

    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      const requestsData = snapshot.docs.map((doc) => ({
        ...doc.data(),
        request_id: doc.id,
      })) as RoomRequest[];

      setRequests(requestsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async () => {
    if (!requestToDelete) return;

    try {
      await deleteDoc(doc(db, "room_requests", requestToDelete));
      toast({
        title: "Success",
        description: "Room request deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting request:", error);
      toast({
        title: "Error",
        description: "Failed to delete room request",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setRequestToDelete(null);
    }
  };

  const handleToggleStatus = async (requestId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";

    try {
      await updateDoc(doc(db, "room_requests", requestId), {
        status: newStatus,
        updated_at: new Date(),
      });
      toast({
        title: "Success",
        description: `Request ${newStatus === "active" ? "activated" : "deactivated"} successfully`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive",
      });
    }
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
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Manage your room requests</p>
          <Button variant="action" size="sm" onClick={() => navigate("/dashboard/post-request")}>
            Post New Request
          </Button>
        </div>

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
              Loading your requests...
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
              <Clock className="w-20 h-20 mx-auto text-muted-foreground/40" />
            </motion.div>
            <p className="text-muted-foreground mb-6 text-lg">You haven't posted any room requests yet.</p>
            <Button variant="action" onClick={() => navigate("/dashboard/post-request")}>
              Post Your First Request
            </Button>
          </motion.div>
        )}

        {!loading && requests.length > 0 && (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {requests.map((req, index) => {
                const isEmergency = req.request_type === "emergency";
                return (
                  <motion.div
                    key={req.request_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
                    className={`bg-card rounded-2xl border p-6 shadow-card transition-all duration-300 ${
                      req.status === "inactive" ? "opacity-60" : ""
                    } ${isEmergency ? "border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-transparent" : ""}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <h3 className="font-display font-bold text-foreground text-lg">{req.title}</h3>
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
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                              req.status === "active"
                                ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-600 border border-green-500/30"
                                : "bg-gray-500/10 text-gray-600 border border-gray-500/20"
                            }`}
                          >
                            {req.status === "active" ? "Active" : "Inactive"}
                          </motion.span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{req.description}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 text-blue-600 rounded-full border border-blue-500/20">
                            <Clock className="w-3 h-3" />
                            {getDurationLabel(req.duration)}
                          </span>
                          <span className="flex items-center gap-1 px-2.5 py-1 bg-green-500/10 text-green-600 rounded-full border border-green-500/20">
                            <MapPin className="w-3 h-3" />
                            {req.location || req.city}
                          </span>
                          <span className="px-2.5 py-1 bg-violet-500/10 text-violet-600 rounded-full border border-violet-500/20 font-medium">
                            ₹{req.budget_min.toLocaleString()} - ₹{req.budget_max.toLocaleString()}
                          </span>
                          {req.needed_from && (
                            <span className="px-2.5 py-1 bg-orange-500/10 text-orange-600 rounded-full border border-orange-500/20 font-medium">
                              Needed: {(req.needed_from?.toDate ? req.needed_from.toDate() : new Date(req.needed_from)).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          )}
                          <span>•</span>
                          <span>{getTimeAgo(req.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRequest(req)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(req.request_id, req.status)}
                        >
                          {req.status === "active" ? (
                            <>
                              <EyeOff className="w-3 h-3 mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/dashboard/post-request?edit=${req.request_id}`)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRequestToDelete(req.request_id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
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
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      isEmergency ? "bg-secondary text-white" : "bg-accent text-accent-foreground"
                    }`}>
                      {isEmergency ? "🚨 Emergency" : "Long-Term"}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      r.status === "active" ? "bg-green-500 text-white" : "bg-gray-400 text-white"
                    }`}>
                      {r.status === "active" ? "Active" : "Inactive"}
                    </span>
                    {r.created_at && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        Posted {(() => {
                          const d = r.created_at?.toDate ? r.created_at.toDate() : new Date(r.created_at);
                          const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
                          return diff === 0 ? "today" : diff === 1 ? "yesterday" : `${diff} days ago`;
                        })()}
                      </span>
                    )}
                  </div>
                  <DialogTitle className="text-xl font-bold text-foreground leading-snug pr-6">{r.title}</DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {r.location || r.city}{r.location && r.location !== r.city ? `, ${r.city}` : ""}
                  </p>
                </div>

                <div className="p-5 space-y-5">
                  {/* Budget Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Min Budget</p>
                      <p className="font-display font-bold text-primary text-xl">₹{r.budget_min.toLocaleString()}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Max Budget</p>
                      <p className="font-display font-bold text-foreground text-xl">₹{r.budget_max.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Key Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-muted/60 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Duration</p>
                      <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />{getDurationLabel(r.duration)}
                      </p>
                    </div>
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
                    {r.preferences?.gender_preference && (
                      <div className="bg-muted/60 rounded-lg p-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Gender Pref.</p>
                        <p className="text-sm font-semibold text-foreground capitalize flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {r.preferences.gender_preference === "any" ? "Any" : `${r.preferences.gender_preference} only`}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {r.description && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Details</p>
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
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Other Requirements</p>
                      <p className="text-sm text-foreground">{r.preferences.other_requirements}</p>
                    </div>
                  )}

                  {isEmergency && (
                    <div className="flex items-start gap-2 bg-secondary/5 border border-secondary/20 rounded-lg p-3">
                      <AlertTriangle className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-secondary">
                        <strong>Emergency Request:</strong> This request expires after {getDurationLabel(r.duration)}.
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="action"
                      size="sm"
                      onClick={() => { setSelectedRequest(null); navigate(`/dashboard/post-request?edit=${r.request_id}`); }}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit Request
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedRequest(null)}>Close</Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this room request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UserDashboardLayout>
  );
};

export default MyRequests;
