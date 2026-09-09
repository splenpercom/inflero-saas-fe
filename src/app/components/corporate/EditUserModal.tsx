import { useState, useEffect } from "react";
import { X, EyeOff, Eye, User } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { getUserManagementTranslation } from "../../i18n/userManagementTranslations";
import { DateInput } from "../ui/DateInput";
import { CustomSelect } from "../ui/CustomSelect";
import type { TenantUserRow } from "../../api/userManagement";
import type { UiUserStatus } from "../../lib/userManagementMappers";

export interface EditUserFormData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roleId: string;
  dateOfBirth: string;
  joiningDate: string;
  status: UiUserStatus;
  password: string;
  confirmPassword: string;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (userData: EditUserFormData) => void;
  user: TenantUserRow | null;
  roles?: { id: string; name: string }[];
  saving?: boolean;
}

export function EditUserModal({ isOpen, onClose, onSave, user, roles = [], saving }: EditUserModalProps) {
  const { language } = useLanguage();
  const t = (key: Parameters<typeof getUserManagementTranslation>[0]) =>
    getUserManagementTranslation(key, language);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<EditUserFormData>({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    roleId: "",
    dateOfBirth: "",
    joiningDate: "",
    status: "Active",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id,
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.email,
        phone: user.phone === "—" ? "" : user.phone,
        roleId: user.roleId,
        dateOfBirth: user.dateOfBirthIso,
        joiningDate: user.dateOfJoinIso,
        status: user.status,
        password: "",
        confirmPassword: "",
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#14b8a6]" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {t("editUser")}: {user?.name}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-120px)] scrollbar-hide">
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-700 dark:text-gray-300 mb-1.5 block">
                  {t("firstName")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                  placeholder={t("enterFirstName")}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-gray-700 dark:text-gray-300 mb-1.5 block">
                  {t("lastName")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                  placeholder={t("enterLastName")}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-gray-700 dark:text-gray-300 mb-1.5 block">
                  {t("email")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-700 dark:text-gray-300 mb-1.5 block">
                  {t("phone")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                  placeholder={t("enterPhone")}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-gray-700 dark:text-gray-300 mb-1.5 block">
                  {t("role")} <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  value={formData.roleId}
                  onChange={(value) => setFormData({ ...formData, roleId: value })}
                  options={roles.map((role) => ({
                    value: role.id,
                    label: role.name === "Administrator" ? "Admin" : role.name,
                  }))}
                  placeholder={t("selectRole")}
                  required
                  disabled={user?.isTenantOwner === true}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-700 dark:text-gray-300 mb-1.5 block">{t("dateOfBirth")}</label>
                <DateInput
                  value={formData.dateOfBirth}
                  onChange={(value) => setFormData({ ...formData, dateOfBirth: value })}
                  defaultYearsAgo={30}
                />
              </div>
              <div>
                <label className="text-xs text-gray-700 dark:text-gray-300 mb-1.5 block">{t("joiningDate")}</label>
                <DateInput
                  value={formData.joiningDate}
                  onChange={(value) => setFormData({ ...formData, joiningDate: value })}
                  defaultYearsAgo={0}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-700 dark:text-gray-300 mb-1.5 block">
                  {t("status")} <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  value={formData.status}
                  onChange={(value) => setFormData({ ...formData, status: value as UiUserStatus })}
                  options={[
                    { value: "Active", label: t("active") },
                    { value: "Inactive", label: t("inactive") },
                  ]}
                  placeholder={t("status")}
                  required
                  disabled={user?.isTenantOwner === true}
                />
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-800 pt-3 mt-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t("leavePasswordFieldsEmpty")}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-700 dark:text-gray-300 mb-1.5 block">{t("newPassword")}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-1.5 pr-8 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                      placeholder={t("enterNewPassword")}
                      minLength={8}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-700 dark:text-gray-300 mb-1.5 block">{t("confirmNewPassword")}</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-3 py-1.5 pr-8 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                      placeholder={t("confirmNewPasswordPlaceholder")}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirmPassword ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              {t("cancel")}
            </button>
            <button type="submit" disabled={saving} className="px-3 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors disabled:opacity-50">
              {t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
