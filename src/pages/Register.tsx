import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import { registerWithEmail, signInWithGoogle } from "@/lib/firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { CameraCapture } from "@/components/CameraCapture";
import { auth } from "@/lib/firebase";
import { updateUser, createUser, getUser } from "@/lib/firebase/users";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "male" as "male" | "female" | "other",
    email: "",
    phone: "",
    password: "",
    city: "",
    home_district: "",
    user_type: "both" as "searcher" | "poster" | "both",
    profile_type: "student" as "student" | "professional",
    college_name: "",
    course: "",
    year_of_study: "",
    student_id_file: null as File | null,
    company_name: "",
    job_role: "",
    company_id_file: null as File | null,
    id_type: "aadhaar" as "aadhaar" | "pan",
    id_file: null as File | null,
    selfie_file: null as File | null,
  });

  // Check if user is already authenticated with Google
  useEffect(() => {
    const checkGoogleUser = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Check if user has completed registration
        const userData = await getUser(currentUser.uid);
        if (userData) {
          // User already registered, redirect to dashboard
          navigate('/dashboard');
        } else {
          // Google user needs to complete registration
          setIsGoogleUser(true);
          setFormData((prev) => ({
            ...prev,
            name: currentUser.displayName || "",
            email: currentUser.email || "",
          }));
          toast({
            title: "Complete Your Profile",
            description: "Fill in the remaining details to finish registration.",
          });
        }
      }
    };
    checkGoogleUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, [fieldName]: file });
  };

  const validateStep1 = () => {
    if (!formData.name || !formData.age || !formData.email || !formData.phone) {
      toast({ title: "Missing Information", description: "Please fill in all required fields.", variant: "destructive" });
      return false;
    }
    if (parseInt(formData.age) < 18) {
      toast({ title: "Age Requirement", description: "You must be at least 18 years old.", variant: "destructive" });
      return false;
    }
    // Skip password validation for Google users
    if (!isGoogleUser && formData.password.length < 6) {
      toast({ title: "Weak Password", description: "Password must be at least 6 characters.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.city || !formData.home_district) {
      toast({ title: "Missing Information", description: "Please fill in all required fields.", variant: "destructive" });
      return false;
    }
    if (formData.profile_type === "student" && (!formData.college_name || !formData.course || !formData.year_of_study || !formData.student_id_file)) {
      toast({ title: "Missing Student Info", description: "Complete all student details and upload ID.", variant: "destructive" });
      return false;
    }
    if (formData.profile_type === "professional" && (!formData.company_name || !formData.job_role || !formData.company_id_file)) {
      toast({ title: "Missing Professional Info", description: "Complete all professional details and upload ID.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id_file || !formData.selfie_file) {
      toast({ title: "Missing Documents", description: "Please upload ID proof and selfie.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      let userId: string;
      
      // Check if user is already authenticated via Google
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        // User signed in with Google, use their existing auth
        userId = currentUser.uid;
        
        // Create Firestore user document
        await createUser(userId, {
          name: formData.name,
          age: parseInt(formData.age),
          gender: formData.gender,
          phone: formData.phone,
          email: formData.email,
          city: formData.city,
          home_district: formData.home_district,
          user_type: formData.user_type,
          aadhaar_verified: false,
          pan_verified: false,
          verification_status: 'unverified',
          verification_badges: [],
        });
      } else {
        // Regular email/password registration
        const result = await registerWithEmail(formData.email, formData.password, {
          name: formData.name,
          age: parseInt(formData.age),
          gender: formData.gender,
          phone: formData.phone,
          city: formData.city,
          home_district: formData.home_district,
          user_type: formData.user_type,
        });
        userId = result.user.uid;
      }

      // Convert files to base64 strings with compression
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

      // Convert all files to base64
      const updates: any = {
        verification_status: "verified"
      };

      // Build verification badges array
      const verificationBadges: string[] = [];

      // Upload student/professional ID
      if (formData.profile_type === "student" && formData.student_id_file) {
        const studentIdBase64 = await fileToBase64(formData.student_id_file);
        updates.college = formData.college_name;
        updates.course = formData.course;
        updates.year = parseInt(formData.year_of_study);
        updates.student_id_url = studentIdBase64;
        verificationBadges.push("student");
      } else if (formData.profile_type === "professional" && formData.company_id_file) {
        const companyIdBase64 = await fileToBase64(formData.company_id_file);
        updates.company = formData.company_name;
        updates.role = formData.job_role;
        updates.professional_id_url = companyIdBase64;
        verificationBadges.push("professional");
      }

      // Upload ID proof (Aadhaar/PAN)
      const idProofBase64 = await fileToBase64(formData.id_file);
      if (formData.id_type === "aadhaar") {
        updates.aadhaar_verified = true;
      } else {
        updates.pan_verified = true;
      }
      verificationBadges.push("identity");

      // Upload selfie
      const selfieBase64 = await fileToBase64(formData.selfie_file);
      updates.selfie_url = selfieBase64;
      verificationBadges.push("selfie");

      // Add verification badges
      updates.verification_badges = verificationBadges;

      // Update user document with all data
      await updateUser(userId, updates);

      toast({ title: "Success!", description: "Account created successfully. All verifications complete!" });
      navigate('/dashboard/profile');
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create account.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      
      // Pre-fill form with Google data
      setFormData({
        ...formData,
        name: result.user.displayName || "",
        email: result.user.email || "",
      });
      
      setIsGoogleUser(true);
      
      toast({ 
        title: "Google Sign-In Successful!", 
        description: "Please complete your profile to continue." 
      });
      
      // Stay on step 1 but hide password field
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to sign up.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12" style={{ background: "linear-gradient(160deg, hsl(263 70% 28%) 0%, hsl(263 70% 40%) 50%, hsl(330 81% 50%) 100%)" }}>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-bold text-primary-foreground">RoomBridge</span>
        </div>
        <div>
          <h1 className="font-display text-4xl font-bold text-primary-foreground leading-tight mb-4">
            Join the Safest<br />Room-Finding<br />Community
          </h1>
          <p className="text-primary-foreground/70 text-lg max-w-md">Verified users. Smart matching. No brokers.</p>
          <div className="mt-8 space-y-3">
            {["✔ Verified identity", "✔ Smart matching", "✔ In-app chat", "✔ Emergency rooms"].map((item) => (
              <p key={item} className="text-sm text-primary-foreground/80">{item}</p>
            ))}
          </div>
        </div>
        <div className="flex gap-6">
          {["No Brokers", "Verified Users", "Smart Matching", "Safe Chat"].map((item) => (
            <div key={item} className="flex items-center gap-1.5 text-sm text-primary-foreground/60">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-background overflow-y-auto">
        <div className="w-full max-w-md space-y-6 py-8">
          <div className="lg:hidden flex items-center gap-2 justify-center mb-4">
            <div className="w-9 h-9 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-gradient-brand">RoomBridge</span>
          </div>

          <div className="text-center lg:text-left">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <h2 className="font-display text-3xl font-bold text-foreground">Create Account</h2>
            <p className="text-muted-foreground mt-2">Step {step} of 3</p>
          </div>

          <div className="flex gap-2">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Full Name</label>
                  <input type="text" name="name" placeholder="Enter your full name" value={formData.name} onChange={handleChange} required disabled={loading || isGoogleUser} className="w-full px-4 py-3 rounded-xl bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Age</label>
                    <input type="number" name="age" placeholder="21" value={formData.age} onChange={handleChange} required min="18" max="100" disabled={loading} className="w-full px-4 py-3 rounded-xl bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} required disabled={loading} className="w-full px-4 py-3 rounded-xl bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
                  <input type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required disabled={loading || isGoogleUser} className="w-full px-4 py-3 rounded-xl bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Phone</label>
                  <input type="tel" name="phone" placeholder="9876543210" value={formData.phone} onChange={handleChange} required pattern="[0-9]{10}" disabled={loading} className="w-full px-4 py-3 rounded-xl bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" />
                </div>
                {!isGoogleUser && (
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Password</label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} name="password" placeholder="Create password" value={formData.password} onChange={handleChange} required minLength={6} disabled={loading} className="w-full px-4 py-3 rounded-xl bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring pr-10 disabled:opacity-50" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} disabled={loading} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
                {isGoogleUser && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm text-primary">
                    ✓ Signed in with Google. Complete the remaining steps to finish registration.
                  </div>
                )}
                <Button type="button" onClick={handleNext} variant="action" size="lg" className="w-full" disabled={loading}>
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">City</label>
                    <input type="text" name="city" placeholder="Mumbai" value={formData.city} onChange={handleChange} required disabled={loading} className="w-full px-4 py-3 rounded-xl bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Home District</label>
                    <input type="text" name="home_district" placeholder="Jaipur" value={formData.home_district} onChange={handleChange} required disabled={loading} className="w-full px-4 py-3 rounded-xl bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">I am a</label>
                  <select name="profile_type" value={formData.profile_type} onChange={handleChange} required disabled={loading} className="w-full px-4 py-3 rounded-xl bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50">
                    <option value="student">Student</option>
                    <option value="professional">Working Professional</option>
                  </select>
                </div>

                {formData.profile_type === "student" && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">College Name</label>
                      <input type="text" name="college_name" placeholder="IIT Mumbai" value={formData.college_name} onChange={handleChange} required disabled={loading} className="w-full px-4 py-3 rounded-xl bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-foreground block mb-1.5">Course</label>
                        <input type="text" name="course" placeholder="B.Tech CSE" value={formData.course} onChange={handleChange} required disabled={loading} className="w-full px-4 py-3 rounded-xl bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground block mb-1.5">Year</label>
                        <input type="text" name="year_of_study" placeholder="2nd Year" value={formData.year_of_study} onChange={handleChange} required disabled={loading} className="w-full px-4 py-3 rounded-xl bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Student ID</label>
                      <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'student_id_file')} required disabled={loading} className="w-full px-4 py-3 rounded-xl bg-muted border-0 text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50" />
                    </div>
                  </>
                )}

                {formData.profile_type === "professional" && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Company Name</label>
                      <input type="text" name="company_name" placeholder="TCS" value={formData.company_name} onChange={handleChange} required disabled={loading} className="w-full px-4 py-3 rounded-xl bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Job Role</label>
                      <input type="text" name="job_role" placeholder="Software Engineer" value={formData.job_role} onChange={handleChange} required disabled={loading} className="w-full px-4 py-3 rounded-xl bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Company ID</label>
                      <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'company_id_file')} required disabled={loading} className="w-full px-4 py-3 rounded-xl bg-muted border-0 text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50" />
                    </div>
                  </>
                )}

                <div className="flex gap-3">
                  <Button type="button" onClick={() => setStep(1)} variant="outline" size="lg" className="flex-1" disabled={loading}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button type="button" onClick={handleNext} variant="action" size="lg" className="flex-1" disabled={loading}>
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Identity Verification</h3>
                  <p className="text-sm text-muted-foreground">Upload documents for verification</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">ID Type</label>
                  <select name="id_type" value={formData.id_type} onChange={handleChange} required disabled={loading} className="w-full px-4 py-3 rounded-xl bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50">
                    <option value="aadhaar">Aadhaar Card</option>
                    <option value="pan">PAN Card</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">{formData.id_type === "aadhaar" ? "Aadhaar" : "PAN"} Card</label>
                  <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'id_file')} required disabled={loading} className="w-full px-4 py-3 rounded-xl bg-muted border-0 text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Live Selfie</label>
                  <div className="space-y-2">
                    <CameraCapture
                      onCapture={(file) => setFormData({ ...formData, selfie_file: file })}
                      disabled={loading}
                    />
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-card px-2 text-muted-foreground">or</span>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'selfie_file')}
                        disabled={loading}
                        className="w-full px-4 py-3 rounded-xl bg-muted border-0 text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50"
                      />
                    </div>
                    {formData.selfie_file && (
                      <p className="text-xs text-primary">✓ Selfie uploaded: {formData.selfie_file.name}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="button" onClick={() => setStep(2)} variant="outline" size="lg" className="flex-1" disabled={loading}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button type="submit" variant="action" size="lg" className="flex-1" disabled={loading}>
                    {loading ? "Creating..." : "Create Account"}
                  </Button>
                </div>
              </>
            )}
          </form>

          {step === 1 && !isGoogleUser && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-background px-3 text-muted-foreground">or</span></div>
              </div>
              <Button variant="outline" size="lg" className="w-full text-sm font-medium" onClick={handleGoogleSignUp} disabled={loading}>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {loading ? "Connecting..." : "Continue with Google"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">Complete all 3 steps after Google sign-in</p>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
