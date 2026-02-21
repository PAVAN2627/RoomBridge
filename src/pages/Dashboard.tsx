import { useState, useEffect } from "react";
import UserDashboardLayout from "@/components/UserDashboardLayout";
import { Search, Home, MessageCircle, Star, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";

const Dashboard = () => {
  const { userData } = useAuth();
  const [stats, setStats] = useState({
    activeListings: 0,
    roomRequests: 0,
    messages: 0,
    rating: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!userData) return;

      try {
        // Count active listings by user
        const listingsQuery = query(
          collection(db, "listings"),
          where("poster_id", "==", userData.user_id),
          where("status", "==", "active")
        );
        const listingsSnapshot = await getCountFromServer(listingsQuery);

        // Count active room requests by user
        const requestsQuery = query(
          collection(db, "room_requests"),
          where("searcher_id", "==", userData.user_id),
          where("status", "==", "active")
        );
        const requestsSnapshot = await getCountFromServer(requestsQuery);

        // Count chats where user is a participant
        const chatsQuery = query(
          collection(db, "chats"),
          where("participant_ids", "array-contains", userData.user_id)
        );
        const chatsSnapshot = await getCountFromServer(chatsQuery);

        setStats({
          activeListings: listingsSnapshot.data().count,
          roomRequests: requestsSnapshot.data().count,
          messages: chatsSnapshot.data().count,
          rating: userData.average_rating || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userData]);

  const statsData = [
    { icon: Search, label: "Active Listings", value: stats.activeListings.toString(), color: "bg-primary" },
    { icon: Home, label: "Room Requests", value: stats.roomRequests.toString(), color: "bg-secondary" },
    { icon: MessageCircle, label: "Messages", value: stats.messages.toString(), color: "bg-primary" },
    { icon: Star, label: "Your Rating", value: stats.rating > 0 ? stats.rating.toFixed(1) : "N/A", color: "bg-secondary" },
  ];

  return (
    <UserDashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-1">
            Welcome back, {userData?.name || "User"}! 👋
          </h2>
          <p className="text-muted-foreground text-sm">Here's what's happening with your account.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statsData.map((stat) => (
                <div key={stat.label} className="bg-card rounded-xl border border-border p-5 shadow-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                  </div>
                  <span className="font-display text-3xl font-bold text-foreground">{stat.value}</span>
                </div>
              ))}
            </div>

            <div className="bg-card rounded-xl border border-border p-6 shadow-card">
              <h3 className="font-display text-lg font-bold text-foreground mb-4">🔥 Your Profile</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Verification Status</span>
                  <span className={`text-sm font-medium ${
                    userData?.verification_status === "verified" ? "text-primary" :
                    userData?.verification_status === "pending" ? "text-secondary" :
                    "text-muted-foreground"
                  }`}>
                    {userData?.verification_status === "verified" ? "✔ Verified" :
                     userData?.verification_status === "pending" ? "⏳ Pending" :
                     "Not Verified"}
                  </span>
                </div>
                {userData?.verification_badges && userData.verification_badges.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Badges</span>
                    <div className="flex gap-2">
                      {userData.verification_badges.map((badge) => (
                        <span key={badge} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-medium">
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {userData?.total_ratings > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Reviews</span>
                    <span className="text-sm font-medium text-foreground">{userData.total_ratings}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </UserDashboardLayout>
  );
};

export default Dashboard;
