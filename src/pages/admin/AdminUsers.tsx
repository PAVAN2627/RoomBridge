import { useState, useEffect } from "react";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, XCircle, Loader2, X, ShieldCheck, ShieldOff, User, Mail, Phone, MapPin, Building2, Star, Calendar, FileText, Image as ImageIcon, UserX, Trash2, Users, AlertTriangle } from "lucide-react";
import { collection, query, getDocs, orderBy, limit, doc, updateDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AdminUsers = () => {
  const { toast } = useToast();
  const { userData } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<any | null>(null);
  const [actioning, setActioning] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<any | null>(null);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [userToActivate, setUserToActivate] = useState<any | null>(null);

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

  const toggleBan = async (u: any) => {
    const newBan = u.ban_status === "active" ? "none" : "active";
    setActioning(true);
    try {
      await updateDoc(doc(db, "users", u.id), {
        ban_status: newBan,
        updated_at: serverTimestamp(),
      });
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, ban_status: newBan } : x));
      if (selected?.id === u.id) setSelected((prev: any) => ({ ...prev, ban_status: newBan }));
      toast({ title: newBan === "active" ? "User banned" : "User unbanned" });
    } catch {
      toast({ title: "Error", description: "Action failed", variant: "destructive" });
    } finally {
      setActioning(false);
    }
  };

  const handleActivate = async () => {
    if (!userToActivate) return;
    setActioning(true);
    try {
      console.log("Attempting to activate user:", userToActivate.id);
      console.log("Current user role:", userData?.role);
      
      // Verify admin status
      if (userData?.role !== 'admin') {
        throw new Error("You must be an admin to perform this action");
      }
      
      await updateDoc(doc(db, "users", userToActivate.id), {
        account_status: "active",
        activated_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      
      setUsers((prev) => prev.map((x) => x.id === userToActivate.id ? { ...x, account_status: "active" } : x));
      if (selected?.id === userToActivate.id) {
        setSelected((prev: any) => ({ ...prev, account_status: "active" }));
      }
      toast({ title: "Account activated", description: "User account has been activated successfully." });
      setActivateDialogOpen(false);
      setUserToActivate(null);
    } catch (error: any) {
      console.error("Error activating user:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      
      let errorMsg = "Failed to activate account";
      if (error.code === 'permission-denied') {
        errorMsg = "Permission denied. Please wait a moment for Firebase rules to update, then try again.";
      }
      
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
    } finally {
      setActioning(false);
    }
  };

  const handleDeactivate = async () => {
    if (!userToDeactivate) return;
    setActioning(true);
    try {
      console.log("Attempting to deactivate user:", userToDeactivate.id);
      console.log("Current user role:", userData?.role);
      console.log("Current user ID:", userData?.user_id);
      
      // Verify admin status
      if (userData?.role !== 'admin') {
        throw new Error("You must be an admin to perform this action");
      }
      
      await updateDoc(doc(db, "users", userToDeactivate.id), {
        account_status: "deactivated",
        deactivated_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      
      setUsers((prev) => prev.map((x) => x.id === userToDeactivate.id ? { ...x, account_status: "deactivated" } : x));
      if (selected?.id === userToDeactivate.id) {
        setSelected((prev: any) => ({ ...prev, account_status: "deactivated" }));
      }
      toast({ title: "Account deactivated", description: "User account has been deactivated successfully." });
      setDeactivateDialogOpen(false);
      setUserToDeactivate(null);
    } catch (error: any) {
      console.error("Error deactivating user:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      
      // More detailed error message
      let errorMsg = "Failed to deactivate account";
      if (error.code === 'permission-denied') {
        errorMsg = "Permission denied. Please wait a moment for Firebase rules to update, then try again.";
      }
      
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
    } finally {
      setActioning(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    setActioning(true);
    try {
      await deleteDoc(doc(db, "users", userToDelete.id));
      setUsers((prev) => prev.filter((x) => x.id !== userToDelete.id));
      if (selected?.id === userToDelete.id) {
        setSelected(null);
      }
      toast({ title: "Account deleted", description: "User account has been permanently deleted." });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({ title: "Error", description: "Failed to delete account", variant: "destructive" });
    } finally {
      setActioning(false);
    }
  };

  const toggleVerification = async (userId: string, currentStatus: string) => {
    setActioning(true);
    try {
      const newStatus = currentStatus === "verified" ? "pending" : "verified";
      const updates: any = {
        verification_status: newStatus,
        updated_at: serverTimestamp(),
      };

      // If verifying, add badges based on documents
      if (newStatus === "verified") {
        const user = users.find(u => u.id === userId);
        const badges: string[] = [];
        
        if (user?.student_id_url || user?.college) {
          badges.push('student');
        }
        if (user?.professional_id_url || user?.company) {
          badges.push('professional');
        }
        if (user?.selfie_url) {
          badges.push('identity');
        }
        
        updates.verification_badges = badges;
        updates.aadhaar_verified = true;
        updates.pan_verified = true;
      } else {
        // If unverifying, remove badges
        updates.verification_badges = [];
        updates.aadhaar_verified = false;
        updates.pan_verified = false;
      }

      await updateDoc(doc(db, "users", userId), updates);
      
      setUsers((prev) => prev.map((x) => x.id === userId ? { ...x, ...updates } : x));
      if (selected?.id === userId) {
        setSelected((prev: any) => ({ ...prev, ...updates }));
      }
      
      toast({ 
        title: newStatus === "verified" ? "User verified" : "Verification removed",
        description: newStatus === "verified" ? "User has been verified successfully." : "User verification has been removed."
      });
    } catch (error) {
      console.error("Error toggling verification:", error);
      toast({ title: "Error", description: "Failed to update verification status", variant: "destructive" });
    } finally {
      setActioning(false);
    }
  };

  const toggleAccountStatus = async (userId: string, currentStatus: string) => {
    setActioning(true);
    try {
      const newStatus = currentStatus === "active" ? "deactivated" : "active";
      const updates: any = {
        account_status: newStatus,
        updated_at: serverTimestamp(),
      };

      if (newStatus === "active") {
        updates.activated_at = serverTimestamp();
      } else {
        updates.deactivated_at = serverTimestamp();
      }

      await updateDoc(doc(db, "users", userId), updates);
      
      setUsers((prev) => prev.map((x) => x.id === userId ? { ...x, account_status: newStatus } : x));
      if (selected?.id === userId) {
        setSelected((prev: any) => ({ ...prev, account_status: newStatus }));
      }
      
      toast({ 
        title: newStatus === "active" ? "Account activated" : "Account deactivated",
        description: newStatus === "active" ? "User account has been activated." : "User account has been deactivated."
      });
    } catch (error) {
      console.error("Error toggling account status:", error);
      toast({ title: "Error", description: "Failed to update account status", variant: "destructive" });
    } finally {
      setActioning(false);
    }
  };

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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-64"
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
            Loading users...
          </motion.p>
        </motion.div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl" />
          <div className="relative bg-card/80 backdrop-blur-sm border rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg"
                >
                  <Users className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">User Management</h2>
                  <p className="text-sm text-muted-foreground">Manage all registered users ({filteredUsers.length})</p>
                </div>
              </div>
              <div className="flex gap-2">
                {["All", "Active", "Pending", "Banned"].map((f, index) => (
                  <motion.button
                    key={f}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                      f === filter 
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg" 
                        : "bg-muted text-muted-foreground hover:bg-accent border border-border/50"
                    }`}
                  >
                    {f}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

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
                        <Button variant="ghost" size="sm" onClick={() => setSelected(user)}>View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-display font-bold text-foreground text-base">User Details</h3>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Avatar + Name */}
              <div className="flex items-center gap-4">
                {selected.selfie_url ? (
                  <img src={selected.selfie_url} alt={selected.name} className="w-16 h-16 rounded-full object-cover border-2 border-border" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-brand flex items-center justify-center text-primary-foreground text-xl font-bold flex-shrink-0">
                    {selected.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
                <div>
                  <p className="font-bold text-foreground text-lg leading-tight">{selected.name || "—"}</p>
                  <p className="text-sm text-muted-foreground capitalize">{selected.user_type || "—"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      selected.ban_status === "active" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                    }`}>{selected.ban_status === "active" ? "Banned" : "Active"}</span>
                    {selected.account_status === "deactivated" && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Deactivated</span>
                    )}
                    {selected.verification_status === "verified" && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Verified</span>
                    )}
                    {selected.verification_status === "pending" && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">Pending Verification</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoRow icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={selected.email} />
                <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={selected.phone} />
                <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Age / Gender" value={selected.age ? `${selected.age} / ${selected.gender}` : selected.gender} />
                <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} label="City" value={selected.city} />
                <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} label="Home District" value={selected.home_district} />
                <InfoRow icon={<Star className="w-3.5 h-3.5" />} label="Rating" value={selected.average_rating ? `${Number(selected.average_rating).toFixed(1)} (${selected.total_ratings} reviews)` : "No ratings"} />
                <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} label="Joined" value={selected.created_at?.toDate?.()?.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} />
              </div>

              {/* Student info */}
              {(selected.college || selected.course) && (
                <div className="bg-muted rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Student Info</p>
                  <InfoRow icon={<Building2 className="w-3.5 h-3.5" />} label="College" value={selected.college} />
                  <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Course" value={selected.course} />
                  {selected.year && <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} label="Year" value={String(selected.year)} />}
                  {selected.student_id_url && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        Student ID Proof
                      </p>
                      <img 
                        src={selected.student_id_url} 
                        alt="Student ID" 
                        className="w-full rounded-lg border border-border object-contain max-h-48 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(selected.student_id_url, '_blank')}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Professional info */}
              {(selected.company || selected.role) && (
                <div className="bg-muted rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Professional Info</p>
                  <InfoRow icon={<Building2 className="w-3.5 h-3.5" />} label="Company" value={selected.company} />
                  <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Role" value={selected.role} />
                  {selected.professional_id_url && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        Professional ID Proof
                      </p>
                      <img 
                        src={selected.professional_id_url} 
                        alt="Professional ID" 
                        className="w-full rounded-lg border border-border object-contain max-h-48 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(selected.professional_id_url, '_blank')}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Verification Documents */}
              <div className="bg-muted rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Verification Documents</p>
                
                {/* Aadhaar/PAN */}
                {(selected.aadhaar_verified || selected.pan_verified) && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      {selected.aadhaar_verified ? "Aadhaar Card" : "PAN Card"}
                      {(selected.aadhaar_verified || selected.pan_verified) && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      )}
                    </p>
                    {selected.aadhaar_url && (
                      <img 
                        src={selected.aadhaar_url} 
                        alt="Aadhaar" 
                        className="w-full rounded-lg border border-border object-contain max-h-48 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(selected.aadhaar_url, '_blank')}
                      />
                    )}
                    {selected.pan_url && (
                      <img 
                        src={selected.pan_url} 
                        alt="PAN" 
                        className="w-full rounded-lg border border-border object-contain max-h-48 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(selected.pan_url, '_blank')}
                      />
                    )}
                    {!selected.aadhaar_url && !selected.pan_url && (
                      <p className="text-xs text-muted-foreground">Document not available</p>
                    )}
                  </div>
                )}

                {/* Live Selfie */}
                {selected.selfie_url && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" />
                      Live Selfie
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    </p>
                    <img 
                      src={selected.selfie_url} 
                      alt="Live Selfie" 
                      className="w-full rounded-lg border border-border object-contain max-h-48 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(selected.selfie_url, '_blank')}
                    />
                  </div>
                )}

                {/* Verification Badges */}
                {selected.verification_badges && selected.verification_badges.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selected.verification_badges.map((badge: string) => (
                      <span key={badge} className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700 capitalize">
                        ✓ {badge}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Ban reason */}
              {selected.ban_status === "active" && selected.ban_reason && (
                <div className="bg-destructive/10 rounded-xl p-3 text-xs text-destructive">
                  <strong>Ban reason:</strong> {selected.ban_reason}
                </div>
              )}

              {/* Toggle Controls */}
              <div className="bg-muted rounded-xl p-4 space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Account Controls</p>
                
                {/* Verification Status Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 ${selected.verification_status === "verified" ? "text-green-600" : "text-muted-foreground"}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">Verification Status</p>
                      <p className="text-xs text-muted-foreground">
                        {selected.verification_status === "verified" ? "User is verified" : "User is not verified"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={selected.verification_status === "verified"}
                    onCheckedChange={() => toggleVerification(selected.id, selected.verification_status)}
                    disabled={actioning}
                  />
                </div>

                {/* Account Status Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className={`w-4 h-4 ${selected.account_status === "active" ? "text-green-600" : "text-orange-600"}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">Account Status</p>
                      <p className="text-xs text-muted-foreground">
                        {selected.account_status === "active" ? "Account is active" : "Account is deactivated"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={selected.account_status === "active"}
                    onCheckedChange={() => toggleAccountStatus(selected.id, selected.account_status || "active")}
                    disabled={actioning}
                  />
                </div>

                {/* Ban Status Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldOff className={`w-4 h-4 ${selected.ban_status === "active" ? "text-destructive" : "text-green-600"}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">Ban Status</p>
                      <p className="text-xs text-muted-foreground">
                        {selected.ban_status === "active" ? "User is banned" : "User is not banned"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={selected.ban_status === "active"}
                    onCheckedChange={() => toggleBan(selected)}
                    disabled={actioning}
                  />
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="p-5 pt-0 flex gap-2 flex-wrap">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={actioning}
                  onClick={() => {
                    setUserToDelete(selected);
                    setDeleteDialogOpen(true);
                  }}
                  className="flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Account
                </Button>
              </motion.div>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Activate Confirmation Dialog */}
      <AlertDialog open={activateDialogOpen} onOpenChange={setActivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Activate User Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to activate <strong>{userToActivate?.name}</strong>'s account? 
              The user will be able to log in and use the platform again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actioning}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleActivate}
              disabled={actioning}
              className="bg-green-500 hover:bg-green-600"
            >
              {actioning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Activating...</> : "Activate Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-orange-500" />
              Deactivate User Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate <strong>{userToDeactivate?.name}</strong>'s account? 
              The user will not be able to log in, but their data will be preserved. This action can be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actioning}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeactivate}
              disabled={actioning}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {actioning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deactivating...</> : "Deactivate Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete User Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{userToDelete?.name}</strong>'s account? 
              This action cannot be undone. All user data, listings, and messages will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actioning}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={actioning}
              className="bg-destructive hover:bg-destructive/90"
            >
              {actioning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</> : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminDashboardLayout>
  );
};

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) => (
  value ? (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-[10px] text-muted-foreground leading-none mb-0.5">{label}</p>
        <p className="text-sm text-foreground font-medium break-all">{value}</p>
      </div>
    </div>
  ) : null
);

export default AdminUsers;
