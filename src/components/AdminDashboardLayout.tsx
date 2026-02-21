import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShieldCheck, LayoutDashboard, Users, Home, FileText,
  CheckSquare, MessageCircle, Star, Flag, Settings, LogOut, Menu, Bell
} from "lucide-react";
import { useState } from "react";
import { signOut } from "@/lib/firebase/auth";
import { useToast } from "@/hooks/use-toast";

const adminMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard Overview", to: "/admin" },
  { icon: Users, label: "Users", to: "/admin/users" },
  { icon: Home, label: "Listings", to: "/admin/listings" },
  { icon: FileText, label: "Room Requests", to: "/admin/requests" },
  { icon: CheckSquare, label: "Verification Docs", to: "/admin/verifications" },
  { icon: MessageCircle, label: "Reported Chats", to: "/admin/reported-chats" },
  { icon: Star, label: "Reviews", to: "/admin/reviews" },
  { icon: Flag, label: "Reports & Flags", to: "/admin/reports" },
  { icon: Settings, label: "Settings", to: "/admin/settings" },
];

const AdminDashboardLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pageTitle = adminMenuItems.find((item) => item.to === location.pathname)?.label || "Admin";

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Admin Sidebar — darker violet */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ background: "linear-gradient(180deg, hsl(263 70% 28%) 0%, hsl(263 70% 20%) 100%)" }}
      >
        {/* Logo */}
        <div className="p-5 flex items-center gap-2 border-b border-primary-foreground/10">
          <div className="w-9 h-9 rounded-lg bg-primary-foreground/15 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-display text-lg font-bold text-primary-foreground block leading-tight">RoomMatch</span>
            <span className="text-[10px] text-secondary font-semibold uppercase tracking-wider">Admin Panel</span>
          </div>
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
                {item.label === "Reports & Flags" && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-secondary text-primary-foreground text-[10px] font-bold flex items-center justify-center">3</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-primary-foreground/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/8 w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
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
            <button className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-secondary border-2 border-background" />
            </button>
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-primary-foreground text-sm font-bold">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminDashboardLayout;
