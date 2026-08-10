import { pickLang } from "../../i18n/pickLang";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowLeft, User, Mail, Phone, MapPin, Building, Calendar, Shield, Lock, Eye, EyeOff, Image } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../i18n/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import {
  changePassword,
  requestEmailChange,
  updateProfile,
  verifyEmailChange,
} from "../../api/auth";
import { getUserDisplayName, getUserInitials, formatMemberSince, getCompanyLogoUrl } from "../../lib/userDisplay";
import { notifyFromError, notifyInfo, notifySuccess } from "../../lib/toast";

export function Profile() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { user, isDemo, isAuthenticated, refresh } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);

  const pt = (en: string, az: string, ru?: string) => pickLang(language, az, en, ru);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setPhone(user.phone ?? "");
    setAddress(user.address ?? "");
  }, [user]);

  const displayName = getUserDisplayName(user, pt("Demo User", "Demo İstifadəçi"));
  const initials = getUserInitials(displayName, user?.email);
  const roleName = user?.role?.name ?? pt("Administrator", "Administrator");
  const statusLabel =
    user?.status === "ACTIVE" ? pt("Active", "Aktiv") : user?.status ?? pt("Active", "Aktiv");
  const companyName = user?.tenant?.name ?? pt("Inflero", "Inflero");
  const companyLogo = getCompanyLogoUrl(user?.tenant, theme === "dark");
  const memberSince = formatMemberSince(user?.createdAt, language);

  const requireSignedIn = () => {
    if (!(isAuthenticated || isDemo)) {
      notifyInfo(
        pt(
          "Sign in with your live account to edit profile settings.",
          "Profil parametrlərini redaktə etmək üçün canlı hesabınızla daxil olun.",
        ),
      );
      return false;
    }
    return true;
  };

  const handleSaveProfile = async () => {
    if (!requireSignedIn()) return;
    if (!firstName.trim() || !lastName.trim()) {
      notifyFromError(null, pt("First and last name are required.", "Ad və soyad mütləqdir."));
      return;
    }
    setProfileSaving(true);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
      });
      await refresh();
      notifySuccess(pt("Profile updated.", "Profil yeniləndi."));
    } catch (err) {
      notifyFromError(err);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!requireSignedIn()) return;
    if (!currentPassword || !newPassword || !confirmPassword) {
      notifyFromError(null, pt("Fill in all password fields.", "Bütün şifrə sahələrini doldurun."));
      return;
    }
    if (newPassword.length < 8) {
      notifyFromError(null, pt("New password must be at least 8 characters.", "Yeni şifrə ən azı 8 simvol olmalıdır."));
      return;
    }
    if (newPassword !== confirmPassword) {
      notifyFromError(null, pt("New passwords do not match.", "Yeni şifrələr uyğun gəlmir."));
      return;
    }
    setPasswordSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      notifySuccess(pt("Password updated.", "Şifrə yeniləndi."));
    } catch (err) {
      notifyFromError(err);
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleRequestEmailCode = async () => {
    if (!requireSignedIn()) return;
    if (!newEmail.trim()) {
      notifyFromError(null, pt("Enter a new email address.", "Yeni e-poçt ünvanı daxil edin."));
      return;
    }
    setEmailSaving(true);
    try {
      await requestEmailChange(newEmail.trim().toLowerCase());
      setEmailCodeSent(true);
      notifySuccess(pt("Verification code sent to your new email.", "Yeni e-poçtunuza təsdiq kodu göndərildi."));
    } catch (err) {
      notifyFromError(err);
    } finally {
      setEmailSaving(false);
    }
  };

  const handleVerifyEmailChange = async () => {
    if (!requireSignedIn()) return;
    if (!newEmail.trim() || !emailOtp.trim()) {
      notifyFromError(null, pt("Enter the new email and verification code.", "Yeni e-poçt və təsdiq kodunu daxil edin."));
      return;
    }
    setEmailSaving(true);
    try {
      await verifyEmailChange(newEmail.trim().toLowerCase(), emailOtp.trim());
      await refresh();
      setNewEmail("");
      setEmailOtp("");
      setEmailCodeSent(false);
      notifySuccess(pt("Email address updated.", "E-poçt ünvanı yeniləndi."));
    } catch (err) {
      notifyFromError(err);
    } finally {
      setEmailSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-[#f0f2ff]/20 to-gray-100 dark:from-gray-950 dark:via-[#001db8]/10 dark:to-gray-900 p-4">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 smooth-transition"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">{pt("Profile", "Profil")}</h1>
          <p className="text-[10px] text-gray-600 dark:text-gray-400">
            {pt("Manage your account information", "Hesab məlumatlarınızı idarə edin")}
          </p>
        </div>
      </div>

      <div className="glass-card p-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0026f6] to-[#001db8] flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-white">{initials}</span>
              )}
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">{displayName}</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">
              {user?.email ?? (isDemo ? "demo@sample.local" : "—")}
            </p>
            <div className="flex gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 bg-[#e8ebff]0/10 dark:bg-[#e8ebff]0/20 border border-[#0026f6]/20 rounded text-[10px] font-medium text-[#0026f6] dark:text-[#0026f6]">
                {roleName}
              </span>
              <span className="px-2 py-0.5 bg-green-500/10 dark:bg-green-500/20 border border-green-500/20 rounded text-[10px] font-medium text-green-600 dark:text-green-400">
                {statusLabel}
              </span>
              {isDemo && (
                <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] font-medium text-amber-700 dark:text-amber-300">
                  {pt("Demo", "Demo")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-4 mb-3">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden shrink-0">
            {companyLogo ? (
              <img src={companyLogo} alt={companyName} className="w-full h-full object-cover" />
            ) : (
              <Building className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Image className="w-3 h-3 text-[#0026f6] dark:text-[#0026f6]" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                {pt("Company Logo", "Şirkət Loqosu")}
              </h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{companyName}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
              {pt(
                "To change your company logo, go to Settings → Company Images → Company Logo.",
                "Şirkət loqosunu dəyişmək üçün Parametrlər → Şirkət Şəkilləri → Şirkət Loqosu bölməsinə keçin.",
              )}
            </p>
            <Link
              to="/dashboard/settings"
              className="inline-flex mt-2 text-[10px] font-medium text-[#0026f6] dark:text-[#0026f6] hover:underline"
            >
              {pt("Open Settings", "Parametrləri aç")}
            </Link>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-1.5 rounded-lg font-medium text-xs smooth-transition flex items-center gap-1.5 ${
            activeTab === "profile"
              ? "bg-[#001db8] text-white shadow-lg shadow-[#0026f6]/20"
              : "glass hover:bg-white/50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400"
          }`}
        >
          <User className="w-3 h-3" />
          {pt("Profile Information", "Profil Məlumatı")}
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`px-4 py-1.5 rounded-lg font-medium text-xs smooth-transition flex items-center gap-1.5 ${
            activeTab === "security"
              ? "bg-[#001db8] text-white shadow-lg shadow-[#0026f6]/20"
              : "glass hover:bg-white/50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400"
          }`}
        >
          <Shield className="w-3 h-3" />
          {pt("Security", "Təhlükəsizlik")}
        </button>
      </div>

      {activeTab === "profile" && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
            {pt("Personal Information", "Şəxsi Məlumat")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <User className="w-3 h-3" />
                {pt("First name", "Ad")}
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isDemo || !isAuthenticated}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] disabled:opacity-60"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <User className="w-3 h-3" />
                {pt("Last name", "Soyad")}
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isDemo || !isAuthenticated}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] disabled:opacity-60"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Mail className="w-3 h-3" />
                {pt("Email", "E-poçt")}
              </label>
              <input
                type="email"
                value={user?.email ?? ""}
                disabled
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Phone className="w-3 h-3" />
                {pt("Phone", "Telefon")}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isDemo || !isAuthenticated}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] disabled:opacity-60"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Building className="w-3 h-3" />
                {pt("Company", "Şirkət")}
              </label>
              <input
                type="text"
                value={companyName}
                disabled
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Calendar className="w-3 h-3" />
                {pt("Member Since", "Üzv Olduğu Tarix")}
              </label>
              <input
                type="text"
                value={memberSince}
                disabled
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <MapPin className="w-3 h-3" />
                {pt("Address", "Ünvan")}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={isDemo || !isAuthenticated}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] disabled:opacity-60"
              />
            </div>
          </div>

          <div className="flex justify-start mt-4">
            <button
              onClick={handleSaveProfile}
              disabled={profileSaving || !(isAuthenticated || isDemo)}
              className="px-4 py-1.5 bg-[#001db8] hover:bg-[#001fc4] text-white rounded-lg smooth-transition shadow-lg shadow-[#0026f6]/20 font-medium text-xs disabled:opacity-60"
            >
              {profileSaving ? pt("Saving…", "Yadda saxlanılır…") : pt("Save Changes", "Dəyişiklikləri Yadda Saxla")}
            </button>
          </div>
        </div>
      )}

      {activeTab === "security" && (
        <div className="space-y-3">
          <div className="glass-card p-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
              {pt("Change Password", "Şifrəni Dəyişdir")}
            </h3>
            <div className="space-y-3 max-w-md">
              <div>
                <label className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <Lock className="w-3 h-3" />
                  {pt("Current Password", "Cari Şifrə")}
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={isDemo || !isAuthenticated}
                    className="w-full px-3 py-1.5 pr-9 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((v) => !v)}
                    disabled={isDemo || !isAuthenticated}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-40"
                    aria-label={showCurrentPassword ? pt("Hide password", "Şifrəni gizlət") : pt("Show password", "Şifrəni göstər")}
                  >
                    {showCurrentPassword ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <Lock className="w-3 h-3" />
                  {pt("New Password", "Yeni Şifrə")}
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isDemo || !isAuthenticated}
                    className="w-full px-3 py-1.5 pr-9 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    disabled={isDemo || !isAuthenticated}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-40"
                    aria-label={showNewPassword ? pt("Hide password", "Şifrəni gizlət") : pt("Show password", "Şifrəni göstər")}
                  >
                    {showNewPassword ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <Lock className="w-3 h-3" />
                  {pt("Confirm New Password", "Yeni Şifrəni Təsdiqlə")}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isDemo || !isAuthenticated}
                    className="w-full px-3 py-1.5 pr-9 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    disabled={isDemo || !isAuthenticated}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-40"
                    aria-label={showConfirmPassword ? pt("Hide password", "Şifrəni gizlət") : pt("Show password", "Şifrəni göstər")}
                  >
                    {showConfirmPassword ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-start mt-4">
              <button
                onClick={handleChangePassword}
                disabled={passwordSaving || !(isAuthenticated || isDemo)}
                className="px-4 py-1.5 bg-[#001db8] hover:bg-[#001fc4] text-white rounded-lg smooth-transition shadow-lg shadow-[#0026f6]/20 font-medium text-xs disabled:opacity-60"
              >
                {passwordSaving ? pt("Updating…", "Yenilənir…") : pt("Update Password", "Şifrəni Yenilə")}
              </button>
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
              {pt("Change Email", "E-poçtu Dəyişdir")}
            </h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-3">
              {pt(
                "A verification code will be sent to your new email address.",
                "Yeni e-poçt ünvanınıza təsdiq kodu göndəriləcək.",
              )}
            </p>
            <div className="space-y-3 max-w-md">
              <div>
                <label className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <Mail className="w-3 h-3" />
                  {pt("New email", "Yeni e-poçt")}
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={isDemo || !isAuthenticated}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] disabled:opacity-60"
                />
              </div>
              {emailCodeSent && (
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {pt("Verification code", "Təsdiq kodu")}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ""))}
                    disabled={isDemo || !isAuthenticated}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] disabled:opacity-60"
                  />
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={handleRequestEmailCode}
                disabled={emailSaving || !(isAuthenticated || isDemo)}
                className="px-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium disabled:opacity-60"
              >
                {emailSaving ? pt("Sending…", "Göndərilir…") : pt("Send code", "Kod göndər")}
              </button>
              {emailCodeSent && (
                <button
                  onClick={handleVerifyEmailChange}
                  disabled={emailSaving || !(isAuthenticated || isDemo)}
                  className="px-4 py-1.5 bg-[#001db8] hover:bg-[#001fc4] text-white rounded-lg text-xs font-medium disabled:opacity-60"
                >
                  {emailSaving ? pt("Verifying…", "Təsdiqlənir…") : pt("Verify & update email", "Təsdiqlə və yenilə")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
