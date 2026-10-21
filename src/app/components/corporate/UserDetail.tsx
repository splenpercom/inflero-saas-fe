import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Briefcase, Calendar, Loader2, Mail, Phone } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { getUserManagementTranslation } from "../../i18n/userManagementTranslations";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { useBranchRevision } from "../../hooks/useBranchRevision";
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
import {
  fetchOffers,
  type OfferStatusUi,
  type TravelOfferRow,
} from "../../api/offers";
import {
  fetchTravelCommissions,
  type TravelCommissionEntryRow,
  type TravelCommissionStatusUi,
} from "../../api/travelCommissions";
import { fetchExpenses, type ExpenseListRow } from "../../api/finance";
import {
  formatFinanceDate,
  mapExpenseStatusLabel,
  type ExpenseStatusApi,
} from "../../lib/financeMappers";

type ProfileTab = "expenses" | "commissions" | "offers";

const TRAVEL_COMMISSION_STATUS_BADGE: Record<TravelCommissionStatusUi, string> = {
  paid: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700",
  pending: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700",
  processing: "bg-blue-100 dark:bg-[#14b8a6]/20 text-blue-700 dark:text-[#14b8a6] border border-blue-300 dark:border-[#14b8a6]/50",
  voided: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-700",
};

const EXPENSE_STATUS_BADGE: Record<ExpenseStatusApi, string> = {
  APPROVED: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700",
  PENDING: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700",
  REJECTED: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700",
};

const OFFER_STATUS_BADGE: Record<OfferStatusUi, string> = {
  active: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700",
  inactive: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600",
  sent: "bg-blue-100 dark:bg-[#14b8a6]/20 text-blue-700 dark:text-[#14b8a6] border border-blue-300 dark:border-[#14b8a6]/50",
  expired: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700",
  accepted: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700",
  rejected: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700",
  changing: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700",
};

const OFFER_STATUS_LABEL: Record<OfferStatusUi, { en: string; az: string }> = {
  active: { en: "Active", az: "Aktiv" },
  inactive: { en: "Inactive", az: "Qeyri-aktiv" },
  sent: { en: "Sent", az: "Göndərildi" },
  expired: { en: "Expired", az: "Vaxtı bitmiş" },
  accepted: { en: "Accepted", az: "Qəbul edildi" },
  rejected: { en: "Rejected", az: "Rədd edildi" },
  changing: { en: "Changing", az: "Dəyişiklik" },
};

function offerTitle(o: TravelOfferRow): string {
  const route = [o.from, o.to].filter(Boolean).join(" → ");
  if (route) return `${o.saleType}${route ? ` · ${route}` : ""}`;
  if (o.hotelName) return `${o.saleType} · ${o.hotelName}`;
  return o.saleType || o.displayCode;
}

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
  const { isGlobalMode, branchId } = useBranch();
  const branchRevision = useBranchRevision();
  const needsBranch = isGlobalMode && !branchId;
  const travelEnabled = hasModule("TRAVEL");
  const { canView, canEdit } = useModulePermissions("User Management");
  const t = (key: string) => getUserManagementTranslation(key as any, language);
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const [user, setUser] = useState<TenantUserRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>("expenses");
  const [expenseFilter, setExpenseFilter] = useState<"all" | ExpenseStatusApi>("all");
  const [expenses, setExpenses] = useState<ExpenseListRow[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [offerFilter, setOfferFilter] = useState<"all" | OfferStatusUi>("all");
  const [offers, setOffers] = useState<TravelOfferRow[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [commission, setCommission] = useState<UserCommissionDetail | null>(null);
  const [commissionLoading, setCommissionLoading] = useState(false);
  const [travelCommissions, setTravelCommissions] = useState<TravelCommissionEntryRow[]>([]);
  const [travelCommissionsLoading, setTravelCommissionsLoading] = useState(false);
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
    if (!user || !(isAuthenticated || isDemo) || activeTab !== "commissions" || !travelEnabled) {
      if (!travelEnabled) setTravelCommissions([]);
      return;
    }
    if (needsBranch) {
      setTravelCommissions([]);
      setTravelCommissionsLoading(false);
      return;
    }
    let cancelled = false;
    setTravelCommissionsLoading(true);
    fetchTravelCommissions({ userId: user.id })
      .then((rows) => {
        if (!cancelled) setTravelCommissions(Array.isArray(rows) ? rows : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setTravelCommissions([]);
          notifyFromError(err);
        }
      })
      .finally(() => {
        if (!cancelled) setTravelCommissionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, isAuthenticated, isDemo, activeTab, travelEnabled, needsBranch, branchRevision]);

  useEffect(() => {
    if (!user || !(isAuthenticated || isDemo) || activeTab !== "offers") return;
    let cancelled = false;
    setOffersLoading(true);
    fetchOffers({ createdByUserId: user.id, pageSize: 100 })
      .then((res) => {
        if (!cancelled) setOffers(Array.isArray(res.items) ? res.items : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setOffers([]);
          notifyFromError(err);
        }
      })
      .finally(() => {
        if (!cancelled) setOffersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, isAuthenticated, isDemo, activeTab]);

  useEffect(() => {
    if (!user || !(isAuthenticated || isDemo) || activeTab !== "expenses") return;
    let cancelled = false;
    setExpensesLoading(true);
    fetchExpenses({ userId: user.id, pageSize: 100 })
      .then((res) => {
        if (!cancelled) setExpenses(Array.isArray(res.items) ? res.items : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setExpenses([]);
          notifyFromError(err);
        }
      })
      .finally(() => {
        if (!cancelled) setExpensesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, isAuthenticated, isDemo, activeTab]);

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

  const travelCommissionTotals = useMemo(() => {
    const active = travelCommissions.filter((c) => c.status !== "voided");
    return {
      count: active.length,
      sales: active.reduce((s, c) => s + (c.salesAmount || 0), 0),
      commission: active.reduce((s, c) => s + (c.commissionAmount || 0), 0),
      bonus: active.reduce((s, c) => s + (c.bonusAmount || 0), 0),
      payout: active.reduce((s, c) => s + (c.totalPayout || 0), 0),
    };
  }, [travelCommissions]);

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
    expenseFilter === "all" ? expenses : expenses.filter((e) => e.status === expenseFilter);
  const filteredOffers =
    offerFilter === "all" ? offers : offers.filter((o) => o.status === offerFilter);

  function travelStatusLabel(status: TravelCommissionStatusUi) {
    if (status === "paid") return tr("Ödənilib", "Paid");
    if (status === "pending") return tr("Gözləyir", "Pending");
    if (status === "processing") return tr("Emal olunur", "Processing");
    return tr("Ləğv edilib", "Voided");
  }

  function travelOfferLabel(c: TravelCommissionEntryRow) {
    if (c.offerDisplayCode && c.offerTitle) return `${c.offerDisplayCode} — ${c.offerTitle}`;
    if (c.offerDisplayCode) return c.offerDisplayCode;
    if (c.offerTitle) return c.offerTitle;
    return c.source === "AUTO"
      ? tr("Avto komissiya", "Auto commission")
      : tr("Manual qeyd", "Manual entry");
  }

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
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <select
                value={expenseFilter}
                onChange={(e) => setExpenseFilter(e.target.value as "all" | ExpenseStatusApi)}
                className={selectClass}
              >
                <option value="all">{tr("Bütün Statuslar", "All Statuses")}</option>
                <option value="APPROVED">{tr("Təsdiqlənib", "Approved")}</option>
                <option value="PENDING">{tr("Gözləyir", "Pending")}</option>
                <option value="REJECTED">{tr("Rədd edilib", "Rejected")}</option>
              </select>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {tr("Bu işçiyə təyin olunmuş xərclər", "Expenses assigned to this employee")}
                {!expensesLoading ? ` · ${filteredExpenses.length}` : ""}
              </span>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    {[
                      tr("İstinad", "Reference"),
                      tr("Tarix", "Date"),
                      tr("Kateqoriya", "Category"),
                      tr("Təsvir", "Description"),
                      tr("Məbləğ", "Amount"),
                      tr("Status", "Status"),
                    ].map((h) => (
                      <th key={h} className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {expensesLoading ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-xs text-gray-500">
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-[#14b8a6]" />
                          {tr("Yüklənir…", "Loading…")}
                        </span>
                      </td>
                    </tr>
                  ) : filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                        {tr("Bu işçiyə təyin olunmuş xərc yoxdur.", "No expenses assigned to this employee.")}
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp, i) => (
                      <tr
                        key={exp.id}
                        className={`cursor-pointer ${i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/30"} hover:bg-gray-50 dark:hover:bg-gray-800/60`}
                        onClick={() => navigate("/dashboard/finances/expenses")}
                      >
                        <td className="px-3 py-2 text-xs font-mono text-gray-500">
                          {exp.reference || exp.expenseName}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                          {formatFinanceDate(exp.date)}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{exp.category}</td>
                        <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 max-w-[200px] truncate">
                          {exp.description || "—"}
                        </td>
                        <td className="px-3 py-2 text-xs font-medium text-gray-900 dark:text-white">
                          {formatMoney(exp.amount)}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${EXPENSE_STATUS_BADGE[exp.status] ?? ""}`}>
                            {mapExpenseStatusLabel(exp.status, tr)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
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

            {travelEnabled && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {tr("Təklif komissiyaları", "Offer commissions")}
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {tr(
                        "Qəbul edilmiş və ödənilmiş təkliflərdən qazanılan real komissiyalar",
                        "Real commissions earned from accepted and paid offers",
                      )}
                    </p>
                  </div>
                  {!needsBranch && !travelCommissionsLoading && travelCommissionTotals.count > 0 && (
                    <div className="flex flex-wrap gap-3 text-[11px]">
                      <span className="text-gray-500">
                        {tr("Satış", "Sales")}:{" "}
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatMoney(travelCommissionTotals.sales)}
                        </span>
                      </span>
                      <span className="text-gray-500">
                        {tr("Komissiya", "Commission")}:{" "}
                        <span className="font-semibold text-[#14b8a6]">
                          {formatMoney(travelCommissionTotals.commission)}
                        </span>
                      </span>
                      {travelCommissionTotals.bonus > 0 && (
                        <span className="text-gray-500">
                          {tr("Bonus", "Bonus")}:{" "}
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {formatMoney(travelCommissionTotals.bonus)}
                          </span>
                        </span>
                      )}
                      <span className="text-gray-500">
                        {tr("Cəmi", "Total")}:{" "}
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatMoney(travelCommissionTotals.payout)}
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                {needsBranch ? (
                  <div className="px-4 py-10 text-center text-xs text-gray-500 dark:text-gray-400">
                    {tr(
                      "Komissiyaları görmək üçün filial seçin",
                      "Select a branch to view commissions",
                    )}
                  </div>
                ) : travelCommissionsLoading ? (
                  <div className="px-4 py-10 flex justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-[#14b8a6]" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px]">
                      <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                        <tr>
                          {[
                            tr("Təklif", "Offer"),
                            tr("Mənbə", "Source"),
                            tr("Satış", "Sales"),
                            tr("Dərəcə", "Rate"),
                            tr("Komissiya", "Commission"),
                            tr("Bonus", "Bonus"),
                            tr("Cəmi", "Payout"),
                            tr("Tarix", "Date"),
                            tr("Status", "Status"),
                          ].map((h) => (
                            <th
                              key={h}
                              className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {travelCommissions.length === 0 ? (
                          <tr>
                            <td
                              colSpan={9}
                              className="px-3 py-10 text-center text-xs text-gray-500 dark:text-gray-400"
                            >
                              {tr(
                                "Bu işçi üçün hələ komissiya yoxdur.",
                                "No commissions earned for this employee yet.",
                              )}
                            </td>
                          </tr>
                        ) : (
                          travelCommissions.map((c, i) => (
                            <tr
                              key={c.id}
                              className={
                                i % 2 === 0
                                  ? "bg-white dark:bg-gray-900"
                                  : "bg-gray-50 dark:bg-gray-800/30"
                              }
                            >
                              <td className="px-3 py-2 text-xs text-gray-800 dark:text-gray-200 max-w-[220px]">
                                <div className="truncate font-medium">{travelOfferLabel(c)}</div>
                                {c.period ? (
                                  <div className="text-[10px] text-gray-400 mt-0.5">{c.period}</div>
                                ) : null}
                              </td>
                              <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                                {c.source === "AUTO" ? tr("Avto", "Auto") : tr("Manual", "Manual")}
                              </td>
                              <td className="px-3 py-2 text-xs font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                {formatMoney(c.salesAmount)}
                              </td>
                              <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                {c.commissionRate}%
                              </td>
                              <td className="px-3 py-2 text-xs font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                {formatMoney(c.commissionAmount)}
                              </td>
                              <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                {c.bonusAmount > 0 ? `+${formatMoney(c.bonusAmount)}` : "—"}
                              </td>
                              <td className="px-3 py-2 text-xs font-semibold text-[#14b8a6] whitespace-nowrap">
                                {formatMoney(c.totalPayout)}
                              </td>
                              <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                {c.entryDate || "—"}
                              </td>
                              <td className="px-3 py-2">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                                    TRAVEL_COMMISSION_STATUS_BADGE[c.status] ?? TRAVEL_COMMISSION_STATUS_BADGE.pending
                                  }`}
                                >
                                  {travelStatusLabel(c.status)}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {!travelEnabled && !showCommission && !commissionLoading && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-10 text-center text-xs text-gray-500 dark:text-gray-400">
                {t("noCommissionSalesYet")}
              </div>
            )}
          </div>
        )}

        {activeTab === "offers" && (
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <select
                value={offerFilter}
                onChange={(e) => setOfferFilter(e.target.value as "all" | OfferStatusUi)}
                className={selectClass}
              >
                <option value="all">{tr("Bütün Statuslar", "All Statuses")}</option>
                {(Object.keys(OFFER_STATUS_LABEL) as OfferStatusUi[]).map((s) => (
                  <option key={s} value={s}>
                    {language === "az" ? OFFER_STATUS_LABEL[s].az : OFFER_STATUS_LABEL[s].en}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {tr("Yaradılan təkliflər", "Offers created by this employee")}
                {!offersLoading ? ` · ${filteredOffers.length}` : ""}
              </span>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    {[
                      "ID",
                      tr("Təklif", "Offer"),
                      tr("Müştəri", "Client"),
                      tr("Məbləğ", "Value"),
                      tr("Tarix", "Date"),
                      tr("Status", "Status"),
                    ].map((h) => (
                      <th key={h} className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {offersLoading ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-xs text-gray-500">
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-[#14b8a6]" />
                          {tr("Yüklənir…", "Loading…")}
                        </span>
                      </td>
                    </tr>
                  ) : filteredOffers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                        {tr("Bu işçinin yaratdığı təklif yoxdur.", "No offers created by this employee.")}
                      </td>
                    </tr>
                  ) : (
                    filteredOffers.map((offer, i) => (
                      <tr
                        key={offer.id}
                        className={`cursor-pointer ${i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/30"} hover:bg-gray-50 dark:hover:bg-gray-800/60`}
                        onClick={() => navigate("/dashboard/offers")}
                      >
                        <td className="px-3 py-2 text-xs font-mono text-gray-500">{offer.displayCode}</td>
                        <td className="px-3 py-2 text-xs font-medium text-gray-800 dark:text-gray-200">
                          {offerTitle(offer)}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                          {offer.clientName || "—"}
                        </td>
                        <td className="px-3 py-2 text-xs font-medium text-gray-900 dark:text-white">
                          {Number(offer.salePrice?.amount || 0).toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}{" "}
                          {offer.salePrice?.currency || "AZN"}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                          {offer.saleDate || offer.createdAt || "—"}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${OFFER_STATUS_BADGE[offer.status] ?? ""}`}>
                            {language === "az"
                              ? OFFER_STATUS_LABEL[offer.status]?.az ?? offer.status
                              : OFFER_STATUS_LABEL[offer.status]?.en ?? offer.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
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
