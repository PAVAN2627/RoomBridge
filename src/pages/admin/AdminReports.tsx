import { useState, useEffect } from "react";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Flag, Loader2, Eye, X, ShieldBan, AlertTriangle, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, onSnapshot, orderBy, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { reviewReport } from "@/lib/firebase/reports";
import { getUser } from "@/lib/firebase/users";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Report {
  report_id: string;
  reporter_id: string;
  reported_user_id: string;
  report_type: string;
  description: string;
  evidence_urls: string[];
  status: string;
  action_taken?: string;
  reviewer_id?: string;
  reviewed_at?: any;
  created_at: any;
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  fake_identity: "Fake Identity",
  broker: "Broker / Agent",
  scam: "Scam / Fraud",
  harassment: "Harassment",
};

const SEVERITY: Record<string, string> = {
  scam: "High",
  fake_identity: "High",
  harassment: "Medium",
  broker: "Medium",
};

const FILTERS = ["All", "pending", "under_review", "resolved", "dismissed"];

const AdminReports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionText, setActionText] = useState("");
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  const fetchUserName = async (uid: string) => {
    if (!uid || userNames[uid]) return;
    try {
      const u = await getUser(uid);
      if (u?.name) setUserNames((prev) => ({ ...prev, [uid]: u.name }));
    } catch {}
  };

  useEffect(() => {
    const q = query(collection(db, "reports"), orderBy("created_at", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const loaded = snap.docs.map((d) => ({ ...d.data(), report_id: d.id } as Report));
      setReports(loaded);
      setLoading(false);
      // Fetch user names for all unique IDs
      const ids = new Set<string>();
      loaded.forEach((r) => { ids.add(r.reporter_id); ids.add(r.reported_user_id); });
      ids.forEach((id) => fetchUserName(id));
    });
    return () => unsub();
  }, []);

  const filteredReports =
    filter === "All" ? reports : reports.filter((r) => r.status === filter);

  const handleBlock = async (reportId: string, reportedUserId: string, reportType: string) => {
    if (!user) return;
    setActionLoading(true);
    try {
      // Ban the reported user
      await updateDoc(doc(db, "users", reportedUserId), {
        ban_status: "active",
        ban_reason: actionText || `Banned due to report: ${REPORT_TYPE_LABELS[reportType] || reportType}`,
        updated_at: serverTimestamp(),
      });
      // Mark report as resolved
      await reviewReport(reportId, user.uid, "resolved", actionText || `User blocked due to: ${REPORT_TYPE_LABELS[reportType] || reportType}`);
      toast({ title: "User blocked", description: "The reported user has been banned and the report resolved." });
      setSelectedReport(null);
      setActionText("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismiss = async (reportId: string) => {
    if (!user) return;
    setActionLoading(true);
    try {
      await reviewReport(reportId, user.uid, "dismissed", actionText || "Dismissed by admin");
      toast({ title: "Report dismissed", description: "The report has been dismissed." });
      setSelectedReport(null);
      setActionText("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const getTimeAgo = (ts: any) => {
    if (!ts) return "";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = Math.floor((Date.now() - date.getTime()) / 86400000);
    return diff === 0 ? "Today" : diff === 1 ? "Yesterday" : `${diff}d ago`;
  };

  return (
    <AdminDashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header with stats */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10 rounded-2xl blur-xl" />
          <div className="relative bg-card/80 backdrop-blur-sm border rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg"
              >
                <Flag className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">User Reports</h2>
                <p className="text-sm text-muted-foreground">
                  Monitor and moderate user reports ({filteredReports.length})
                </p>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f, index) => (
                <motion.button
                  key={f}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all capitalize ${
                    filter === f
                      ? "bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-lg"
                      : "bg-muted text-muted-foreground hover:bg-accent border border-border/50"
                  }`}
                >
                  {f === "All" ? "All" : f.replace("_", " ")}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16"
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
              className="text-sm text-muted-foreground mt-4"
            >
              Loading reports...
            </motion.p>
          </motion.div>
        )}

        {!loading && filteredReports.length === 0 && (
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
              <Flag className="w-20 h-20 mx-auto text-muted-foreground/40" />
            </motion.div>
            <p className="text-muted-foreground text-lg">No reports found.</p>
          </motion.div>
        )}

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredReports.map((r, index) => {
              const severity = SEVERITY[r.report_type] || "Low";
              return (
                <motion.div
                  key={r.report_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.1)" }}
                  className={`bg-card rounded-2xl border p-6 shadow-card transition-all duration-300 ${
                    severity === "High" ? "border-red-500/40 bg-gradient-to-br from-red-500/5 to-transparent" : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <motion.div
                        animate={severity === "High" ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Flag
                          className={`w-5 h-5 flex-shrink-0 ${
                            severity === "High" ? "text-red-500" :
                            severity === "Medium" ? "text-orange-500" : "text-muted-foreground"
                          }`}
                        />
                      </motion.div>
                      <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-muted text-foreground border border-border">
                        {REPORT_TYPE_LABELS[r.report_type] || r.report_type}
                      </span>
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                        severity === "High" ? "bg-red-500/10 text-red-600 border border-red-500/30" :
                        severity === "Medium" ? "bg-orange-500/10 text-orange-600 border border-orange-500/30" :
                        "bg-muted text-muted-foreground border border-border"
                      }`}>
                        {severity} severity
                      </span>
                      <span className="text-xs text-muted-foreground">{getTimeAgo(r.created_at)}</span>
                    </div>
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 capitalize ${
                        r.status === "pending" ? "bg-red-500/10 text-red-600 border border-red-500/30" :
                        r.status === "under_review" ? "bg-orange-500/10 text-orange-600 border border-orange-500/30" :
                        r.status === "resolved" ? "bg-green-500/10 text-green-600 border border-green-500/30" :
                        "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {r.status.replace("_", " ")}
                    </motion.span>
                  </div>

                  <p className="text-sm text-foreground font-medium mb-3 line-clamp-2">{r.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs mb-4">
                    <span className="px-3 py-1.5 bg-violet-500/10 text-violet-600 rounded-full border border-violet-500/20 font-medium">
                      Reporter: {userNames[r.reporter_id] || <span className="font-mono">{r.reporter_id.slice(0, 10)}…</span>}
                    </span>
                    <span className="px-3 py-1.5 bg-blue-500/10 text-blue-600 rounded-full border border-blue-500/20 font-medium">
                      Reported: {userNames[r.reported_user_id] || <span className="font-mono">{r.reported_user_id.slice(0, 10)}…</span>}
                    </span>
                    {r.evidence_urls?.length > 0 && (
                      <span className="px-3 py-1.5 bg-green-500/10 text-green-600 rounded-full border border-green-500/20 font-medium">
                        {r.evidence_urls.length} proof image(s)
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" size="sm" onClick={() => { setSelectedReport(r); setActionText(""); }}>
                        <Eye className="w-3 h-3 mr-1" />
                        Review
                      </Button>
                    </motion.div>
                    {r.status !== "resolved" && r.status !== "dismissed" && (
                      <>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button variant="destructive" size="sm" disabled={actionLoading}
                            onClick={() => handleBlock(r.report_id, r.reported_user_id, r.report_type)}>
                            <ShieldBan className="w-3 h-3 mr-1" />
                            Block User
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button variant="outline" size="sm" disabled={actionLoading}
                            onClick={() => handleDismiss(r.report_id)}>
                            <X className="w-3 h-3 mr-1" />
                            Dismiss
                          </Button>
                        </motion.div>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-destructive" />
              Report Details
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (() => {
            const r = selectedReport;
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Type</p>
                    <p className="text-sm font-semibold text-foreground">{REPORT_TYPE_LABELS[r.report_type] || r.report_type}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                    <p className="text-sm font-semibold text-foreground capitalize">{r.status.replace("_", " ")}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3 col-span-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Reporter</p>
                    <p className="text-sm font-semibold text-foreground">{userNames[r.reporter_id] || "—"}</p>
                    <p className="text-[10px] font-mono text-muted-foreground break-all mt-0.5">{r.reporter_id}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3 col-span-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Reported User</p>
                    <p className="text-sm font-semibold text-foreground">{userNames[r.reported_user_id] || "—"}</p>
                    <p className="text-[10px] font-mono text-muted-foreground break-all mt-0.5">{r.reported_user_id}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Description</p>
                  <p className="text-sm text-foreground leading-relaxed bg-muted/50 rounded-lg p-3">{r.description}</p>
                </div>

                {r.evidence_urls?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Proof / Evidence ({r.evidence_urls.length})
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {r.evidence_urls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt={`Evidence ${i + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-border hover:opacity-80 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {r.action_taken && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Action Taken</p>
                    <p className="text-sm text-foreground">{r.action_taken}</p>
                  </div>
                )}

                {r.status !== "resolved" && r.status !== "dismissed" && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Action notes</label>
                      <textarea rows={2} value={actionText} onChange={(e) => setActionText(e.target.value)}
                        placeholder="Describe what action was taken..."
                        className="w-full px-3 py-2 rounded-lg bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="destructive" size="sm" className="flex-1" disabled={actionLoading}
                        onClick={() => handleBlock(r.report_id, r.reported_user_id, r.report_type)}>
                        {actionLoading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <ShieldBan className="w-3 h-3 mr-1" />}
                        Block User
                      </Button>
                      <Button variant="outline" size="sm" disabled={actionLoading}
                        onClick={() => handleDismiss(r.report_id)}>
                        <X className="w-3 h-3 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </AdminDashboardLayout>
  );
};

export default AdminReports;
