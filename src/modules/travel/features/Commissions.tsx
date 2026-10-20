import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Search, Plus, FileText, FileSpreadsheet, RefreshCw,
  ChevronDown, Eye, Trash2, X, CheckCircle, Clock, TrendingUp,
  Edit2, Save,
} from "lucide-react";
import { useLanguage } from "../../../app/i18n/LanguageContext";
import { FilterSelect } from "../ui/filter-select";
import { exportToExcel } from "../lib/exportExcel";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Commission {
  id: string;
  employee: string;
  role: string;
  offerId: string;
  offerTitle: string;
  period: string;
  salesAmount: number;
  commissionRate: number;
  commissionAmount: number;
  bonusAmount: number;
  totalPayout: number;
  status: "paid" | "pending" | "processing";
  paidDate?: string;
}

interface StoredEmployee {
  id: string;
  fullName: string;
  jobTitle: string;
  department: string;
  status: string;
}

interface CommissionRule {
  employeeId: string;
  employeeName: string;
  ruleType: "percentage" | "fixed" | "tiered";
  baseRate: number;
  tier1Threshold: number;
  tier2Rate: number;
  bonusOnTarget: number;
  monthlyTarget: number;
}

// ─── Offers reference ─────────────────────────────────────────────────────────

interface OfferRef {
  id: string;
  title: string;
  type: "percentage" | "fixed" | "bundle";
  value: number;
  status: "active" | "inactive" | "expired";
}

const OFFERS_REF: OfferRef[] = [
  { id: "OFF001", title: "Summer Sale",        type: "percentage", value: 20, status: "active"   },
  { id: "OFF002", title: "New Client Welcome", type: "percentage", value: 15, status: "active"   },
  { id: "OFF003", title: "Oil Change Bundle",  type: "bundle",     value: 0,  status: "expired"  },
  { id: "OFF004", title: "Loyalty Discount",   type: "fixed",      value: 50, status: "active"   },
  { id: "OFF005", title: "Holiday Special",    type: "percentage", value: 25, status: "inactive" },
  { id: "OFF006", title: "Flash Friday",       type: "percentage", value: 10, status: "active"   },
];

// ─── Mock seed data ───────────────────────────────────────────────────────────

const SEED: Commission[] = [
  { id: "COM001", employee: "Anar Həsənov",    role: "Senior Sales",  offerId: "OFF001", offerTitle: "Summer Sale",        period: "Aug 2026", salesAmount: 28400, commissionRate: 5,   commissionAmount: 1420, bonusAmount: 200, totalPayout: 1620, status: "paid",       paidDate: "2026-09-05" },
  { id: "COM002", employee: "Leyla Əliyeva",   role: "Sales Agent",   offerId: "OFF002", offerTitle: "New Client Welcome", period: "Aug 2026", salesAmount: 19800, commissionRate: 4,   commissionAmount: 792,  bonusAmount: 0,   totalPayout: 792,  status: "pending"  },
  { id: "COM003", employee: "Rauf Quliyev",    role: "Sales Manager", offerId: "OFF004", offerTitle: "Loyalty Discount",   period: "Aug 2026", salesAmount: 45200, commissionRate: 6.5, commissionAmount: 2938, bonusAmount: 500, totalPayout: 3438, status: "processing" },
  { id: "COM004", employee: "Nigar Babayeva",  role: "Sales Agent",   offerId: "OFF006", offerTitle: "Flash Friday",       period: "Aug 2026", salesAmount: 12600, commissionRate: 4,   commissionAmount: 504,  bonusAmount: 0,   totalPayout: 504,  status: "paid",       paidDate: "2026-09-05" },
  { id: "COM005", employee: "Elçin Nəsirov",   role: "Senior Sales",  offerId: "OFF001", offerTitle: "Summer Sale",        period: "Jul 2026", salesAmount: 33100, commissionRate: 5,   commissionAmount: 1655, bonusAmount: 150, totalPayout: 1805, status: "paid",       paidDate: "2026-08-05" },
  { id: "COM006", employee: "Sevinc Əhmədova", role: "Sales Agent",   offerId: "OFF002", offerTitle: "New Client Welcome", period: "Jul 2026", salesAmount: 8900,  commissionRate: 4,   commissionAmount: 356,  bonusAmount: 0,   totalPayout: 356,  status: "paid",       paidDate: "2026-08-05" },
];

const STORAGE_KEY  = "inflero_commissions";
const RULES_KEY    = "inflero_commission_rules";

function loadCommissions(): Commission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Commission[];
  } catch {}
  return SEED;
}

function uid() {
  return "COM" + String(Math.floor(Math.random() * 9000) + 1000);
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<Commission["status"], string> = {
  paid:       "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700",
  pending:    "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700",
  processing: "bg-blue-100 dark:bg-[#14b8a6]/20 text-blue-700 dark:text-[#14b8a6] border border-blue-300 dark:border-[#14b8a6]/50",
};

const STATUS_ICON: Record<Commission["status"], typeof CheckCircle> = {
  paid: CheckCircle, pending: Clock, processing: TrendingUp,
};

// ─── View Commission Modal ────────────────────────────────────────────────────

function ViewModal({ c, onClose }: { c: Commission; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Commission Detail</h2>
          <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>
        <div className="p-4 space-y-0 divide-y divide-gray-100 dark:divide-gray-800">
          {[
            { label: "ID",           value: c.id },
            { label: "Employee",     value: c.employee },
            { label: "Offer",        value: `${c.offerTitle} (${c.offerId})` },
            { label: "Period",       value: c.period },
            { label: "Sales",        value: `${c.salesAmount.toLocaleString()} ₼` },
            { label: "Rate",         value: `${c.commissionRate}%` },
            { label: "Commission",   value: `${c.commissionAmount.toLocaleString()} ₼` },
            { label: "Bonus",        value: c.bonusAmount > 0 ? `+${c.bonusAmount} ₼` : "—" },
            { label: "Total Payout", value: `${c.totalPayout.toLocaleString()} ₼` },
            { label: "Status",       value: c.status },
            { label: "Paid Date",    value: c.paidDate ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-start justify-between py-2 gap-4">
              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px] flex-shrink-0 pt-0.5">{label}</span>
              <span className="text-xs text-gray-900 dark:text-white text-right">
                {label === "Status" ? (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${STATUS_BADGE[c.status]}`}>{value}</span>
                ) : value}
              </span>
            </div>
          ))}
        </div>
        <div className="px-4 pb-4">
          <button onClick={onClose} className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Commissions() {
  const { language } = useLanguage();
  const tr = (az: string, en: string) => language === "az" ? az : en;
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"entries" | "rules">("entries");

  // ── Entries state ──
  const [commissions, setCommissions] = useState<Commission[]>(loadCommissions);
  const [search, setSearch]           = useState("");
  const [period, setPeriod]           = useState("Aug 2026");
  const [showModal, setShowModal]     = useState(false);
  const [viewingEntry, setViewingEntry] = useState<Commission | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [form, setForm] = useState({
    employee: "", role: "", offerId: "", period: "Sep 2026",
    salesAmount: "", commissionRate: "5", bonus: "0",
  });

  // ── Rules state ──
  const [rules, setRules]                 = useState<CommissionRule[]>(() => {
    try {
      const raw = localStorage.getItem(RULES_KEY);
      if (raw) return JSON.parse(raw) as CommissionRule[];
    } catch {}
    return [];
  });
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleForm, setRuleForm]           = useState<Partial<CommissionRule>>({});

  // ── Employees ──
  const [storedEmployees, setStoredEmployees] = useState<StoredEmployee[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("inflero_employees");
      if (raw) setStoredEmployees(JSON.parse(raw) as StoredEmployee[]);
    } catch {}
  }, [showModal, activeTab]);

  // Persist commissions
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(commissions)); } catch {}
  }, [commissions]);

  // Persist rules
  useEffect(() => {
    try { localStorage.setItem(RULES_KEY, JSON.stringify(rules)); } catch {}
  }, [rules]);

  // Sync rules: add missing employees, keep existing
  useEffect(() => {
    if (storedEmployees.length === 0) return;
    setRules(prev => {
      const existing = new Map(prev.map(r => [r.employeeId, r]));
      return storedEmployees
        .filter(e => e.status !== "Inactive")
        .map(e => existing.get(e.id) ?? {
          employeeId:     e.id,
          employeeName:   e.fullName,
          ruleType:       "percentage" as const,
          baseRate:       5,
          tier1Threshold: 20000,
          tier2Rate:      7,
          bonusOnTarget:  300,
          monthlyTarget:  30000,
        });
    });
  }, [storedEmployees]);

  // ── Derived ──
  const availablePeriods = useMemo(() => {
    const set = new Set(commissions.map(c => c.period));
    return Array.from(set).sort().reverse();
  }, [commissions]);

  const filtered = commissions.filter(c =>
    (period === "All" || c.period === period) &&
    (c.employee.toLowerCase().includes(search.toLowerCase()) ||
     c.role.toLowerCase().includes(search.toLowerCase()) ||
     c.offerTitle.toLowerCase().includes(search.toLowerCase()))
  );

  const calcCommission = useMemo(() => {
    const sales = parseFloat(form.salesAmount) || 0;
    const rate  = parseFloat(form.commissionRate) || 0;
    return Math.round(sales * rate / 100);
  }, [form.salesAmount, form.commissionRate]);

  const calcTotal = calcCommission + (parseFloat(form.bonus) || 0);

  const employeeNames = useMemo(() => {
    const fromStorage = storedEmployees.filter(e => e.status !== "Inactive").map(e => e.fullName);
    const fromData    = [...new Set(commissions.map(c => c.employee))];
    return [...new Set([...fromStorage, ...fromData])].sort();
  }, [storedEmployees, commissions]);

  // ── Handlers ──
  function handleDelete(id: string) {
    if (confirm(tr("Bu qeydi silmək istədiyinizə əminsiniz?", "Delete this commission entry?"))) {
      setCommissions(prev => prev.filter(c => c.id !== id));
    }
  }

  function handleSave() {
    if (!form.employee || !form.offerId || !form.salesAmount) return;
    const offer = OFFERS_REF.find(o => o.id === form.offerId);
    const emp   = storedEmployees.find(e => e.fullName === form.employee);
    const entry: Commission = {
      id: uid(),
      employee: form.employee,
      role: emp?.jobTitle || form.role || "Staff",
      offerId: form.offerId,
      offerTitle: offer?.title || form.offerId,
      period: form.period,
      salesAmount: parseFloat(form.salesAmount) || 0,
      commissionRate: parseFloat(form.commissionRate) || 5,
      commissionAmount: calcCommission,
      bonusAmount: parseFloat(form.bonus) || 0,
      totalPayout: calcTotal,
      status: "pending",
    };
    setCommissions(prev => [entry, ...prev]);
    setShowModal(false);
    setForm({ employee: "", role: "", offerId: "", period: "Sep 2026", salesAmount: "", commissionRate: "5", bonus: "0" });
  }

  function handleExportCSV() {
    exportToExcel(
      ["ID", tr("İşçi", "Employee"), tr("Vəzifə", "Role"), tr("Təklif ID", "Offer ID"), tr("Təklif adı", "Offer Title"), tr("Dövr", "Period"), tr("Satış məbləği", "Sales Amount"), tr("Komissiya dərəcəsi %", "Commission Rate %"), tr("Komissiya məbləği", "Commission Amount"), tr("Bonus", "Bonus"), tr("Cəmi ödəniş", "Total Payout"), "Status", tr("Ödəniş tarixi", "Paid Date")],
      filtered.map(c => [
        c.id, c.employee, c.role, c.offerId, c.offerTitle, c.period,
        c.salesAmount, c.commissionRate, c.commissionAmount,
        c.bonusAmount, c.totalPayout, c.status, c.paidDate ?? "",
      ]),
      "commissions"
    );
  }

  function saveRule(id: string) {
    setRules(prev => prev.map(r => r.employeeId === id ? { ...r, ...ruleForm } as CommissionRule : r));
    setEditingRuleId(null);
  }

  const inputClass = "w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] transition-colors";
  const labelClass = "block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1";
  const thCls      = "text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap";

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">

        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {tr("Komissiyalar", "Commissions")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {tr("İşçi komissiyalarını izləyin", "Track employee commission payouts per offer")}
          </p>
        </div>

        {/* Tabs + Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("entries")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === "entries"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {tr("Komissiyalar", "Commissions")}
            </button>
            <button
              onClick={() => setActiveTab("rules")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === "rules"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {tr("Qaydalar", "Rules")}
            </button>
          </div>

          {activeTab === "entries" && (
            <div className="flex gap-2">
              <button onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                title={tr("Excel İxrac Et", "Export CSV")}>
                <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
              </button>
              <button onClick={() => alert(tr("PDF ixrac funksiyası tezliklə əlavə olunacaq", "Export PDF coming soon"))}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                title={tr("PDF İxrac Et", "Export PDF")}>
                <FileText className="w-3.5 h-3.5 text-red-500" />
              </button>
              <button onClick={() => { setIsRefreshing(true); setTimeout(() => setIsRefreshing(false), 800); }}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                title={tr("Yenilə", "Refresh")}>
                <RefreshCw className={`w-3.5 h-3.5${isRefreshing ? " animate-spin" : ""}`} />
              </button>
              <button onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors">
                <Plus className="w-3.5 h-3.5" />
                <span>{tr("Qeyd Əlavə Et", "Add Entry")}</span>
              </button>
            </div>
          )}
        </div>

        {/* ══ ENTRIES TAB ══ */}
        {activeTab === "entries" && (
          <>
            {/* Search / Filter Bar */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="flex-1 relative max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input type="text"
                    placeholder={tr("İşçi axtar...", "Search employees or offers...")}
                    value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                  />
                </div>
                <div className="flex gap-2 ml-auto">
                  <FilterSelect value={period} onChange={setPeriod} options={[
                    { value: "All", label: tr("Bütün dövrlər", "All Periods") },
                    ...availablePeriods.map(p => ({ value: p, label: p })),
                  ]} />
                </div>
              </div>
            </div>

            {/* Entries Table */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                      <th className={thCls}>{tr("İŞÇİ", "EMPLOYEE")}</th>
                      <th className={thCls}>{tr("TƏKLİF", "OFFER")}</th>
                      <th className={thCls}>{tr("DÖVR", "PERIOD")}</th>
                      <th className={thCls}>{tr("SATIŞ", "SALES")}</th>
                      <th className={thCls}>{tr("DƏRƏCƏSİ", "RATE")}</th>
                      <th className={thCls}>{tr("KOMİSSİYA", "COMMISSION")}</th>
                      <th className={thCls}>{tr("BONUS", "BONUS")}</th>
                      <th className={thCls}>{tr("CƏMİ", "TOTAL")}</th>
                      <th className={thCls}>{tr("STATUS", "STATUS")}</th>
                      <th className={thCls}>{tr("ƏMƏLİYYATLAR", "ACTIONS")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c, idx) => {
                      const Icon = STATUS_ICON[c.status];
                      return (
                        <tr key={c.id} className={`border-b border-gray-200 dark:border-gray-800 ${idx % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/30"}`}>

                          {/* EMPLOYEE — avatar + name, linked to profile */}
                          <td className="px-3 py-2 whitespace-nowrap">
                            <button
                              onClick={() => navigate("/dashboard/user-management")}
                              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                            >
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200 text-[10px] font-bold flex-shrink-0">
                                {getInitials(c.employee)}
                              </div>
                              <p className="text-xs text-gray-900 dark:text-white whitespace-nowrap">{c.employee}</p>
                            </button>
                          </td>

                          {/* OFFER — linked to offer-view page */}
                          <td className="px-3 py-2 whitespace-nowrap">
                            <button
                              onClick={() => navigate(`/offer-view/${c.offerId}`)}
                              className="text-xs text-[#14b8a6] dark:text-[#14b8a6] hover:underline text-left whitespace-nowrap font-medium"
                            >
                              {c.offerTitle}
                            </button>
                          </td>

                          <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{c.period}</td>
                          <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{c.salesAmount.toLocaleString()} ₼</td>
                          <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{c.commissionRate}%</td>
                          <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{c.commissionAmount.toLocaleString()} ₼</td>
                          <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{c.bonusAmount > 0 ? `+${c.bonusAmount} ₼` : "—"}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className="text-xs font-medium text-gray-900 dark:text-white">{c.totalPayout.toLocaleString()} ₼</span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${STATUS_BADGE[c.status]}`}>
                              <Icon className="w-2.5 h-2.5" />
                              {c.status === "paid" ? tr("Ödənilib", "Paid") : c.status === "pending" ? tr("Gözləyir", "Pending") : tr("Emal olunur", "Processing")}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button onClick={() => setViewingEntry(c)}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                title={tr("Bax", "View")}>
                                <Eye className="w-3 h-3" />
                              </button>
                              <button onClick={() => handleDelete(c.id)}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title={tr("Sil", "Delete")}>
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={10} className="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                          {tr("Heç bir nəticə tapılmadı.", "No commission entries found.")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ══ RULES TAB ══ */}
        {activeTab === "rules" && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {tr("Hər işçi üçün komissiya qaydalarını müəyyən edin. Dəyişikliklər yeni qeydlərə tətbiq olunur.", "Set commission rules per employee. Changes apply to new entries.")}
              </p>
            </div>

            {rules.length === 0 ? (
              <p className="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                {tr("İşçi tapılmadı. İstifadəçilər → İşçi bölməsindən əlavə edin.", "No employees found. Add users under Users → Employee.")}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                      <th className={thCls}>{tr("İŞÇİ", "EMPLOYEE")}</th>
                      <th className={thCls}>{tr("QAYDA NÖVİ", "RULE TYPE")}</th>
                      <th className={thCls}>{tr("ƏSAS DƏRƏCƏ", "BASE RATE")}</th>
                      <th className={thCls}>{tr("AYLIQ HƏDƏF (₼)", "MONTHLY TARGET (₼)")}</th>
                      <th className={thCls}>{tr("TİER-2 HƏDD (₼)", "TIER-2 THRESHOLD (₼)")}</th>
                      <th className={thCls}>{tr("TİER-2 DƏRƏCƏ", "TIER-2 RATE")}</th>
                      <th className={thCls}>{tr("HƏDƏF BONUS (₼)", "TARGET BONUS (₼)")}</th>
                      <th className={thCls}>{tr("ƏMƏLİYYATLAR", "ACTIONS")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((rule, idx) => {
                      const isEditing = editingRuleId === rule.employeeId;
                      const rf        = isEditing ? ruleForm : rule;
                      const inCls     = "px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#14b8a6]";
                      return (
                        <tr key={rule.employeeId} className={`border-b border-gray-200 dark:border-gray-800 ${idx % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/30"}`}>

                          {/* Employee */}
                          <td className="px-3 py-2 whitespace-nowrap">
                            <button
                              onClick={() => navigate("/dashboard/user-management")}
                              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                            >
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200 text-[10px] font-bold flex-shrink-0">
                                {getInitials(rule.employeeName)}
                              </div>
                              <p className="text-xs text-gray-900 dark:text-white whitespace-nowrap">{rule.employeeName}</p>
                            </button>
                          </td>

                          {/* Rule type */}
                          <td className="px-3 py-2 whitespace-nowrap">
                            {isEditing ? (
                              <select value={rf.ruleType}
                                onChange={e => setRuleForm(f => ({ ...f, ruleType: e.target.value as CommissionRule["ruleType"] }))}
                                className={inCls + " w-28"}>
                                <option value="percentage">Percentage %</option>
                                <option value="fixed">Fixed ₼</option>
                                <option value="tiered">Tiered %</option>
                              </select>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 dark:bg-[#14b8a6]/20 text-blue-700 dark:text-[#14b8a6] border border-blue-300 dark:border-[#14b8a6]/50">
                                {rule.ruleType === "percentage" ? "Percentage" : rule.ruleType === "fixed" ? "Fixed" : "Tiered"}
                              </span>
                            )}
                          </td>

                          {/* Base rate */}
                          <td className="px-3 py-2 whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <input type="number" min="0" max="100" step="0.5"
                                  value={rf.baseRate ?? 0}
                                  onChange={e => setRuleForm(f => ({ ...f, baseRate: parseFloat(e.target.value) || 0 }))}
                                  className={inCls + " w-16"} />
                                <span className="text-xs text-gray-500">{rf.ruleType === "fixed" ? "₼" : "%"}</span>
                              </div>
                            ) : (
                              <span className="text-xs font-medium text-gray-900 dark:text-white">
                                {rule.baseRate}{rule.ruleType === "fixed" ? " ₼" : "%"}
                              </span>
                            )}
                          </td>

                          {/* Monthly target */}
                          <td className="px-3 py-2 whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <input type="number" min="0"
                                  value={rf.monthlyTarget ?? 0}
                                  onChange={e => setRuleForm(f => ({ ...f, monthlyTarget: parseFloat(e.target.value) || 0 }))}
                                  className={inCls + " w-20"} />
                                <span className="text-xs text-gray-500">₼</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-600 dark:text-gray-400">{rule.monthlyTarget.toLocaleString()} ₼</span>
                            )}
                          </td>

                          {/* Tier-2 threshold */}
                          <td className="px-3 py-2 whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <input type="number" min="0"
                                  value={rf.tier1Threshold ?? 0}
                                  onChange={e => setRuleForm(f => ({ ...f, tier1Threshold: parseFloat(e.target.value) || 0 }))}
                                  className={inCls + " w-20"} />
                                <span className="text-xs text-gray-500">₼</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {rule.ruleType === "tiered" ? `${rule.tier1Threshold.toLocaleString()} ₼` : "—"}
                              </span>
                            )}
                          </td>

                          {/* Tier-2 rate */}
                          <td className="px-3 py-2 whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <input type="number" min="0" max="100" step="0.5"
                                  value={rf.tier2Rate ?? 0}
                                  onChange={e => setRuleForm(f => ({ ...f, tier2Rate: parseFloat(e.target.value) || 0 }))}
                                  className={inCls + " w-14"} />
                                <span className="text-xs text-gray-500">%</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {rule.ruleType === "tiered" ? `${rule.tier2Rate}%` : "—"}
                              </span>
                            )}
                          </td>

                          {/* Bonus on target */}
                          <td className="px-3 py-2 whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <input type="number" min="0"
                                  value={rf.bonusOnTarget ?? 0}
                                  onChange={e => setRuleForm(f => ({ ...f, bonusOnTarget: parseFloat(e.target.value) || 0 }))}
                                  className={inCls + " w-16"} />
                                <span className="text-xs text-gray-500">₼</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-600 dark:text-gray-400">+{rule.bonusOnTarget} ₼</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <>
                                  <button onClick={() => saveRule(rule.employeeId)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors"
                                    title="Save">
                                    <Save className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => setEditingRuleId(null)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    title="Cancel">
                                    <X className="w-3 h-3" />
                                  </button>
                                </>
                              ) : (
                                <button onClick={() => { setEditingRuleId(rule.employeeId); setRuleForm({ ...rule }); }}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                  title="Edit rule">
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* View Entry Modal */}
      {viewingEntry && (
        <ViewModal c={viewingEntry} onClose={() => setViewingEntry(null)} />
      )}

      {/* Add Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {tr("Komissiya Qeydi Əlavə Et", "Add Commission Entry")}
              </h2>
              <button onClick={() => setShowModal(false)} className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className={labelClass}>{tr("İşçi", "Employee")} *</label>
                <div className="relative">
                  <select value={form.employee} onChange={e => setForm({ ...form, employee: e.target.value })}
                    className={inputClass + " appearance-none pr-8 cursor-pointer"}>
                    <option value="">{tr("İşçi seçin", "Select employee")}</option>
                    {employeeNames.map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className={labelClass}>{tr("Tamamlanan Təklif", "Completed Offer")} *</label>
                <div className="relative">
                  <select value={form.offerId} onChange={e => setForm({ ...form, offerId: e.target.value })}
                    className={inputClass + " appearance-none pr-8 cursor-pointer"}>
                    <option value="">{tr("Təklif seçin", "Select offer")}</option>
                    {OFFERS_REF.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.title} ({o.id}) {o.status !== "active" ? `[${o.status}]` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className={labelClass}>{tr("Dövr", "Period")}</label>
                <input value={form.period} onChange={e => setForm({ ...form, period: e.target.value })}
                  placeholder="e.g. Sep 2026" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{tr("Satış Məbləği (₼)", "Sales Amount (₼)")} *</label>
                <input type="number" min="0" value={form.salesAmount}
                  onChange={e => setForm({ ...form, salesAmount: e.target.value })}
                  placeholder="0" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{tr("Komissiya Dərəcəsi (%)", "Commission Rate (%)")}</label>
                <input type="number" min="0" max="100" step="0.5" value={form.commissionRate}
                  onChange={e => setForm({ ...form, commissionRate: e.target.value })}
                  placeholder="5" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{tr("Bonus (₼)", "Bonus (₼)")}</label>
                <input type="number" min="0" value={form.bonus}
                  onChange={e => setForm({ ...form, bonus: e.target.value })}
                  placeholder="0" className={inputClass} />
              </div>
              {(form.salesAmount || form.bonus) && (
                <div className="bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    {tr("Hesablama", "Calculation Preview")}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">{tr("Komissiya", "Commission")}</span>
                    <span className="text-xs font-medium text-gray-900 dark:text-white">{calcCommission.toLocaleString()} ₼</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">{tr("Bonus", "Bonus")}</span>
                    <span className="text-xs font-medium text-gray-900 dark:text-white">+{(parseFloat(form.bonus) || 0).toLocaleString()} ₼</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">{tr("Ümumi", "Total Payout")}</span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{calcTotal.toLocaleString()} ₼</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 px-4 pb-4">
              <button onClick={() => setShowModal(false)}
                className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors">
                {tr("Ləğv Et", "Cancel")}
              </button>
              <button onClick={handleSave}
                disabled={!form.employee || !form.offerId || !form.salesAmount}
                className="flex-1 px-3 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors">
                {tr("Yadda Saxla", "Save Entry")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
