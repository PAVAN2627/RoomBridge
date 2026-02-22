import { useState, useEffect } from "react";
import UserDashboardLayout from "@/components/UserDashboardLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { createRoomRequest } from "@/lib/firebase/roomRequests";
import { Timestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { geocodeLocation } from "@/lib/geocoding";

const PostRoomRequest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;

  const [loading, setLoading] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(!!editId);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    required_date: "",
    duration: "1_month",
    budget_min: "",
    budget_max: "",
    city: "",
    location: "",
    gender_preference: "any",
    request_type: "normal",
  });

  // Load existing request data if in edit mode
  useEffect(() => {
    if (!editId) return;
    const fetchRequest = async () => {
      try {
        const docSnap = await getDoc(doc(db, "room_requests", editId));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            title: data.title || "",
            description: data.description || "",
            required_date: data.required_date?.toDate
              ? data.required_date.toDate().toISOString().split("T")[0]
              : "",
            duration: data.duration || "1_month",
            budget_min: String(data.budget_min || ""),
            budget_max: String(data.budget_max || ""),
            city: data.city || "",
            location: data.location || "",
            gender_preference: data.preferences?.gender_preference || "any",
            request_type: data.request_type || "normal",
          });
        } else {
          toast({ title: "Error", description: "Request not found", variant: "destructive" });
          navigate("/dashboard/my-requests");
        }
      } catch (err) {
        console.error(err);
        toast({ title: "Error", description: "Failed to load request", variant: "destructive" });
      } finally {
        setLoadingEdit(false);
      }
    };
    fetchRequest();
  }, [editId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Auto-set request_type based on duration
    if (name === "duration") {
      const emergencyDurations = ["1_day", "2_days", "3_days", "4_days", "5_days", "6_days", "7_days"];
      const isEmergency = emergencyDurations.includes(value);
      setFormData({ 
        ...formData, 
        [name]: value,
        request_type: isEmergency ? "emergency" : "normal"
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to post a room request",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title || !formData.city || !formData.budget_min || !formData.budget_max) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const budgetMin = parseInt(formData.budget_min);
    const budgetMax = parseInt(formData.budget_max);

    if (budgetMin > budgetMax) {
      toast({
        title: "Invalid Budget",
        description: "Minimum budget cannot be greater than maximum budget",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Geocode the location to get coordinates
      let latitude = 0;
      let longitude = 0;
      
      try {
        const locationToGeocode = formData.location || formData.city;
        const coordinates = await geocodeLocation(locationToGeocode, formData.city);
        if (coordinates) {
          latitude = coordinates.latitude;
          longitude = coordinates.longitude;
        }
      } catch (geoError) {
        console.error("Geocoding error:", geoError);
        // Continue without coordinates - not a critical error
      }

      // Calculate needed_from and needed_until for type compatibility
      const neededFrom = formData.required_date
        ? Timestamp.fromDate(new Date(formData.required_date))
        : Timestamp.now();
      const durationDays: Record<string, number> = {
        "1_day": 1, "2_days": 2, "3_days": 3, "4_days": 4, "5_days": 5,
        "6_days": 6, "7_days": 7, "1_month": 30, "3_months": 90,
        "6_months": 180, "12_months": 365,
      };
      const days = durationDays[formData.duration] || 30;
      const neededUntil = Timestamp.fromMillis(neededFrom.toMillis() + days * 24 * 60 * 60 * 1000);

      const requestData = {
        title: formData.title,
        description: formData.description || "",
        request_type: formData.request_type as "normal" | "emergency",
        needed_from: neededFrom,
        needed_until: neededUntil,
        duration: formData.duration,
        budget_min: budgetMin,
        budget_max: budgetMax,
        city: formData.city,
        location: formData.location || formData.city,
        latitude,
        longitude,
        preferences: {
          gender_preference: formData.gender_preference as "any" | "male" | "female",
        },
      };

      if (isEditMode && editId) {
        await updateDoc(doc(db, "room_requests", editId), {
          ...requestData,
          updated_at: Timestamp.now(),
        });
        toast({
          title: "Success!",
          description: "Your room request has been updated successfully",
        });
        navigate("/dashboard/my-requests");
      } else {
        await createRoomRequest(user.uid, requestData);
        toast({
          title: "Success!",
          description: "Your room request has been posted successfully",
        });
        navigate("/dashboard/requests");
      }
    } catch (error: any) {
      console.error("Error creating room request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create room request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserDashboardLayout>
      <div className="max-w-xl mx-auto">
        {loadingEdit ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-4 shadow-card space-y-4">
          <div>
            <h2 className="font-display text-base font-bold text-foreground mb-0.5">
              {isEditMode ? "Edit Room Request" : "I Need a Room"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isEditMode ? "Update your room requirement details." : "Post your requirement so room owners can find you."}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">What are you looking for? *</label>
              <input 
                type="text" 
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Room near BITS Pilani for exam" 
                required
                disabled={loading}
                className="w-full px-3 py-2 rounded-lg bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" 
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Required Date</label>
                <input 
                  type="date" 
                  name="required_date"
                  value={formData.required_date}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" 
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Duration *</label>
                <select 
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                >
                  <optgroup label="Emergency (1-7 days)">
                    <option value="1_day">1 Day</option>
                    <option value="2_days">2 Days</option>
                    <option value="3_days">3 Days</option>
                    <option value="4_days">4 Days</option>
                    <option value="5_days">5 Days</option>
                    <option value="6_days">6 Days</option>
                    <option value="7_days">7 Days (1 Week)</option>
                  </optgroup>
                  <optgroup label="Long-term">
                    <option value="1_month">1 Month</option>
                    <option value="3_months">3 Months</option>
                    <option value="6_months">6 Months</option>
                    <option value="12_months">12 Months</option>
                  </optgroup>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Min Budget (₹) *</label>
                <input 
                  type="number" 
                  name="budget_min"
                  value={formData.budget_min}
                  onChange={handleChange}
                  placeholder="e.g. 5000" 
                  required
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" 
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Max Budget (₹) *</label>
                <input 
                  type="number" 
                  name="budget_max"
                  value={formData.budget_max}
                  onChange={handleChange}
                  placeholder="e.g. 8000" 
                  required
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" 
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">City *</label>
                <input 
                  type="text" 
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Kota" 
                  required
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" 
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Preferred Gender</label>
                <select 
                  name="gender_preference"
                  value={formData.gender_preference}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                >
                  <option value="any">Any</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Specific Location (Optional)</label>
              <input 
                type="text" 
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Near Coaching Center, Railway Station" 
                disabled={loading}
                className="w-full px-3 py-2 rounded-lg bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" 
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Additional Details</label>
              <textarea 
                rows={2} 
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Any preferences for roommate, hometown match, etc." 
                disabled={loading}
                className="w-full px-3 py-2 rounded-lg bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none disabled:opacity-50" 
              />
            </div>

            {["1_day", "2_days", "3_days", "4_days", "5_days", "6_days", "7_days"].includes(formData.duration) && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  <strong>Emergency Request:</strong> This request will be marked as urgent and will expire after {formData.duration.replace("_", " ")}.
                </p>
              </div>
            )}
          </div>

          <Button type="submit" variant="action" size="sm" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditMode ? "Saving..." : "Posting..."}
              </>
            ) : (
              isEditMode ? "Save Changes" : "Post Room Request"
            )}
          </Button>
        </form>
        )}
      </div>
    </UserDashboardLayout>
  );
};

export default PostRoomRequest;
