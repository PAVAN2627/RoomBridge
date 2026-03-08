import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import FeaturesSection from "@/components/FeaturesSection";
import CategoriesSection from "@/components/CategoriesSection";
import MatchingPreview from "@/components/MatchingPreview";
import EmergencyBanner from "@/components/EmergencyBanner";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <FeaturesSection />
      <CategoriesSection />
      <MatchingPreview />
      <EmergencyBanner />
      <Footer />
    </div>
  );
};

export default Index;
