import { useState, useEffect } from "react";
import UserDashboardLayout from "@/components/UserDashboardLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Camera, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { updateUser } from "@/lib/firebase/users";
import { useToast } from "@/hooks/use-toast";

const ProfileVerification = () => {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "male" as "male" | "female" | "other",
    phone: "",
    city: "",
    home_district: "",
    college: "",
    course: "",
    company: "",
    role: "",
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || "",
        age: userData.age?.toString() || "",
        gender: userData.gender || "male",
        phone: userData.phone || "",
        city: userData.city || "",
        home_district: userData.home_district || "",
        college: userData.college || "",
        course: userData.course || "",
        company: userData.company || "",
        role: userData.role || "",
      });

      // Load selfie preview if available
      if (userData.selfie_url) {
        setSelfiePreview(userData.selfie_url);
      }
    }
  }, [userData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await updateUser(user.uid, {
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        phone: formData.phone,
        city: formData.city,
        home_district: formData.home_district,
        college: formData.college || "",
        course: formData.course || "",
        company: formData.company || "",
        role: formData.role || "",
      });

      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      // Convert to base64 with compression
      const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const base64 = reader.result as string;
            // Check if image is too large (>500KB base64 = ~375KB original)
            if (base64.length > 500000) {
              // Compress the image
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Resize if too large
                const maxDimension = 1024;
                if (width > maxDimension || height > maxDimension) {
                  if (width > height) {
                    height = (height / width) * maxDimension;
                    width = maxDimension;
                  } else {
                    width = (width / height) * maxDimension;
                    height = maxDimension;
                  }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                
                // Convert to JPEG with quality 0.7
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                resolve(compressedBase64);
              };
              img.onerror = reject;
              img.src = base64;
            } else {
              resolve(base64);
            }
          };
          reader.onerror = error => reject(error);
        });
      };

      const photoBase64 = await fileToBase64(file);
      setSelfiePreview(photoBase64);

      await updateUser(user.uid, { selfie_url: photoBase64 });

      toast({
        title: "Photo Updated",
        description: "Your profile photo has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload photo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getVerificationStatus = (badge: string) => {
    if (!userData) return "not_started";
    if (userData.verification_badges?.includes(badge)) return "verified";
    if (userData.verification_status === "pending") return "pending";
    return "not_started";
  };

  const verificationItems = [
    { label: "Student Verified", badge: "student", show: !!userData?.college },
    { label: "Professional Verified", badge: "professional", show: !!userData?.company },
    { label: "ID Verified", badge: "identity", show: true },
    { label: "Live Photo Verified", badge: "selfie", show: true },
  ];

  if (!userData) {
    return (
      <UserDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </UserDashboardLayout>
    );
  }

  return (
    <UserDashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile Form */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-5">
          <h2 className="font-display text-xl font-bold text-foreground">Profile Information</h2>

          <div className="flex items-center gap-4 mb-2">
            {selfiePreview ? (
              <img
                src={selfiePreview}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-2 border-primary"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-brand flex items-center justify-center text-primary-foreground text-2xl font-bold">
                {formData.name.charAt(0).toUpperCase() || "U"}
              </div>
            )}
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploading}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload">
                <Button variant="brand-outline" size="sm" disabled={uploading} asChild>
                  <span className="cursor-pointer">
                    {uploading ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 mr-1" />
                    )}
                    Change Photo
                  </span>
                </Button>
              </label>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {userData.college && (
              <>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">College Name</label>
                  <input
                    type="text"
                    name="college"
                    value={formData.college}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Course</label>
                  <input
                    type="text"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </>
            )}
            {userData.company && (
              <>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Company Name</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Job Role</label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </>
            )}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Current City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Home Village / District</label>
              <input
                type="text"
                name="home_district"
                value={formData.home_district}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <Button
            variant="action"
            size="lg"
            className="w-full"
            onClick={handleSaveProfile}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Profile"
            )}
          </Button>
        </div>
      </div>
    </UserDashboardLayout>
  );
};

export default ProfileVerification;
