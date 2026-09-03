import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Mail, Lock, ArrowRight, Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { pickLang } from "../i18n/pickLang";
import { useAuth } from "../context/AuthContext";
import { RegistrationModal } from "./RegistrationModal";
import { forgotPassword } from "../api/auth";
import { notifyFromError, notifySuccess } from "../lib/toast";
import { AppBrandLogo } from "./ui/AppBrandLogo";
import { LanguageSwitcherDropdown } from "./LanguageSwitcherDropdown";

type View = "login" | "forgot" | "forgot-sent";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const [view, setView] = useState<View>("login");

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const t = (en: string, az: string, ru: string) => pickLang(language, az, en, ru);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, from]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      notifyFromError(
        null,
        t("Please fill in all fields.", "Bütün sahələri doldurun.", "Пожалуйста, заполните все поля."),
      );
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      notifySuccess(t("Signed in successfully.", "Uğurla daxil oldunuz.", "Вход выполнен успешно."));
      navigate(from, { replace: true });
    } catch (err) {
      notifyFromError(
        err,
        t(
          "Sign-in failed. Check your credentials or wait for admin approval.",
          "Daxil olma uğursuz oldu. Məlumatları yoxlayın və ya admin təsdiqini gözləyin.",
          "Не удалось войти. Проверьте данные или дождитесь подтверждения администратора.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      await forgotPassword(forgotEmail.trim());
      notifySuccess(
        t(
          "If an account exists, a reset link has been sent.",
          "Hesab mövcuddursa, sıfırlama linki göndərildi.",
          "Если аккаунт существует, ссылка для сброса отправлена.",
        ),
      );
      setView("forgot-sent");
    } catch (err) {
      notifyFromError(err);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#042f2e] flex overflow-hidden">
      <style>{`
        @keyframes lp-glow  { 0%,100%{opacity:0.35} 50%{opacity:0.7} }
        @keyframes lp-slide { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lp-fade  { from{opacity:0} to{opacity:1} }
        .lp-glow  { animation: lp-glow  5s ease-in-out infinite }
        .lp-glow2 { animation: lp-glow  7s ease-in-out infinite 2s }
        .lp-slide { animation: lp-slide 0.55s cubic-bezier(.16,1,.3,1) both }
        .lp-fade  { animation: lp-fade  0.4s ease both }
        .lp-grid  {
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 52px 52px;
        }
        .glass-field {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          transition: all 0.2s;
        }
        .glass-field:focus {
          background: rgba(255,255,255,0.09);
          border-color: rgba(20,184,166,0.55);
          box-shadow: 0 0 0 3px rgba(20,184,166,0.12);
          outline: none;
        }
        .glass-field:-webkit-autofill,
        .glass-field:-webkit-autofill:hover,
        .glass-field:-webkit-autofill:focus,
        .glass-field:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px rgba(4, 47, 46, 0.95) inset !important;
          -webkit-text-fill-color: rgba(255,255,255,0.90) !important;
          caret-color: white;
          border-color: rgba(255,255,255,0.10) !important;
          transition: background-color 9999s ease-in-out 0s;
        }
      `}</style>

      <div className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 relative overflow-hidden p-12">
        <div className="absolute inset-0 lp-grid" />
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-[#14b8a6]/14 blur-3xl lp-glow pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 rounded-full bg-[#0f766e]/60 blur-3xl lp-glow2 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#14b8a6]/60 to-transparent" />

        <div className="relative z-10">
          <AppBrandLogo onDarkBackground size="auth" />
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            {t(
              "The all-in-one SaaS for every business.",
              "Hər biznes üçün vahid SaaS platforması.",
              "Единая SaaS-платформа для любого бизнеса.",
            )}
          </h2>
          <p className="text-white/40 text-base leading-relaxed mb-10">
            {t(
              "Built for car service shops, ecommerce stores, and growing companies — inventory, sales, customers, and finance in one place.",
              "Avtomobil servisi, e-ticarət mağazaları və böyüyən şirkətlər üçün — inventar, satış, müştəri və maliyyə bir yerdə.",
              "Для автосервисов, интернет-магазинов и растущих компаний — склад, продажи, клиенты и финансы в одном месте.",
            )}
          </p>

          <div className="flex flex-wrap gap-2.5">
            {[
              t("POS & Sales", "POS və Satış", "POS и продажи"),
              t("Inventory", "İnventar", "Склад"),
              t("Customer CRM", "Müştəri CRM", "CRM клиентов"),
              t("Finance & Reports", "Maliyyə hesabatları", "Финансы и отчёты"),
              t("Multi-branch", "Çoxlu filial", "Мультифилиальность"),
            ].map((f) => (
              <span
                key={f}
                className="px-3 py-1.5 rounded-full text-[11px] font-semibold text-white/50 border border-white/10 bg-white/4"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="bg-white/[0.07] border border-white/12 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  {t("New order received", "Yeni sifariş alındı", "Получен новый заказ")}
                </p>
                <p className="text-[10px] text-white/40">
                  {t("Anar H. · Online store · 10:30", "Anar H. · Onlayn mağaza · 10:30", "Anar H. · Интернет-магазин · 10:30")}
                </p>
              </div>
              <span className="ml-auto w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: "12", l: t("Today", "Bugün", "Сегодня") },
                { v: "248", l: t("Customers", "Müştəri", "Клиенты") },
                { v: "15,2K ₼", l: t("Revenue", "Gəlir", "Выручка") },
              ].map((s) => (
                <div key={s.l} className="bg-white/[0.06] rounded-xl p-2.5 text-center">
                  <p className="text-sm font-black text-white leading-none mb-0.5">{s.v}</p>
                  <p className="text-[9px] text-white/35">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#14b8a6]/6 blur-3xl pointer-events-none" />

        <div className="absolute top-6 left-0 right-0 px-6 flex items-center justify-between lg:justify-end">
          <AppBrandLogo onDarkBackground size="nav" className="lg:hidden" />
          <LanguageSwitcherDropdown variant="dark" />
        </div>

        {view === "login" && (
          <div className="w-full max-w-sm lp-slide">
            <div className="mb-8">
              <h1 className="text-3xl font-black text-white mb-2">
                {t("Welcome back", "Xoş gəldiniz", "С возвращением")}
              </h1>
              <p className="text-white/40 text-sm">
                {t(
                  "Sign in to your Inflero account.",
                  "Inflero hesabınıza daxil olun.",
                  "Войдите в свой аккаунт Inflero.",
                )}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-white/50 block mb-1.5">
                  {t("Email address", "E-poçt ünvanı", "Электронная почта")}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder={t("you@company.az", "siz@sirket.az", "you@company.ru")}
                    className="glass-field w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-white/50 block mb-1.5">
                  {t("Password", "Şifrə", "Пароль")}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder={t("Enter your password", "Şifrəni daxil edin", "Введите пароль")}
                    className="glass-field w-full pl-10 pr-11 py-3 rounded-xl text-sm text-white placeholder-white/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors p-0.5"
                  >
                    {showPw ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div
                    onClick={() => setRemember(!remember)}
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-all cursor-pointer ${remember ? "bg-[#14b8a6] border-[#14b8a6]" : "border-white/20 bg-white/5"}`}
                  >
                    {remember && <CheckCircle className="w-3 h-3 text-white fill-current" />}
                  </div>
                  <span className="text-xs text-white/40 group-hover:text-white/60 transition-colors select-none">
                    {t("Remember me", "Məni xatırla", "Запомнить меня")}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setView("forgot");
                    setForgotEmail(email);
                  }}
                  className="text-xs text-white/40 hover:text-[#5eead4] transition-colors font-medium"
                >
                  {t("Forgot password?", "Şifrəni unutmusunuz?", "Забыли пароль?")}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white text-[#14b8a6] text-sm font-bold hover:bg-white/95 transition-all shadow-lg shadow-white/8 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] mt-2"
              >
                {loading ? (
                  <svg className="animate-spin w-4 h-4 text-[#14b8a6]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  <>
                    {t("Sign in", "Daxil ol", "Войти")}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10 text-center space-y-2">
              <p className="text-xs text-white/40">
                {t("Don't have an account yet?", "Hələ hesabınız yoxdur?", "Ещё нет аккаунта?")}
              </p>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(true)}
                className="text-sm font-semibold text-[#5eead4] hover:text-white transition-colors"
              >
                {t(
                  "Get started — submit registration",
                  "Başla — qeydiyyat sorğusu göndər",
                  "Начать — подать заявку на регистрацию",
                )}
              </button>
            </div>
          </div>
        )}

        {view === "forgot" && (
          <div className="w-full max-w-sm lp-slide">
            <button
              onClick={() => setView("login")}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors mb-8"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t("Back to sign in", "Girişə qayıt", "Назад ко входу")}
            </button>

            <div className="mb-8">
              <div className="w-12 h-12 rounded-2xl bg-[#14b8a6]/15 border border-[#14b8a6]/20 flex items-center justify-center mb-5">
                <Lock className="w-5 h-5 text-[#5eead4]" />
              </div>
              <h1 className="text-3xl font-black text-white mb-2">
                {t("Forgot password?", "Şifrəni unutdunuz?", "Забыли пароль?")}
              </h1>
              <p className="text-white/40 text-sm leading-relaxed">
                {t(
                  "Enter your email and we'll send you a reset link.",
                  "E-poçtunuzu daxil edin, şifrə sıfırlama linki göndərəcəyik.",
                  "Введите email — мы отправим ссылку для сброса пароля.",
                )}
              </p>
            </div>

            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-white/50 block mb-1.5">
                  {t("Email address", "E-poçt ünvanı", "Электронная почта")}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    autoFocus
                    placeholder={t("you@company.az", "siz@sirket.az", "you@company.ru")}
                    className="glass-field w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={forgotLoading || !forgotEmail}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white text-[#14b8a6] text-sm font-bold hover:bg-white/95 transition-all shadow-lg shadow-white/8 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
              >
                {forgotLoading ? (
                  <svg className="animate-spin w-4 h-4 text-[#14b8a6]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  <>
                    {t("Send reset link", "Sıfırlama linki göndər", "Отправить ссылку")}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {view === "forgot-sent" && (
          <div className="w-full max-w-sm lp-slide text-center">
            <div className="w-16 h-16 rounded-3xl bg-green-500/15 border border-green-500/25 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-3xl font-black text-white mb-3">
              {t("Check your email", "E-poçtunuzu yoxlayın", "Проверьте почту")}
            </h1>
            <p className="text-white/40 text-sm leading-relaxed mb-2">
              {t(
                "We sent a password reset link to",
                "Şifrə sıfırlama linki göndərildi:",
                "Мы отправили ссылку для сброса пароля на",
              )}
            </p>
            <p className="text-white font-semibold text-sm mb-8">{forgotEmail}</p>

            <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-4 text-left mb-8">
              <p className="text-xs text-white/40 leading-relaxed">
                {t(
                  "Didn't receive the email? Check your spam folder or make sure the email address is correct.",
                  "E-poçtu almadınız? Spam qovluğunu yoxlayın və ya e-poçt ünvanının düzgün olduğundan əmin olun.",
                  "Не получили письмо? Проверьте папку «Спам» или убедитесь, что адрес указан верно.",
                )}
              </p>
            </div>

            <button
              onClick={() => setView("forgot")}
              className="w-full py-3 rounded-xl bg-white/6 border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all font-medium mb-4"
            >
              {t("Try a different email", "Başqa e-poçt cəhd edin", "Указать другой email")}
            </button>
            <button
              onClick={() => setView("login")}
              className="text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              ← {t("Back to sign in", "Girişə qayıt", "Назад ко входу")}
            </button>
          </div>
        )}
      </div>

      <RegistrationModal open={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
    </div>
  );
}
