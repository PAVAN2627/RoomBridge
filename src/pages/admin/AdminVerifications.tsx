import { useState, useEffect } from "react";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle2, XCircle, Eye, Loader2 } from "lucide-react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

const AdminVerifications = () => {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVerifications = async () => {
      try {
        const verificationsRef = collection(db, "verifications");
        const q = query(verificationsRef, orderBy("submitted_at", "desc"), limit(50));
        const snapshot = await getDocs(q);
        
        const verificationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setVerifications(verificationsData);
      } catch (error) {
        console.error("Error fetching verifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVerifications();
  }, []);

  const pendingCount = verifications.filter(v => v.status === "pending").length;

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Review identity verification documents</p>
          {pendingCount > 0 && (
            <span className="text-xs font-semibold bg-secondary/10 text-secondary px-3 py-1.5 rounded-full">
              {pendingCount} Pending
            </span>
          )}
        </div>

        {verifications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No verifications found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {verifications.map((v) => (
              <div key={v.id} className="bg-card rounded-xl border border-border p-5 shadow-card flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <span className="font-medium text-sm text-foreground">{v.user_id}</span>
                    <span className="text-xs text-muted-foreground block">
                      {v.verification_type} • Submitted {v.submitted_at?.toDate?.()?.toLocaleDateString() || 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    v.status === "approved" ? "bg-primary/10 text-primary" :
                    v.status === "rejected" ? "bg-destructive/10 text-destructive" :
                    "bg-secondary/10 text-secondary"
                  }`}>{v.status}</span>
                  {v.status === "pending" && (
                    <div className="flex gap-1.5">
                      <Button variant="ghost" size="icon" className="w-8 h-8"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="w-8 h-8 text-primary"><CheckCircle2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive"><XCircle className="w-4 h-4" /></Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminVerifications;
