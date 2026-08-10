import { useState } from "react";
import { useNavigate } from "react-router";
import { Mail, ArrowRight, X, ArrowLeft, CheckCircle2 } from "lucide-react";
import { AppBrandLogo } from "./ui/AppBrandLogo";
import { useLanguage } from "../i18n/LanguageContext";
import { pickLang } from "../i18n/pickLang";
import { LanguageSwitcherDropdown } from "./LanguageSwitcherDropdown";

interface ForgotPasswordProps {
  onClose: () => void;
}

export function ForgotPassword({ onClose }: ForgotPasswordProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Simple translation helper for forgot password page specific text
  const t = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setLoading(false);
    setSubmitted(true);
  };

  const handleBackToLogin = () => {
    navigate("/");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="min-h-screen relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/30 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse delay-700"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <AppBrandLogo onDarkBackground size="auth" />
              <div className="flex items-center gap-3">
                <LanguageSwitcherDropdown variant="dark" />
                <button
                  onClick={onClose}
                  className="backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 rounded-xl p-2 transition-all duration-300"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Card */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
              {!submitted ? (
                <>
                  {/* Title */}
                  <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-3">
                      {t("Şifrəni Sıfırla", "Reset Password")}
                    </h1>
                    <p className="text-white/70 text-lg">
                      {t(
                        "E-poçt ünvanınızı daxil edin və şifrəni sıfırlama təlimatları göndərəcəyik",
                        "Enter your email address and we'll send you instructions to reset your password"
                      )}
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email Field */}
                    <div>
                      <label className="block text-white font-medium mb-3">
                        {t("E-poçt Ünvanı", "Email Address")}
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t("sizin@epoctunuz.com", "your@email.com")}
                          required
                          className="w-full pl-12 pr-4 py-4 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:bg-white/15 focus:border-blue-400 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          {t("Göndərilir...", "Sending...")}
                        </>
                      ) : (
                        <>
                          {t("Təlimat Göndər", "Send Instructions")}
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>

                    {/* Back to Login */}
                    <button
                      type="button"
                      onClick={handleBackToLogin}
                      className="w-full flex items-center justify-center gap-2 px-8 py-4 backdrop-blur-xl bg-white/10 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-300"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      {t("Girişə Qayıt", "Back to Login")}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  {/* Success Message */}
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 className="w-10 h-10 text-green-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-4">
                      {t("E-poçt Göndərildi", "Email Sent")}
                    </h1>
                    <p className="text-white/70 text-lg mb-8">
                      {t(
                        "Şifrənizi sıfırlamaq üçün təlimatları e-poçt ünvanınıza göndərdik. Zəhmət olmasa e-poçtunuzu yoxlayın.",
                        "We've sent password reset instructions to your email address. Please check your inbox."
                      )}
                    </p>
                    <div className="space-y-3">
                      <p className="text-white/60 text-sm">
                        {t(
                          "E-poçt almadınız? Spam qovluğunuzu yoxlayın və ya bir neçə dəqiqə gözləyin.",
                          "Didn't receive the email? Check your spam folder or wait a few minutes."
                        )}
                      </p>
                      <button
                        onClick={handleBackToLogin}
                        className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105"
                      >
                        <ArrowLeft className="w-5 h-5" />
                        {t("Girişə Qayıt", "Back to Login")}
                      </button>
                      <button
                        onClick={() => setSubmitted(false)}
                        className="w-full px-8 py-3 text-white/70 hover:text-white text-sm font-medium transition-colors"
                      >
                        {t("E-poçtu Yenidən Göndər", "Resend Email")}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
