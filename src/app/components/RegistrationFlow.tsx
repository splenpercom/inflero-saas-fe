import { useState } from "react";
import { useNavigate } from "react-router";
import { useLanguage } from "../i18n/LanguageContext";
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Building2,
  Users,
  MapPin,
  Phone,
  Mail,
  User,
  Crown,
  Zap,
  X,
  AlertCircle
} from "lucide-react";
import { AppBrandLogo } from "./ui/AppBrandLogo";

interface Package {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  recommended?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

interface RegistrationData {
  package?: string;
  billingPeriod?: "monthly" | "annual";
  branches?: number;
  businessName?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  address?: string;
  countryCode?: string;
}

interface RegistrationFlowProps {
  onClose: () => void;
}

export function RegistrationFlow({ onClose }: RegistrationFlowProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<RegistrationData>({
    billingPeriod: "monthly", // Default to monthly
    package: "corporate", // Auto-select corporate
    countryCode: "+994" // Default to Azerbaijan
  });
  const [validationError, setValidationError] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Phone number formatting function
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, '');
    
    // Limit to 9 digits
    const limitedDigits = digitsOnly.slice(0, 9);
    
    // Format as XX-XXX-XX-XX
    let formatted = '';
    if (limitedDigits.length > 0) {
      formatted = limitedDigits.slice(0, 2);
      if (limitedDigits.length > 2) {
        formatted += '-' + limitedDigits.slice(2, 5);
      }
      if (limitedDigits.length > 5) {
        formatted += '-' + limitedDigits.slice(5, 7);
      }
      if (limitedDigits.length > 7) {
        formatted += '-' + limitedDigits.slice(7, 9);
      }
    }
    return formatted;
  };

  const packages: Package[] = [
    {
      id: "starter",
      name: "Starter Plan",
      price: "99",
      period: "month",
      icon: Zap,
      features: [
        "Up to 3 branches",
        "Basic POS system",
        "Menu management",
        "Order tracking",
        "Customer database",
        "Basic reports",
        "Email support",
      ],
    },
    {
      id: "professional",
      name: "Professional Plan",
      price: "299",
      period: "month",
      icon: Crown,
      recommended: true,
      features: [
        "Unlimited branches",
        "Advanced POS system",
        "Full menu management",
        "Real-time analytics",
        "Customer loyalty program",
        "Advanced reports & insights",
        "Delivery integration",
        "Staff management",
        "Priority support",
        "Custom branding",
      ],
    },
  ];

  const branchOptions = [1, 2, 3, 4, 5, 6];

  const handleNext = () => {
    setValidationError(""); // Clear any previous errors

    if (step === 1 && !formData.package) {
      setValidationError("Zəhmət olmasa paket seçin");
      return;
    }
    if (step === 2 && !formData.branches) {
      setValidationError("Zəhmət olmasa filial sayını seçin");
      return;
    }
    if (step === 3) {
      if (!formData.businessName || !formData.ownerName) {
        setValidationError("Zəhmət olmasa bütün məcburi sahələri doldurun");
        return;
      }
    }
    if (step === 4) {
      if (!formData.email || !formData.phone) {
        setValidationError("Zəhmət olmasa bütün məcburi sahələri doldurun");
        return;
      }
    }
    
    if (step < 5) {
      setStep(step + 1);
    } else {
      // Complete registration
      setShowSuccessModal(true);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setValidationError(""); // Clear validation errors when going back
    }
  };

  const handleBillingPeriodChange = (period: "monthly" | "annual") => {
    setFormData({ ...formData, billingPeriod: period, package: "corporate" });
  };

  const handleCloseSuccess = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseSuccess}></div>
          <div className="relative z-10 max-w-md w-full backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-400/50 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/50">
                <Check className="w-10 h-10 text-white" />
              </div>
              
              <h3 className="text-3xl font-bold text-white mb-3">
                Müraciət Qəbul Edildi!
              </h3>
              
              <p className="text-white/80 text-lg mb-8 leading-relaxed">
                Müraciətiniz uğurla qəbul edildi. Ən qısa zamanda sizinlə əlaqə saxlayacağıq.
              </p>
              
              <button
                onClick={handleCloseSuccess}
                className="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105"
              >
                Bağla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      <div className="min-h-screen relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/30 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse delay-700"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-screen py-12 px-4">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <AppBrandLogo onDarkBackground size="auth" />
              <button
                onClick={onClose}
                className="backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 rounded-xl p-2 transition-all duration-300"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-12">
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-white">
                    Addım {step} / 5
                  </span>
                  <span className="text-sm text-white/60">
                    {Math.round((step / 5) * 100)}% Tamamlandı
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out"
                    style={{ width: `${(step / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Step Content */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 mb-8">
              {/* Validation Error */}
              {validationError && (
                <div className="mb-6 backdrop-blur-xl bg-red-500/20 border border-red-400/50 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span className="text-red-300 font-medium">{validationError}</span>
                </div>
              )}

              {/* Step 1: Package Selection */}
              {step === 1 && (
                <div>
                  <h2 className="text-4xl font-bold text-white mb-3 text-center">
                    Korporativ Qeydiyyat
                  </h2>
                  <p className="text-white/70 text-lg mb-8 text-center">
                    Filial sayına görə ödəniş planını seçin
                  </p>

                  {/* Billing Period Switcher */}
                  <div className="flex justify-center mb-8">
                    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-1.5 inline-flex">
                      <button
                        onClick={() => handleBillingPeriodChange("monthly")}
                        className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 ${
                          formData.billingPeriod === "monthly"
                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                            : "text-white/70 hover:text-white"
                        }`}
                      >
                        Aylıq
                      </button>
                      <button
                        onClick={() => handleBillingPeriodChange("annual")}
                        className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 relative ${
                          formData.billingPeriod === "annual"
                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                            : "text-white/70 hover:text-white"
                        }`}
                      >
                        İllik
                        <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                          -33%
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Compact Pricing Display */}
                  <div className="max-w-lg mx-auto">
                    <div className="text-center mb-8">
                      <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                          <Building2 className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-2xl font-bold text-white mb-1">
                            Korporativ Plan
                          </h3>
                          <span className="text-white/60 text-sm">Tam funksiyalı sistem</span>
                        </div>
                      </div>

                      <div className="w-full backdrop-blur-xl rounded-2xl p-6 mb-6 transition-all duration-300 border-2 bg-white/10 border-blue-400/50 shadow-lg relative">
                        <div className="flex items-center justify-center gap-3 mb-3">
                          <span className="text-6xl font-bold text-white">
                            {formData.billingPeriod === "monthly" ? "600" : "400"}
                          </span>
                          <div className="text-left">
                            <div className="text-white/60 text-lg">₼ / ay</div>
                            <div className="text-white/50 text-sm">hər filial</div>
                          </div>
                        </div>

                        {formData.billingPeriod === "annual" && (
                          <div className="backdrop-blur-xl bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-3">
                            <p className="text-emerald-300 text-sm font-medium">
                              ✓ İllik ödəniş: 4,800 ₼/il (hər filial)
                            </p>
                            <p className="text-emerald-400 text-xs mt-1">
                              2,400 ₼ qənaət edin!
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Number of Branches */}
              {step === 2 && (
                <div>
                  <h2 className="text-4xl font-bold text-white mb-3">
                    Filial Sayı
                  </h2>
                  <p className="text-white/70 text-lg mb-8">
                    Neçə filiala sahibsiniz?
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {branchOptions.map((option) => {
                      const isSelected = formData.branches === option;
                      return (
                        <button
                          key={option}
                          onClick={() =>
                            setFormData({
                              ...formData,
                              branches: option as number,
                            })
                          }
                          className={`relative backdrop-blur-xl rounded-2xl p-8 transition-all duration-300 border-2 ${
                            isSelected
                              ? "bg-white/20 border-blue-400 shadow-lg shadow-blue-500/50 scale-105"
                              : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30 hover:scale-102"
                          }`}
                        >
                          <div className="flex flex-col items-center gap-3">
                            <Building2 className="w-10 h-10 text-blue-400" />
                            <span className="text-3xl font-bold text-white">
                              {option}
                            </span>
                            <span className="text-sm text-white/60">
                              {option === 1 ? "Filial" : "Filial"}
                            </span>
                          </div>
                          {isSelected && (
                            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Business Information */}
              {step === 3 && (
                <div>
                  <h2 className="text-4xl font-bold text-white mb-3">
                    Biznes Məlumatları
                  </h2>
                  <p className="text-white/70 text-lg mb-8">
                    Biznəsiniz haqqında məlumat verin
                  </p>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-white font-medium mb-3">
                        Biznes Adı *
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          type="text"
                          value={formData.businessName || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              businessName: e.target.value,
                            })
                          }
                          placeholder="Biznəsinizin adını daxil edin"
                          className="w-full pl-12 pr-4 py-4 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:bg-white/15 focus:border-blue-400 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-3">
                        Sahibkar Adı *
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          type="text"
                          value={formData.ownerName || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              ownerName: e.target.value,
                            })
                          }
                          placeholder="Sahibkarın tam adını daxil edin"
                          className="w-full pl-12 pr-4 py-4 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:bg-white/15 focus:border-blue-400 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-3">
                        Ünvan
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-4 w-5 h-5 text-white/40" />
                        <textarea
                          value={formData.address || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, address: e.target.value })
                          }
                          placeholder="Biznes ünvanını daxil edin"
                          rows={3}
                          className="w-full pl-12 pr-4 py-4 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:bg-white/15 focus:border-blue-400 outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Contact Information */}
              {step === 4 && (
                <div>
                  <h2 className="text-4xl font-bold text-white mb-3">
                    Əlaqə Məlumatları
                  </h2>
                  <p className="text-white/70 text-lg mb-8">
                    Sizinlə necə əlaqə saxlaya bilərik?
                  </p>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-white font-medium mb-3">
                        Email Ünvanı *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          type="email"
                          value={formData.email || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="email@example.com"
                          className="w-full pl-12 pr-4 py-4 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:bg-white/15 focus:border-blue-400 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-3">
                        Telefon Nömrəsi *
                      </label>
                      <div className="flex gap-3">
                        {/* Country Code Selector */}
                        <div className="relative">
                          <select
                            value={formData.countryCode || "+994"}
                            onChange={(e) =>
                              setFormData({ ...formData, countryCode: e.target.value })
                            }
                            className="h-full px-4 py-4 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl text-white focus:bg-white/15 focus:border-blue-400 outline-none transition-all appearance-none pr-10 cursor-pointer"
                          >
                            <option value="+994" className="bg-slate-800">🇦🇿 +994</option>
                            <option value="+90" className="bg-slate-800">🇹🇷 +90</option>
                            <option value="+7" className="bg-slate-800">🇷🇺 +7</option>
                            <option value="+1" className="bg-slate-800">🇺🇸 +1</option>
                            <option value="+44" className="bg-slate-800">🇬🇧 +44</option>
                            <option value="+49" className="bg-slate-800">🇩🇪 +49</option>
                            <option value="+33" className="bg-slate-800">🇫🇷 +33</option>
                          </select>
                        </div>
                        
                        {/* Phone Input */}
                        <div className="relative flex-1">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                          <input
                            type="tel"
                            value={formData.phone || ""}
                            onChange={(e) => {
                              const formatted = formatPhoneNumber(e.target.value);
                              setFormData({ ...formData, phone: formatted });
                            }}
                            placeholder="XX-XXX-XX-XX"
                            maxLength={12}
                            className="w-full pl-12 pr-4 py-4 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:bg-white/15 focus:border-blue-400 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Confirmation */}
              {step === 5 && (
                (() => {
                  const pricePerBranch = formData.billingPeriod === "monthly" ? 600 : 400;
                  const originalPricePerBranch = 600;
                  const numBranches = typeof formData.branches === "number" ? formData.branches : 6;
                  const totalMonthly = pricePerBranch * numBranches;
                  const totalAnnual = totalMonthly * 12;
                  const originalTotalAnnual = originalPricePerBranch * numBranches * 12;
                  const savedAmount = originalTotalAnnual - totalAnnual;
                  
                  return (
                    <div>
                      <h2 className="text-4xl font-bold text-white mb-3">
                        Təsdiq et
                      </h2>
                      <p className="text-white/70 text-lg mb-8">
                        Məlumatlarınızı nəzərdən keçirin
                      </p>

                      <div className="space-y-6">
                        <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-400/50 rounded-xl p-6">
                          <h3 className="text-white font-semibold mb-4 text-lg flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            Ümumi Məbləğ
                          </h3>
                          
                          {formData.billingPeriod === "monthly" ? (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-white/80 text-sm">
                                    {numBranches} filial × {pricePerBranch} ₼/ay
                                  </div>
                                  <div className="text-white/60 text-xs mt-1">
                                    Aylıq ödəniş
                                  </div>
                                </div>
                                <span className="text-3xl font-bold text-white">
                                  {totalMonthly.toLocaleString()} ₼<span className="text-lg text-white/60">/ay</span>
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div>
                                <div className="text-white/60 text-sm mb-3">
                                  {numBranches} filial × 400 ₼/ay × 12 ay
                                </div>
                                
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-white/60 text-sm">Orijinal qiymət:</span>
                                  <span className="text-white/50 text-xl line-through">
                                    {originalTotalAnnual.toLocaleString()} ₼
                                  </span>
                                </div>
                                
                                <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/20">
                                  <span className="text-white/80 text-lg font-medium">Ödəniləcək məbləğ:</span>
                                  <span className="text-4xl font-bold text-white">
                                    {totalAnnual.toLocaleString()} ₼
                                  </span>
                                </div>
                                
                                <div className="backdrop-blur-xl bg-emerald-500/20 border border-emerald-400/30 rounded-lg p-4">
                                  <div className="flex items-center justify-between">
                                    <span className="text-emerald-300 font-medium">
                                      İllik qənaət
                                    </span>
                                    <span className="text-emerald-400 text-2xl font-bold">
                                      {savedAmount.toLocaleString()} ₼
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="backdrop-blur-xl bg-white/5 border border-white/20 rounded-xl p-6">
                          <h3 className="text-white font-semibold mb-4 text-lg">
                            Paket Təfərrüatları
                          </h3>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/60">Plan:</span>
                              <span className="text-white/80 font-medium">Korporativ Plan</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/60">Ödəniş dövrü:</span>
                              <span className="text-white/80">
                                {formData.billingPeriod === "monthly" ? "Aylıq" : "İllik"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/60">Filial sayı:</span>
                              <span className="text-white/80 font-medium">{numBranches}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/60">Hər filial üçün:</span>
                              <div className="flex flex-col items-end gap-1">
                                {formData.billingPeriod === "annual" && (
                                  <span className="text-white/40 text-xs line-through">
                                    {originalPricePerBranch} ₼/ay
                                  </span>
                                )}
                                <span className="text-white/80">
                                  {pricePerBranch} ₼/ay
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="backdrop-blur-xl bg-white/5 border border-white/20 rounded-xl p-6">
                          <h3 className="text-white font-semibold mb-4 text-lg">
                            Biznes Məlumatları
                          </h3>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-white/60">Biznes adı:</span>
                              <span className="text-white font-medium">
                                {formData.businessName}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60">Sahibkar:</span>
                              <span className="text-white font-medium">
                                {formData.ownerName}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60">Email:</span>
                              <span className="text-white font-medium">
                                {formData.email}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60">Telefon:</span>
                              <span className="text-white font-medium">
                                {formData.countryCode} {formatPhoneNumber(formData.phone || "")}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="backdrop-blur-xl bg-blue-500/10 border border-blue-400/30 rounded-xl p-6">
                          <p className="text-white/80 text-sm leading-relaxed">
                            "Qeydiyyatı Tamamla" düyməsinə basmaqla siz bizim Xidmət Şərtləri və Məxfilik Siyasətimizi qəbul edirsiniz. Hesabınız yaradılacaq və sizə giriş məlumatlarınız ilə təsdiq e-poçtu göndəriləcək.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-4">
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-6 py-4 backdrop-blur-xl bg-white/10 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-300"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Geri
                </button>
              )}
              {step !== 5 && (
                <button
                  onClick={handleNext}
                  className="ml-auto flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105"
                >
                  Davam et
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
              {step === 5 && (
                <button
                  onClick={handleNext}
                  className="ml-auto flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105"
                >
                  Qeydiyyatı Tamamla
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}