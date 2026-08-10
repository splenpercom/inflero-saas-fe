import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { 
  UtensilsCrossed, 
  Store, 
  Activity, 
  Building2,
  ArrowRight,
  Eye,
  Sparkles,
  Zap,
  Shield,
  Languages,
  Mail,
  Lock,
  PlayCircle,
  X
} from "lucide-react";
import { APP_LOGO_DARK } from "../lib/branding";
import { BrandLogo } from "./ui/BrandLogo";
import { RegistrationFlow } from "./RegistrationFlow";
import { Login } from "./Login";
import { Contacts } from "./Contacts";
import { useLanguage } from "../i18n/LanguageContext";
import { STORAGE_KEYS } from "../lib/storageKeys";
import { pickLang } from "../i18n/pickLang";
import { LanguageSwitcherDropdown } from "./LanguageSwitcherDropdown";

interface BusinessType {
  id: string;
  title: { az: string; en: string };
  description: { az: string; en: string };
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  demoPath?: string;
}

export function LandingPage() {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const [showRegistration, setShowRegistration] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>("");

  // Geolocation-based language detection
  useEffect(() => {
    const detectLocation = async () => {
      try {
        // Check if language preference is already saved
        const savedLanguage = localStorage.getItem(STORAGE_KEYS.language);
        if (savedLanguage) {
          return; // Don't override user's saved preference
        }

        // Try to detect location using IP-based geolocation API
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        
        // Set Azerbaijani if user is from Azerbaijan
        if (data.country_code === "AZ") {
          setLanguage("az");
        }
      } catch (error) {
        // Silently fail - default language will be used
      }
    };

    detectLocation();
  }, [setLanguage]);

  // Simple translation helper for landing page specific text
  const t = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const businessTypes: BusinessType[] = [
    {
      id: "corporate",
      title: { az: "Korporativ Biznes", en: "Corporate Business" },
      description: { az: "Təşkilatlar üçün korporativ həllər", en: "Enterprise solutions for organizations" },
      icon: Building2,
      color: "from-amber-400/80 to-amber-600/80",
      demoPath: "/corporate/dashboard",
    },
    {
      id: "restaurant",
      title: { az: "Restoran", en: "Restaurant" },
      description: { az: "Restoranlar və kafelər üçün tam POS sistemi", en: "Complete POS system for restaurants & cafes" },
      icon: UtensilsCrossed,
      color: "from-blue-400/80 to-blue-600/80",
      demoPath: "/dashboard",
    },
    {
      id: "shop",
      title: { az: "Mağaza", en: "Shop/Store" },
      description: { az: "Mağazalar üçün pərakəndə satış idarəetmə sistemi", en: "Retail management system for shops & stores" },
      icon: Store,
      color: "from-emerald-400/80 to-emerald-600/80",
    },
    {
      id: "gym",
      title: { az: "İdman Zalı/Xəstəxana", en: "Gym/Hospital" },
      description: { az: "İdman zalları, klinikalar və müəssisələr üçün idarəetmə", en: "Management for gyms, clinics & facilities" },
      icon: Activity,
      color: "from-purple-400/80 to-purple-600/80",
    },
  ];

  const handleSeeDemo = (type: BusinessType) => {
    if (type.demoPath) {
      navigate(type.demoPath);
    } else {
      alert(t(
        `${type.title.az} demo tezliklə!`,
        `${type.title.en} demo coming soon!`
      ));
    }
  };

  const handleStartNow = (type: BusinessType) => {
    if (type.id === "corporate") {
      setShowRegistration(true);
    } else {
      alert(t(
        `${type.title.az} üçün quraşdırma - Tezliklə!`,
        `Start setup for ${type.title.en} - Coming soon!`
      ));
    }
  };

  const handleWatchVideo = (typeId: string) => {
    setSelectedBusinessType(typeId);
    setShowVideoModal(true);
  };

  const getYoutubeVideoId = (typeId: string) => {
    // You can customize these YouTube video IDs for each business type
    const videoIds: { [key: string]: string } = {
      corporate: "dQw4w9WgXcQ", // Replace with actual video ID
      restaurant: "dQw4w9WgXcQ", // Replace with actual video ID
      shop: "dQw4w9WgXcQ", // Replace with actual video ID
      gym: "dQw4w9WgXcQ", // Replace with actual video ID
    };
    return videoIds[typeId] || "dQw4w9WgXcQ";
  };

  if (showRegistration) {
    return <RegistrationFlow onClose={() => setShowRegistration(false)} />;
  }

  if (showLogin) {
    return <Login onClose={() => setShowLogin(false)} />;
  }

  if (showContacts) {
    return <Contacts onClose={() => setShowContacts(false)} />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="relative z-20 px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <BrandLogo src={APP_LOGO_DARK} alt="Inflero" size="nav" />
          <div className="flex items-center gap-2 md:gap-3">
            <LanguageSwitcherDropdown variant="dark" />
            <button
              onClick={() => setShowContacts(true)}
              className="flex items-center gap-1.5 backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 px-3 md:px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-300 hover:scale-105"
            >
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">{t("Əlaqə", "Contact")}</span>
            </button>
            <button
              onClick={() => setShowLogin(true)}
              className="flex items-center gap-1.5 backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 px-3 md:px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-300 hover:scale-105"
            >
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">{t("Daxil ol", "Login")}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 min-h-[calc(100vh-80px)] py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              {t("Həllinizi", "Choose Your")} <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{t("Seçin", "Solution")}</span>
            </h1>
            <p className="text-xl text-white/80">
              {t("Biznesiniz üçün mükəmməl uyğunluğu seçin", "Select the perfect fit for your business")}
            </p>
          </div>

          {/* Business Type Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {businessTypes.map((type) => {
              const Icon = type.icon;
              const isRestaurant = type.id === "restaurant";
              const isShop = type.id === "shop";
              const isGym = type.id === "gym";
              const isLocked = isRestaurant || isShop || isGym;
              
              return (
                <div
                  key={type.id}
                  className={`group relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl overflow-hidden transition-all duration-300 ${
                    isLocked ? "opacity-75" : "hover:bg-white/15 hover:scale-[1.02] hover:border-white/30"
                  }`}
                >
                  {/* Lock Overlay for Restaurant, Shop, and Gym */}
                  {(isRestaurant || isShop || isGym) && (
                    <div className="absolute inset-0 z-10 backdrop-blur-[2px] bg-black/40 flex items-center justify-center">
                      <div className="text-center px-6">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center">
                          <Lock className="w-10 h-10 text-white" />
                        </div>
                        <p className="text-2xl font-bold text-white mb-2">
                          {t("Tezliklə", "Coming Soon")}
                        </p>
                        <p className="text-sm text-white/70">
                          {t("Bu xidmət hazırlanır", "This service is under development")}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${type.color} opacity-0 ${!isLocked && "group-hover:opacity-20"} transition-opacity duration-300`}></div>
                  
                  {/* Card Content */}
                  <div className="relative p-8">
                    {/* Icon and Title */}
                    <div className="flex items-start gap-5 mb-6">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${type.color} backdrop-blur-sm flex items-center justify-center shadow-lg`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-3xl font-bold text-white mb-2">
                          {type.title[language]}
                        </h2>
                        <p className="text-sm text-white/60 uppercase tracking-wider font-medium">
                          {t("Peşəkar Həll", "Professional Solution")}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-white/80 mb-8 text-lg leading-relaxed">
                      {type.description[language]}
                    </p>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => !isLocked && handleSeeDemo(type)}
                          disabled={isLocked}
                          className={`flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r ${type.color} backdrop-blur-sm text-white rounded-xl font-semibold transition-all duration-300 ${"  "}${
                            isLocked ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105"
                          }`}
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-sm">{t("Demo-ya bax", "See Demo")}</span>
                        </button>
                        <button
                          onClick={() => !isLocked && handleStartNow(type)}
                          disabled={isLocked}
                          className={`flex-1 flex items-center justify-center gap-2 px-5 py-3.5 backdrop-blur-xl bg-white/10 border border-white/30 text-white rounded-xl font-semibold transition-all duration-300 ${
                            isLocked ? "opacity-50 cursor-not-allowed" : "hover:bg-white/20 hover:scale-105"
                          }`}
                        >
                          <ArrowRight className="w-4 h-4" />
                          <span className="text-sm">{t("Qeydiyyat", "Register")}</span>
                        </button>
                      </div>
                      <button
                        onClick={() => handleWatchVideo(type.id)}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3.5 backdrop-blur-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-white rounded-xl font-semibold transition-all duration-300 hover:bg-purple-500/30 hover:scale-105"
                      >
                        <PlayCircle className="w-5 h-5" />
                        <span>{t("Təqdimatı İzlə", "Watch Presentation")}</span>
                      </button>
                    </div>
                  </div>

                  {/* Glow Effect on Hover */}
                  {!isLocked && (
                    <div className={`absolute -inset-0.5 bg-gradient-to-r ${type.color} opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300 -z-10`}></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {showVideoModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowVideoModal(false)}
        >
          <div 
            className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 z-50 flex items-center justify-center w-10 h-10 text-white bg-red-500/90 backdrop-blur-sm rounded-full font-semibold shadow-lg hover:bg-red-600 transition-all hover:scale-110"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${getYoutubeVideoId(selectedBusinessType)}?autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;