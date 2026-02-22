import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Settings, Sparkles, Shield, MessageCircle, Bell, Clock, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { expireEmergencyRequests, sendExpirationWarnings } from "@/lib/firebase/autoExpiration";

const AdminSettings = () => {
  const { toast } = useToast();
  const [expiringRequests, setExpiringRequests] = useState(false);
  const [sendingWarnings, setSendingWarnings] = useState(false);

  const handleExpireRequests = async () => {
    setExpiringRequests(true);
    try {
      const count = await expireEmergencyRequests();
      toast({
        title: "Success",
        description: `Expired ${count} emergency request${count !== 1 ? 's' : ''}`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to expire requests",
        variant: "destructive",
      });
    } finally {
      setExpiringRequests(false);
    }
  };

  const handleSendWarnings = async () => {
    setSendingWarnings(true);
    try {
      const count = await sendExpirationWarnings();
      toast({
        title: "Success",
        description: `Sent ${count} expiration warning${count !== 1 ? 's' : ''}`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to send warnings",
        variant: "destructive",
      });
    } finally {
      setSendingWarnings(false);
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 rounded-2xl blur-xl" />
          <div className="relative bg-card/80 backdrop-blur-sm border rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg"
              >
                <Settings className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
                  Platform Settings
                  <Sparkles className="w-5 h-5 text-blue-500" />
                </h2>
                <p className="text-sm text-muted-foreground">Configure system-wide settings and features</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Settings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 rounded-2xl blur-xl" />
          <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-6 shadow-2xl space-y-6">
            
            {/* Numeric Settings */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                <label className="text-sm font-semibold text-foreground block mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  Auto-Expire Emergency Requests (days)
                </label>
                <input 
                  type="number" 
                  defaultValue={3} 
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" 
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="text-sm font-semibold text-foreground block mb-2 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-orange-500" />
                  Reports Before Auto-Block
                </label>
                <input 
                  type="number" 
                  defaultValue={3} 
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all" 
                />
              </motion.div>
            </div>

            {/* Toggle Settings */}
            <div className="space-y-3 pt-2">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Feature Toggles</p>
              {[
                { label: "Allow unverified users to post listings", icon: Shield, color: "violet" },
                { label: "Enable emergency room feature", icon: Bell, color: "orange" },
                { label: "Enable in-app chat", icon: MessageCircle, color: "blue" },
                { label: "Enable rating system", icon: Sparkles, color: "yellow" }
              ].map((setting, index) => (
                <motion.label
                  key={setting.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + index * 0.05 }}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-muted/50 transition-all group"
                >
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      defaultChecked 
                      className="w-5 h-5 rounded border-border text-primary focus:ring-2 focus:ring-primary/50 transition-all" 
                    />
                  </div>
                  <setting.icon className={`w-4 h-4 text-${setting.color}-500 flex-shrink-0`} />
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors">{setting.label}</span>
                </motion.label>
              ))}
            </div>

            {/* Save Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="pt-2"
            >
              <Button variant="brand" size="default" className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Help & Support Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-2xl blur-xl" />
          <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">Auto-Expiration Controls</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Manually trigger auto-expiration checks for emergency room requests.
            </p>
            <div className="flex gap-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={expiringRequests}
                  onClick={handleExpireRequests}
                >
                  {expiringRequests ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Expiring...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Expire Old Requests
                    </>
                  )}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={sendingWarnings}
                  onClick={handleSendWarnings}
                >
                  {sendingWarnings ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4 mr-2" />
                      Send Warnings
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Help & Support Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl blur-xl" />
          <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">Help & Support</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Need assistance? Contact the development team or check the documentation.
            </p>
            <div className="flex gap-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" size="sm">
                  View Documentation
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" size="sm">
                  Contact Support
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminSettings;
