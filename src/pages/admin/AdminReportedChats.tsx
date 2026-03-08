import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { MessageCircle, AlertTriangle, Loader2, ShieldBan } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collection, getDocs, query, where, doc, updateDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";

const AdminReportedChats = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [reportDocs, userDocs] = await Promise.all([
        getDocs(collection(db, "reports")),
        getDocs(collection(db, "users")),
      ]);

      const userMap: Record<string, string> = {};
      userDocs.docs.forEach((d) => {
        const data = d.data();
        userMap[d.id] = data.name || data.email || d.id;
      });

      const list = reportDocs.docs
        .map((d) => ({
          id: d.id,
          ...d.data(),
          reporterName: userMap[(d.data() as any).reporter_id] || "Unknown",
          reportedName: userMap[(d.data() as any).reported_user_id] || "Unknown",
        }))
        .sort((a: any, b: any) => (b.created_at?.toMillis?.() ?? 0) - (a.created_at?.toMillis?.() ?? 0));

      setReports(list);
    } catch (err) {
      console.error("AdminReportedChats fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (id: string, action: "resolved" | "dismissed", reportedUserId?: string) => {
    setActioning(id);
    try {
      const batch = writeBatch(db);

      if (action === "resolved" && reportedUserId) {
        // Ban the reported user
        batch.update(doc(db, "users", reportedUserId), {
          status: "banned",
          banned_at: serverTimestamp(),
          banned_reason: "Resolved report by admin",
        });

        // Mark all their listings as deleted
        const [listingSnap, requestSnap] = await Promise.all([
          getDocs(query(collection(db, "listings"), where("poster_id", "==", reportedUserId))),
          getDocs(query(collection(db, "room_requests"), where("searcher_id", "==", reportedUserId))),
        ]);
        listingSnap.docs.forEach((d) =>
          batch.update(d.ref, { status: "deleted", deleted_at: serverTimestamp() })
        );
        requestSnap.docs.forEach((d) =>
          batch.update(d.ref, { status: "deleted", deleted_at: serverTimestamp() })
        );
      }

      // Update the report status
      batch.update(doc(db, "reports", id), { status: action, updated_at: serverTimestamp() });

      await batch.commit();

      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: action } : r))
      );

      if (action === "resolved") {
        toast({
          title: "User banned",
          description: "The reported user has been banned and all their content removed.",
        });
      }
    } catch (err) {
      console.error("Report action error:", err);
      toast({ title: "Error", description: "Action failed. Please try again.", variant: "destructive" });
    } finally {
      setActioning(null);
    }
  };

  const timeAgo = (ts: any) => {
    if (!ts?.toDate) return "";
    const diff = Math.floor((Date.now() - ts.toDate().getTime()) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  const severityOf = (type: string) => {
    if (type === "harassment") return "High";
    if (type === "scam" || type === "fake_identity") return "Medium";
    return "Low";
  };

  const severityStyle = (sev: string) => {
    if (sev === "High") return "bg-destructive/10 text-destructive border-destructive/30";
    if (sev === "Medium") return "bg-secondary/10 text-secondary";
    return "bg-muted text-muted-foreground";
  };

  const pendingReports = reports.filter((r: any) => r.status === "pending");
  const otherReports = reports.filter((r: any) => r.status !== "pending");

  return (
    <AdminDashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-muted-foreground">Review all user reports and flag inappropriate behaviour</p>
          <Link to="/admin/reports" className="text-xs text-primary hover:underline">View full reports table →</Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground text-sm shadow-card">
            No reports found.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending reports */}
            {pendingReports.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Pending ({pendingReports.length})</h3>
                <div className="space-y-4">
                  {pendingReports.map((report: any) => {
                    const sev = severityOf(report.report_type);
                    return (
                      <div key={report.id} className={`bg-card rounded-xl border p-5 shadow-card ${sev === "High" ? "border-destructive/40" : "border-border"}`}>
                        <div className="flex items-start justify-between mb-3 gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <MessageCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm font-semibold text-foreground">{report.reporterName}</span>
                            <span className="text-xs text-muted-foreground">reported</span>
                            <span className="text-sm font-semibold text-foreground">{report.reportedName}</span>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${severityStyle(sev)}`}>{sev}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <AlertTriangle className="w-3 h-3" />
                          <span className="capitalize">Reason: {report.report_type?.replace(/_/g, " ") || "—"}</span>
                          <span>• {timeAgo(report.created_at)}</span>
                        </div>
                        {report.description && (
                          <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3 mb-3 italic">
                            "{report.description}"
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={actioning === report.id}
                            onClick={() => handleAction(report.id, "resolved", report.reported_user_id)}
                          >
                            {actioning === report.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <><ShieldBan className="w-3 h-3 mr-1" />Ban & Remove</>}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={actioning === report.id}
                            onClick={() => handleAction(report.id, "dismissed")}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Resolved/Dismissed */}
            {otherReports.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Resolved / Dismissed ({otherReports.length})</h3>
                <div className="space-y-3">
                  {otherReports.map((report: any) => (
                    <div key={report.id} className="bg-card rounded-xl border border-border p-4 shadow-card opacity-60">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{report.reporterName}</span>
                          <span className="text-xs text-muted-foreground">reported</span>
                          <span className="text-sm font-medium text-foreground">{report.reportedName}</span>
                          <span className="text-xs text-muted-foreground capitalize">— {report.report_type?.replace(/_/g, " ")}</span>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${
                          report.status === "resolved" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        }`}>{report.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminReportedChats;
