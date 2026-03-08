import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import UserDashboardLayout from "@/components/UserDashboardLayout";
import {
  Search, Home, MessageCircle, Star, Loader2, PlusCircle,
  HandHelping, MapPin, Clock, IndianRupee, ArrowRight,
  CheckCircle2, AlertTriangle, Building2, CalendarDays, Eye,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection, query, where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ListingDocument, RoomRequestDocument } from "@/lib/firebase/types";

/* ── helpers ── */
const formatRupee = (n: number) =>
  n >= 1000 ? `₹${(n / 1000).toFixed(0)}k` : `₹${n}`;

const durationLabel: Record<string, string> = {
  "1_day": "1 Day", "2_days": "2 Days", "3_days": "3 Days",
  "4_days": "4 Days", "5_days": "5 Days", "6_days": "6 Days",
  "7_days": "1 Week", "1_month": "1 Month", "3_months": "3 Months",
  "6_months": "6 Months", "12_months": "12 Months",
};
const listingTypeLabel: Record<string, string> = {
  long_term: "Long-Term", pg: "PG", flatmate: "Flatmate",
  short_stay: "Short Stay", emergency: "Emergency",
};
const roomTypeLabel: Record<string, string> = {
  "1rk": "1 RK", "1bhk": "1 BHK", "2bhk": "2 BHK", "3bhk": "3 BHK",
  "4bhk": "4 BHK", studio: "Studio", shared: "Shared", single: "Single",
};

/* ─────────────────────────────────────────────── */

const Dashboard = () => {
  const { user, userData } = useAuth();
  const [stats, setStats] = useState({ activeListings: 0, roomRequests: 0, messages: 0 });
  const [listings, setListings] = useState<ListingDocument[]>([]);
  const [requests, setRequests] = useState<RoomRequestDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !userData) return;
    const uid = user.uid;

    const fetchAll = async () => {
      try {
        const [listingDocs, requestDocs, chatDocs] = await Promise.all([
          getDocs(query(collection(db, "listings"), where("poster_id", "==", uid))),
          getDocs(query(collection(db, "room_requests"), where("searcher_id", "==", uid))),
          getDocs(query(collection(db, "chats"), where("participant_ids", "array-contains", uid))),
        ]);

        const sortByDate = (a: any, b: any) => {
          const aTime = a.data().created_at?.toMillis?.() ?? 0;
          const bTime = b.data().created_at?.toMillis?.() ?? 0;
          return bTime - aTime;
        };

        const sortedListings = listingDocs.docs.sort(sortByDate);
        const sortedRequests = requestDocs.docs.sort(sortByDate);

        setStats({
          activeListings: listingDocs.docs.filter((d) => d.data().status === "active").length,
          roomRequests: requestDocs.docs.filter((d) => d.data().status === "active").length,
          messages: chatDocs.size,
        });

        setListings(
          sortedListings
            .slice(0, 3)
            .map((d) => ({ listing_id: d.id, ...d.data() } as ListingDocument))
        );
        setRequests(
          sortedRequests
            .slice(0, 3)
            .map((d) => ({ request_id: d.id, ...d.data() } as RoomRequestDocument))
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [user, userData]);

  const firstName = userData?.name?.split(" ")[0] || "User";
  const isVerified = userData?.verification_status === "verified";
  const initials = userData?.name
    ? userData.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <UserDashboardLayout>
      <div className="max-w-5xl mx-auto space-y-5">

        {/* ── Welcome Banner ── */}
        <div className="bg-gradient-to-r from-violet-700 to-violet-500 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-lg font-bold flex-shrink-0 overflow-hidden">
              {userData?.selfie_url
                ? <img src={userData.selfie_url} alt="avatar" className="w-12 h-12 rounded-full object-cover" />
                : initials}
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white leading-tight">
                Welcome back, {firstName}! 👋
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {isVerified ? (
                  <span className="flex items-center gap-1 text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs bg-yellow-400/30 text-yellow-100 px-2 py-0.5 rounded-full font-medium">
                    <AlertTriangle className="w-3 h-3" /> Not Verified
                  </span>
                )}
                {userData?.city && (
                  <span className="flex items-center gap-1 text-xs text-white/70">
                    <MapPin className="w-3 h-3" />{userData.city}
                  </span>
                )}
                {(userData?.average_rating ?? 0) > 0 && (
                  <span className="flex items-center gap-1 text-xs text-white/70">
                    <Star className="w-3 h-3 fill-yellow-300 text-yellow-300" />
                    {userData!.average_rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <Link to="/dashboard/post" className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition-colors">
              <PlusCircle className="w-3.5 h-3.5" /> Post Room
            </Link>
            <Link to="/dashboard/post-request" className="flex items-center gap-1.5 px-3 py-2 bg-white text-violet-700 text-xs font-semibold rounded-lg hover:bg-white/90 transition-colors">
              <HandHelping className="w-3.5 h-3.5" /> Need Room
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Building2, label: "Active Listings", value: stats.activeListings, to: "/dashboard/my-listings", color: "text-violet-500", bg: "bg-violet-500/10" },
                { icon: HandHelping, label: "Room Requests", value: stats.roomRequests, to: "/dashboard/my-requests", color: "text-emerald-500", bg: "bg-emerald-500/10" },
                { icon: MessageCircle, label: "Conversations", value: stats.messages, to: "/dashboard/messages", color: "text-blue-500", bg: "bg-blue-500/10" },
                { icon: Star, label: "Your Rating", value: (userData?.average_rating ?? 0) > 0 ? userData!.average_rating.toFixed(1) : "—", to: "/dashboard/ratings", color: "text-amber-500", bg: "bg-amber-500/10" },
              ].map((s) => (
                <Link key={s.label} to={s.to} className="bg-card rounded-xl border border-border p-4 shadow-card hover:shadow-md transition-shadow">
                  <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                    <s.icon className={s.color} style={{ width: 18, height: 18 }} />
                  </div>
                  <div className="font-display text-2xl font-bold text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </Link>
              ))}
            </div>

            {/* ── Two columns: listings + requests ── */}
            <div className="grid md:grid-cols-2 gap-5">

              {/* My Listings */}
              <section className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-violet-500" />
                    <h3 className="text-sm font-semibold text-foreground">My Listings</h3>
                  </div>
                  <Link to="/dashboard/my-listings" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                    See all <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {listings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                    <Building2 className="w-8 h-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">No listings yet</p>
                    <Link to="/dashboard/post" className="flex items-center gap-1.5 text-xs font-medium text-primary px-3 py-1.5 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
                      <PlusCircle className="w-3.5 h-3.5" /> Post your first listing
                    </Link>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {listings.map((l) => (
                      <li key={l.listing_id} className="flex gap-3 p-3 hover:bg-muted/40 transition-colors">
                        <div className="w-14 h-14 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                          {l.images?.[0]
                            ? <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-5 h-5 text-muted-foreground/50" /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-sm font-semibold text-foreground truncate leading-tight">{l.title}</p>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${l.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                              {l.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />{l.city}
                            </span>
                            <span className="flex items-center gap-0.5 text-xs font-medium text-foreground">
                              <IndianRupee className="w-3 h-3" />{formatRupee(l.rent_amount)}/mo
                            </span>
                            {l.listing_type && (
                              <span className="text-[10px] bg-violet-500/10 text-violet-600 px-1.5 py-0.5 rounded-full font-medium">
                                {listingTypeLabel[l.listing_type] ?? l.listing_type}
                              </span>
                            )}
                            {l.room_type && (
                              <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                                {roomTypeLabel[l.room_type] ?? l.room_type}
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="px-4 py-2.5 border-t border-border">
                  <Link to="/dashboard/post" className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 text-xs font-semibold transition-colors">
                    <PlusCircle className="w-3.5 h-3.5" /> Post New Listing
                  </Link>
                </div>
              </section>

              {/* My Room Requests */}
              <section className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <HandHelping className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-semibold text-foreground">My Room Requests</h3>
                  </div>
                  <Link to="/dashboard/my-requests" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                    See all <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {requests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                    <HandHelping className="w-8 h-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">No requests yet</p>
                    <Link to="/dashboard/post-request" className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 px-3 py-1.5 bg-emerald-500/10 rounded-lg hover:bg-emerald-500/20 transition-colors">
                      <PlusCircle className="w-3.5 h-3.5" /> Post a room request
                    </Link>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {requests.map((r) => (
                      <li key={r.request_id} className="p-3 hover:bg-muted/40 transition-colors">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <p className="text-sm font-semibold text-foreground leading-tight truncate">{r.title}</p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {r.request_type === "emergency" && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600">🔥 Urgent</span>
                            )}
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${r.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                              {r.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />{r.city}
                          </span>
                          <span className="flex items-center gap-0.5 text-xs font-medium text-foreground">
                            <IndianRupee className="w-3 h-3" />{formatRupee(r.budget_min)}–{formatRupee(r.budget_max)}
                          </span>
                          {r.duration && (
                            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />{durationLabel[r.duration] ?? r.duration}
                            </span>
                          )}
                          {r.needed_from && (
                            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                              <CalendarDays className="w-3 h-3" />
                              {r.needed_from.toDate().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="px-4 py-2.5 border-t border-border">
                  <Link to="/dashboard/post-request" className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 text-xs font-semibold transition-colors">
                    <PlusCircle className="w-3.5 h-3.5" /> Post New Request
                  </Link>
                </div>
              </section>
            </div>

            {/* ── Quick Actions ── */}
            <section className="bg-card rounded-xl border border-border shadow-card p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { icon: Search, label: "Browse Listings", to: "/dashboard/browse", color: "text-violet-500", bg: "bg-violet-500/10" },
                  { icon: Home, label: "Room Requests", to: "/dashboard/requests", color: "text-emerald-500", bg: "bg-emerald-500/10" },
                  { icon: MessageCircle, label: "Messages", to: "/dashboard/messages", color: "text-blue-500", bg: "bg-blue-500/10" },
                  { icon: Eye, label: "My Profile", to: "/dashboard/profile", color: "text-amber-500", bg: "bg-amber-500/10" },
                ].map((a) => (
                  <Link key={a.to} to={a.to} className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl hover:bg-muted/60 transition-colors text-center">
                    <div className={`w-9 h-9 rounded-lg ${a.bg} flex items-center justify-center`}>
                      <a.icon className={a.color} style={{ width: 18, height: 18 }} />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground leading-tight">{a.label}</span>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </UserDashboardLayout>
  );
};

export default Dashboard;
