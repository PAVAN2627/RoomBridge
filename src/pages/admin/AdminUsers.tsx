import { useState, useEffect } from "react";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy("created_at", "desc"), limit(100));
        const snapshot = await getDocs(q);
        
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    if (filter === "All") return true;
    if (filter === "Active") return user.ban_status === "none";
    if (filter === "Pending") return user.verification_status === "pending";
    if (filter === "Banned") return user.ban_status === "active";
    return true;
  });

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
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Manage all registered users</p>
          <div className="flex gap-2">
            {["All", "Active", "Pending", "Banned"].map((f) => (
              <button 
                key={f} 
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  f === filter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No users found</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Verified</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Joined</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-primary-foreground text-xs font-bold">
                            {user.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <span className="font-medium text-foreground">{user.name}</span>
                            <span className="text-xs text-muted-foreground block">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{user.user_type || 'N/A'}</td>
                      <td className="p-4">
                        {user.verification_status === "verified" ? (
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        ) : (
                          <XCircle className="w-4 h-4 text-muted-foreground" />
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          user.ban_status === "none" ? "bg-primary/10 text-primary" :
                          user.verification_status === "pending" ? "bg-secondary/10 text-secondary" :
                          "bg-destructive/10 text-destructive"
                        }`}>
                          {user.ban_status === "active" ? "Banned" : 
                           user.verification_status === "pending" ? "Pending" : "Active"}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {user.created_at?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm">View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminUsers;
