import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Briefcase, Calendar, Mail, Phone } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { getUserManagementTranslation } from "../../i18n/userManagementTranslations";
import { useAuth } from "../../context/AuthContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { NoAccessPanel } from "../permissions/NoAccessPanel";
import { formatDate } from "../../lib/dateFormat";
import {
  fetchTenantUserCommission,
  fetchTenantUsers,
  updateTenantUser,
  type TenantUserRow,
  type UserCommissionDetail,
} from "../../api/userManagement";
import { fetchTenantRoles } from "../../api/userManagement";
import { fetchStores } from "../../api/stores";
import { EditUserModal, type EditUserFormData } from "./EditUserModal";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { pickLang } from "../../i18n/pickLang";

type ProfileTab = "expenses" | "commissions" | "offers";

const MOCK_EXPENSES = [
  { id: "EXP-001", date: "2026-09-01", category: "Meals", description: "Client dinner", amount: 120, status: "Approved" },
  { id: "EXP-002", date: "2026-08-28", category: "Transport", description: "Taxi to airport", amount: 45, status: "Approved" },
  { id: "EXP-003", date: "2026-08-20", category: "Accommodation", description: "Business trip", amount: 380, status: "Pending" },
  { id: "EXP-004", date: "2026-08-10", category: "Meals", description: "Team lunch", amount: 210, status: "Approved" },
  { id: "EXP-005", date: "2026-07-25", category: "Other", description: "Office supplies", amount: 65, status: "Rejected" },
];

const MOCK_COMMISSIONS = [
  { id: "COM-001", offer: "Istanbul Business Package", amount: 450, rate: 10, date: "2026-08-25", status: "Paid" },
  { id: "COM-002", offer: "Baku City Tour", amount: 120, rate: 10, date: "2026-08-10", status: "Paid" },
  { id: "COM-003", offer: "Dubai Luxury Package", amount: 680, rate: 10, date: "2026-08-28", status: "Pending" },
];

const MOCK_OFFERS = [
  { id: "OF-001", title: "Istanbul Business Package", client: "Nigar Babayeva", value: 4500, status: "Completed", date: "2026-08-15" },
  { id: "OF-002", title: "Baku City Tour", client: "Anar Həsənov", value: 1200, status: "Completed", date: "2026-08-10" },
  { id: "OF-003", title: "Georgia Adventure Trip", client: "Sevinc Əhmədova", value: 2100, status: "Active", date: "2026-09-01" },
  { id: "OF-004", title: "Dubai Luxury Package", client: "Leyla Əliyeva", value: 6800, status: "Pending", date: "2026-08-28" },
];

const EXPENSE_STATUS: Record<string, string> = {
  Approved: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700",
  Pending: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700",
  Rejected: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700",
};

const OFFER_STATUS: Record<string, string> = {
  Completed: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700",
  Active: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700",
  Pending: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700",
};

function formatMoney(value: string | number | null | undefined) {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? "0"));
  if (Number.isNaN(n)) return "₼0.00";
  return `₼${n.toFixed(2)}`;
}

function rateLabel(
  type: "FIXED" | "PERCENT" | null | undefined,
  value: string | null | undefined,
  t: (key: string) => string,
) {
  if (!type || value == null || value === "") return "—";
  if (type === "PERCENT") return `${value}% (${t("commissionPercent")})`;
  return `${formatMoney(value)} (${t("commissionFixed")})`;
}

export function UserDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { isDemo, isAuthenticated, user: authUser, hasModule } = useAuth();
  const { canView, canEdit } = useModulePermissions("User Management");
  const t = (key: string) => getUserManagementTranslation(key as any, language);
  const tr = (az: string, en: string) => pickLang(language, az, en);

  const [user, setUser] = useState<TenantUserRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>("expenses");
  const [expenseFilter, setExpenseFilter] = useState("all");
  const [offerFilter, setOfferFilter] = useState("all");
  const [commission, setCommission] = useState<UserCommissionDetail | null>(null);
  const [commissionLoading, setCommissionLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [managerRoleId, setManagerRoleId] = useState<string | undefined>();

  const selectClass =
    "w-full max-w-xs px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300";

  useEffect(() => {
    if (!(isAuthenticated || isDemo) || !canView || !id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchTenantUsers()
      .then((list) => {
        if (!cancelled) setUser(list.find((u) => u.id === id) ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isAuthenticated, isDemo, canView]);

  useEffect(() => {
    if (!user || !(isAuthenticated || isDemo)) {
      setCommission(null);
      return;
    }
    let cancelled = false;
    setCommissionLoading(true);
    fetchTenantUserCommission(user.id)
      .then((data) => {
        if (!cancelled) setCommission(data);
      })
      .catch(() => {
        if (!cancelled) setCommission(null);
      })
      .finally(() => {
        if (!cancelled) setCommissionLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, isAuthenticated, isDemo]);

  useEffect(() => {
    if (!(isAuthenticated || isDemo) || !canEdit) return;
    let cancelled = false;
    Promise.all([fetchTenantRoles(), fetchStores()])
      .then(([roleRows, stores]) => {
        if (cancelled) return;
        setRoles(roleRows.map((r) => ({ id: r.id, name: r.name })));
        const mgr = roleRows.find((r) => /manager/i.test(r.name));
        setManagerRoleId(mgr?.id);
        setBranches(stores.map((s) => ({ id: s.id, name: s.name })));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isDemo, canEdit]);

  if (!canView && isAuthenticated) {
    return <NoAccessPanel />;
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#14b8a6] border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">{tr("İşçi tapılmadı.", "Employee not found.")}</p>
          <button
            type="button"
            onClick={() => navigate("/dashboard/user-management")}
            className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="w-3 h-3" />
            {t("backToList")}
          </button>
        </div>
      </div>
    );
  }

  const showCommission = Boolean(commission?.hasCommission);
  const filteredExpenses =
    expenseFilter === "all" ? MOCK_EXPENSES : MOCK_EXPENSES.filter((e) => e.status === expenseFilter);
  const filteredOffers =
    offerFilter === "all" ? MOCK_OFFERS : MOCK_OFFERS.filter((o) => o.status === offerFilter);

  const tabs: { key: ProfileTab; label: string }[] = [
    { key: "expenses", label: tr("Xərclər", "Expenses") },
    { key: "commissions", label: tr("Komissiyalar", "Commissions") },
    { key: "offers", label: tr("Təkliflər", "Offers") },
  ];

  async function handleSaveUser(form: EditUserFormData) {
    if (!user) return;
    setSaving(true);
    try {
      const updated = await updateTenantUser(user.id, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || null,
        roleId: form.roleId,
        managedStoreIds: form.managedStoreIds,
        status: form.status,
        dateOfBirth: form.dateOfBirth || null,
        dateOfJoin: form.joiningDate || null,
        newPassword: form.password || null,
        canPlacePosOrder: form.canPlacePosOrder,
      });
      setUser(updated);
      setEditOpen(false);
      notifySuccess(tr("İşçi yeniləndi", "Employee updated"));
    } catch (err) {
      notifyFromError(err, tr("Yeniləmə uğursuz oldu", "Update failed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        <button
          type="button"
          onClick={() => navigate("/dashboard/user-management")}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors mb-4"
        >
          <ArrowLeft className="w-3 h-3" />
          {t("backToList")}
        </button>

        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#14b8a6] flex items-center justify-center flex-shrink-0 text-2xl border-2 border-[#14b8a6]/30">
              {user.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg xl:text-xl font-semibold text-gray-900 dark:text-white">{user.name}</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#ccfbf1] dark:bg-[#14b8a6]/20 text-[#14b8a6] border border-[#14b8a6]/20">
                  {user.role}
                </span>
                {user.employeeId ? (
                  <span className="text-xs text-gray-500 dark:text-gray-400">{user.employeeId}</span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Mail className="w-3 h-3" />
                  {user.email}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Phone className="w-3 h-3" />
                  {user.phone || "—"}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Briefcase className="w-3 h-3" />
                  {user.team || "—"}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="w-3 h-3" />
                  {user.dateOfJoin || "—"}
                </span>
              </div>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                disabled={isDemo}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#14b8a6] hover:bg-[#0d9488] text-white disabled:opacity-50"
              >
                {t("editProfile")}
              </button>
            )}
          </div>
        </div>

        {/* Profile details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{t("basicInformation")}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-gray-500 uppercase">{t("phone")}</div>
                <div className="text-xs text-gray-900 dark:text-white mt-0.5">{user.phone || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase">{t("email")}</div>
                <div className="text-xs text-gray-900 dark:text-white mt-0.5 break-all">{user.email}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase">{t("birthday")}</div>
                <div className="text-xs text-gray-900 dark:text-white mt-0.5">{user.birthday || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase">{t("branch")}</div>
                <div className="text-xs text-gray-900 dark:text-white mt-0.5">{user.branch || "—"}</div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{t("bankInformation")}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-gray-500 uppercase">{t("bankName")}</div>
                <div className="text-xs text-gray-900 dark:text-white mt-0.5">{user.bankName || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase">{t("accountNumber")}</div>
                <div className="text-xs text-gray-900 dark:text-white mt-0.5">{user.accountNo || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase">{t("ifscCode")}</div>
                <div className="text-xs text-gray-900 dark:text-white mt-0.5">{user.ifsc || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase">{t("branch")}</div>
                <div className="text-xs text-gray-900 dark:text-white mt-0.5">{user.branch || "—"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 pb-2.5 pt-0.5 text-xs font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.key
                  ? "border-[#14b8a6] text-[#14b8a6]"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "expenses" && (
          <div>
            <div className="mb-3">
              <select
                value={expenseFilter}
                onChange={(e) => setExpenseFilter(e.target.value)}
                className={selectClass}
              >
                <option value="all">{tr("Bütün Statuslar", "All Statuses")}</option>
                <option value="Approved">{tr("Təsdiqlənib", "Approved")}</option>
                <option value="Pending">{tr("Gözləyir", "Pending")}</option>
                <option value="Rejected">{tr("Rədd edilib", "Rejected")}</option>
              </select>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    {["ID", "Date", "Category", "Description", "Amount", "Status"].map((h) => (
                      <th key={h} className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((exp, i) => (
                    <tr key={exp.id} className={i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/30"}>
                      <td className="px-3 py-2 text-xs font-mono text-gray-500">{exp.id}</td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{exp.date}</td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{exp.category}</td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{exp.description}</td>
                      <td className="px-3 py-2 text-xs font-medium text-gray-900 dark:text-white">${exp.amount}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${EXPENSE_STATUS[exp.status] ?? ""}`}>
                          {exp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "commissions" && (
          <div className="space-y-4">
            {!commissionLoading && showCommission && commission && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{t("commissionRecord")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase">{t("configuredRate")}</div>
                    <div className="text-xs font-medium text-gray-900 dark:text-white mt-0.5">
                      {rateLabel(commission.biller?.commissionType, commission.biller?.commissionValue, t)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase">{t("totalCommission")}</div>
                    <div className="text-xs font-semibold text-[#14b8a6] mt-0.5">
                      {formatMoney(commission.totals.totalCommission)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase">{t("commissionSales")}</div>
                    <div className="text-xs text-gray-900 dark:text-white mt-0.5">
                      {commission.totals.saleCount} · {formatMoney(commission.totals.totalSales)}
                    </div>
                  </div>
                </div>
                {commission.records.length > 0 && (
                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="w-full min-w-[640px]">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/50 text-left">
                          <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase">{t("saleReference")}</th>
                          <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase">{t("saleDate")}</th>
                          <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase">{t("customer")}</th>
                          <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase text-right">{t("saleTotal")}</th>
                          <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase text-right">{t("commissionAmount")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commission.records.map((row) => (
                          <tr key={row.posOrderId} className="border-t border-gray-100 dark:border-gray-800">
                            <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">{row.reference}</td>
                            <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{formatDate(row.date, language)}</td>
                            <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{row.customerName ?? "—"}</td>
                            <td className="px-3 py-2 text-xs text-right text-gray-900 dark:text-white">{formatMoney(row.grandTotal)}</td>
                            <td className="px-3 py-2 text-xs text-right font-medium text-gray-900 dark:text-white">{formatMoney(row.commissionAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    {["Offer", "Amount", "Rate", "Date", "Status"].map((h) => (
                      <th key={h} className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_COMMISSIONS.map((c, i) => (
                    <tr key={c.id} className={i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/30"}>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{c.offer}</td>
                      <td className="px-3 py-2 text-xs font-medium text-gray-900 dark:text-white">${c.amount}</td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{c.rate}%</td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{c.date}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                            c.status === "Paid"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700"
                              : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "offers" && (
          <div>
            <div className="mb-3">
              <select
                value={offerFilter}
                onChange={(e) => setOfferFilter(e.target.value)}
                className={selectClass}
              >
                <option value="all">{tr("Bütün Statuslar", "All Statuses")}</option>
                <option value="Active">{tr("Aktiv", "Active")}</option>
                <option value="Completed">{tr("Tamamlandı", "Completed")}</option>
                <option value="Pending">{tr("Gözləyir", "Pending")}</option>
              </select>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    {["ID", "Offer", "Client", "Value", "Date", "Status"].map((h) => (
                      <th key={h} className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOffers.map((offer, i) => (
                    <tr key={offer.id} className={i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/30"}>
                      <td className="px-3 py-2 text-xs font-mono text-gray-500">{offer.id}</td>
                      <td className="px-3 py-2 text-xs font-medium text-gray-800 dark:text-gray-200">{offer.title}</td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{offer.client}</td>
                      <td className="px-3 py-2 text-xs font-medium text-gray-900 dark:text-white">${offer.value.toLocaleString()}</td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{offer.date}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${OFFER_STATUS[offer.status] ?? ""}`}>
                          {offer.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <EditUserModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleSaveUser}
        user={user}
        roles={roles}
        branches={branches}
        showManagedBranches={Boolean(authUser?.isTenantOwner && branches.length > 0)}
        managerRoleId={managerRoleId}
        saving={saving}
        showPosOrderControls={hasModule("POS")}
      />
    </div>
  );
}
