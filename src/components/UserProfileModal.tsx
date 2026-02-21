import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserDocument } from "@/lib/firebase/types";
import { getUser } from "@/lib/firebase/users";
import { CheckCircle2, Loader2, MapPin, Briefcase, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserProfileModalProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileModal({ userId, open, onOpenChange }: UserProfileModalProps) {
  const [userData, setUserData] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId && open) {
      setLoading(true);
      getUser(userId)
        .then(setUserData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [userId, open]);

  if (!userId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
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
                <div className="flex flex-wrap gap-2 mt-2">
                  {userData.verification_badges?.map((badge) => (
                    <Badge key={badge} variant="default" className="text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {badge === "student"
                        ? "Student Verified"
                        : badge === "professional"
                        ? "Professional Verified"
                        : badge === "identity"
                        ? "ID Verified"
                        : badge}
                    </Badge>
                  ))}
                </div>
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

            {/* Student Info */}
            {userData.college && (
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <GraduationCap className="w-4 h-4" />
                  Student Information
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium text-foreground">College:</span> {userData.college}
                  </p>
                  {userData.course && (
                    <p>
                      <span className="font-medium text-foreground">Course:</span> {userData.course}
                    </p>
                  )}
                  {userData.year && (
                    <p>
                      <span className="font-medium text-foreground">Year:</span> {userData.year}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Professional Info */}
            {userData.company && (
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Briefcase className="w-4 h-4" />
                  Professional Information
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium text-foreground">Company:</span> {userData.company}
                  </p>
                  {userData.role && (
                    <p>
                      <span className="font-medium text-foreground">Role:</span> {userData.role}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Contact Info */}
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="text-sm font-medium text-foreground">Contact Information</div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <span className="font-medium text-foreground">Email:</span> {userData.email}
                </p>
                <p>
                  <span className="font-medium text-foreground">Phone:</span> {userData.phone}
                </p>
              </div>
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
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">User not found</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
