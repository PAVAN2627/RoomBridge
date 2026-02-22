import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserDocument } from "@/lib/firebase/types";
import { getUser } from "@/lib/firebase/users";
import { Loader2, MapPin, Star, Lock, MessageCircle, GraduationCap, Briefcase, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { submitRating } from "@/lib/firebase/ratings";
import { findChatBetweenUsers } from "@/lib/firebase/chats";

interface UserProfileModalProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileModal({ userId, open, onOpenChange }: UserProfileModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userData, setUserData] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [ratingStars, setRatingStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);
  const [showIdProof, setShowIdProof] = useState(false);

  useEffect(() => {
    if (userId && open) {
      setLoading(true);
      setIsConnected(null);
      setRatingStars(0);
      setHoverStars(0);
      setReviewText("");
      setRatingDone(false);
      setShowIdProof(false);
      // Load user data and check connection simultaneously
      const isOwnProfile = user?.uid === userId;
      Promise.all([
        getUser(userId),
        isOwnProfile || !user
          ? Promise.resolve(true)
          : findChatBetweenUsers(user.uid, userId).then((chat) => chat !== null),
      ])
        .then(([uData, connected]) => {
          setUserData(uData);
          setIsConnected(connected);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [userId, open]);

  const handleSubmitRating = async () => {
    if (!user || !userId || ratingStars === 0) return;
    setRatingSubmitting(true);
    try {
      console.log('Submitting rating:', { reviewer: user.uid, reviewee: userId, stars: ratingStars });
      await submitRating(user.uid, userId, ratingStars, reviewText || undefined);
      setRatingDone(true);
      console.log('Rating submitted successfully');
      toast({ title: "Rating submitted!", description: "Your review has been saved." });
    } catch (err: any) {
      console.error('Rating submission error:', err);
      toast({ title: "Error", description: err.message || "Failed to submit rating", variant: "destructive" });
    } finally {
      setRatingSubmitting(false);
    }
  };

  if (!userId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : userData ? (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-start gap-4">
              {userData.selfie_url ? (
                <img
                  src={userData.selfie_url}
                  alt={userData.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-brand flex items-center justify-center text-primary-foreground text-2xl font-bold">
                  {userData.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground">{userData.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {userData.age} years • {userData.gender}
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">
                  {userData.city}
                  {userData.home_district && ` • From ${userData.home_district}`}
                </span>
              </div>
            </div>

            {/* College / Company with ID proof — always shown */}
            <div className="bg-muted rounded-lg px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {userData.college ? (
                  <GraduationCap className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                ) : userData.company ? (
                  <Briefcase className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <GraduationCap className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground leading-none mb-0.5">
                    {userData.college ? "College" : userData.company ? "Company" : "College / Company"}
                  </p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {userData.college || userData.company || (
                      <span className="font-normal italic text-muted-foreground">Not provided</span>
                    )}
                    {userData.course && <span className="font-normal text-muted-foreground"> · {userData.course}</span>}
                    {userData.role && <span className="font-normal text-muted-foreground"> · {userData.role}</span>}
                  </p>
                </div>
              </div>

              {/* ID proof — gated by connection */}
              {isConnected ? (
                (() => {
                  const idUrl = userData.student_id_url || userData.professional_id_url;
                  return idUrl ? (
                    <div className="flex-shrink-0 space-y-2 text-right">
                      <button
                        type="button"
                        onClick={() => setShowIdProof((p) => !p)}
                        className="flex items-center gap-1 text-xs font-medium text-primary hover:underline whitespace-nowrap"
                      >
                        {showIdProof ? (
                          <><EyeOff className="w-3.5 h-3.5" /> Hide ID</>
                        ) : (
                          <><Eye className="w-3.5 h-3.5" /> View ID Proof</>
                        )}
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic flex-shrink-0">No ID uploaded</span>
                  );
                })()
              ) : (
                <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Locked</span>
                </div>
              )}
            </div>

            {/* ID proof — fullscreen overlay */}
            {isConnected && showIdProof && (userData.student_id_url || userData.professional_id_url) && (() => {
              const idUrl = (userData.student_id_url || userData.professional_id_url)!;
              return (
                <div
                  className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
                  onClick={() => setShowIdProof(false)}
                >
                  {/* Card — stop click propagation so clicking image doesn't close */}
                  <div
                    className="relative bg-background rounded-xl shadow-2xl overflow-hidden max-w-sm w-full mx-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Toolbar */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted">
                      <span className="text-sm font-semibold text-foreground">ID Proof</span>
                      <div className="flex items-center gap-3">
                        <a
                          href={idUrl}
                          download="id_proof"
                          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                          </svg>
                          Download
                        </a>
                      </div>
                    </div>
                    {/* Image */}
                    <div className="flex items-center justify-center p-4 bg-background">
                      <img
                        src={idUrl}
                        alt="ID Card"
                        className="max-h-72 w-auto rounded object-contain"
                      />
                    </div>
                    {/* Cancel button */}
                    <div className="px-4 pb-4">
                      <button
                        type="button"
                        onClick={() => setShowIdProof(false)}
                        className="w-full py-2 rounded-lg bg-muted text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Contact Info */}
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="text-sm font-medium text-foreground">Contact Information</div>
              {isConnected ? (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium text-foreground">Email:</span> {userData.email}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Phone:</span> {userData.phone}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      <span className="blur-sm select-none pointer-events-none font-medium text-foreground">
                        +91 ••••••••••
                      </span>
                      {" "}· Phone number hidden
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Email address hidden</span>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <MessageCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground">Privacy protection:</span> Phone number, email, and ID card are only visible after you have messaged this user. This keeps both parties safe.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Rating */}
            {userData.total_ratings > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-foreground font-medium">Rating:</span>
                <span className="text-primary font-bold">
                  {userData.average_rating.toFixed(1)} ⭐
                </span>
                <span className="text-muted-foreground">({userData.total_ratings} reviews)</span>
              </div>
            )}

            {/* Rate this user */}
            {user && user.uid !== userId && (
              <div className="border-t border-border pt-4">
                <p className="text-sm font-semibold text-foreground mb-3">
                  {ratingDone ? "✔ Rating Submitted" : "Rate this user"}
                </p>
                {!ratingDone ? (
                  <>
                    <div className="flex gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          onMouseEnter={() => setHoverStars(s)}
                          onMouseLeave={() => setHoverStars(0)}
                          onClick={() => setRatingStars(s)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`w-7 h-7 transition-colors ${
                              (hoverStars || ratingStars) >= s
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        </button>
                      ))}
                      {ratingStars > 0 && (
                        <span className="ml-2 self-center text-sm text-muted-foreground">
                          {["Terrible","Poor","Okay","Good","Excellent"][ratingStars - 1]}
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={2}
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Add a review (optional)"
                      className="w-full px-3 py-2 rounded-lg bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none mb-3"
                    />
                    <Button
                      variant="action"
                      size="sm"
                      disabled={ratingStars === 0 || ratingSubmitting}
                      onClick={handleSubmitRating}
                    >
                      {ratingSubmitting ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Star className="w-3 h-3 mr-1" />
                      )}
                      Submit Rating
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Thank you for your feedback!</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">User not found</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
