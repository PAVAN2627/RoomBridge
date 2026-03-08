import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import {
  Users, Home, Flag, Loader2, UserPlus, AlertTriangle,
  FileText, Star, TrendingUp, ShieldCheck, ShieldX,
  MessageSquareWarning, CheckCircle2, Clock, ArrowRight,
  Building2, UserCheck,
} from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

const AdminDashboard = () => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    bannedUsers: 0,
    verifiedUsers: 0,
    activeListings: 0,
    totalListings: 0,
    activeRequests: 0,
    emergencyRequests: 0,
    totalRequests: 0,
    pendingReports: 0,
    resolvedReports: 0,
    totalReports: 0,
    totalReviews: 0,
    avgRating: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [recentListings, setRecentListings] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [
          usersDocs,
          listingsDocs,
          reportsDocs,
          ratingsDocs,
          requestsDocs,
        ] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "listings")),
          getDocs(collection(db, "reports")),
          getDocs(collection(db, "ratings")),
          getDocs(collection(db, "room_requests")),
        ]);

        const users = usersDocs.docs.map((d) => ({ id: d.id, ...d.data() }));
        const listings = listingsDocs.docs.map((d) => ({ id: d.id, ...d.data() }));
        const reports = reportsDocs.docs.map((d) => ({ id: d.id, ...d.data() }));
        const ratings = ratingsDocs.docs.map((d) => ({ id: d.id, ...d.data() as any }));
        const requests = requestsDocs.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Compute averages
        const activeRatings = ratings.filter((r: any) => r.status === "active");
        const avgRating = activeRatings.length
          ? activeRatings.reduce((s: number, r: any) => s + (r.stars || 0), 0) / activeRatings.length
          : 0;

        setStats({
          totalUsers: users.length,
          bannedUsers: users.filter((u: any) => u.ban_status === "active").length,
          verifiedUsers: users.filter((u: any) => u.verification_status === "verified").length,
          activeListings: listings.filter((l: any) => l.status === "active").length,
          totalListings: listings.length,
          activeRequests: requests.filter((r: any) => r.status === "active").length,
          emergencyRequests: requests.filter((r: any) => r.request_type === "emergency" && r.status === "active").length,
          totalRequests: requests.length,
          pendingReports: reports.filter((r: any) => r.status === "pending").length,
          resolvedReports: reports.filter((r: any) => r.status === "resolved").length,
          totalReports: reports.length,
          totalReviews: activeRatings.length,
          avgRating,
        });

        const sortByDate = (a: any, b: any) =>
          (b.created_at?.toMillis?.() ?? 0) - (a.created_at?.toMillis?.() ?? 0);

        setRecentUsers(users.sort(sortByDate).slice(0, 5));
        setRecentReports(reports.sort(sortByDate).slice(0, 4));
        setRecentListings(listings.filter((l: any) => l.status === "active").sort(sortByDate).slice(0, 4));
      } catch (err) {
        console.error("AdminDashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const timeAgo = (ts: any) => {
    if (!ts?.toDate) return "";
    const diff = Math.floor((Date.now() - ts.toDate().getTime()) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const adminName = userData?.name?.split(" ")[0] || "Admin";
  const adminInitial = userData?.name?.charAt(0)?.toUpperCase() || "A";
  const adminPhoto = (userData as any)?.selfie_url || null;

  return (
    <AdminDashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Welcome Banner ── */}
        <div className="rounded-2xl overflow-hidden relative"
          style={{ background: "linear-gradient(135deg, hsl(263 70% 28%) 0%, hsl(263 70% 18%) 60%, hsl(220 70% 20%) 100%)" }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 80% 50%, white 0%, transparent 60%)" }} />
          <div className="relative p-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center text-white text-lg font-bold overflow-hidden flex-shrink-0">
                {adminPhoto
                  ? <img src={adminPhoto} alt="Admin" className="w-12 h-12 rounded-full object-cover" />
                  : adminInitial}
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-white leading-tight">
                  Welcome back, {adminName} 👋
                </h2>
                <p className="text-white/60 text-sm mt-0.5">{today}</p>
              </div>
            </div>
            {stats.pendingReports > 0 && (
              <Link to="/admin/reports"
                className="flex items-center gap-2 bg-white/15 hover:bg-white/25 transition-colors text-white text-sm font-medium px-4 py-2 rounded-xl border border-white/20">
                <AlertTriangle className="w-4 h-4 text-yellow-300" />
                {stats.pendingReports} pending report{stats.pendingReports > 1 ? "s" : ""} need review
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* ── 6 Stat Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Users */}
              <Link to="/admin/users" className="bg-card rounded-xl border border-border p-4 shadow-card hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-4.5 h-4.5 text-primary w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="font-display text-3xl font-bold text-foreground">{stats.totalUsers}</p>
                <p className="text-sm text-muted-foreground mt-0.5">Total Users</p>
                <div className="flex gap-3 mt-3 text-xs">
                  <span className="flex items-center gap-1 text-green-600"><UserCheck className="w-3 h-3" />{stats.verifiedUsers} verified</span>
                  {stats.bannedUsers > 0 && <span className="flex items-center gap-1 text-destructive"><ShieldX className="w-3 h-3" />{stats.bannedUsers} banned</span>}
                </div>
              </Link>

              {/* Listings */}
              <Link to="/admin/listings" className="bg-card rounded-xl border border-border p-4 shadow-card hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Home className="w-5 h-5 text-secondary" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="font-display text-3xl font-bold text-foreground">{stats.activeListings}</p>
                <p className="text-sm text-muted-foreground mt-0.5">Active Listings</p>
                <div className="flex gap-3 mt-3 text-xs">
                  <span className="text-muted-foreground">{stats.totalListings} total</span>
                  <span className="text-muted-foreground">{stats.totalListings - stats.activeListings} inactive</span>
                </div>
              </Link>

              {/* Room Requests */}
              <Link to="/admin/requests" className="bg-card rounded-xl border border-border p-4 shadow-card hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-orange-500" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="font-display text-3xl font-bold text-foreground">{stats.activeRequests}</p>
                <p className="text-sm text-muted-foreground mt-0.5">Active Requests</p>
                <div className="flex gap-3 mt-3 text-xs">
                  {stats.emergencyRequests > 0 && (
                    <span className="flex items-center gap-1 text-orange-500"><Clock className="w-3 h-3" />{stats.emergencyRequests} emergency</span>
                  )}
                  <span className="text-muted-foreground">{stats.totalRequests} total</span>
                </div>
              </Link>

              {/* Reviews */}
              <Link to="/admin/reviews" className="bg-card rounded-xl border border-border p-4 shadow-card hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-500" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="font-display text-3xl font-bold text-foreground">{stats.totalReviews}</p>
                <p className="text-sm text-muted-foreground mt-0.5">Total Reviews</p>
                <div className="flex gap-3 mt-3 text-xs">
                  <span className="flex items-center gap-1 text-yellow-600">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    {stats.avgRating.toFixed(1)} avg rating
                  </span>
                </div>
              </Link>

              {/* Reports */}
              <Link to="/admin/reports" className="bg-card rounded-xl border border-border p-4 shadow-card hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stats.pendingReports > 0 ? "bg-destructive/10" : "bg-muted"}`}>
                    <Flag className={`w-5 h-5 ${stats.pendingReports > 0 ? "text-destructive" : "text-muted-foreground"}`} />
                  </div>
                  {stats.pendingReports > 0 && (
                    <span className="text-xs bg-destructive text-white font-bold px-2 py-0.5 rounded-full">{stats.pendingReports}</span>
                  )}
                </div>
                <p className="font-display text-3xl font-bold text-foreground">{stats.pendingReports}</p>
                <p className="text-sm text-muted-foreground mt-0.5">Pending Reports</p>
                <div className="flex gap-3 mt-3 text-xs">
                  <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" />{stats.resolvedReports} resolved</span>
                  <span className="text-muted-foreground">{stats.totalReports} total</span>
                </div>
              </Link>

              {/* Platform Health */}
              <div className="bg-card rounded-xl border border-border p-4 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">Healthy</span>
                </div>
                <p className="font-display text-3xl font-bold text-foreground">
                  {stats.totalUsers > 0 ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100) : 0}%
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">Verification Rate</p>
                <div className="mt-3">
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="bg-green-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${stats.totalUsers > 0 ? (stats.verifiedUsers / stats.totalUsers) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Quick Actions ── */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { icon: Users, label: "Manage Users", to: "/admin/users", color: "text-primary bg-primary/10" },
                  { icon: Home, label: "View Listings", to: "/admin/listings", color: "text-secondary bg-secondary/10" },
                  { icon: FileText, label: "Room Requests", to: "/admin/requests", color: "text-orange-500 bg-orange-500/10" },
                  { icon: Star, label: "Reviews", to: "/admin/reviews", color: "text-yellow-500 bg-yellow-500/10" },
                  { icon: Flag, label: "Reports", to: "/admin/reports", color: "text-destructive bg-destructive/10" },
                  { icon: ShieldCheck, label: "My Profile", to: "/admin/profile", color: "text-green-600 bg-green-500/10" },
                ].map((a) => (
                  <Link key={a.to} to={a.to}
                    className="bg-card rounded-xl border border-border p-3 shadow-card hover:shadow-md transition-all flex flex-col items-center gap-2 text-center group">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${a.color}`}>
                      <a.icon className="w-4.5 h-4.5 w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-foreground leading-tight">{a.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* ── 3-column activity ── */}
            <div className="grid lg:grid-cols-3 gap-5">

              {/* Recent Registrations */}
              <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-sm text-foreground">New Users</h3>
                  </div>
                  <Link to="/admin/users" className="text-xs text-primary hover:underline">See all</Link>
                </div>
                {recentUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No users yet</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {recentUsers.map((u) => (
                      <li key={u.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0 overflow-hidden">
                          {u.selfie_url
                            ? <img src={u.selfie_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                            : u.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate leading-tight">{u.name || "—"}</p>
                          <p className="text-xs text-muted-foreground capitalize">{u.user_type || "user"} · {timeAgo(u.created_at)}</p>
                        </div>
                        {u.verification_status === "verified" && (
                          <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Recent Listings */}
              <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-secondary" />
                    <h3 className="font-semibold text-sm text-foreground">New Listings</h3>
                  </div>
                  <Link to="/admin/listings" className="text-xs text-primary hover:underline">See all</Link>
                </div>
                {recentListings.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No listings yet</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {recentListings.map((l) => (
                      <li key={l.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {l.images?.[0]
                            ? <img src={l.images[0]} alt="" className="w-8 h-8 rounded-lg object-cover" />
                            : <Home className="w-4 h-4 text-secondary" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate leading-tight">{l.title || "—"}</p>
                          <p className="text-xs text-muted-foreground">₹{l.rent_amount?.toLocaleString("en-IN")}/mo · {l.city}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Recent Reports */}
              <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquareWarning className="w-4 h-4 text-destructive" />
                    <h3 className="font-semibold text-sm text-foreground">Recent Reports</h3>
                  </div>
                  <Link to="/admin/reports" className="text-xs text-primary hover:underline">See all</Link>
                </div>
                {recentReports.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No reports yet</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {recentReports.map((r) => (
                      <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          r.status === "pending" ? "bg-destructive/10" : "bg-muted"}`}>
                          <Flag className={`w-4 h-4 ${r.status === "pending" ? "text-destructive" : "text-muted-foreground"}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground capitalize truncate leading-tight">
                            {r.report_type?.replace(/_/g, " ") || "Report"}
                          </p>
                          <p className="text-xs text-muted-foreground">{timeAgo(r.created_at)}</p>
                        </div>
                        <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          r.status === "pending" ? "bg-destructive/10 text-destructive" :
                          r.status === "resolved" ? "bg-green-100 text-green-700" :
                          "bg-muted text-muted-foreground"
                        }`}>{r.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

            </div>
          </>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminDashboard;
