import { useEffect, useState } from "react";
import { X, Shield, Check, Minus } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import {
  getUserManagementTranslation,
  translateModuleName,
} from "../../i18n/userManagementTranslations";
import {
  defaultPermissionMatrix,
  isRbacModuleVisible,
  moduleSupportsManage,
  toApiPermissions,
  type RolePermission,
} from "../../lib/rolePermissions";
import { useAuth } from "../../context/AuthContext";

export interface AddRoleFormData {
  roleName: string;
  permissions: RolePermission[];
}

interface AddRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (roleData: AddRoleFormData) => void;
  saving?: boolean;
}

export function AddRoleModal({ isOpen, onClose, onSave, saving }: AddRoleModalProps) {
  const { language } = useLanguage();
  const { hasModule } = useAuth();
  const t = (key: Parameters<typeof getUserManagementTranslation>[0]) =>
    getUserManagementTranslation(key, language);

  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState<RolePermission[]>(() =>
    defaultPermissionMatrix(hasModule),
  );

  useEffect(() => {
    if (!isOpen) return;
    setPermissions(defaultPermissionMatrix(hasModule));
  }, [isOpen, hasModule]);

  const resetForm = () => {
    setRoleName("");
    setPermissions(defaultPermissionMatrix(hasModule));
  };

  const togglePermission = (
    moduleIndex: number,
    permissionType: keyof Omit<RolePermission, "module">,
  ) => {
    setPermissions((prev) => {
      const row = prev[moduleIndex];
      if (!row) return prev;
      if (permissionType === "manage" && !moduleSupportsManage(row.module)) return prev;
      const updated = [...prev];
      updated[moduleIndex] = {
        ...row,
        [permissionType]: !row[permissionType],
      };
      return updated;
    });
  };

  const toggleAll = (moduleIndex: number) => {
    setPermissions((prev) => {
      const updated = [...prev];
      const row = updated[moduleIndex];
      if (!row) return prev;
      const supportsManage = moduleSupportsManage(row.module);
      const allEnabled =
        row.view &&
        row.create &&
        row.edit &&
        row.delete &&
        (!supportsManage || row.manage);
      const next = !allEnabled;
      updated[moduleIndex] = {
        ...row,
        view: next,
        create: next,
        edit: next,
        delete: next,
        manage: supportsManage ? next : false,
      };
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim() || !onSave) return;
    onSave({ roleName: roleName.trim(), permissions: toApiPermissions(permissions) });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#14b8a6]" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t("addNewRole")}</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-120px)] scrollbar-hide">
          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs text-gray-700 dark:text-gray-300 mb-1.5 block">
                {t("roleName")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                placeholder={t("enterRoleName")}
                required
              />
            </div>

            <div>
              <label className="text-xs text-gray-700 dark:text-gray-300 mb-2 block">
                {t("modulePermissions")}
              </label>
              <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed text-xs">
                    <colgroup>
                      <col />
                      <col className="w-14" />
                      <col className="w-14" />
                      <col className="w-14" />
                      <col className="w-14" />
                      <col className="w-16" />
                      <col className="w-14" />
                    </colgroup>
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                        <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                          {t("module")}
                        </th>
                        <th className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1 py-2 text-center">
                          {t("view")}
                        </th>
                        <th className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1 py-2 text-center">
                          {t("create")}
                        </th>
                        <th className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1 py-2 text-center">
                          {t("edit")}
                        </th>
                        <th className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1 py-2 text-center">
                          {t("delete")}
                        </th>
                        <th
                          className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1 py-2 text-center"
                          title={t("managePaymentsHint")}
                        >
                          {t("managePayments")}
                        </th>
                        <th className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1 py-2 text-center">
                          {t("all")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {permissions.map((permission, index) => {
                        const moduleAvailable = isRbacModuleVisible(permission.module, hasModule);
                        const supportsManage = moduleSupportsManage(permission.module);
                        return (
                        <tr
                          key={permission.module}
                          className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
                        >
                          <td className="px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white">
                            <span className="block truncate">
                              {translateModuleName(permission.module, language)}
                              {!moduleAvailable && (
                                <span className="ml-2 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                  {t("unavailableModule")}
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-1 py-2">
                            <div className="flex justify-center">
                              <button
                                type="button"
                                disabled={!moduleAvailable}
                                onClick={() => togglePermission(index, "view")}
                                className={`inline-flex w-5 h-5 shrink-0 rounded items-center justify-center transition-colors disabled:opacity-50 ${
                                  permission.view
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                                }`}
                              >
                                {permission.view ? <Check className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>
                          <td className="px-1 py-2">
                            <div className="flex justify-center">
                              <button
                                type="button"
                                disabled={!moduleAvailable}
                                onClick={() => togglePermission(index, "create")}
                                className={`inline-flex w-5 h-5 shrink-0 rounded items-center justify-center transition-colors disabled:opacity-50 ${
                                  permission.create
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                                }`}
                              >
                                {permission.create ? <Check className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>
                          <td className="px-1 py-2">
                            <div className="flex justify-center">
                              <button
                                type="button"
                                disabled={!moduleAvailable}
                                onClick={() => togglePermission(index, "edit")}
                                className={`inline-flex w-5 h-5 shrink-0 rounded items-center justify-center transition-colors disabled:opacity-50 ${
                                  permission.edit
                                    ? "bg-[#14b8a6] text-white"
                                    : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                                }`}
                              >
                                {permission.edit ? <Check className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>
                          <td className="px-1 py-2">
                            <div className="flex justify-center">
                              <button
                                type="button"
                                disabled={!moduleAvailable}
                                onClick={() => togglePermission(index, "delete")}
                                className={`inline-flex w-5 h-5 shrink-0 rounded items-center justify-center transition-colors disabled:opacity-50 ${
                                  permission.delete
                                    ? "bg-red-500 text-white"
                                    : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                                }`}
                              >
                                {permission.delete ? <Check className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>
                          <td className="px-1 py-2">
                            <div className="flex justify-center">
                              {supportsManage ? (
                                <button
                                  type="button"
                                  disabled={!moduleAvailable}
                                  title={t("managePaymentsHint")}
                                  onClick={() => togglePermission(index, "manage")}
                                  className={`inline-flex w-5 h-5 shrink-0 rounded items-center justify-center transition-colors disabled:opacity-50 ${
                                    permission.manage
                                      ? "bg-amber-500 text-white"
                                      : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                                  }`}
                                >
                                  {permission.manage ? <Check className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                </button>
                              ) : (
                                <span className="inline-flex w-5 h-5 shrink-0 items-center justify-center text-gray-300 dark:text-gray-600" aria-hidden>
                                  <Minus className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-1 py-2">
                            <div className="flex justify-center">
                              <button
                                type="button"
                                disabled={!moduleAvailable}
                                onClick={() => toggleAll(index)}
                                className={`inline-flex w-5 h-5 shrink-0 rounded items-center justify-center transition-colors disabled:opacity-50 ${
                                  permission.view &&
                                  permission.create &&
                                  permission.edit &&
                                  permission.delete &&
                                  (!supportsManage || permission.manage)
                                    ? "bg-purple-500 text-white"
                                    : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                                }`}
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-3 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {t("createRole")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
