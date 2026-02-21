import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminSetup from "./pages/AdminSetup";

// User Dashboard
import Dashboard from "./pages/Dashboard";
import BrowseListings from "./pages/user/BrowseListings";
import RoomRequests from "./pages/user/RoomRequests";
import PostListing from "./pages/user/PostListing";
import PostRoomRequest from "./pages/user/PostRoomRequest";
import Messages from "./pages/user/Messages";
import MyRatings from "./pages/user/MyRatings";
import ProfileVerification from "./pages/user/ProfileVerification";
import UserSettings from "./pages/user/UserSettings";

// Admin Dashboard
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminListings from "./pages/admin/AdminListings";
import AdminRequests from "./pages/admin/AdminRequests";
import AdminVerifications from "./pages/admin/AdminVerifications";
import AdminReportedChats from "./pages/admin/AdminReportedChats";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin-setup" element={<AdminSetup />} />

          {/* User Dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/browse" element={<ProtectedRoute><BrowseListings /></ProtectedRoute>} />
          <Route path="/dashboard/requests" element={<ProtectedRoute><RoomRequests /></ProtectedRoute>} />
          <Route path="/dashboard/post" element={<ProtectedRoute><PostListing /></ProtectedRoute>} />
          <Route path="/dashboard/post-request" element={<ProtectedRoute><PostRoomRequest /></ProtectedRoute>} />
          <Route path="/dashboard/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/dashboard/ratings" element={<ProtectedRoute><MyRatings /></ProtectedRoute>} />
          <Route path="/dashboard/profile" element={<ProtectedRoute><ProfileVerification /></ProtectedRoute>} />
          <Route path="/dashboard/settings" element={<ProtectedRoute><UserSettings /></ProtectedRoute>} />

          {/* Admin Dashboard */}
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/listings" element={<ProtectedRoute requireAdmin><AdminListings /></ProtectedRoute>} />
          <Route path="/admin/requests" element={<ProtectedRoute requireAdmin><AdminRequests /></ProtectedRoute>} />
          <Route path="/admin/verifications" element={<ProtectedRoute requireAdmin><AdminVerifications /></ProtectedRoute>} />
          <Route path="/admin/reported-chats" element={<ProtectedRoute requireAdmin><AdminReportedChats /></ProtectedRoute>} />
          <Route path="/admin/reviews" element={<ProtectedRoute requireAdmin><AdminReviews /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute requireAdmin><AdminReports /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><AdminSettings /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
