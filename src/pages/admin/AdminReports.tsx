import { useState, useEffect } from "react";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Flag, Loader2, Eye, X, ShieldBan } from "lucide-react";
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
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-muted-foreground">
            User reports and trust flags ({filteredReports.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize ${
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {f === "All" ? "All" : f.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {!loading && filteredReports.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">No reports found.</div>
        )}

        <div className="space-y-4">
          {filteredReports.map((r) => {
            const severity = SEVERITY[r.report_type] || "Low";
            return (
              <div
                key={r.report_id}
                className={`bg-card rounded-xl border p-5 shadow-card ${
                  severity === "High" ? "border-destructive/40" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Flag
                      className={`w-4 h-4 flex-shrink-0 ${
                        severity === "High" ? "text-destructive" :
                        severity === "Medium" ? "text-secondary" : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {REPORT_TYPE_LABELS[r.report_type] || r.report_type}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {severity} severity
                    </span>
                    <span className="text-xs text-muted-foreground">{getTimeAgo(r.created_at)}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 capitalize ${
                    r.status === "pending" ? "bg-destructive/10 text-destructive" :
                    r.status === "under_review" ? "bg-secondary/10 text-secondary" :
                    r.status === "resolved" ? "bg-primary/10 text-primary" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {r.status.replace("_", " ")}
                  </span>
                </div>

                <p className="text-sm text-foreground font-medium mb-1 line-clamp-2">{r.description}</p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                  <span>Reporter: <span className="font-semibold text-foreground">{userNames[r.reporter_id] || <span className="font-mono">{r.reporter_id.slice(0, 10)}…</span>}</span></span>
                  <span>•</span>
                  <span>Reported: <span className="font-semibold text-foreground">{userNames[r.reported_user_id] || <span className="font-mono">{r.reported_user_id.slice(0, 10)}…</span>}</span></span>
                  {r.evidence_urls?.length > 0 && (
                    <><span>•</span><span className="text-primary font-medium">{r.evidence_urls.length} proof image(s)</span></>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => { setSelectedReport(r); setActionText(""); }}>
                    <Eye className="w-3 h-3 mr-1" />
                    Review
                  </Button>
                  {r.status !== "resolved" && r.status !== "dismissed" && (
                    <Button variant="destructive" size="sm" disabled={actionLoading}
                      onClick={() => handleBlock(r.report_id, r.reported_user_id, r.report_type)}>
                      <ShieldBan className="w-3 h-3 mr-1" />
                      Block User
                    </Button>
                  )}
                  {r.status !== "resolved" && r.status !== "dismissed" && (
                    <Button variant="outline" size="sm" disabled={actionLoading}
                      onClick={() => handleDismiss(r.report_id)}>
                      <X className="w-3 h-3 mr-1" />
                      Dismiss
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
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
