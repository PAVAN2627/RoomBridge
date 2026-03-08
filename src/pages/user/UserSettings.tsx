import UserDashboardLayout from "@/components/UserDashboardLayout";
import { Button } from "@/components/ui/button";

const UserSettings = () => {
  return (
    <UserDashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-5">
          <h2 className="font-display text-xl font-bold text-foreground">Account Settings</h2>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
            <input type="email" defaultValue="user@example.com" className="w-full px-4 py-2.5 rounded-lg bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Phone</label>
            <input type="tel" defaultValue="+91 9876543210" className="w-full px-4 py-2.5 rounded-lg bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <Button variant="brand" size="default">Update Account</Button>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-5">
          <h2 className="font-display text-xl font-bold text-foreground">Notification Preferences</h2>
          <div className="space-y-3">
            {["New match notifications", "Message alerts", "Room request responses", "Platform updates"].map((pref) => (
              <label key={pref} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border text-primary focus:ring-ring" />
                <span className="text-sm text-foreground">{pref}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-destructive/20 p-6 shadow-card">
          <h2 className="font-display text-xl font-bold text-destructive mb-2">Danger Zone</h2>
          <p className="text-sm text-muted-foreground mb-4">Permanently delete your account and all associated data.</p>
          <Button variant="destructive" size="sm">Delete Account</Button>
        </div>
      </div>
    </UserDashboardLayout>
  );
};

export default UserSettings;
