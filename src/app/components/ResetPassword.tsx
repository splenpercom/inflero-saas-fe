import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Lock, ArrowRight, X, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { AppBrandLogo } from "./ui/AppBrandLogo";
import { useLanguage } from "../i18n/LanguageContext";
import { pickLang } from "../i18n/pickLang";
import { LanguageSwitcherDropdown } from "./LanguageSwitcherDropdown";

interface ResetPasswordProps {
  onClose: () => void;
}

export function ResetPassword({ onClose }: ResetPasswordProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Get token from URL (normally would be used for API call)
  const token = searchParams.get("token");

  // Simple translation helper
  const t = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (password.length < 8) {
      setError(t("Şifrə ən azı 8 simvoldan ibarət olmalıdır", "Password must be at least 8 characters"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("Şifrələr uyğun gəlmir", "Passwords do not match"));
      return;
    }

    setLoading(true);

    // Simulate API call to reset password
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setLoading(false);
    setSubmitted(true);

    // Redirect to login after 3 seconds
    setTimeout(() => {
      navigate("/");
    }, 3000);
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
                      {t("Yeni Şifrə Təyin Et", "Set New Password")}
                    </h1>
                    <p className="text-white/70 text-lg">
                      {t(
                        "Hesabınız üçün yeni və güclü bir şifrə təyin edin",
                        "Create a new strong password for your account"
                      )}
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Password Field */}
                    <div>
                      <label className="block text-white font-medium mb-3">
                        {t("Yeni Şifrə", "New Password")}
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={t("Ən azı 8 simvol", "At least 8 characters")}
                          required
                          className="w-full pl-12 pr-12 py-4 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:bg-white/15 focus:border-blue-400 outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                      <label className="block text-white font-medium mb-3">
                        {t("Şifrəni Təsdiqlə", "Confirm Password")}
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder={t("Şifrəni təkrar daxil edin", "Re-enter your password")}
                          required
                          className="w-full pl-12 pr-12 py-4 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:bg-white/15 focus:border-blue-400 outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="backdrop-blur-xl bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                        <p className="text-red-200 text-sm">{error}</p>
                      </div>
                    )}

                    {/* Password Requirements */}
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
                      <p className="text-white/60 text-xs mb-2">
                        {t("Şifrə tələbləri:", "Password requirements:")}
                      </p>
                      <ul className="text-white/50 text-xs space-y-1">
                        <li className={password.length >= 8 ? "text-green-400" : ""}>
                          • {t("Ən azı 8 simvol", "At least 8 characters")}
                        </li>
                        <li className={password !== confirmPassword || !confirmPassword ? "" : "text-green-400"}>
                          • {t("Şifrələr uyğun olmalıdır", "Passwords must match")}
                        </li>
                      </ul>
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
                          {t("Yenilənir...", "Updating...")}
                        </>
                      ) : (
                        <>
                          {t("Şifrəni Yenilə", "Update Password")}
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
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
                      {t("Şifrə Uğurla Yeniləndi", "Password Reset Successfully")}
                    </h1>
                    <p className="text-white/70 text-lg mb-4">
                      {t(
                        "Şifrəniz uğurla yeniləndi. İndi yeni şifrənizlə daxil ola bilərsiniz.",
                        "Your password has been successfully reset. You can now sign in with your new password."
                      )}
                    </p>
                    <div className="flex items-center justify-center gap-2 text-white/60 text-sm">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white/60 rounded-full animate-spin"></div>
                      {t("Giriş səhifəsinə yönləndirilirsiniz...", "Redirecting to login page...")}
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
