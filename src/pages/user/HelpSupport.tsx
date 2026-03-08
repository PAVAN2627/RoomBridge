import { useState } from "react";
import UserDashboardLayout from "@/components/UserDashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, ChevronUp, HelpCircle, MessageCircle, Flag, BookOpen, Mail, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

const FAQ_ITEMS = [
  {
    question: "How do I find a room on RoomBridge?",
    answer:
      "Go to 'Browse Listings' from your dashboard. You can filter by city, budget and listing type. Click on any room card to see full details, then click 'Contact Owner' to start a chat.",
  },
  {
    question: "How do I post my room?",
    answer:
      "Click 'Post Listing' from the sidebar. Fill in the room details including photos, rent, deposit, and preferences. Once published your listing will be visible to all users.",
  },
  {
    question: "What is an Emergency Request?",
    answer:
      "An Emergency Room Request is for people who need accommodation urgently within 1–7 days. These are shown at the top with an urgent badge so owners can respond quickly.",
  },
  {
    question: "How does the rating system work?",
    answer:
      "After interacting with a room owner or tenant, you can rate them (1–5 stars) with a written review from their profile page or from the listing/request detail dialog. Ratings are public and help build trust.",
  },
  {
    question: "How do I edit or delete my listing/request?",
    answer:
      "Go to 'My Listings' or 'My Requests'. Each card has Edit and Delete buttons. Editing opens the pre-filled form so you can update details.",
  },
  {
    question: "How do I report a suspicious user?",
    answer:
      "Click 'Report User' in the sidebar. Enter their User ID, choose the type of issue, describe what happened, and optionally upload screenshots as proof. Our admin team reviews all reports.",
  },
  {
    question: "Is my personal information safe?",
    answer:
      "Yes. We only show your name and profile photo publicly. Phone and email are only shared when you initiate a chat. We use Firebase Authentication and Firestore security rules to protect your data.",
  },
  {
    question: "What happens after I report someone?",
    answer:
      "Our admin team reviews the report, contacts the reported user if needed, and may suspend or ban the account if the report is valid. You will not be notified of the outcome but action will be taken on valid reports.",
  },
];

const HelpSupport = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({ subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      toast({ title: "Fill in all fields", variant: "destructive" });
      return;
    }
    setSending(true);
    // Simulate sending (no backend wired for generic help yet)
    await new Promise((r) => setTimeout(r, 1200));
    setSending(false);
    toast({ title: "Message sent!", description: "Our team will get back to you within 24 hours." });
    setContactForm({ subject: "", message: "" });
  };

  return (
    <UserDashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Quick actions */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div
            onClick={() => navigate("/dashboard/report")}
            className="bg-card rounded-xl border border-destructive/20 p-5 shadow-card cursor-pointer hover:border-destructive/50 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center mb-3">
              <Flag className="w-5 h-5 text-destructive" />
            </div>
            <h3 className="font-semibold text-foreground text-sm mb-1">Report a User</h3>
            <p className="text-xs text-muted-foreground">Report scams, fake identities or harassment</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground text-sm mb-1">FAQs</h3>
            <p className="text-xs text-muted-foreground">Answers to common questions below ↓</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mb-3">
              <Mail className="w-5 h-5 text-accent-foreground" />
            </div>
            <h3 className="font-semibold text-foreground text-sm mb-1">Contact Support</h3>
            <p className="text-xs text-muted-foreground">Use the form below to reach us</p>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-card">
          <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2 mb-5">
            <HelpCircle className="w-5 h-5 text-primary" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="border border-border rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-sm font-medium text-foreground pr-4">{item.question}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 pt-1 bg-muted/20">
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact form */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-card">
          <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2 mb-1">
            <MessageCircle className="w-5 h-5 text-primary" />
            Contact Support
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            Can't find an answer above? Send us a message and we'll respond within 24 hours.
          </p>
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Subject</label>
              <input
                type="text"
                value={contactForm.subject}
                onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                placeholder="e.g. Problem with a listing, Account issue"
                className="w-full px-4 py-2.5 rounded-lg bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Message</label>
              <textarea
                rows={4}
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                placeholder="Describe your issue or question in detail..."
                className="w-full px-4 py-2.5 rounded-lg bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
            <Button type="submit" variant="action" disabled={sending}>
              {sending ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </div>
      </div>
    </UserDashboardLayout>
  );
};

export default HelpSupport;
