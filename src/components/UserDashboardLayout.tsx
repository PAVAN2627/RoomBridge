import { ReactNode, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Shield, LayoutDashboard, Search, FileText, PlusCircle,
  MessageCircle, Star, User, LogOut, Menu, Bell, HandHelping, List, Flag, HelpCircle
} from "lucide-react";
import { signOut } from "@/lib/firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ChatSessionDocument } from "@/lib/firebase/types";
import { getUser } from "@/lib/firebase/users";
import { AIChatbot } from "@/components/AIChatbot";

const LS_KEY = "rb_chat_seen"; // localStorage key: { [chatId]: milliseconds }

function getSeenMap(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
}
function saveSeenMap(map: Record<string, number>) {
  localStorage.setItem(LS_KEY, JSON.stringify(map));
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard Overview", to: "/dashboard" },
  { icon: Search, label: "Browse Listings", to: "/dashboard/browse" },
  { icon: FileText, label: "Room Requests", to: "/dashboard/requests" },
  { icon: List, label: "My Listings", to: "/dashboard/my-listings" },
  { icon: List, label: "My Requests", to: "/dashboard/my-requests" },
  { icon: PlusCircle, label: "Post Listing", to: "/dashboard/post" },
  { icon: HandHelping, label: "Post Room Request", to: "/dashboard/post-request" },
  { icon: MessageCircle, label: "Messages", to: "/dashboard/messages" },
  { icon: Star, label: "My Ratings", to: "/dashboard/ratings" },
  { icon: User, label: "Profile", to: "/dashboard/profile" },
  { icon: Flag, label: "Report User", to: "/dashboard/report" },
  { icon: HelpCircle, label: "Help & Support", to: "/dashboard/help" },
];

interface UnreadChat {
  chat_id: string;
  preview: string;
  otherName: string;
  at: number; // millis
}

const UserDashboardLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userData } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadChats, setUnreadChats] = useState<UnreadChat[]>([]);
  const bellRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const initials = userData?.name
    ? userData.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  const pageTitle = menuItems.find((item) => item.to === location.pathname)?.label || "Dashboard";

  // When navigating to Messages, mark all chats seen
  useEffect(() => {
    if (location.pathname === "/dashboard/messages") {
      const seen = getSeenMap();
      unreadChats.forEach((c) => { seen[c.chat_id] = Date.now(); });
      saveSeenMap(seen);
      setUnreadChats([]);
    }
  }, [location.pathname]);

  // Close bell and profile dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Real-time chats listener for unread message notifications
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "chats"),
      where("participant_ids", "array-contains", user.uid),
      orderBy("last_message_at", "desc")
    );
    const unsub = onSnapshot(q, async (snap) => {
      const seen = getSeenMap();
      const unread: UnreadChat[] = [];
      for (const docSnap of snap.docs) {
        const chat = docSnap.data() as ChatSessionDocument;
        if (!chat.last_message_sender_id) continue;
        if (chat.last_message_sender_id === user.uid) continue; // own message
        const msgAt = chat.last_message_at?.toMillis?.() ?? 0;
        const seenAt = seen[chat.chat_id] ?? 0;
        if (msgAt <= seenAt) continue; // already seen
        const otherUserId = chat.participant_ids.find((id) => id !== user.uid)!;
        let otherName = "Someone";
        try {
          const u = await getUser(otherUserId);
          if (u) otherName = u.full_name || u.username || "Someone";
        } catch { /* ignore */ }
        unread.push({
          chat_id: chat.chat_id,
          preview: chat.last_message_preview || "Sent you a message",
          otherName,
          at: msgAt,
        });
      }
      setUnreadChats(unread);
    });
    return () => unsub();
  }, [user]);

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

      {/* Sidebar — darker violet matching admin */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ background: "linear-gradient(180deg, hsl(263 70% 28%) 0%, hsl(263 70% 20%) 100%)" }}
      >
        {/* Logo + Sign Out */}
        <div className="p-4 border-b border-primary-foreground/10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-primary-foreground/15 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-display text-lg font-bold text-primary-foreground block leading-tight">RoomBridge</span>
              <span className="text-[10px] text-secondary font-semibold uppercase tracking-wider">User Panel</span>
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
          {menuItems.map((item) => {
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
              </Link>
            );
          })}
        </nav>

        {/* Bottom user profile card */}
        <div className="p-3 border-t border-primary-foreground/10">
          <Link
            to="/dashboard/profile"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary-foreground/10 hover:bg-primary-foreground/15 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary font-bold text-sm flex-shrink-0 overflow-hidden">
              {(userData as any)?.selfie_url
                ? <img src={(userData as any).selfie_url} alt="User" className="w-8 h-8 rounded-full object-cover" />
                : initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-primary-foreground truncate leading-tight">
                {userData?.name || "User"}
              </p>
              <p className="text-[10px] text-secondary font-medium uppercase tracking-wide capitalize">
                {(userData as any)?.user_type || "Member"}
              </p>
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
            {/* Notification Bell */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setBellOpen((p) => !p)}
                className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                {unreadChats.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] rounded-full bg-red-500 border-2 border-background flex items-center justify-center text-[9px] font-bold text-white px-0.5">
                    {unreadChats.length > 9 ? "9+" : unreadChats.length}
                  </span>
                )}
              </button>

              {/* Dropdown */}
              {bellOpen && (
                <div className="absolute right-0 top-11 w-80 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="text-sm font-semibold text-foreground">Notifications</span>
                    {unreadChats.length > 0 && (
                      <button
                        onClick={() => {
                          const seen = getSeenMap();
                          unreadChats.forEach((c) => { seen[c.chat_id] = Date.now(); });
                          saveSeenMap(seen);
                          setUnreadChats([]);
                          setBellOpen(false);
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  {unreadChats.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-40" />
                      <p className="text-sm text-muted-foreground">No new notifications</p>
                    </div>
                  ) : (
                    <ul className="max-h-72 overflow-y-auto divide-y divide-border">
                      {unreadChats.map((n) => (
                        <li key={n.chat_id}>
                          <button
                            onClick={() => {
                              const seen = getSeenMap();
                              seen[n.chat_id] = Date.now();
                              saveSeenMap(seen);
                              setUnreadChats((prev) => prev.filter((c) => c.chat_id !== n.chat_id));
                              setBellOpen(false);
                              navigate(`/dashboard/messages?chat=${n.chat_id}`);
                            }}
                            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/60 transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <MessageCircle className="w-4 h-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-foreground truncate">{n.otherName}</p>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{n.preview}</p>
                            </div>
                            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="px-4 py-2.5 border-t border-border">
                    <button
                      onClick={() => { setBellOpen(false); navigate("/dashboard/messages"); }}
                      className="w-full text-xs text-center text-primary hover:underline"
                    >
                      View all messages →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar + Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((p) => !p)}
                className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold border-2 border-primary/30 hover:border-primary transition-colors flex-shrink-0"
                title={userData?.name || "Profile"}
              >
                {userData?.selfie_url ? (
                  <img src={userData.selfie_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center text-white text-xs font-bold">
                    {initials}
                  </span>
                )}
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-11 w-52 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold text-foreground truncate">{userData?.name || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email || ""}</p>
                  </div>
                  {/* Actions */}
                  <div className="py-1">
                    <Link
                      to="/dashboard/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted/60 transition-colors"
                    >
                      <User className="w-4 h-4 text-muted-foreground" />
                      Profile
                    </Link>
                    <button
                      onClick={() => { setProfileOpen(false); handleLogout(); }}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>

      {/* AI Chatbot */}
      <AIChatbot />
    </div>
  );
};

export default UserDashboardLayout;
