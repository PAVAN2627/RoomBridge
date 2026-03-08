import { useState, useEffect } from "react";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Clock, Loader2, MapPin, IndianRupee, AlertTriangle, Calendar, User, FileText, Sparkles, TrendingUp, CheckCircle, XCircle } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";

const AdminRequests = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "expired" | "fulfilled">("all");

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const [reqDocs, userDocs] = await Promise.all([
          getDocs(collection(db, "room_requests")),
          getDocs(collection(db, "users")),
        ]);

        const userMap: Record<string, string> = {};
        userDocs.docs.forEach((d) => {
          const data = d.data();
          userMap[d.id] = data.name || data.email || d.id;
        });

        const list = reqDocs.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => (b.created_at?.toMillis?.() ?? 0) - (a.created_at?.toMillis?.() ?? 0))
          .map((r: any) => ({ ...r, userName: userMap[r.searcher_id] || "Unknown" }));

        setRequests(list);
      } catch (err) {
        console.error("AdminRequests fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const formatDate = (ts: any) => {
    if (!ts?.toDate) return "—";
    return ts.toDate().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const filtered = filter === "all" ? requests : requests.filter((r: any) => r.status === filter);

  const statusColor = (s: string) => {
    if (s === "active") return "text-primary bg-primary/10";
    if (s === "fulfilled") return "text-green-600 bg-green-100";
    if (s === "expired") return "text-muted-foreground bg-muted";
    return "text-muted-foreground bg-muted";
  };

  const typeColor = (t: string) =>
    t === "emergency" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground";

  return (
    <AdminDashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { label: "Total Requests", value: requests.length, icon: FileText, color: "from-violet-500 to-purple-500", bgColor: "bg-violet-50 dark:bg-violet-950/20" },
            { label: "Active", value: requests.filter(r => r.status === "active").length, icon: TrendingUp, color: "from-blue-500 to-cyan-500", bgColor: "bg-blue-50 dark:bg-blue-950/20" },
            { label: "Fulfilled", value: requests.filter(r => r.status === "fulfilled").length, icon: CheckCircle, color: "from-green-500 to-emerald-500", bgColor: "bg-green-50 dark:bg-green-950/20" },
            { label: "Emergency", value: requests.filter(r => r.request_type === "emergency").length, icon: AlertTriangle, color: "from-orange-500 to-red-500", bgColor: "bg-orange-50 dark:bg-orange-950/20" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`${stat.bgColor} rounded-2xl p-5 border border-border shadow-md hover:shadow-xl transition-all`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                  className="text-3xl font-display font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent"
                >
                  {stat.value}
                </motion.div>
              </div>
              <p className="text-sm font-semibold text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center justify-between flex-wrap gap-4"
        >
          <p className="text-sm text-muted-foreground font-medium">
            Showing <span className="text-primary font-bold">{filtered.length}</span> of {requests.length} requests
          </p>
          <div className="flex gap-2">
            {(["all", "active", "expired", "fulfilled"] as const).map((f, index) => (
              <motion.button
                key={f}
                onClick={() => setFilter(f)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-full capitalize font-semibold text-xs transition-all ${
                  filter === f
                    ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg"
                    : "bg-card border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {f}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-12 h-12 text-primary" />
            </motion.div>
            <p className="text-muted-foreground mt-4">Loading room requests...</p>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-card via-card to-violet-50/30 dark:to-violet-950/10 rounded-2xl border border-border p-16 text-center shadow-lg"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <FileText className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            </motion.div>
            <p className="text-lg font-semibold text-foreground mb-2">No requests found</p>
            <p className="text-muted-foreground">Try adjusting your filters</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-4"
          >
            <AnimatePresence>
              {filtered.map((req: any, index: any) => {
                const isEmergency = req.request_type === "emergency";
                return (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ x: 4, transition: { duration: 0.2 } }}
                    className={`group bg-card rounded-2xl border overflow-hidden shadow-md hover:shadow-xl transition-all ${
                      isEmergency 
                        ? "border-orange-300 dark:border-orange-900 ring-2 ring-orange-500/20" 
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        {/* Left: User & Title */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {req.userName?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                {req.userName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Posted {formatDate(req.created_at)}
                              </p>
                            </div>
                          </div>
                          <h3 className="font-display font-bold text-lg text-foreground mb-2 leading-tight">
                            {req.title || "Room Request"}
                          </h3>
                          {req.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                              {req.description}
                            </p>
                          )}
                        </div>

                        {/* Right: Status & Type Badges */}
                        <div className="flex flex-col gap-2 items-end flex-shrink-0">
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            className={`text-xs font-bold px-3 py-1.5 rounded-full capitalize ${statusColor(req.status)} shadow-sm`}
                          >
                            {req.status || "pending"}
                          </motion.span>
                          {isEmergency && (
                            <motion.span
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="flex items-center gap-1 text-xs font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-full shadow-lg"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              Emergency
                            </motion.span>
                          )}
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                        {/* Budget */}
                        <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 rounded-xl p-3 border border-violet-200 dark:border-violet-900">
                          <div className="flex items-center gap-2 mb-1">
                            <IndianRupee className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Budget</p>
                          </div>
                          <p className="text-sm font-bold text-foreground">
                            {req.budget_min || req.budget_max 
                              ? `₹${req.budget_min ?? "?"} - ${req.budget_max ?? "?"}` 
                              : "Not specified"}
                          </p>
                        </div>

                        {/* Location */}
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-xl p-3 border border-blue-200 dark:border-blue-900">
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Location</p>
                          </div>
                          <p className="text-sm font-bold text-foreground truncate">
                            {req.city || "Any"}
                          </p>
                        </div>

                        {/* Duration */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl p-3 border border-green-200 dark:border-green-900">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Duration</p>
                          </div>
                          <p className="text-sm font-bold text-foreground">
                            {req.duration || "Flexible"}
                          </p>
                        </div>

                        {/* Required Date */}
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-xl p-3 border border-orange-200 dark:border-orange-900">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Needed From</p>
                          </div>
                          <p className="text-sm font-bold text-foreground">
                            {formatDate(req.needed_from)}
                          </p>
                        </div>
                      </div>

                      {/* Additional Info */}
                      {(req.needed_until || req.gender_preference) && (
                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                          {req.needed_until && (
                            <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full font-medium">
                              Until: {formatDate(req.needed_until)}
                            </span>
                          )}
                          {req.gender_preference && (
                            <span className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-3 py-1 rounded-full font-semibold capitalize">
                              {req.gender_preference === "any" ? "Any Gender" : `${req.gender_preference} only`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Hover Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminRequests;
