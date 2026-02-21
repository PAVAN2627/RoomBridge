import { useState, useEffect } from "react";
import UserDashboardLayout from "@/components/UserDashboardLayout";
import { Clock, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { collection, query, where, orderBy, onSnapshot, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RoomRequestDocument, UserDocument } from "@/lib/firebase/types";
import { getUser } from "@/lib/firebase/users";
import { useNavigate } from "react-router-dom";

const RoomRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<(RoomRequestDocument & { userData?: UserDocument })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time listener for active room requests
    const requestsQuery = query(
      collection(db, "room_requests"),
      where("status", "==", "active"),
      orderBy("created_at", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(requestsQuery, async (snapshot) => {
      const requestsData = snapshot.docs.map((doc) => ({
        ...doc.data(),
        request_id: doc.id,
      })) as RoomRequestDocument[];

      // Fetch user data for each request
      const requestsWithUserData = await Promise.all(
        requestsData.map(async (request) => {
          const userData = await getUser(request.searcher_id);
          return { ...request, userData: userData || undefined };
        })
      );

      setRequests(requestsWithUserData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "TBD";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <UserDashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">People looking for rooms near you</p>
          <Button variant="action" size="sm" onClick={() => navigate("/dashboard/post-request")}>
            Post Your Request
          </Button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {!loading && requests.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No active room requests at the moment.</p>
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div className="space-y-4">
            {requests.map((req) => {
              const isEmergency = req.request_type === "emergency";
              return (
                <div
                  key={req.request_id}
                  className={`bg-card rounded-xl border p-5 shadow-card ${
                    isEmergency ? "border-secondary" : "border-border"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {req.userData?.selfie_url ? (
                          <img
                            src={req.userData.selfie_url}
                            alt={req.userData.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-primary-foreground text-xs font-bold">
                            {req.userData?.name?.charAt(0) || "U"}
                          </div>
                        )}
                        <span className="font-medium text-sm text-foreground">
                          {req.userData?.name || "User"}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isEmergency
                              ? "bg-secondary/10 text-secondary"
                              : "bg-accent text-accent-foreground"
                          }`}
                        >
                          {getRequestTypeLabel(req.request_type)}
                        </span>
                        {req.userData?.verification_badges && req.userData.verification_badges.length > 0 && (
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                            ✔ Verified
                          </span>
                        )}
                      </div>
                      <h3 className="font-display font-bold text-foreground mb-1">{req.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{req.description}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(req.needed_from)} - {formatDate(req.needed_until)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {req.city}
                        </span>
                        <span>
                          Budget: ₹{req.budget_min.toLocaleString()} - ₹{req.budget_max.toLocaleString()}
                        </span>
                        {req.userData?.gender && (
                          <span>Gender: {req.userData.gender}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[10px] text-muted-foreground">
                        {getTimeAgo(req.created_at)}
                      </span>
                      <Button variant="brand-outline" size="sm">
                        Respond
                      </Button>
                    </div>
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

export default RoomRequests;
