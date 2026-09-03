import { useState, useEffect } from "react";
import { X, Shield, Check, Minus } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import {
  getUserManagementTranslation,
  translateModuleName,
} from "../../i18n/userManagementTranslations";
import type { TenantRoleRow } from "../../api/userManagement";
import {
  defaultPermissionMatrix,
  isRbacModuleVisible,
  mergeApiPermissions,
  toApiPermissionsPreservingHidden,
  type RolePermission,
} from "../../lib/rolePermissions";
import { useAuth } from "../../context/AuthContext";

export interface EditRoleFormData {
  id: string;
  roleName: string;
  permissions: RolePermission[];
}

interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (roleData: EditRoleFormData) => void;
  role: TenantRoleRow | null;
  saving?: boolean;
}

export function EditRoleModal({ isOpen, onClose, onSave, role, saving }: EditRoleModalProps) {
  const { language } = useLanguage();
  const { hasModule } = useAuth();
  const t = (key: Parameters<typeof getUserManagementTranslation>[0]) =>
    getUserManagementTranslation(key, language);

  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState<RolePermission[]>(() =>
    defaultPermissionMatrix(hasModule),
  );

  useEffect(() => {
    if (role) {
      setRoleName(role.name);
      setPermissions(
        role.permissions?.length
          ? mergeApiPermissions(role.permissions, hasModule)
          : defaultPermissionMatrix(hasModule),
      );
    }
  }, [role, hasModule]);

  const togglePermission = (
    moduleIndex: number,
    permissionType: keyof Omit<RolePermission, "module">,
  ) => {
    setPermissions((prev) => {
      const updated = [...prev];
      updated[moduleIndex] = {
        ...updated[moduleIndex],
        [permissionType]: !updated[moduleIndex][permissionType],
      };
      return updated;
    });
  };

  const toggleAll = (moduleIndex: number) => {
    setPermissions((prev) => {
      const updated = [...prev];
      const row = updated[moduleIndex];
      const allEnabled = row.view && row.create && row.edit && row.delete;
      updated[moduleIndex] = {
        ...row,
        view: !allEnabled,
        create: !allEnabled,
        edit: !allEnabled,
        delete: !allEnabled,
      };
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim() || !role || !onSave) return;
    onSave({
      id: role.id,
      roleName: roleName.trim(),
      permissions: toApiPermissionsPreservingHidden(permissions, role.permissions, hasModule),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#14b8a6]" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {t("editRole")}: {role?.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
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
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                        <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                          {t("module")}
                        </th>
                        <th className="text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                          {t("view")}
                        </th>
                        <th className="text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                          {t("create")}
                        </th>
                        <th className="text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                          {t("edit")}
                        </th>
                        <th className="text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                          {t("delete")}
                        </th>
                        <th className="text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                          {t("all")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {permissions.map((permission, index) => {
                        const moduleAvailable = isRbacModuleVisible(permission.module, hasModule);
                        return (
                        <tr
                          key={permission.module}
                          className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
                        >
                          <td className="px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                            {translateModuleName(permission.module, language)}
                            {!moduleAvailable && (
                              <span className="ml-2 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                {t("unavailableModule")}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              disabled={!moduleAvailable}
                              onClick={() => togglePermission(index, "view")}
                              className={`w-5 h-5 rounded flex items-center justify-center transition-colors disabled:opacity-50 ${
                                permission.view
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                              }`}
                            >
                              {permission.view ? <Check className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                            </button>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              disabled={!moduleAvailable}
                              onClick={() => togglePermission(index, "create")}
                              className={`w-5 h-5 rounded flex items-center justify-center transition-colors disabled:opacity-50 ${
                                permission.create
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                              }`}
                            >
                              {permission.create ? <Check className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                            </button>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              disabled={!moduleAvailable}
                              onClick={() => togglePermission(index, "edit")}
                              className={`w-5 h-5 rounded flex items-center justify-center transition-colors disabled:opacity-50 ${
                                permission.edit
                                  ? "bg-[#14b8a6] text-white"
                                  : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                              }`}
                            >
                              {permission.edit ? <Check className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                            </button>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              disabled={!moduleAvailable}
                              onClick={() => togglePermission(index, "delete")}
                              className={`w-5 h-5 rounded flex items-center justify-center transition-colors disabled:opacity-50 ${
                                permission.delete
                                  ? "bg-red-500 text-white"
                                  : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                              }`}
                            >
                              {permission.delete ? <Check className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                            </button>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              disabled={!moduleAvailable}
                              onClick={() => toggleAll(index)}
                              className={`w-5 h-5 rounded flex items-center justify-center transition-colors disabled:opacity-50 ${
                                permission.view &&
                                permission.create &&
                                permission.edit &&
                                permission.delete
                                  ? "bg-purple-500 text-white"
                                  : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                              }`}
                            >
                              <Check className="w-3 h-3" />
                            </button>
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
              onClick={onClose}
              className="px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-3 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {t("saveChanges")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
