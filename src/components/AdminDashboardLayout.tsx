import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShieldCheck, LayoutDashboard, Users, Home, FileText,
  Star, Flag, UserCircle, LogOut, Menu, Bell, MapPin
} from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { signOut } from "@/lib/firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const adminMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard Overview", to: "/admin" },
  { icon: Users, label: "Users", to: "/admin/users" },
  { icon: Home, label: "Listings", to: "/admin/listings" },
  { icon: FileText, label: "Room Requests", to: "/admin/requests" },
  { icon: Star, label: "Reviews", to: "/admin/reviews" },
  { icon: Flag, label: "Reports & Flags", to: "/admin/reports" },
  { icon: MapPin, label: "Geocoding Utility", to: "/admin/geocoding" },
  { icon: UserCircle, label: "Profile", to: "/admin/profile" },
];

const AdminDashboardLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userData } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingReports, setPendingReports] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);

  // Real-time pending reports count
  useEffect(() => {
    const q = query(collection(db, "reports"), where("status", "==", "pending"));
    const unsub = onSnapshot(q, (snap) => {
      setPendingReports(snap.size);
    });
    return () => unsub();
  }, []);

  const pageTitle = adminMenuItems.find((item) => item.to === location.pathname)?.label || "Admin";

  const handleLogout = async () => {
    try {
      await signOut();
      toast({ title: "Logged out", description: "You have been logged out successfully." });
      navigate("/");
    } catch {
      toast({ title: "Error", description: "Failed to log out. Please try again.", variant: "destructive" });
    }
  };

  const adminInitial = userData?.name?.charAt(0)?.toUpperCase() || "A";
  const adminPhoto = (userData as any)?.selfie_url || null;

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ background: "linear-gradient(180deg, hsl(263 70% 28%) 0%, hsl(263 70% 20%) 100%)" }}
      >
        {/* Logo + Sign Out */}
        <div className="p-4 border-b border-primary-foreground/10">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary-foreground/15 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-display text-lg font-bold text-primary-foreground block leading-tight">RoomBridge</span>
                <span className="text-[10px] text-secondary font-semibold uppercase tracking-wider">Admin Panel</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-semibold bg-destructive/15 text-destructive hover:bg-destructive hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {adminMenuItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary-foreground/15 text-primary-foreground shadow-sm"
                    : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/8"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-secondary" />
                )}
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.label === "Reports & Flags" && pendingReports > 0 && (
                  <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-secondary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {pendingReports}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom admin profile card */}
        <div className="p-3 border-t border-primary-foreground/10">
          <Link
            to="/admin/profile"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary-foreground/10 hover:bg-primary-foreground/15 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary font-bold text-sm flex-shrink-0 overflow-hidden">
              {adminPhoto
                ? <img src={adminPhoto} alt="Admin" className="w-8 h-8 rounded-full object-cover" />
                : adminInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-primary-foreground truncate leading-tight">
                {userData?.name || "Admin"}
              </p>
              <p className="text-[10px] text-secondary font-medium uppercase tracking-wide">Administrator</p>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-display font-bold text-lg text-foreground">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown((p) => !p)}
                className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                {pendingReports > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center border-2 border-background">
                    {pendingReports}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {showNotifDropdown && (
                <div
                  className="absolute right-0 top-12 w-72 bg-card rounded-xl border border-border shadow-2xl z-50 overflow-hidden"
                  onMouseLeave={() => setShowNotifDropdown(false)}
                >
                  <div className="p-3 border-b border-border flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Notifications</span>
                    {pendingReports > 0 && (
                      <span className="text-xs bg-destructive/10 text-destructive font-semibold px-2 py-0.5 rounded-full">
                        {pendingReports} pending
                      </span>
                    )}
                  </div>
                  {pendingReports === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No new notifications</p>
                  ) : (
                    <div>
                      <div className="px-4 py-3 flex items-start gap-3 hover:bg-muted/50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                          <Flag className="w-4 h-4 text-destructive" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {pendingReports} new report{pendingReports > 1 ? "s" : ""} submitted
                          </p>
                          <p className="text-xs text-muted-foreground">Requires your review</p>
                        </div>
                      </div>
                      <div className="p-3 border-t border-border">
                        <Link
                          to="/admin/reports"
                          onClick={() => setShowNotifDropdown(false)}
                          className="text-xs text-primary font-semibold hover:underline"
                        >
                          View all reports →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Admin avatar dropdown */}
            <div className="relative">
              <button
                onClick={() => { setShowAvatarDropdown((p) => !p); setShowNotifDropdown(false); }}
                className="focus:outline-none"
              >
                {adminPhoto ? (
                  <img src={adminPhoto} alt="Admin" className="w-9 h-9 rounded-full object-cover border-2 border-border hover:opacity-90 transition-opacity" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-primary-foreground text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity">
                    {adminInitial}
                  </div>
                )}
              </button>

              {showAvatarDropdown && (
                <div
                  className="absolute right-0 top-12 w-48 bg-card rounded-xl border border-border shadow-2xl z-50 overflow-hidden"
                  onMouseLeave={() => setShowAvatarDropdown(false)}
                >
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold text-foreground truncate">{userData?.name || "Admin"}</p>
                    <p className="text-xs text-muted-foreground truncate">{userData?.email || ""}</p>
                  </div>
                  <Link
                    to="/admin/profile"
                    onClick={() => setShowAvatarDropdown(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <UserCircle className="w-4 h-4 text-muted-foreground" />
                    Profile
                  </Link>
                  <button
                    onClick={() => { setShowAvatarDropdown(false); handleLogout(); }}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminDashboardLayout;
