import { useState } from "react";
import { X, EyeOff, Eye, User } from "lucide-react";
import { CustomSelect } from "../ui/CustomSelect";
import { DateInput } from "../ui/DateInput";
import { useLanguage } from "../../i18n/LanguageContext";
import { getUserManagementTranslation } from "../../i18n/userManagementTranslations";

import { pickLang } from "../../i18n/pickLang";
export interface AddUserFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roleId: string;
  storeId: string;
  dateOfBirth: string;
  joiningDate: string;
  password: string;
  confirmPassword: string;
}

const emptyForm = (): AddUserFormData => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  roleId: "",
  storeId: "",
  dateOfBirth: "",
  joiningDate: "",
  password: "",
  confirmPassword: "",
});

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (userData: AddUserFormData) => void;
  roles?: { id: string; name: string }[];
  branches?: { id: string; name: string }[];
  showBranchSelect?: boolean;
  saving?: boolean;
}

export function AddUserModal({
  isOpen,
  onClose,
  onSave,
  roles = [],
  branches = [],
  showBranchSelect = false,
  saving,
}: AddUserModalProps) {
  const { language } = useLanguage();
  const t = (key: Parameters<typeof getUserManagementTranslation>[0]) =>
    getUserManagementTranslation(key, language);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<AddUserFormData>(emptyForm());

  const resetForm = () => setFormData(emptyForm());

  const handleClose = () => {
    resetForm();
    onClose();
  };

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
            <User className="w-4 h-4 text-[#0026f6]" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t("addNewUser")}</h2>
          </div>
          <button type="button" onClick={handleClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
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
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
                  placeholder={t("enterFirstName")}
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-700 dark:text-gray-300 mb-1.5 block">
                  {t("lastName")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
                  placeholder={t("enterLastName")}
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-700 dark:text-gray-300 mb-1.5 block">
                  {t("email")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
                  placeholder={t("enterEmail")}
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
                  placeholder={t("enterPhone")}
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-700 dark:text-gray-300 mb-1.5 block">
                  {t("role")} <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  value={formData.roleId}
                  onChange={(value) => setFormData({ ...formData, roleId: value })}
                  options={roles.map((role) => ({ value: role.id, label: role.name }))}
                  placeholder={t("selectRole")}
                  required
                />
              </div>
            </div>

            {showBranchSelect && (
              <div>
                <label className="text-xs text-gray-700 dark:text-gray-300 mb-1.5 block">
                  {t("branch")}
                </label>
                <CustomSelect
                  value={formData.storeId}
                  onChange={(value) => setFormData({ ...formData, storeId: value })}
                  options={[
                    { value: "", label: pickLang(language, "Şirkət səviyyəsi", "Company-wide") },
                    ...branches.map((b) => ({ value: b.id, label: b.name })),
                  ]}
                  placeholder={t("selectBranch")}
                />
              </div>
            )}

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
                  {t("password")} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full px-3 py-1.5 pr-8 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
                    placeholder={t("enterPassword")}
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-700 dark:text-gray-300 mb-1.5 block">
                  {t("confirmPassword")} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full px-3 py-1.5 pr-8 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
                    placeholder={t("confirmPasswordPlaceholder")}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirmPassword ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <button type="button" onClick={handleClose} className="px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              {t("cancel")}
            </button>
            <button type="submit" disabled={saving} className="px-3 py-1.5 text-xs bg-gradient-to-r from-[#0026f6] to-[#001db8] hover:from-[#001fc4] hover:to-[#0018a0] text-white rounded-lg font-medium transition-colors disabled:opacity-50">
              {t("addUser")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
