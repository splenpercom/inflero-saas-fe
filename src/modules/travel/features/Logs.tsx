import { useState, useMemo } from "react";
import {
  Search,
  RefreshCw,
  Download,
} from "lucide-react";
import { useLanguage } from "../../../app/i18n/LanguageContext";
import { FilterSelect } from "../ui/filter-select";
import { exportToExcel } from "../lib/exportExcel";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionType =
  | "LOGIN"
  | "LOGOUT"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "VIEW"
  | "EXPORT"
  | "SETTINGS"
  | "FAILED_LOGIN";

type Status = "success" | "warning" | "error";
type DateRange = "today" | "week" | "month" | "all";

interface LogEntry {
  id: string;
  timestamp: Date;
  user: {
    name: string;
    email: string;
    role: string;
    avatarInitials: string;
    avatarColor: string;
  };
  action: ActionType;
  details: string;
  ip: string;
  status: Status;
  userAgent: string;
  sessionId: string;
  beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>;
  resource?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const now = new Date();
const minsAgo = (m: number) => new Date(now.getTime() - m * 60_000);
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);

const MOCK_LOGS: LogEntry[] = [
  {
    id: "log-001",
    timestamp: minsAgo(3),
    user: { name: "Sarah Mitchell", email: "s.mitchell@corp.io", role: "Admin", avatarInitials: "SM", avatarColor: "bg-violet-500" },
    action: "SETTINGS",
    details: "Updated password policy: minimum length changed from 8 to 12 characters",
    ip: "10.0.1.42",
    status: "success",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    sessionId: "sess_a1b2c3d4e5",
    resource: "Security Policy",
    beforeData: { minLength: 8, requireSpecialChars: false },
    afterData: { minLength: 12, requireSpecialChars: true },
  },
  {
    id: "log-002",
    timestamp: minsAgo(7),
    user: { name: "James Okafor", email: "j.okafor@corp.io", role: "Finance Manager", avatarInitials: "JO", avatarColor: "bg-emerald-500" },
    action: "EXPORT",
    details: "Exported Q3 financial report (2,847 records) to CSV",
    ip: "10.0.2.18",
    status: "success",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    sessionId: "sess_f6g7h8i9j0",
    resource: "Financial Reports / Q3-2026",
  },
  {
    id: "log-003",
    timestamp: minsAgo(12),
    user: { name: "Unknown", email: "—", role: "—", avatarInitials: "?", avatarColor: "bg-red-400" },
    action: "FAILED_LOGIN",
    details: "Failed login attempt for user priya.sharma@corp.io — invalid credentials (attempt 3 of 5)",
    ip: "185.220.101.47",
    status: "error",
    userAgent: "python-requests/2.31.0",
    sessionId: "—",
    resource: "Auth",
  },
  {
    id: "log-004",
    timestamp: minsAgo(18),
    user: { name: "Priya Sharma", email: "p.sharma@corp.io", role: "HR Specialist", avatarInitials: "PS", avatarColor: "bg-pink-500" },
    action: "LOGIN",
    details: "Successful login from corporate VPN",
    ip: "10.0.3.99",
    status: "success",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15",
    sessionId: "sess_k1l2m3n4o5",
    resource: "Auth",
  },
  {
    id: "log-005",
    timestamp: minsAgo(24),
    user: { name: "Tom Brennan", email: "t.brennan@corp.io", role: "Sales Lead", avatarInitials: "TB", avatarColor: "bg-orange-500" },
    action: "CREATE",
    details: "Created new customer account: Nexus Dynamics Ltd. (Enterprise tier)",
    ip: "10.0.1.77",
    status: "success",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0",
    sessionId: "sess_p6q7r8s9t0",
    resource: "Customers / CUS-00891",
    afterData: { company: "Nexus Dynamics Ltd.", tier: "Enterprise", contractValue: 120000 },
  },
  {
    id: "log-006",
    timestamp: minsAgo(31),
    user: { name: "Sarah Mitchell", email: "s.mitchell@corp.io", role: "Admin", avatarInitials: "SM", avatarColor: "bg-violet-500" },
    action: "DELETE",
    details: "Deleted inactive user account: legacy.bot@corp.io (last active 18 months ago)",
    ip: "10.0.1.42",
    status: "success",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    sessionId: "sess_a1b2c3d4e5",
    resource: "Users / legacy.bot@corp.io",
    beforeData: { email: "legacy.bot@corp.io", status: "inactive", lastLogin: "2025-03-14" },
  },
  {
    id: "log-007",
    timestamp: minsAgo(45),
    user: { name: "Aisha Novak", email: "a.novak@corp.io", role: "Operations", avatarInitials: "AN", avatarColor: "bg-teal-500" },
    action: "UPDATE",
    details: "Updated supplier contract: Orbital Supplies — payment terms changed from Net-30 to Net-15",
    ip: "10.0.2.55",
    status: "success",
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
    sessionId: "sess_u1v2w3x4y5",
    resource: "Suppliers / SUP-00234",
    beforeData: { paymentTerms: "Net-30", discountRate: 0.02 },
    afterData: { paymentTerms: "Net-15", discountRate: 0.035 },
  },
  {
    id: "log-008",
    timestamp: minsAgo(58),
    user: { name: "James Okafor", email: "j.okafor@corp.io", role: "Finance Manager", avatarInitials: "JO", avatarColor: "bg-emerald-500" },
    action: "VIEW",
    details: "Accessed employee payroll records for September 2026 (248 records)",
    ip: "10.0.2.18",
    status: "success",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    sessionId: "sess_f6g7h8i9j0",
    resource: "Payroll / 2026-09",
  },
  {
    id: "log-009",
    timestamp: hoursAgo(1.5),
    user: { name: "Unknown", email: "—", role: "—", avatarInitials: "?", avatarColor: "bg-red-400" },
    action: "FAILED_LOGIN",
    details: "Failed login attempt for user admin@corp.io — account locked after 5 consecutive failures",
    ip: "92.118.160.22",
    status: "error",
    userAgent: "curl/8.1.2",
    sessionId: "—",
    resource: "Auth",
  },
  {
    id: "log-010",
    timestamp: hoursAgo(2),
    user: { name: "Marcus Webb", email: "m.webb@corp.io", role: "IT Engineer", avatarInitials: "MW", avatarColor: "bg-cyan-500" },
    action: "SETTINGS",
    details: "Configured SMTP relay settings for outbound email notifications",
    ip: "10.0.4.11",
    status: "success",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) Chrome/126.0",
    sessionId: "sess_z6a7b8c9d0",
    resource: "System / Email Settings",
    beforeData: { smtpHost: "smtp.legacy.corp.io", port: 25 },
    afterData: { smtpHost: "smtp.sendgrid.net", port: 587, tls: true },
  },
  {
    id: "log-011",
    timestamp: hoursAgo(2.5),
    user: { name: "Priya Sharma", email: "p.sharma@corp.io", role: "HR Specialist", avatarInitials: "PS", avatarColor: "bg-pink-500" },
    action: "CREATE",
    details: "Created new employee record: Damilola Adeyemi — Software Engineer, joining 2026-09-15",
    ip: "10.0.3.99",
    status: "success",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15",
    sessionId: "sess_k1l2m3n4o5",
    resource: "Employees / EMP-01142",
    afterData: { name: "Damilola Adeyemi", role: "Software Engineer", startDate: "2026-09-15", salary: 95000 },
  },
  {
    id: "log-012",
    timestamp: hoursAgo(3),
    user: { name: "Tom Brennan", email: "t.brennan@corp.io", role: "Sales Lead", avatarInitials: "TB", avatarColor: "bg-orange-500" },
    action: "UPDATE",
    details: "Updated deal stage for Nexus Dynamics — moved from 'Proposal' to 'Contract Review'",
    ip: "10.0.1.77",
    status: "success",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0",
    sessionId: "sess_p6q7r8s9t0",
    resource: "Deals / DEAL-00456",
    beforeData: { stage: "Proposal", probability: 0.6 },
    afterData: { stage: "Contract Review", probability: 0.85 },
  },
  {
    id: "log-013",
    timestamp: hoursAgo(3.5),
    user: { name: "Aisha Novak", email: "a.novak@corp.io", role: "Operations", avatarInitials: "AN", avatarColor: "bg-teal-500" },
    action: "EXPORT",
    details: "Exported inventory report — low stock items (34 SKUs) to PDF",
    ip: "10.0.2.55",
    status: "warning",
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
    sessionId: "sess_u1v2w3x4y5",
    resource: "Inventory / Low-Stock Report",
  },
  {
    id: "log-014",
    timestamp: hoursAgo(4),
    user: { name: "Marcus Webb", email: "m.webb@corp.io", role: "IT Engineer", avatarInitials: "MW", avatarColor: "bg-cyan-500" },
    action: "DELETE",
    details: "Purged archived log files older than 90 days (12.4 GB freed)",
    ip: "10.0.4.11",
    status: "success",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) Chrome/126.0",
    sessionId: "sess_z6a7b8c9d0",
    resource: "System / Archive Logs",
  },
  {
    id: "log-015",
    timestamp: hoursAgo(5),
    user: { name: "James Okafor", email: "j.okafor@corp.io", role: "Finance Manager", avatarInitials: "JO", avatarColor: "bg-emerald-500" },
    action: "LOGOUT",
    details: "User session ended — idle timeout after 30 minutes",
    ip: "10.0.2.18",
    status: "success",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    sessionId: "sess_f6g7h8i9j0",
    resource: "Auth",
  },
  {
    id: "log-016",
    timestamp: hoursAgo(6),
    user: { name: "Sarah Mitchell", email: "s.mitchell@corp.io", role: "Admin", avatarInitials: "SM", avatarColor: "bg-violet-500" },
    action: "CREATE",
    details: "Created new role: 'Regional Auditor' with read-only access to financial modules",
    ip: "10.0.1.42",
    status: "success",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    sessionId: "sess_e1f2g3h4i5",
    resource: "Roles & Permissions / ROLE-014",
    afterData: { roleName: "Regional Auditor", permissions: ["finance:read", "reports:read"], userCount: 0 },
  },
  {
    id: "log-017",
    timestamp: daysAgo(1),
    user: { name: "Priya Sharma", email: "p.sharma@corp.io", role: "HR Specialist", avatarInitials: "PS", avatarColor: "bg-pink-500" },
    action: "UPDATE",
    details: "Updated employee record for Marcus Webb — promoted to Senior IT Engineer",
    ip: "10.0.3.99",
    status: "success",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15",
    sessionId: "sess_j6k7l8m9n0",
    resource: "Employees / EMP-00887",
    beforeData: { role: "IT Engineer", grade: "L3", salary: 82000 },
    afterData: { role: "Senior IT Engineer", grade: "L4", salary: 98000 },
  },
  {
    id: "log-018",
    timestamp: daysAgo(1),
    user: { name: "Tom Brennan", email: "t.brennan@corp.io", role: "Sales Lead", avatarInitials: "TB", avatarColor: "bg-orange-500" },
    action: "VIEW",
    details: "Accessed competitor analysis dashboard — pricing intelligence module",
    ip: "10.0.1.77",
    status: "success",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0",
    sessionId: "sess_o1p2q3r4s5",
    resource: "Intelligence / Competitor Pricing",
  },
  {
    id: "log-019",
    timestamp: daysAgo(2),
    user: { name: "Aisha Novak", email: "a.novak@corp.io", role: "Operations", avatarInitials: "AN", avatarColor: "bg-teal-500" },
    action: "CREATE",
    details: "Created purchase order PO-2026-1847 for Orbital Supplies — $48,320 total",
    ip: "10.0.2.55",
    status: "success",
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
    sessionId: "sess_t6u7v8w9x0",
    resource: "Purchase Orders / PO-2026-1847",
    afterData: { supplier: "Orbital Supplies", amount: 48320, currency: "USD", items: 12 },
  },
  {
    id: "log-020",
    timestamp: daysAgo(2),
    user: { name: "Marcus Webb", email: "m.webb@corp.io", role: "IT Engineer", avatarInitials: "MW", avatarColor: "bg-cyan-500" },
    action: "LOGIN",
    details: "Successful login via SSO (Google Workspace)",
    ip: "10.0.4.11",
    status: "success",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) Chrome/126.0",
    sessionId: "sess_y1z2a3b4c5",
    resource: "Auth",
  },
  {
    id: "log-021",
    timestamp: daysAgo(3),
    user: { name: "James Okafor", email: "j.okafor@corp.io", role: "Finance Manager", avatarInitials: "JO", avatarColor: "bg-emerald-500" },
    action: "DELETE",
    details: "Deleted draft invoice INV-DRAFT-0042 — superseded by revised quote",
    ip: "10.0.2.18",
    status: "success",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    sessionId: "sess_d6e7f8g9h0",
    resource: "Invoices / INV-DRAFT-0042",
    beforeData: { invoiceId: "INV-DRAFT-0042", amount: 34500, status: "draft" },
  },
  {
    id: "log-022",
    timestamp: daysAgo(4),
    user: { name: "Unknown", email: "—", role: "—", avatarInitials: "?", avatarColor: "bg-red-400" },
    action: "FAILED_LOGIN",
    details: "Failed login attempt for user james.okafor@corp.io — suspicious IP flagged by geo-fence policy",
    ip: "41.203.65.188",
    status: "error",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/118.0",
    sessionId: "—",
    resource: "Auth",
  },
  {
    id: "log-023",
    timestamp: daysAgo(5),
    user: { name: "Sarah Mitchell", email: "s.mitchell@corp.io", role: "Admin", avatarInitials: "SM", avatarColor: "bg-violet-500" },
    action: "EXPORT",
    details: "Exported full audit log for August 2026 — compliance archive (45,291 entries)",
    ip: "10.0.1.42",
    status: "success",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    sessionId: "sess_i1j2k3l4m5",
    resource: "Audit Logs / 2026-08",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(date: Date): string {
  const now2 = new Date();
  const diffMs = now2.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

function formatFullTimestamp(date: Date): string {
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function isInDateRange(date: Date, range: DateRange): boolean {
  const now2 = new Date();
  if (range === "today") return date.toDateString() === now2.toDateString();
  if (range === "week") return date >= new Date(now2.getTime() - 7 * 86_400_000);
  if (range === "month") return date >= new Date(now2.getTime() - 30 * 86_400_000);
  return true;
}

const UNIQUE_USERS = Array.from(
  new Map(MOCK_LOGS.map((l) => [l.user.email, l.user.name])).entries()
).filter(([email]) => email !== "—");

// ─── Main Component ───────────────────────────────────────────────────────────

export function Logs() {
  const { language } = useLanguage();
  const tr = (az: string, en: string) => language === "az" ? az : en;
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [actionFilter, setActionFilter] = useState<ActionType | "ALL">("ALL");
  const [userFilter, setUserFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const filtered = useMemo(() => {
    return MOCK_LOGS.filter((log) => {
      if (!isInDateRange(log.timestamp, dateRange)) return false;
      if (actionFilter !== "ALL" && log.action !== actionFilter) return false;
      if (userFilter !== "all" && log.user.email !== userFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !log.user.name.toLowerCase().includes(q) &&
          !log.user.email.toLowerCase().includes(q) &&
          !log.details.toLowerCase().includes(q) &&
          !log.action.toLowerCase().includes(q) &&
          !log.ip.includes(q)
        )
          return false;
      }
      return true;
    });
  }, [search, dateRange, actionFilter, userFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function resetPage() {
    setCurrentPage(1);
  }

  function exportCSV() {
    exportToExcel(
      [tr("Zaman", "Timestamp"), tr("İstifadəçi", "User"), "Email", tr("Vəzifə", "Role"), tr("Əməliyyat", "Action"), tr("Detallar", "Details"), "IP", "Status", tr("Resurs", "Resource"), "Session ID", "User Agent"],
      filtered.map(l => [
        formatFullTimestamp(l.timestamp),
        l.user.name, l.user.email, l.user.role,
        l.action, l.details, l.ip, l.status,
        l.resource ?? "", l.sessionId, l.userAgent,
      ]),
      `activity_logs_${dateRange}`
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">

        {/* Page Header */}
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {tr("Fəaliyyət Qeydləri", "Activity Logs")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {tr("Bütün istifadəçi əməliyyatlarını izləyin", "Track all user actions and system events")}
          </p>
        </div>

        {/* Action Buttons Row */}
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={() => { resetPage(); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title={tr("Yenilə", "Refresh")}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title={tr("CSV İxrac Et", "Export CSV")}
          >
            <Download className="w-3.5 h-3.5 text-green-500" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search */}
            <div className="flex-1 relative max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={tr("İstifadəçi, əməliyyat, IP axtar...", "Search user, action, IP...")}
                value={search}
                onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>

            {/* Selects */}
            <div className="flex gap-2 ml-auto flex-wrap">
              <FilterSelect
                value={dateRange}
                onChange={(v) => { setDateRange(v as DateRange); resetPage(); }}
                options={[
                  { value: "today", label: tr("Bu gün", "Today") },
                  { value: "week",  label: tr("Bu həftə", "This Week") },
                  { value: "month", label: tr("Bu ay", "This Month") },
                  { value: "all",   label: tr("Bütün vaxtlar", "All Time") },
                ]}
              />
              <FilterSelect
                value={actionFilter}
                onChange={(v) => { setActionFilter(v as ActionType | "ALL"); resetPage(); }}
                options={[
                  { value: "ALL",          label: tr("Bütün əməliyyatlar", "All Actions") },
                  { value: "LOGIN",        label: tr("Giriş", "Login") },
                  { value: "LOGOUT",       label: tr("Çıxış", "Logout") },
                  { value: "CREATE",       label: tr("Yarat", "Create") },
                  { value: "UPDATE",       label: tr("Yenilə", "Update") },
                  { value: "DELETE",       label: tr("Sil", "Delete") },
                  { value: "VIEW",         label: tr("Bax", "View") },
                  { value: "EXPORT",       label: tr("İxrac", "Export") },
                  { value: "SETTINGS",     label: tr("Parametrlər", "Settings") },
                  { value: "FAILED_LOGIN", label: tr("Uğursuz Giriş", "Failed Login") },
                ]}
              />
              <FilterSelect
                value={userFilter}
                onChange={(v) => { setUserFilter(v); resetPage(); }}
                options={[
                  { value: "all", label: tr("Bütün İstifadəçilər", "All Users") },
                  ...UNIQUE_USERS.map(([email, name]) => ({ value: email, label: name })),
                ]}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("ZAMAN", "TIMESTAMP")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("İSTİFADƏÇİ", "USER")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("DETALLAR", "DETAILS")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-12 text-center text-xs text-gray-400 dark:text-gray-600">
                      {tr("Filtrlərə uyğun qeyd tapılmadı.", "No log entries match your filters.")}
                    </td>
                  </tr>
                ) : (
                  paginated.map((log, index) => {
                    const isFailed = log.action === "FAILED_LOGIN";

                    return (
                      <tr
                        key={log.id}
                        className={[
                          "border-b border-gray-200 dark:border-gray-800 transition-colors",
                          index % 2 === 0
                            ? "bg-white dark:bg-gray-900"
                            : "bg-gray-50 dark:bg-gray-800/30",
                          isFailed ? "bg-red-50/30 dark:bg-red-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-800/50",
                        ].join(" ")}
                      >
                        {/* Timestamp */}
                        <td className="px-3 py-2 text-xs whitespace-nowrap">
                          <div className="font-medium text-gray-700 dark:text-gray-300">
                            {formatTimestamp(log.timestamp)}
                          </div>
                          <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-mono">
                            {formatFullTimestamp(log.timestamp)}
                          </div>
                        </td>

                        {/* User */}
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200 text-[10px] font-bold flex-shrink-0">
                              {log.user.avatarInitials}
                            </div>
                            <div>
                              <p className="text-xs text-gray-900 dark:text-white whitespace-nowrap">{log.user.name}</p>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap">{log.user.role}</p>
                            </div>
                          </div>
                        </td>

                        {/* Details + IP subtitle */}
                        <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 max-w-xs">
                          <p className="line-clamp-2 leading-snug">{log.details}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-mono">
                            {[log.resource, log.ip].filter(Boolean).join(" · ")}
                          </p>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
            <span>
              {tr("Göstərilir", "Showing")}{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}
              </span>{" "}
              {tr("/", "of")}{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">{filtered.length}</span>{" "}
              {tr("qeyd", "entries")}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-2.5 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {tr("Əvvəlki", "Previous")}
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "…" ? (
                    <span key={`ellipsis-${idx}`} className="px-1.5 text-gray-400">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item as number)}
                      className={`w-6 h-6 text-xs rounded border transition-colors ${
                        currentPage === item
                          ? "bg-[#14b8a6] border-[#14b8a6] text-white"
                          : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-2.5 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {tr("Növbəti", "Next")}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
