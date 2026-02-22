import { useState, useEffect } from "react";
import UserDashboardLayout from "@/components/UserDashboardLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Upload, X, Home, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, addDoc, Timestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { geocodeLocation } from "@/lib/geocoding";

const PostListing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;

  const [loading, setLoading] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(!!editId);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    listing_type: "long_term",
    room_type: "1rk",
    rent_amount: "",
    deposit_amount: "",
    location: "",
    city: "",
    description: "",
    gender_preference: "any",
    furnishing: "furnished",
    amenities: [] as string[],
    available_from: "",
  });

  // Load existing listing data if in edit mode
  useEffect(() => {
    if (!editId) return;
    const fetchListing = async () => {
      try {
        const docSnap = await getDoc(doc(db, "listings", editId));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            title: data.title || "",
            listing_type: data.listing_type || "long_term",
            room_type: data.room_type || "1rk",
            rent_amount: String(data.rent_amount || ""),
            deposit_amount: String(data.deposit_amount || ""),
            location: data.location || "",
            city: data.city || "",
            description: data.description || "",
            gender_preference: data.preferences?.gender_preference || "any",
            furnishing: data.preferences?.furnishing || "furnished",
            amenities: data.amenities || [],
            available_from: data.available_from?.toDate
              ? data.available_from.toDate().toISOString().split("T")[0]
              : "",
          });
          if (data.images && data.images.length > 0) {
            setExistingImages(data.images);
          }
        } else {
          toast({ title: "Error", description: "Listing not found", variant: "destructive" });
          navigate("/dashboard/my-listings");
        }
      } catch (err) {
        console.error(err);
        toast({ title: "Error", description: "Failed to load listing", variant: "destructive" });
      } finally {
        setLoadingEdit(false);
      }
    };
    fetchListing();
  }, [editId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (images.length + existingImages.length + files.length > 5) {
      toast({
        title: "Too many images",
        description: "You can upload maximum 5 images",
        variant: "destructive",
      });
      return;
    }

    // Check file sizes
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast({
        title: "File too large",
        description: "Each image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setImages([...images, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to post a listing",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title || !formData.rent_amount || !formData.deposit_amount || !formData.location || !formData.city || !formData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // In create mode require at least one image; in edit mode existing images count
    if (images.length === 0 && existingImages.length === 0) {
      toast({
        title: "Photo Required",
        description: "Please upload at least one photo of the room",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Convert images to base64
      const imageBase64Array: string[] = [];
      for (const file of images) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const result = reader.result as string;
            // Compress if needed
            if (result.length > 500000) {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
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
                resolve(canvas.toDataURL('image/jpeg', 0.7));
              };
              img.onerror = reject;
              img.src = result;
            } else {
              resolve(result);
            }
          };
          reader.onerror = reject;
        });
        imageBase64Array.push(base64);
      }

      // Geocode the location to get coordinates
      let latitude = 0;
      let longitude = 0;
      
      try {
        const coordinates = await geocodeLocation(formData.location, formData.city);
        if (coordinates) {
          latitude = coordinates.latitude;
          longitude = coordinates.longitude;
        }
      } catch (geoError) {
        console.error("Geocoding error:", geoError);
        // Continue without coordinates - not a critical error
      }

      // Create listing document
      const listingData = {
        poster_id: user.uid,
        title: formData.title,
        description: formData.description,
        listing_type: formData.listing_type,
        room_type: formData.room_type,
        rent_amount: parseInt(formData.rent_amount),
        deposit_amount: parseInt(formData.deposit_amount),
        available_from: formData.available_from ? Timestamp.fromDate(new Date(formData.available_from)) : Timestamp.now(),
        location: formData.location,
        city: formData.city,
        latitude,
        longitude,
        amenities: formData.amenities,
        preferences: {
          gender_preference: formData.gender_preference,
          furnishing: formData.furnishing,
        },
        images: [...existingImages, ...imageBase64Array],
        updated_at: Timestamp.now(),
      };

      if (isEditMode && editId) {
        await updateDoc(doc(db, "listings", editId), listingData);
        toast({
          title: "Success!",
          description: "Your listing has been updated successfully",
        });
        navigate("/dashboard/my-listings");
      } else {
        await addDoc(collection(db, "listings"), {
          ...listingData,
          status: "active",
          created_at: Timestamp.now(),
        });
        toast({
          title: "Success!",
          description: "Your listing has been published successfully",
        });
        navigate("/dashboard/browse");
      }
    } catch (error: any) {
      console.error("Error creating listing:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create listing",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserDashboardLayout>
      <div className="max-w-2xl mx-auto py-6">
        {loadingEdit ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
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
              Loading listing details...
            </motion.p>
          </motion.div>
        ) : (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          onSubmit={handleSubmit}
          className="relative"
        >
          {/* Gradient background effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl blur-2xl -z-10" />
          
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-2xl overflow-hidden">
            {/* Header with gradient */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10 p-6 border-b border-border/50"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg"
                >
                  <Home className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                    {isEditMode ? "Edit Listing" : "Post a Room Listing"}
                    <Sparkles className="w-5 h-5 text-violet-500" />
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {isEditMode ? "Update the details of your listing." : "Fill in details to list your room for students and professionals."}
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="p-6 space-y-6">
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-5"
                >
                {/* Listing Title */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <label className="text-sm font-semibold text-foreground block mb-2 flex items-center gap-2">
                    Listing Title
                    <span className="text-destructive">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Spacious Room near IIT Gate" 
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all disabled:opacity-50" 
                  />
                </motion.div>

                {/* Listing Type and Room Type */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="grid sm:grid-cols-2 gap-4"
                >
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2 flex items-center gap-2">
                      Listing Type
                      <span className="text-destructive">*</span>
                    </label>
                    <select 
                      name="listing_type"
                      value={formData.listing_type}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all disabled:opacity-50"
                    >
                      <option value="long_term">Long-Term Rental</option>
                      <option value="pg">PG Accommodation</option>
                      <option value="flatmate">Flatmate Replacement</option>
                      <option value="short_stay">Short Stay (1-3 days)</option>
                      <option value="emergency">Emergency Availability</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2 flex items-center gap-2">
                      Room Type
                      <span className="text-destructive">*</span>
                    </label>
                    <select 
                      name="room_type"
                      value={formData.room_type}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all disabled:opacity-50"
                    >
                      <option value="1rk">1 RK</option>
                      <option value="1bhk">1 BHK</option>
                      <option value="2bhk">2 BHK</option>
                      <option value="3bhk">3 BHK</option>
                      <option value="4bhk">4 BHK</option>
                      <option value="studio">Studio</option>
                      <option value="shared">Shared Room</option>
                      <option value="single">Single Room</option>
                    </select>
                  </div>
                </motion.div>

                {/* Rent and Deposit */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 }}
                  className="grid sm:grid-cols-2 gap-4"
                >
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2 flex items-center gap-2">
                      Monthly Rent (₹)
                      <span className="text-destructive">*</span>
                    </label>
                    <input 
                      type="number" 
                      name="rent_amount"
                      value={formData.rent_amount}
                      onChange={handleChange}
                      placeholder="e.g. 6500" 
                      required
                      disabled={loading}
                      className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all disabled:opacity-50" 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2 flex items-center gap-2">
                      Deposit Amount (₹)
                      <span className="text-destructive">*</span>
                    </label>
                    <input 
                      type="number" 
                      name="deposit_amount"
                      value={formData.deposit_amount}
                      onChange={handleChange}
                      placeholder="e.g. 13000" 
                      required
                      disabled={loading}
                      className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all disabled:opacity-50" 
                    />
                  </div>
                </motion.div>

                {/* Location and City */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="grid sm:grid-cols-2 gap-4"
                >
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2 flex items-center gap-2">
                      Location
                      <span className="text-destructive">*</span>
                    </label>
                    <input 
                      type="text" 
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g. Powai" 
                      required
                      disabled={loading}
                      className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all disabled:opacity-50" 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2 flex items-center gap-2">
                      City
                      <span className="text-destructive">*</span>
                    </label>
                    <input 
                      type="text" 
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g. Mumbai" 
                      required
                      disabled={loading}
                      className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all disabled:opacity-50" 
                    />
                  </div>
                </motion.div>

                {/* Description */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 }}
                >
                  <label className="text-sm font-semibold text-foreground block mb-2 flex items-center gap-2">
                    Description
                    <span className="text-destructive">*</span>
                  </label>
                  <textarea 
                    rows={4} 
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the room, amenities, nearby landmarks..." 
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all resize-none disabled:opacity-50" 
                  />
                </motion.div>

                {/* Preferences */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="grid sm:grid-cols-3 gap-4"
                >
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2">Gender Preference</label>
                    <select 
                      name="gender_preference"
                      value={formData.gender_preference}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all disabled:opacity-50"
                    >
                      <option value="any">Any</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2">Furnishing</label>
                    <select 
                      name="furnishing"
                      value={formData.furnishing}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all disabled:opacity-50"
                    >
                      <option value="furnished">Furnished</option>
                      <option value="semi-furnished">Semi-Furnished</option>
                      <option value="unfurnished">Unfurnished</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2">Available From</label>
                    <input 
                      type="date" 
                      name="available_from"
                      value={formData.available_from}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all disabled:opacity-50" 
                    />
                  </div>
                </motion.div>

                {/* Image Upload */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55 }}
                >
                  <label className="text-sm font-semibold text-foreground block mb-2 flex items-center gap-2">
                    Room Photos
                    <span className="text-destructive">*</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {isEditMode ? "(Add more or remove existing)" : "(Minimum 1 required)"}
                    </span>
                  </label>
                  <div className="space-y-3">
                    {/* Existing images (edit mode) */}
                    {existingImages.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Current photos:</p>
                        <div className="grid grid-cols-3 gap-3">
                          {existingImages.map((src, index) => (
                            <div key={index} className="relative group">
                              <img src={src} alt={`Existing ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                              <button
                                type="button"
                                onClick={() => removeExistingImage(index)}
                                className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* New image previews */}
                    {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className={`border-2 border-dashed rounded-lg p-4 text-center ${!isEditMode && images.length === 0 && existingImages.length === 0 ? 'border-destructive/50 bg-destructive/5' : 'border-border'}`}>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        disabled={loading || (images.length + existingImages.length) >= 5}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <Upload className={`w-5 h-5 mx-auto mb-1 ${!isEditMode && images.length === 0 && existingImages.length === 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                        <p className={`text-sm ${!isEditMode && images.length === 0 && existingImages.length === 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                          {!isEditMode && images.length === 0 && existingImages.length === 0
                            ? 'At least one photo is required'
                            : 'Click to upload more images'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Max 5 images, 5MB each</p>
                      </label>
                    </div>
                  </div>
                </motion.div>
                </motion.div>
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button type="submit" className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/30" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isEditMode ? "Saving..." : "Publishing..."}
                    </>
                  ) : (
                    isEditMode ? "Save Changes" : "Publish Listing"
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.form>
        )}
      </div>
    </UserDashboardLayout>
  );
};

export default PostListing;
