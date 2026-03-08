import { useState, useRef, useEffect, useCallback } from "react";
import UserDashboardLayout from "@/components/UserDashboardLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, UploadCloud, X, CheckCircle2, Flag, Search } from "lucide-react";
import { submitReport } from "@/lib/firebase/reports";
import { db } from "@/lib/firebase";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getUser } from "@/lib/firebase/users";
import { collection, query, where, limit, getDocs } from "firebase/firestore";
import { UserDocument } from "@/lib/firebase/types";

const REPORT_TYPES = [
  { value: "scam", label: "Scam / Fraud", description: "Asking money upfront or advance before showing room" },
  { value: "fake_identity", label: "Fake Identity", description: "Profile photo or information doesn't match real person" },
  { value: "broker", label: "Broker / Agent", description: "Posing as owner but is actually a paid broker" },
  { value: "harassment", label: "Harassment", description: "Abusive, threatening or inappropriate behavior" },
];

const ReportUser = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillId = searchParams.get("userId") || "";

  // User search state
  const [nameSearch, setNameSearch] = useState("");
  const [searchResults, setSearchResults] = useState<UserDocument[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDocument | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Form state
  const [reportType, setReportType] = useState("");
  const [description, setDescription] = useState("");
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [proofPreviews, setProofPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // If navigated with ?userId=, prefill by fetching name
  useEffect(() => {
    if (!prefillId) return;
    getUser(prefillId).then((u) => {
      if (u) setSelectedUser(u);
    }).catch(() => {});
  }, [prefillId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced name search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchUsers = useCallback(async (text: string) => {
    if (text.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setSearchLoading(true);
    try {
      // Capitalize first letter to match stored names
      const cap = text.charAt(0).toUpperCase() + text.slice(1);
      const q = query(
        collection(db, "users"),
        where("name", ">=", cap),
        where("name", "<=", cap + "\uf8ff"),
        limit(10)
      );
      const snap = await getDocs(q);
      const results = snap.docs
        .map((d) => ({ ...d.data(), user_id: d.id } as UserDocument))
        .filter((u) => u.user_id !== user?.uid);
      setSearchResults(results);
      setShowDropdown(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  }, [user?.uid]);

  const handleNameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNameSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchUsers(val), 400);
  };

  const handleSelectUser = (u: UserDocument) => {
    setSelectedUser(u);
    setNameSearch("");
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => f.type.startsWith("image/")).slice(0, 3 - proofFiles.length);
    if (!valid.length) return;
    setProofFiles((prev) => [...prev, ...valid]);
    setProofPreviews((prev) => [...prev, ...valid.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removeFile = (i: number) => {
    URL.revokeObjectURL(proofPreviews[i]);
    setProofFiles((prev) => prev.filter((_, j) => j !== i));
    setProofPreviews((prev) => prev.filter((_, j) => j !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedUser) return;
    if (!reportType) {
      toast({ title: "Select a reason", description: "Please choose what this report is about.", variant: "destructive" });
      return;
    }
    if (!description.trim()) {
      toast({ title: "Add details", description: "Please describe the issue so we can investigate.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Convert proof images to base64 (same as Register.tsx — avoids Storage CORS)
      const fileToBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const base64 = reader.result as string;
            if (base64.length > 500000) {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement("canvas");
                const scale = Math.min(1, Math.sqrt(500000 / base64.length));
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL("image/jpeg", 0.7));
              };
              img.onerror = reject;
              img.src = base64;
            } else {
              resolve(base64);
            }
          };
          reader.onerror = reject;
        });

      const evidenceUrls: string[] = await Promise.all(proofFiles.map(fileToBase64));

      await submitReport(
        user.uid,
        selectedUser.user_id,
        reportType as "fake_identity" | "broker" | "scam" | "harassment",
        description.trim(),
        evidenceUrls
      );
      setSubmitted(true);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to submit report.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <UserDashboardLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Report Submitted</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Our admin team will review your report against <strong>{selectedUser?.name}</strong> and take appropriate action.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="action" onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
            <Button variant="outline" onClick={() => {
              setSubmitted(false); setSelectedUser(null); setReportType("");
              setDescription(""); setProofFiles([]); setProofPreviews([]);
            }}>
              Submit Another
            </Button>
          </div>
        </div>
      </UserDashboardLayout>
    );
  }

  return (
    <UserDashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Warning */}
        <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-secondary mb-0.5">Reporting a user</p>
            <p className="text-xs text-muted-foreground">
              False reports are taken seriously and may result in action against your account. Only report genuine safety concerns.
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-6">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2 mb-1">
              <Flag className="w-5 h-5 text-secondary" />
              Report a User
            </h2>
            <p className="text-sm text-muted-foreground">Search by name, select the user, then describe the issue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1 — Select user */}
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">
                Step 1 — Who are you reporting? *
              </label>

              {selectedUser ? (
                /* Selected user card */
                <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/30 bg-primary/5">
                  {selectedUser.selfie_url ? (
                    <img src={selectedUser.selfie_url} alt={selectedUser.name}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/30 flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-brand flex items-center justify-center text-primary-foreground font-bold text-lg flex-shrink-0">
                      {selectedUser.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-base">{selectedUser.name}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                      {selectedUser.city && <span>📍 {selectedUser.city}</span>}
                      {selectedUser.college && <span>🎓 {selectedUser.college}</span>}
                      {selectedUser.company && <span>💼 {selectedUser.company}</span>}
                    </div>
                    {selectedUser.verification_badges?.length > 0 && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium mt-1 inline-block">✔ Verified</span>
                    )}
                  </div>
                  <button type="button" onClick={() => setSelectedUser(null)}
                    className="text-xs text-muted-foreground hover:text-foreground underline flex-shrink-0">
                    Change
                  </button>
                </div>
              ) : (
                /* Search input + dropdown */
                <div className="relative" ref={searchRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    {searchLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                    <input
                      type="text"
                      value={nameSearch}
                      onChange={handleNameInput}
                      onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                      placeholder="Type a name to search… e.g. Rahul"
                      autoComplete="off"
                      className="w-full pl-10 pr-10 py-3 rounded-xl bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">Type at least 2 characters to see matching users</p>

                  {/* Dropdown results */}
                  {showDropdown && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
                      {searchResults.length === 0 && !searchLoading ? (
                        <div className="px-4 py-3 text-sm text-muted-foreground">No users found for "{nameSearch}"</div>
                      ) : (
                        searchResults.map((u) => (
                          <button
                            key={u.user_id}
                            type="button"
                            onClick={() => handleSelectUser(u)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left border-b border-border/50 last:border-0"
                          >
                            {u.selfie_url ? (
                              <img src={u.selfie_url} alt={u.name}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                                {u.name.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-foreground truncate">{u.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {[u.city, u.college || u.company].filter(Boolean).join(" · ")}
                              </p>
                            </div>
                            {u.verification_badges?.length > 0 && (
                              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium flex-shrink-0">✔</span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Steps 2+ only shown once a user is selected */}
            {selectedUser && (
              <>
                {/* Step 2 — Report type */}
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-2">
                    Step 2 — What is this about? *
                  </label>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {REPORT_TYPES.map((rt) => (
                      <label key={rt.value}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          reportType === rt.value
                            ? "border-secondary bg-secondary/5"
                            : "border-border bg-muted/40 hover:border-muted-foreground/40"
                        }`}>
                        <input type="radio" name="report_type" value={rt.value}
                          checked={reportType === rt.value}
                          onChange={(e) => setReportType(e.target.value)}
                          className="mt-0.5 accent-secondary" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{rt.label}</p>
                          <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{rt.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Step 3 — Description */}
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-1.5">
                    Step 3 — Describe what happened *
                  </label>
                  <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide specific details — dates, what was said or done, any transaction IDs, etc."
                    disabled={loading}
                    className="w-full px-4 py-2.5 rounded-lg bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none disabled:opacity-50" />
                </div>

                {/* Step 4 — Proof */}
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-1.5">
                    Step 4 — Upload Proof (Optional, max 3)
                  </label>
                  {proofPreviews.length < 3 && (
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={loading}
                      className="w-full border-2 border-dashed border-border rounded-lg p-5 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors disabled:opacity-50">
                      <UploadCloud className="w-7 h-7" />
                      <span className="text-sm font-medium">Click to upload screenshots</span>
                      <span className="text-xs">PNG, JPG up to 5MB each</span>
                    </button>
                  )}
                  <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleFileAdd} className="hidden" />
                  {proofPreviews.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {proofPreviews.map((src, i) => (
                        <div key={i} className="relative w-24 h-24">
                          <img src={src} alt={`Proof ${i + 1}`} className="w-24 h-24 object-cover rounded-lg border border-border" />
                          <button type="button" onClick={() => removeFile(i)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/80">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button type="submit" variant="destructive" size="lg" className="w-full" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting Report...</>
                  ) : (
                    <><Flag className="w-4 h-4 mr-2" />Report {selectedUser.name} to Admin</>
                  )}
                </Button>
              </>
            )}
          </form>
        </div>
      </div>
    </UserDashboardLayout>
  );
};

export default ReportUser;
