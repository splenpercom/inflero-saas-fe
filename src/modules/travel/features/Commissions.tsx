import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Search, Plus, FileText, FileSpreadsheet, RefreshCw,
  ChevronDown, Eye, Trash2, X, CheckCircle, Clock, TrendingUp,
  Edit2, Save,
} from "lucide-react";
import { useLanguage } from "../../../app/i18n/LanguageContext";
import { pickLang } from "../../../app/i18n/pickLang";
import { useBranch } from "../../../app/context/BranchContext";
import { useBranchRevision } from "../../../app/hooks/useBranchRevision";
import { useModulePermissions } from "../../../app/hooks/useModulePermissions";
import { useReportDateRange } from "../../../app/hooks/useReportDateRange";
import { ReportDateRangeFilter } from "../../../app/components/corporate/reports/ReportDateRangeFilter";
import { DateInput } from "../../../app/components/ui/DateInput";
import { fetchTenantUsers, type TenantUserRow } from "../../../app/api/userManagement";
import {
  createTravelCommission,
  deleteTravelCommission,
  fetchTravelCommissionRules,
  fetchTravelCommissions,
  patchTravelCommission,
  upsertTravelCommissionRule,
  type TravelCommissionEntryRow,
  type TravelCommissionRuleRow,
} from "../../../app/api/travelCommissions";
import { fetchOffers } from "../../../app/api/offers";
import { exportToExcel } from "../lib/exportExcel";

type Tab = "entries" | "rules";

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function periodFromYmd(ymd: string): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [y, m] = ymd.split("-");
  const mi = Number(m) - 1;
  if (!y || mi < 0 || mi > 11) return "—";
  return `${months[mi]} ${y}`;
}

function emptyForm() {
  return {
    userId: "",
    period: periodFromYmd(todayYmd()),
    entryDate: todayYmd(),
    salesAmount: "",
    commissionRate: "5",
    bonus: "0",
    offerId: "",
    offerTitle: "",
    offerDisplayCode: "",
  };
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
}

const STATUS_BADGE: Record<string, string> = {
  paid: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700",
  pending: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700",
  processing: "bg-blue-100 dark:bg-[#14b8a6]/20 text-blue-700 dark:text-[#14b8a6] border border-blue-300 dark:border-[#14b8a6]/50",
  voided: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-700",
};

const STATUS_ICON: Record<string, typeof CheckCircle> = {
  paid: CheckCircle,
  pending: Clock,
  processing: TrendingUp,
  voided: X,
};

function ViewModal({
  c,
  onClose,
  tr,
}: {
  c: TravelCommissionEntryRow;
  onClose: () => void;
  tr: (az: string, en: string, ru?: string) => string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {tr("Komissiya Detalı", "Commission Detail")}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-2">
          {[
            { label: "ID", value: c.id },
            { label: tr("İşçi", "Employee"), value: c.employeeName },
            { label: tr("Mənbə", "Source"), value: c.source === "AUTO" ? tr("Avto", "Auto") : tr("Manual", "Manual") },
            {
              label: tr("Təklif", "Offer"),
              value: c.offerDisplayCode
                ? `${c.offerTitle ?? "—"} (${c.offerDisplayCode})`
                : (c.offerTitle ?? "—"),
            },
            { label: tr("Dövr", "Period"), value: c.period ?? "—" },
            { label: tr("Tarix", "Date"), value: c.entryDate },
            { label: tr("Satış", "Sales"), value: `${c.salesAmount.toLocaleString()} ₼` },
            { label: tr("Dərəcə", "Rate"), value: `${c.commissionRate}%` },
            { label: tr("Komissiya", "Commission"), value: `${c.commissionAmount.toLocaleString()} ₼` },
            { label: tr("Bonus", "Bonus"), value: c.bonusAmount > 0 ? `+${c.bonusAmount} ₼` : "—" },
            { label: tr("Cəmi", "Total"), value: `${c.totalPayout.toLocaleString()} ₼` },
            { label: "Status", value: c.status },
            { label: tr("Ödəniş tarixi", "Paid Date"), value: c.paidDate ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-3 text-xs">
              <span className="text-gray-500 dark:text-gray-400">{label}</span>
              <span className="text-gray-900 dark:text-white font-medium text-right">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Commissions() {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const navigate = useNavigate();
  const { isGlobalMode, branchId } = useBranch();
  const branchRevision = useBranchRevision();
  const { canView, canCreate, canEdit, canDelete } = useModulePermissions("Commissions");
  const needsBranch = isGlobalMode && !branchId;

  const [tab, setTab] = useState<Tab>("entries");
  const [entries, setEntries] = useState<TravelCommissionEntryRow[]>([]);
  const [rules, setRules] = useState<TravelCommissionRuleRow[]>([]);
  const [users, setUsers] = useState<TenantUserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TravelCommissionEntryRow | null>(null);
  const [viewingEntry, setViewingEntry] = useState<TravelCommissionEntryRow | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingRuleUserId, setEditingRuleUserId] = useState<string | null>(null);
  const [ruleDraft, setRuleDraft] = useState({ baseRatePercent: "5", monthlyTarget: "30000", targetBonus: "300" });
  const [savingRule, setSavingRule] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [offerOptions, setOfferOptions] = useState<
    { id: string; displayCode: string; clientName: string }[]
  >([]);

  const {
    preset,
    setPreset,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    dateFrom,
    dateTo,
  } = useReportDateRange("month");

  const dateFromYmd = useMemo(() => dateFrom.slice(0, 10), [dateFrom]);
  const dateToYmd = useMemo(() => dateTo.slice(0, 10), [dateTo]);

  const loadEntries = useCallback(async () => {
    if (!canView || needsBranch) {
      setEntries([]);
      return;
    }
    setLoading(true);
    try {
      const rows = await fetchTravelCommissions({
        from: dateFromYmd,
        to: dateToYmd,
      });
      setEntries(rows);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [canView, needsBranch, dateFromYmd, dateToYmd]);

  const loadRules = useCallback(async () => {
    if (!canView || needsBranch) {
      setRules([]);
      return;
    }
    try {
      const rows = await fetchTravelCommissionRules();
      setRules(rows);
    } catch {
      setRules([]);
    }
  }, [canView, needsBranch]);

  const loadUsers = useCallback(async () => {
    try {
      const rows = await fetchTenantUsers();
      setUsers(rows.filter((u) => u.status === "Active"));
    } catch {
      setUsers([]);
    }
  }, []);

  const loadOfferOptions = useCallback(async () => {
    if (needsBranch) {
      setOfferOptions([]);
      return;
    }
    try {
      const res = await fetchOffers({ page: 1, pageSize: 100 });
      setOfferOptions(
        (res.items ?? []).map((o) => ({
          id: o.id,
          displayCode: o.displayCode,
          clientName: o.clientName,
        })),
      );
    } catch {
      setOfferOptions([]);
    }
  }, [needsBranch]);

  useEffect(() => {
    void loadUsers();
    void loadOfferOptions();
  }, [loadUsers, loadOfferOptions, branchRevision]);

  useEffect(() => {
    if (tab === "entries") void loadEntries();
    // Always keep rules warm for Add Entry rate prefill + Rules tab.
    void loadRules();
  }, [tab, loadEntries, loadRules, branchRevision]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return entries;
    return entries.filter(
      (c) =>
        c.employeeName.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        (c.offerTitle ?? "").toLowerCase().includes(q) ||
        (c.offerDisplayCode ?? "").toLowerCase().includes(q),
    );
  }, [entries, search]);

  const calcCommission = useMemo(() => {
    const sales = parseFloat(form.salesAmount) || 0;
    const rate = parseFloat(form.commissionRate) || 0;
    return Math.round((sales * rate) / 100);
  }, [form.salesAmount, form.commissionRate]);

  const calcTotal = calcCommission + (parseFloat(form.bonus) || 0);

  function openAdd() {
    setEditingEntry(null);
    const base = emptyForm();
    // Prefill rate from first rule if only one employee selected later; keep default 5.
    setForm(base);
    setShowModal(true);
  }

  function onEmployeeChange(userId: string) {
    const rule = rules.find((r) => r.userId === userId);
    setForm({
      ...form,
      userId,
      commissionRate: rule ? String(rule.baseRatePercent) : form.commissionRate,
    });
  }

  function openEdit(c: TravelCommissionEntryRow) {
    setEditingEntry(c);
    setForm({
      userId: c.userId,
      period: c.period ?? periodFromYmd(c.entryDate),
      entryDate: c.entryDate,
      salesAmount: String(c.salesAmount),
      commissionRate: String(c.commissionRate),
      bonus: String(c.bonusAmount),
      offerId: c.offerId ?? "",
      offerTitle: c.offerTitle ?? "",
      offerDisplayCode: c.offerDisplayCode ?? "",
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingEntry(null);
    setForm(emptyForm());
  }

  async function handleDelete(id: string) {
    if (!confirm(tr("Bu qeydi silmək istədiyinizə əminsiniz?", "Delete this commission entry?"))) return;
    try {
      await deleteTravelCommission(id);
      await loadEntries();
    } catch (err) {
      alert(err instanceof Error ? err.message : tr("Silinmədi", "Delete failed"));
    }
  }

  async function handleSave() {
    if (!form.userId || !form.salesAmount) return;
    try {
      if (editingEntry) {
        await patchTravelCommission(editingEntry.id, {
          ...(editingEntry.source === "MANUAL" ? { userId: form.userId } : {}),
          period: form.period,
          entryDate: form.entryDate,
          salesAmount: form.salesAmount,
          commissionRate: form.commissionRate,
          bonusAmount: form.bonus,
          offerTitle: form.offerTitle || null,
          offerDisplayCode: form.offerDisplayCode || null,
        });
      } else {
        await createTravelCommission({
          userId: form.userId,
          entryDate: form.entryDate,
          salesAmount: form.salesAmount,
          commissionRate: form.commissionRate,
          bonusAmount: form.bonus,
          period: form.period,
          offerTitle: form.offerTitle || null,
          offerDisplayCode: form.offerDisplayCode || null,
        });
      }
      closeModal();
      await loadEntries();
    } catch (err) {
      alert(err instanceof Error ? err.message : tr("Saxlanılmadı", "Save failed"));
    }
  }

  function startEditRule(r: TravelCommissionRuleRow) {
    setEditingRuleUserId(r.userId);
    setRuleDraft({
      baseRatePercent: String(r.baseRatePercent),
      monthlyTarget: String(r.monthlyTarget),
      targetBonus: String(r.targetBonus),
    });
  }

  async function saveRule(userId: string) {
    setSavingRule(true);
    try {
      await upsertTravelCommissionRule(userId, ruleDraft);
      setEditingRuleUserId(null);
      await loadRules();
    } catch (err) {
      alert(err instanceof Error ? err.message : tr("Qayda saxlanılmadı", "Rule save failed"));
    } finally {
      setSavingRule(false);
    }
  }

  function handleExportCSV() {
    exportToExcel(
      [
        "ID",
        tr("İşçi", "Employee"),
        tr("Vəzifə", "Role"),
        tr("Mənbə", "Source"),
        tr("Təklif", "Offer"),
        tr("Dövr", "Period"),
        tr("Tarix", "Date"),
        tr("Satış məbləği", "Sales Amount"),
        tr("Komissiya dərəcəsi %", "Commission Rate %"),
        tr("Komissiya məbləği", "Commission Amount"),
        tr("Bonus", "Bonus"),
        tr("Cəmi ödəniş", "Total Payout"),
        "Status",
        tr("Ödəniş tarixi", "Paid Date"),
      ],
      filtered.map((c) => [
        c.id,
        c.employeeName,
        c.role,
        c.source,
        c.offerDisplayCode ?? c.offerTitle ?? "",
        c.period ?? "",
        c.entryDate,
        c.salesAmount,
        c.commissionRate,
        c.commissionAmount,
        c.bonusAmount,
        c.totalPayout,
        c.status,
        c.paidDate ?? "",
      ]),
      "commissions",
    );
  }

  const inputClass =
    "w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] transition-colors";
  const labelClass = "block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1";
  const thCls =
    "text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap";

  const employeeOptions = useMemo(() => {
    const fromUsers = users.map((u) => ({ id: u.id, name: u.name, role: u.role }));
    const fromRules = rules.map((r) => ({ id: r.userId, name: r.employeeName, role: r.role }));
    const map = new Map<string, { id: string; name: string; role: string }>();
    for (const e of [...fromUsers, ...fromRules]) map.set(e.id, e);
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [users, rules]);

  if (!canView) {
    return (
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 p-6">
        <p className="text-sm text-gray-500">{tr("İcazə yoxdur", "No permission")}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {tr("Komissiyalar", "Commissions")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {tr(
              "İşçi komissiyalarını və qaydalarını idarə edin",
              "Track employee commissions and per-branch rules",
            )}
          </p>
        </div>

        {needsBranch && (
          <div className="mb-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
            {tr("Komissiyaları idarə etmək üçün filial seçin", "Select a branch to manage commissions")}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
            <button
              type="button"
              onClick={() => setTab("entries")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === "entries"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
              }`}
            >
              {tr("Komissiyalar", "Commissions")}
            </button>
            <button
              type="button"
              onClick={() => setTab("rules")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === "rules"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
              }`}
            >
              {tr("Qaydalar", "Rules")}
            </button>
          </div>

          {tab === "entries" && (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                title={tr("Excel İxrac Et", "Export CSV")}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
              </button>
              <button
                type="button"
                onClick={() => alert(tr("PDF ixrac funksiyası tezliklə əlavə olunacaq", "Export PDF coming soon"))}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                title={tr("PDF İxrac Et", "Export PDF")}
              >
                <FileText className="w-3.5 h-3.5 text-red-500" />
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsRefreshing(true);
                  await loadEntries();
                  setIsRefreshing(false);
                }}
                disabled={isRefreshing || needsBranch}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                title={tr("Yenilə", "Refresh")}
              >
                <RefreshCw className={`w-3.5 h-3.5${isRefreshing ? " animate-spin" : ""}`} />
              </button>
              {canCreate && (
              <button
                type="button"
                onClick={openAdd}
                disabled={needsBranch}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{tr("Qeyd Əlavə Et", "Add Entry")}</span>
              </button>
              )}
            </div>
          )}
        </div>

        {tab === "entries" && (
          <>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="flex-1 relative max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={tr("İşçi axtar...", "Search employees or offers...")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                  />
                </div>
                <div className="flex flex-wrap gap-2 ml-auto items-center">
                  <ReportDateRangeFilter
                    preset={preset}
                    onPresetChange={setPreset}
                    customFrom={customFrom}
                    customTo={customTo}
                    onCustomFromChange={setCustomFrom}
                    onCustomToChange={setCustomTo}
                    includeYear={false}
                    includeQuarter={false}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                      <th className={thCls}>{tr("İŞÇİ", "EMPLOYEE")}</th>
                      <th className={thCls}>{tr("MƏNBƏ", "SOURCE")}</th>
                      <th className={thCls}>{tr("TƏKLİF", "OFFER")}</th>
                      <th className={thCls}>{tr("DÖVR", "PERIOD")}</th>
                      <th className={thCls}>{tr("SATIŞ", "SALES")}</th>
                      <th className={thCls}>{tr("DƏRƏCƏSİ", "RATE")}</th>
                      <th className={thCls}>{tr("KOMİSSİYA", "COMMISSION")}</th>
                      <th className={thCls}>{tr("BONUS", "BONUS")}</th>
                      <th className={thCls}>{tr("CƏMİ", "TOTAL")}</th>
                      <th className={thCls}>STATUS</th>
                      <th className={thCls}>{tr("ƏMƏLİYYATLAR", "ACTIONS")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => {
                      const Icon = STATUS_ICON[c.status] ?? Clock;
                      return (
                        <tr
                          key={c.id}
                          className="border-b border-gray-100 dark:border-gray-800/80 hover:bg-gray-50/80 dark:hover:bg-gray-800/40"
                        >
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#0f2744] text-white text-[10px] flex items-center justify-center font-semibold shrink-0">
                                {getInitials(c.employeeName)}
                              </div>
                              <div>
                                <div className="text-xs font-medium text-gray-900 dark:text-white">{c.employeeName}</div>
                                <div className="text-[10px] text-gray-500">{c.role}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                c.source === "AUTO"
                                  ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                              }`}
                            >
                              {c.source === "AUTO" ? tr("Avto", "Auto") : tr("Manual", "Manual")}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">
                            <div>{c.offerTitle ?? "—"}</div>
                            {c.offerDisplayCode && (
                              <button
                                type="button"
                                className="text-[10px] text-[#14b8a6] hover:underline"
                                onClick={() => navigate(`/dashboard/offers`)}
                              >
                                {c.offerDisplayCode}
                              </button>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {c.period ?? "—"}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-900 dark:text-white whitespace-nowrap">
                            {c.salesAmount.toLocaleString()} ₼
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{c.commissionRate}%</td>
                          <td className="px-3 py-2 text-xs font-medium text-gray-900 dark:text-white whitespace-nowrap">
                            {c.commissionAmount.toLocaleString()} ₼
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {c.bonusAmount > 0 ? `+${c.bonusAmount}` : "—"}
                          </td>
                          <td className="px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                            {c.totalPayout.toLocaleString()} ₼
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${STATUS_BADGE[c.status] ?? STATUS_BADGE.pending}`}
                            >
                              <Icon className="w-3 h-3" />
                              {c.status}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setViewingEntry(c)}
                                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                                title={tr("Bax", "View")}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {canEdit && (
                              <button
                                type="button"
                                onClick={() => openEdit(c)}
                                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                                title={tr("Redaktə", "Edit")}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              )}
                              {canDelete && (
                              <button
                                type="button"
                                onClick={() => void handleDelete(c.id)}
                                className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                                title={tr("Sil", "Delete")}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!loading && filtered.length === 0 && (
                      <tr>
                        <td colSpan={11} className="px-3 py-8 text-center text-xs text-gray-500">
                          {needsBranch
                            ? tr("Filial seçin", "Select a branch")
                            : tr("Qeyd tapılmadı", "No commission entries")}
                        </td>
                      </tr>
                    )}
                    {loading && (
                      <tr>
                        <td colSpan={11} className="px-3 py-8 text-center text-xs text-gray-500">
                          {tr("Yüklənir...", "Loading...")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === "rules" && (
          <>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              {tr(
                "Filial üzrə işçi komissiya qaydaları. Dəyişikliklər yeni avto qeydlərə tətbiq olunur.",
                "Set commission rules per employee for this branch. Changes apply to new auto entries.",
              )}
            </p>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                      <th className={thCls}>{tr("İŞÇİ", "EMPLOYEE")}</th>
                      <th className={thCls}>{tr("QAYDA TİPİ", "RULE TYPE")}</th>
                      <th className={thCls}>{tr("ƏSAS DƏRƏCƏ", "BASE RATE")}</th>
                      <th className={thCls}>{tr("AYLIQ HƏDƏF (₼)", "MONTHLY TARGET (₼)")}</th>
                      <th className={thCls}>{tr("HƏDƏF BONUSU (₼)", "TARGET BONUS (₼)")}</th>
                      <th className={thCls}>{tr("ƏMƏLİYYATLAR", "ACTIONS")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((r) => {
                      const editing = editingRuleUserId === r.userId;
                      return (
                        <tr
                          key={r.id}
                          className="border-b border-gray-100 dark:border-gray-800/80 hover:bg-gray-50/80 dark:hover:bg-gray-800/40"
                        >
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#0f2744] text-white text-[10px] flex items-center justify-center font-semibold shrink-0">
                                {getInitials(r.employeeName)}
                              </div>
                              <div>
                                <div className="text-xs font-medium text-gray-900 dark:text-white">{r.employeeName}</div>
                                <div className="text-[10px] text-gray-500">{r.role}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                              {tr("Faiz", "Percentage")}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {editing ? (
                              <input
                                value={ruleDraft.baseRatePercent}
                                onChange={(e) => setRuleDraft({ ...ruleDraft, baseRatePercent: e.target.value })}
                                className={`${inputClass} w-20`}
                              />
                            ) : (
                              <span className="text-xs text-gray-900 dark:text-white">{r.baseRatePercent}%</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {editing ? (
                              <input
                                value={ruleDraft.monthlyTarget}
                                onChange={(e) => setRuleDraft({ ...ruleDraft, monthlyTarget: e.target.value })}
                                className={`${inputClass} w-28`}
                              />
                            ) : (
                              <span className="text-xs text-gray-900 dark:text-white">
                                {r.monthlyTarget.toLocaleString()} ₼
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {editing ? (
                              <input
                                value={ruleDraft.targetBonus}
                                onChange={(e) => setRuleDraft({ ...ruleDraft, targetBonus: e.target.value })}
                                className={`${inputClass} w-24`}
                              />
                            ) : (
                              <span className="text-xs text-gray-900 dark:text-white">
                                +{r.targetBonus.toLocaleString()} ₼
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {editing ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={savingRule || needsBranch}
                                  onClick={() => void saveRule(r.userId)}
                                  className="p-1 rounded hover:bg-teal-50 dark:hover:bg-teal-900/20 text-[#14b8a6]"
                                  title={tr("Saxla", "Save")}
                                >
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingRuleUserId(null)}
                                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : canEdit ? (
                              <button
                                type="button"
                                disabled={needsBranch}
                                onClick={() => startEditRule(r)}
                                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 disabled:opacity-50"
                                title={tr("Redaktə", "Edit")}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                    {rules.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-xs text-gray-500">
                          {needsBranch
                            ? tr("Filial seçin", "Select a branch")
                            : tr("Qayda yoxdur", "No rules yet")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {viewingEntry && (
        <ViewModal c={viewingEntry} onClose={() => setViewingEntry(null)} tr={tr} />
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeModal}>
          <div
            className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {editingEntry
                  ? tr("Komissiya Qeydini Redaktə Et", "Edit Commission Entry")
                  : tr("Komissiya Qeydi Əlavə Et", "Add Commission Entry")}
              </h2>
              <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className={labelClass}>{tr("İşçi", "Employee")} *</label>
                <div className="relative">
                  <select
                    value={form.userId}
                    onChange={(e) => onEmployeeChange(e.target.value)}
                    disabled={editingEntry?.source === "AUTO"}
                    className={`${inputClass} appearance-none pr-8`}
                  >
                    <option value="">{tr("Seçin...", "Select...")}</option>
                    {employeeOptions.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>{tr("Dövr", "Period")}</label>
                  <input
                    value={form.period}
                    onChange={(e) => setForm({ ...form, period: e.target.value })}
                    placeholder="e.g. Oct 2026"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{tr("Tarix", "Date")} *</label>
                  <DateInput
                    value={form.entryDate}
                    onChange={(v) => setForm({ ...form, entryDate: v })}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>{tr("Təklif (istəyə bağlı)", "Offer (optional)")}</label>
                <div className="relative">
                  <select
                    value={form.offerId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const o = offerOptions.find((x) => x.id === id);
                      setForm({
                        ...form,
                        offerId: id,
                        offerDisplayCode: o?.displayCode ?? "",
                        offerTitle: o?.clientName ?? "",
                      });
                    }}
                    disabled={editingEntry?.source === "AUTO"}
                    className={`${inputClass} appearance-none pr-8`}
                  >
                    <option value="">{tr("Seçin...", "Select...")}</option>
                    {offerOptions.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.displayCode} — {o.clientName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <p className="mt-1 text-[10px] text-gray-400">
                  {tr(
                    "Manual qeyd təklifə bağlanmır; yalnız istinad üçün göstərilir.",
                    "Manual entries do not link to the offer row; used as display reference only.",
                  )}
                </p>
              </div>
              <div>
                <label className={labelClass}>{tr("Satış Məbləği (₼)", "Sales Amount (₼)")} *</label>
                <input
                  type="number"
                  value={form.salesAmount}
                  onChange={(e) => setForm({ ...form, salesAmount: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>{tr("Komissiya Dərəcəsi (%)", "Commission Rate (%)")}</label>
                  <input
                    type="number"
                    value={form.commissionRate}
                    onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{tr("Bonus (₼)", "Bonus (₼)")}</label>
                  <input
                    type="number"
                    value={form.bonus}
                    onChange={(e) => setForm({ ...form, bonus: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">{tr("Komissiya", "Commission")}</span>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                    {calcCommission.toLocaleString()} ₼
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">{tr("Cəmi ödəniş", "Total payout")}</span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">
                    {calcTotal.toLocaleString()} ₼
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={closeModal}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
              >
                {tr("Ləğv et", "Cancel")}
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                className="px-3 py-1.5 text-xs rounded-lg bg-[#14b8a6] hover:bg-[#0d9488] text-white font-medium"
              >
                {tr("Saxla", "Save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
