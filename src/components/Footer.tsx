import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold text-background">RoomBridge</span>
            </Link>
            <p className="text-sm text-background/60">
              India's first trust-first student room platform. Verified, safe, smart.
            </p>
          </div>
          {[
            {
              title: "Platform",
              links: [
                { label: "Browse Rooms", to: "/browse" },
                { label: "Post Room", to: "/post" },
                { label: "Room Requests", to: "/requests" },
              ],
            },
            {
              title: "Company",
              links: [
                { label: "About Us", to: "/about" },
                { label: "How It Works", to: "/how-it-works" },
                { label: "Contact", to: "/contact" },
              ],
            },
            {
              title: "Legal",
              links: [
                { label: "Privacy Policy", to: "/privacy" },
                { label: "Terms of Service", to: "/terms" },
              ],
            },
          ].map((group) => (
            <div key={group.title}>
              <h4 className="font-display font-semibold text-background mb-3">{group.title}</h4>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-background/60 hover:text-background transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-background/10 mt-10 pt-6 text-center">
          <p className="text-xs text-background/40">© 2026 RoomBridge. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
