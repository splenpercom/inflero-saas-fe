import { useState, useEffect, useCallback } from "react";
import { cn } from "../ui/utils";
import {
  Search,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  Shield,
  UserPlus,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { formatNowDate, formatNowDateTime } from "../../lib/dateFormat";
import { useAuth } from "../../context/AuthContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useBranchRevision } from "../../hooks/useBranchRevision";
import { NoAccessPanel } from "../permissions/NoAccessPanel";
import { PermissionGate } from "../permissions/PermissionGate";
import { translateModuleName } from "../../i18n/userManagementTranslations";
import { isRbacModuleVisible } from "../../lib/rolePermissions";
import { ViewUserModal } from "./ViewUserModal";
import { AddUserModal, type AddUserFormData } from "./AddUserModal";
import { AddRoleModal } from "./AddRoleModal";
import { EditRoleModal } from "./EditRoleModal";
import { EditUserModal, type EditUserFormData } from "./EditUserModal";
import { CustomSelect } from "../ui/CustomSelect";
import {
  createTenantRole,
  createTenantUser,
  deleteTenantRole,
  deleteTenantUser,
  fetchTenantRoles,
  fetchTenantUsers,
  updateTenantRole,
  updateTenantUser,
  type TenantRoleRow,
  type TenantUserRow,
} from "../../api/userManagement";
import { fetchStores } from "../../api/stores";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { useConfirm } from "../../context/ConfirmContext";
import { DataPagination } from "../ui/DataPagination";
import { usePagination, DEFAULT_LIST_PAGE_SIZE } from "../../hooks/usePagination";

import { pickLang, mapLang } from "../../i18n/pickLang";
export function UserManagement() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated, user: authUser, hasModule } = useAuth();
  const { canView, canCreate, canEdit, canDelete } = useModulePermissions("User Management");
  const branchRevision = useBranchRevision();
  const askConfirm = useConfirm();

  const [activeTab, setActiveTab] = useState<"users" | "roles">("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [users, setUsers] = useState<TenantUserRow[]>([]);
  const [roles, setRoles] = useState<TenantRoleRow[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);

  const [viewUserModalOpen, setViewUserModalOpen] = useState(false);
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [addRoleModalOpen, setAddRoleModalOpen] = useState(false);
  const [editRoleModalOpen, setEditRoleModalOpen] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TenantUserRow | null>(null);
  const [selectedRole, setSelectedRole] = useState<TenantRoleRow | null>(null);

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const ut = (key: string) => {
    const translations: Record<string, { en: string; az: string }> = {
      users: { en: "Users", az: "İstifadəçilər" },
      rolesPermission: { en: "Roles & Permission", az: "Rollar və İcazələr" },
      manageUsers: { en: "Manage your users", az: "İstifadəçilərinizi idarə edin" },
      manageRoles: { en: "Manage your roles", az: "Rollarınızı idarə edin" },
      search: { en: "Search...", az: "Axtar..." },
      all: { en: "All", az: "Hamısı" },
      active: { en: "Active", az: "Aktiv" },
      inactive: { en: "Inactive", az: "Qeyri-aktiv" },
      status: { en: "Status", az: "Status" },
      addUser: { en: "Add User", az: "İstifadəçi Əlavə et" },
      addRole: { en: "Add Role", az: "Rol Əlavə et" },
      userName: { en: "User Name", az: "İstifadəçi Adı" },
      phone: { en: "Phone", az: "Telefon" },
      email: { en: "Email", az: "Email" },
      role: { en: "Role", az: "Rol" },
      actions: { en: "Actions", az: "Əməliyyatlar" },
      roleName: { en: "Role", az: "Rol" },
      createdDate: { en: "Created Date", az: "Yaradılma Tarixi" },
      activeStatus: { en: "Active", az: "Aktiv" },
      inactiveStatus: { en: "Inactive", az: "Qeyri-aktiv" },
      deleteUserConfirm: {
        en: "Are you sure you want to delete this user?",
        az: "Bu istifadəçini silmək istədiyinizə əminsiniz?",
      },
      deleteRoleConfirm: {
        en: "Are you sure you want to delete this role?",
        az: "Bu rolu silmək istədiyinizə əminsiniz?",
      },
      refreshed: { en: "Refreshed!", az: "Yeniləndi!" },
      userListTitle: { en: "User List", az: "İstifadəçi Siyahısı" },
      rolesListTitle: { en: "Roles List", az: "Rollar Siyahısı" },
      generated: { en: "Generated", az: "Yaradıldı" },
      team: { en: "Team", az: "Komanda" },
      noUsers: { en: "No users found", az: "İstifadəçi tapılmadı" },
      noRoles: { en: "No roles found", az: "Rol tapılmadı" },
      loading: { en: "Loading...", az: "Yüklənir..." },
      passwordMismatch: { en: "Passwords do not match", az: "Şifrələr uyğun gəlmir" },
      userAdded: { en: "User added successfully", az: "İstifadəçi əlavə edildi" },
      userUpdated: { en: "User updated successfully", az: "İstifadəçi yeniləndi" },
      userDeleted: { en: "User deleted", az: "İstifadəçi silindi" },
      roleAdded: { en: "Role created successfully", az: "Rol yaradıldı" },
      roleUpdated: { en: "Role updated successfully", az: "Rol yeniləndi" },
      roleDeleted: { en: "Role deleted", az: "Rol silindi" },
    };
    return mapLang(language, translations[key], key);
  };

  const loadRoles = useCallback(async () => {
    if ((!(isAuthenticated || isDemo)) || !canView) {
      setRoles([]);
      return;
    }
    try {
      const rows = await fetchTenantRoles();
      setRoles(rows);
    } catch (err) {
      notifyFromError(err, tr("Rolları yükləmək alınmadı", "Failed to load roles"));
    }
  }, [isAuthenticated, isDemo, canView, language, branchRevision]);

  const loadUsers = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setUsers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await fetchTenantUsers();
      setUsers(rows);
    } catch (err) {
      notifyFromError(err, tr("İstifadəçiləri yükləmək alınmadı", "Failed to load users"));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isDemo, canView, language, branchRevision]);

  const loadBranches = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || authUser?.storeId) {
      setBranches([]);
      return;
    }
    try {
      const stores = await fetchStores();
      setBranches(stores.map((s) => ({ id: s.id, name: s.name })));
    } catch {
      setBranches([]);
    }
  }, [isAuthenticated, isDemo, authUser?.storeId]);

  useEffect(() => {
    void loadRoles();
    void loadUsers();
    void loadBranches();
  }, [loadRoles, loadUsers, loadBranches]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery);
    const matchesStatus =
      statusFilter === "all" || user.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredRoles = roles.filter((role) => {
    const matchesSearch = role.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || role.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const {
    currentPage: usersPage,
    totalPages: usersTotalPages,
    totalItems: usersTotalItems,
    paginatedData: paginatedUsers,
    setCurrentPage: setUsersPage,
    itemsPerPage: usersItemsPerPage,
  } = usePagination({
    data: filteredUsers,
    itemsPerPage: DEFAULT_LIST_PAGE_SIZE,
    resetKey: `${searchQuery}|${statusFilter}`,
  });

  const {
    currentPage: rolesPage,
    totalPages: rolesTotalPages,
    totalItems: rolesTotalItems,
    paginatedData: paginatedRoles,
    setCurrentPage: setRolesPage,
    itemsPerPage: rolesItemsPerPage,
  } = usePagination({
    data: filteredRoles,
    itemsPerPage: DEFAULT_LIST_PAGE_SIZE,
    resetKey: `${searchQuery}|${statusFilter}`,
  });

  const handleExportPDF = () => {
    import("jspdf")
      .then((jsPDFModule) => {
        import("jspdf-autotable").then(() => {
          const jsPDF = jsPDFModule.default;
          const doc = new jsPDF() as any;
          doc.setFontSize(16);
          const title = activeTab === "users" ? ut("userListTitle") : ut("rolesListTitle");
          doc.text(title, 14, 15);
          doc.setFontSize(10);
          doc.text(`${ut("generated")}: ${formatNowDate(language)}`, 14, 22);

          if (activeTab === "users") {
            const headers = [[ut("userName"), ut("phone"), ut("email"), ut("role"), ut("team"), ut("status")]];
            const data = filteredUsers.map((user) => [
              user.name,
              user.phone,
              user.email,
              user.role,
              user.team,
              user.status,
            ]);
            doc.autoTable({ head: headers, body: data, startY: 28, theme: "grid" });
            doc.save(`users_${new Date().toISOString().split("T")[0]}.pdf`);
          } else {
            const headers = [[ut("roleName"), ut("createdDate"), ut("status")]];
            const data = filteredRoles.map((role) => [role.name, role.createdDate, role.status]);
            doc.autoTable({ head: headers, body: data, startY: 28, theme: "grid" });
            doc.save(`roles_${new Date().toISOString().split("T")[0]}.pdf`);
          }
        });
      })
      .catch(() => {
        notifyFromError(null, tr("PDF yaradıla bilmədi", "Failed to generate PDF"));
      });
  };

  const handleExportExcel = () => {
    if (activeTab === "users") {
      const headers = [ut("userName"), ut("phone"), ut("email"), ut("role"), ut("team"), ut("status")];
      const rows = filteredUsers.map((user) => [
        user.name,
        user.phone,
        user.email,
        user.role,
        user.team,
        user.status,
      ]);
      let csvContent = headers.join(";") + "\n";
      rows.forEach((row) => {
        csvContent += row.join(";") + "\n";
      });
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `users_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } else {
      const headers = [ut("roleName"), ut("createdDate"), ut("status")];
      const rows = filteredRoles.map((role) => [role.name, role.createdDate, role.status]);
      let csvContent = headers.join(";") + "\n";
      rows.forEach((row) => {
        csvContent += row.join(";") + "\n";
      });
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `roles_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    const task = activeTab === "users" ? loadUsers() : loadRoles();
    void task.finally(() => {
      setIsRefreshing(false);
      notifySuccess(ut("refreshed"));
    });
  };

  const handleSaveUser = async (data: AddUserFormData) => {
    if (!isAuthenticated || !canCreate) return;
    if (data.password !== data.confirmPassword) {
      notifyFromError(null, ut("passwordMismatch"));
      return;
    }
    setSaving(true);
    try {
      await createTenantUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        roleId: data.roleId,
        storeId: data.storeId || null,
        dateOfBirth: data.dateOfBirth || null,
        dateOfJoin: data.joiningDate || null,
      });
      notifySuccess(ut("userAdded"));
      setAddUserModalOpen(false);
      void loadUsers();
    } catch (err) {
      notifyFromError(err, tr("İstifadəçi əlavə edilə bilmədi", "Failed to add user"));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUser = async (data: EditUserFormData) => {
    if (!isAuthenticated || !canEdit) return;
    if (data.password && data.password !== data.confirmPassword) {
      notifyFromError(null, ut("passwordMismatch"));
      return;
    }
    setSaving(true);
    try {
      await updateTenantUser(data.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        roleId: data.roleId,
        status: data.status,
        dateOfBirth: data.dateOfBirth || null,
        dateOfJoin: data.joiningDate || null,
        newPassword: data.password || null,
      });
      notifySuccess(ut("userUpdated"));
      setEditUserModalOpen(false);
      setSelectedUser(null);
      void loadUsers();
    } catch (err) {
      notifyFromError(err, tr("İstifadəçi yenilənə bilmədi", "Failed to update user"));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRole = async (roleData: { roleName: string; permissions: import("../../lib/rolePermissions").RolePermission[] }) => {
    if (!isAuthenticated || !canCreate) return;
    setSaving(true);
    try {
      await createTenantRole({ name: roleData.roleName, permissions: roleData.permissions });
      notifySuccess(ut("roleAdded"));
      setAddRoleModalOpen(false);
      void loadRoles();
    } catch (err) {
      notifyFromError(err, tr("Rol yaradıla bilmədi", "Failed to create role"));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRole = async (roleData: {
    id: string;
    roleName: string;
    permissions: import("../../lib/rolePermissions").RolePermission[];
  }) => {
    if (!isAuthenticated || !canEdit) return;
    setSaving(true);
    try {
      await updateTenantRole(roleData.id, {
        name: roleData.roleName,
        permissions: roleData.permissions,
      });
      notifySuccess(ut("roleUpdated"));
      setEditRoleModalOpen(false);
      setSelectedRole(null);
      void loadRoles();
    } catch (err) {
      notifyFromError(err, tr("Rol yenilənə bilmədi", "Failed to update role"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAuthenticated || !canDelete) return;
    const confirmMsg =
      activeTab === "users" ? ut("deleteUserConfirm") : ut("deleteRoleConfirm");
    if (!(await askConfirm({
      title: tr("Silmə təsdiqi", "Confirm deletion"),
      message: confirmMsg,
      variant: "danger",
    }))) return;

    setSaving(true);
    try {
      if (activeTab === "users") {
        await deleteTenantUser(id);
        notifySuccess(ut("userDeleted"));
        void loadUsers();
      } else {
        await deleteTenantRole(id);
        notifySuccess(ut("roleDeleted"));
        void loadRoles();
      }
    } catch (err) {
      notifyFromError(
        err,
        activeTab === "users"
          ? tr("İstifadəçi silinə bilmədi", "Failed to delete user")
          : tr("Rol silinə bilmədi", "Failed to delete role"),
      );
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: "Active" | "Inactive") => {
    if (status === "Active") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
          ● {ut("activeStatus")}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700">
        ● {ut("inactiveStatus")}
      </span>
    );
  };

  const roleOptions = roles.map((r) => ({ id: r.id, name: r.name }));

  if (!canView && isAuthenticated) {
    return <NoAccessPanel />;
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {activeTab === "users" ? ut("users") : ut("rolesPermission")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {activeTab === "users" ? ut("manageUsers") : ut("manageRoles")}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex-1 relative max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={ut("search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <CustomSelect
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                options={[
                  { value: "all", label: ut("all") },
                  { value: "active", label: ut("active") },
                  { value: "inactive", label: ut("inactive") },
                ]}
                placeholder={ut("status")}
                className="min-w-[100px]"
              />

              <button
                type="button"
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-red-500" />
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
              </button>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
              </button>

              {activeTab === "users" && (
                <PermissionGate module="User Management" action="create">
                  <button
                    type="button"
                    onClick={() => setAddUserModalOpen(true)}
                    disabled={isDemo}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{ut("addUser")}</span>
                  </button>
                </PermissionGate>
              )}

              {activeTab === "roles" && (
                <PermissionGate module="User Management" action="create">
                  <button
                    type="button"
                    onClick={() => setAddRoleModalOpen(true)}
                    disabled={isDemo}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>{ut("addRole")}</span>
                  </button>
                </PermissionGate>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={cn(
              "px-4 py-2 text-xs font-medium rounded-lg transition-colors",
              activeTab === "users"
                ? "bg-[#14b8a6] text-white shadow-sm"
                : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800",
            )}
          >
            {ut("users")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("roles")}
            className={cn(
              "px-4 py-2 text-xs font-medium rounded-lg transition-colors",
              activeTab === "roles"
                ? "bg-[#14b8a6] text-white shadow-sm"
                : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800",
            )}
          >
            {ut("rolesPermission")}
          </button>
        </div>

        {activeTab === "users" && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                      {ut("userName")}
                    </th>
                    <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                      {ut("phone")}
                    </th>
                    <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                      {ut("email")}
                    </th>
                    <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                      {ut("role")}
                    </th>
                    <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                      {ut("status")}
                    </th>
                    <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                      {ut("actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-xs text-gray-500">
                        {ut("loading")}
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-xs text-gray-500">
                        {ut("noUsers")}
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user, index) => (
                      <tr
                        key={user.id}
                        className={`border-b border-gray-200 dark:border-gray-800 ${
                          index % 2 === 0
                            ? "bg-white dark:bg-gray-900"
                            : "bg-gray-50 dark:bg-gray-800/30"
                        }`}
                      >
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-xs font-medium border border-gray-300 dark:border-gray-700">
                              {user.avatar}
                            </div>
                            <span className="text-xs text-gray-900 dark:text-white">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {user.phone}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {user.email}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            {user.role}
                            {user.isTenantOwner && (
                              <span className="px-1.5 py-0.5 rounded bg-[#14b8a6]/10 text-[#14b8a6] text-[10px] font-medium">
                                {tr("Sahib", "Owner")}
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">{getStatusBadge(user.status)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUser(user);
                                setViewUserModalOpen(true);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            <PermissionGate module="User Management" action="edit">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setEditUserModalOpen(true);
                                }}
                                disabled={isDemo}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </PermissionGate>
                            <PermissionGate module="User Management" action="delete">
                              <button
                                type="button"
                                onClick={() => void handleDelete(user.id)}
                                disabled={isDemo || saving || user.isTenantOwner}
                                title={
                                  user.isTenantOwner
                                    ? tr("Şirkət sahibini silmək olmaz", "Cannot delete the company owner")
                                    : undefined
                                }
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </PermissionGate>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-800">
              <DataPagination
                currentPage={usersPage}
                totalPages={usersTotalPages}
                onPageChange={setUsersPage}
                totalItems={usersTotalItems}
                itemsPerPage={usersItemsPerPage}
                showText={{
                  showing: tr("Göstərilir", "Showing"),
                  to: tr("-", "to"),
                  of: tr("/", "of"),
                  results: tr("nəticə", "results"),
                }}
              />
            </div>
          </div>
        )}

        {activeTab === "roles" && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                      {ut("roleName")}
                    </th>
                    <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                      {ut("createdDate")}
                    </th>
                    <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                      {ut("status")}
                    </th>
                    <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                      {ut("actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-xs text-gray-500">
                        {ut("noRoles")}
                      </td>
                    </tr>
                  ) : (
                    paginatedRoles.map((role, index) => (
                      <tr
                        key={role.id}
                        className={`border-b border-gray-200 dark:border-gray-800 ${
                          index % 2 === 0
                            ? "bg-white dark:bg-gray-900"
                            : "bg-gray-50 dark:bg-gray-800/30"
                        }`}
                      >
                        <td className="px-3 py-2 text-xs text-gray-900 dark:text-white whitespace-nowrap">
                          <div>
                            <div>{role.name}</div>
                            {role.permissions && role.permissions.length > 0 && (
                              <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                {role.permissions
                                  .filter((p) => p.view && isRbacModuleVisible(p.module, hasModule))
                                  .map((p) => translateModuleName(p.module, language))
                                  .join(", ") || "—"}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {role.createdDate}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">{getStatusBadge(role.status)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <PermissionGate module="User Management" action="edit">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRole(role);
                                  setEditRoleModalOpen(true);
                                }}
                                disabled={isDemo}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </PermissionGate>
                            <PermissionGate module="User Management" action="delete">
                              <button
                                type="button"
                                onClick={() => void handleDelete(role.id)}
                                disabled={isDemo || saving}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </PermissionGate>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-800">
              <DataPagination
                currentPage={rolesPage}
                totalPages={rolesTotalPages}
                onPageChange={setRolesPage}
                totalItems={rolesTotalItems}
                itemsPerPage={rolesItemsPerPage}
                showText={{
                  showing: tr("Göstərilir", "Showing"),
                  to: tr("-", "to"),
                  of: tr("/", "of"),
                  results: tr("nəticə", "results"),
                }}
              />
            </div>
          </div>
        )}
      </div>

      <ViewUserModal
        isOpen={viewUserModalOpen}
        onClose={() => setViewUserModalOpen(false)}
        user={selectedUser}
      />
      <AddUserModal
        key={addUserModalOpen ? "add-user-open" : "add-user-closed"}
        isOpen={addUserModalOpen}
        onClose={() => setAddUserModalOpen(false)}
        onSave={handleSaveUser}
        roles={roleOptions}
        branches={branches}
        showBranchSelect={!authUser?.storeId && branches.length > 0}
        saving={saving}
      />
      <AddRoleModal
        key={addRoleModalOpen ? "add-role-open" : "add-role-closed"}
        isOpen={addRoleModalOpen}
        onClose={() => setAddRoleModalOpen(false)}
        onSave={handleSaveRole}
        saving={saving}
      />
      <EditRoleModal
        isOpen={editRoleModalOpen}
        onClose={() => {
          setEditRoleModalOpen(false);
          setSelectedRole(null);
        }}
        role={selectedRole}
        onSave={handleUpdateRole}
        saving={saving}
      />
      <EditUserModal
        isOpen={editUserModalOpen}
        onClose={() => {
          setEditUserModalOpen(false);
          setSelectedUser(null);
        }}
        onSave={handleUpdateUser}
        user={selectedUser}
        roles={roleOptions}
        saving={saving}
      />
    </div>
  );
}
