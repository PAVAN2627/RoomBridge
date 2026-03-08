import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";

const AdminSetup = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const ADMIN_UID = "p4JFxM9hz8QLhQei6S2BFKuBl762";

  const createAdminUser = async () => {
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const userRef = doc(db, "users", ADMIN_UID);
      
      await setDoc(userRef, {
        user_id: ADMIN_UID,
        name: "Admin",
        email: "admin@roombridge.com",
        age: 30,
        gender: "male",
        phone: "0000000000",
        city: "Mumbai",
        home_district: "Mumbai",
        user_type: "both",
        aadhaar_verified: true,
        pan_verified: true,
        verification_status: "verified",
        verification_badges: ["identity", "selfie", "professional"],
        role: "admin",
        average_rating: 0,
        total_ratings: 0,
        rating_distribution: {},
        ban_status: "none",
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      });

      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to create admin user");
      console.error("Error creating admin user:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-brand flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">Admin Setup</h1>
          <p className="text-muted-foreground mt-2">Create admin user document in Firestore</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Admin UID:</span> {ADMIN_UID}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Email:</span> admin@roombridge.com
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Password:</span> Admin@123
            </p>
          </div>

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-primary">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">Admin user created successfully! Redirecting to login...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <Button
            onClick={createAdminUser}
            disabled={loading || success}
            variant="action"
            size="lg"
            className="w-full"
          >
            {loading ? "Creating Admin User..." : success ? "Admin User Created!" : "Create Admin User"}
          </Button>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>This will create a user document in Firestore with:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>Admin role</li>
              <li>All verifications completed</li>
              <li>Full access to admin dashboard</li>
            </ul>
          </div>
        </div>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/login")}
            disabled={loading}
          >
            Go to Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;
