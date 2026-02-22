import { useState, useRef } from "react";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { db, storage } from "@/lib/firebase";
import { Camera, Loader2, Lock, User, Eye, EyeOff, Shield, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const AdminProfile = () => {
  const { user, userData, refreshUserData } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(userData?.name || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const adminPhoto = (userData as any)?.selfie_url || null;
  const adminInitial = userData?.name?.charAt(0)?.toUpperCase() || "A";

  // Save name
  const handleSaveProfile = async () => {
    if (!user || !name.trim()) return;
    setSavingProfile(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        updated_at: serverTimestamp(),
      });
      await refreshUserData();
      toast({ title: "Profile updated", description: "Your name has been saved." });
    } catch {
      toast({ title: "Error", description: "Failed to save profile.", variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  // Upload photo
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB allowed.", variant: "destructive" });
      return;
    }
    setUploadingPhoto(true);
    try {
      const storageRef = ref(storage, `admin_avatars/${user.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "users", user.uid), {
        selfie_url: url,
        updated_at: serverTimestamp(),
      });
      await refreshUserData();
      toast({ title: "Photo updated" });
    } catch {
      toast({ title: "Error", description: "Failed to upload photo.", variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (!user || !user.email) return;
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Fill all fields", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "At least 6 characters required.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Password changed", description: "Your password has been updated successfully." });
    } catch (err: any) {
      const msg =
        err.code === "auth/wrong-password" ? "Current password is incorrect." :
        err.code === "auth/too-many-requests" ? "Too many attempts. Try again later." :
        "Failed to change password.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-xl" />
          <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-6 shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg"
              >
                <Shield className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                  Admin Profile
                  <Sparkles className="w-5 h-5 text-violet-500" />
                </h2>
                <p className="text-sm text-muted-foreground">Manage your administrator account</p>
              </div>
            </div>

            {/* Avatar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-6"
            >
              <div className="relative flex-shrink-0">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="relative"
                >
                  {adminPhoto ? (
                    <img src={adminPhoto} alt="Admin" className="w-24 h-24 rounded-full object-cover border-4 border-violet-500/30 shadow-lg" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                      {adminInitial}
                    </div>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fileRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg border-2 border-background hover:shadow-xl transition-all"
                  >
                    {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  </motion.button>
                </motion.div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg text-foreground">{userData?.name || "Admin"}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-600 rounded-full text-xs font-bold border border-violet-500/30"
                >
                  <Shield className="w-3 h-3" />
                  Administrator
                </motion.div>
              </div>
            </motion.div>

            {/* Name field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-violet-500" />
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="brand"
                size="default"
                onClick={handleSaveProfile}
                disabled={savingProfile || !name.trim()}
                className="w-full"
              >
                {savingProfile ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save Profile"}
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Change password card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-pink-500/10 rounded-2xl blur-xl" />
          <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg"
              >
                <Lock className="w-5 h-5 text-white" />
              </motion.div>
              <h2 className="font-display text-lg font-bold text-foreground">Change Password</h2>
            </div>

            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <label className="text-sm font-semibold text-foreground">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() => setShowCurrent((p) => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </motion.button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                className="space-y-2"
              >
                <label className="text-sm font-semibold text-foreground">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() => setShowNew((p) => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </motion.button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <label className="text-sm font-semibold text-foreground">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="action"
                size="default"
                onClick={handleChangePassword}
                disabled={savingPassword}
                className="w-full"
              >
                {savingPassword ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating…</> : "Update Password"}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminProfile;
