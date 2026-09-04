import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../../i18n";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  Plus,
  Pencil,
  Trash2,
  Download,
  X,
  Grid3X3,
  Users,
  Printer,
  Search,
  Settings2,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../../../app/context/AuthContext";
import { useBranchRevision } from "../../../../app/hooks/useBranchRevision";
import {
  createDiningTable,
  deleteDiningTable,
  fetchDiningRestaurantInfo,
  fetchDiningTables,
  updateDiningTable,
  upsertDiningRestaurantInfo,
  type DiningTable,
} from "../../../../app/api/dining";
import { ApiError } from "../../../../app/api/client";

const inputCls =
  "w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] transition-colors";

const AREAS = ["Indoor", "Outdoor", "Terrace", "Bar", "VIP"];

type UiStatus = "available" | "occupied" | "reserved";

const API_STATUS: Record<UiStatus, DiningTable["status"]> = {
  available: "AVAILABLE",
  occupied: "OCCUPIED",
  reserved: "RESERVED",
};
const UI_STATUS: Record<DiningTable["status"], UiStatus> = {
  AVAILABLE: "available",
  OCCUPIED: "occupied",
  RESERVED: "reserved",
};

const STATUS_LABEL: Record<UiStatus, { az: string; en: string }> = {
  available: { az: "Boş", en: "Available" },
  occupied: { az: "Dolu", en: "Occupied" },
  reserved: { az: "Rezerv", en: "Reserved" },
};
const STATUS_DOT: Record<UiStatus, string> = {
  available: "bg-green-500",
  occupied: "bg-red-500",
  reserved: "bg-amber-500",
};
const STATUS_BADGE: Record<UiStatus, string> = {
  available:
    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  occupied:
    "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  reserved:
    "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
};

type InfoForm = {
  name: string;
  tagline: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  instagram: string;
  facebook: string;
  twitter: string;
  tiktok: string;
  wifiSsid: string;
  wifiPassword: string;
};

const emptyInfo = (): InfoForm => ({
  name: "",
  tagline: "",
  logoUrl: "",
  address: "",
  phone: "",
  email: "",
  instagram: "",
  facebook: "",
  twitter: "",
  tiktok: "",
  wifiSsid: "",
  wifiPassword: "",
});

function errMsg(err: unknown) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Request failed";
}

function makeQrUrl(slug: string | null | undefined, tableId: string) {
  const base = window.location.origin;
  if (!slug) return `${base}/menu/table/${tableId}`;
  return `${base}/menu/${encodeURIComponent(slug)}/table/${tableId}`;
}

function TableModal({
  initial,
  defaultNumber,
  onSave,
  onClose,
}: {
  initial?: DiningTable;
  defaultNumber: number;
  onSave: (d: { name: string; seats: number; area: string; number: number }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [number, setNumber] = useState(initial?.number ?? defaultNumber);
  const [seats, setSeats] = useState(initial?.seats ?? 4);
  const [area, setArea] = useState(initial?.area ?? "Indoor");

  const active = "bg-[#14b8a6] border-[#14b8a6] text-white";
  const idle =
    "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-[#14b8a6]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {initial ? "Edit Table" : "Add Table"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-full p-1 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              Table Number
            </label>
            <input
              type="number"
              min={1}
              value={number}
              onChange={(e) => setNumber(Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              Table Name <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Table 7, Garden Booth…"
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              Seats
            </label>
            <div className="flex gap-1.5">
              {[2, 4, 6, 8, 10, 12].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSeats(n)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    seats === n ? active : idle
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              Area
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AREAS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setArea(a)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                    area === a ? active : idle
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!name.trim() || !number}
            onClick={() => {
              onSave({ name: name.trim(), seats, area, number });
              onClose();
            }}
            className="px-4 py-1.5 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function QRModal({
  table,
  qrUrl,
  onClose,
}: {
  table: DiningTable;
  qrUrl: string;
  onClose: () => void;
}) {
  const qrRef = useRef<HTMLDivElement>(null);
  const downloadQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
      type: "image/svg+xml",
    });
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: `qr-${table.name.replace(/\s+/g, "-")}.svg`,
    });
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("QR code downloaded");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-xs shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {table.name} — QR Code
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-full p-1 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div
            ref={qrRef}
            className="flex items-center justify-center p-4 bg-white rounded-xl border border-gray-100"
          >
            <QRCodeSVG value={qrUrl} size={160} level="H" includeMargin />
          </div>
          <p className="text-[10px] text-gray-400 font-mono break-all text-center">{qrUrl}</p>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2">
          <button
            type="button"
            onClick={downloadQR}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#14b8a6] hover:bg-[#0d9488] text-white text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Download SVG
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoModal({
  initial,
  onSave,
  onClose,
}: {
  initial: InfoForm;
  onSave: (i: InfoForm) => Promise<void>;
  onClose: () => void;
}) {
  const [info, setInfo] = useState<InfoForm>(initial);
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<InfoForm>) => setInfo((p) => ({ ...p, ...patch }));

  const field = (label: string, key: keyof InfoForm, placeholder?: string, type = "text") => (
    <div>
      <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">{label}</label>
      <input
        type={type}
        value={info[key]}
        onChange={(e) => set({ [key]: e.target.value })}
        placeholder={placeholder}
        className={inputCls}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Restaurant Info</h2>
          <button
            type="button"
            onClick={onClose}
            className="bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-full p-1 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Basic</p>
            {field("Restaurant Name", "name", "My Restaurant")}
            {field("Tagline", "tagline", "Fresh food, great vibes")}
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Contact</p>
            {field("Address", "address", "123 Main Street, City")}
            {field("Phone", "phone", "+994 50 000 0000", "tel")}
            {field("Email", "email", "info@restaurant.com", "email")}
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
              Social Links
            </p>
            {field("Instagram URL", "instagram", "https://instagram.com/…")}
            {field("Facebook URL", "facebook", "https://facebook.com/…")}
            {field("Twitter / X URL", "twitter", "https://x.com/…")}
            {field("TikTok URL", "tiktok", "https://tiktok.com/@…")}
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">WiFi</p>
            {field("Network Name (SSID)", "wifiSsid", "Restaurant_WiFi")}
            {field("Password", "wifiPassword", "yourpassword")}
          </div>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 sticky bottom-0 bg-white dark:bg-gray-900 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              void (async () => {
                setSaving(true);
                try {
                  await onSave(info);
                  onClose();
                } finally {
                  setSaving(false);
                }
              })();
            }}
            className="px-4 py-1.5 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function RestaurantTables() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const tr = (az: string, en: string) => (language === "az" ? az : en);
  const slug = user?.tenant?.slug ?? null;
  const branchRevision = useBranchRevision();

  const [tables, setTables] = useState<DiningTable[]>([]);
  const [info, setInfo] = useState<InfoForm>(emptyInfo());
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | { mode: "edit"; table: DiningTable } | null>(null);
  const [qrModal, setQrModal] = useState<DiningTable | null>(null);
  const [infoModal, setInfoModal] = useState(false);
  const [areaFilter, setAreaFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"all" | UiStatus>("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, i] = await Promise.all([fetchDiningTables(), fetchDiningRestaurantInfo()]);
      setTables(t);
      setInfo({
        name: String(i.name ?? ""),
        tagline: String(i.tagline ?? ""),
        logoUrl: String(i.logoUrl ?? ""),
        address: String(i.address ?? ""),
        phone: String(i.phone ?? ""),
        email: String(i.email ?? ""),
        instagram: String(i.instagram ?? ""),
        facebook: String(i.facebook ?? ""),
        twitter: String(i.twitter ?? ""),
        tiktok: String(i.tiktok ?? ""),
        wifiSsid: String(i.wifiSsid ?? ""),
        wifiPassword: String(i.wifiPassword ?? ""),
      });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, branchRevision]);

  const nextNumber = useMemo(
    () => Math.max(0, ...tables.map((t) => t.number)) + 1,
    [tables],
  );

  const areas = [
    "All",
    ...Array.from(new Set(tables.map((t) => t.area).filter(Boolean) as string[])),
  ];

  const filtered = tables.filter((t) => {
    const st = UI_STATUS[t.status];
    return (
      (areaFilter === "All" || t.area === areaFilter) &&
      (statusFilter === "all" || st === statusFilter) &&
      t.name.toLowerCase().includes(search.toLowerCase())
    );
  });

  const counts = {
    available: tables.filter((t) => t.status === "AVAILABLE").length,
    occupied: tables.filter((t) => t.status === "OCCUPIED").length,
    reserved: tables.filter((t) => t.status === "RESERVED").length,
  };

  const setStatus = async (id: string, uiStatus: UiStatus) => {
    try {
      const updated = await updateDiningTable(id, { status: API_STATUS[uiStatus] });
      setTables((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const filterActive = "bg-[#14b8a6] border-[#14b8a6] text-white";
  const filterIdle =
    "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800";

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Grid3X3 className="w-4 h-4 text-[#14b8a6]" />
            {tr("Masalar", "Tables")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {tables.length} {tr("masa", "tables")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setInfoModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" /> {tr("Məlumat", "Info")}
          </button>
          <button
            type="button"
            onClick={() => setModal("add")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[#14b8a6] hover:bg-[#0d9488] text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> {tr("Masa əlavə et", "Add Table")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(
          [
            ["available", tr("Boş", "Available"), "bg-green-50 dark:bg-green-900/20", "text-green-600 dark:text-green-400"],
            ["occupied", tr("Dolu", "Occupied"), "bg-red-50 dark:bg-red-900/20", "text-red-600 dark:text-red-400"],
            ["reserved", tr("Rezerv", "Reserved"), "bg-amber-50 dark:bg-amber-900/20", "text-amber-600 dark:text-amber-400"],
          ] as const
        ).map(([key, label, bg, fg]) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
            className={`bg-white dark:bg-gray-900 border rounded-xl p-3 text-left transition-all ${
              statusFilter === key
                ? "border-[#14b8a6] dark:border-[#0d9488] ring-1 ring-[#14b8a6] dark:ring-[#0d9488]"
                : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
            }`}
          >
            <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center mb-1.5`}>
              <div className={`w-2 h-2 rounded-full ${STATUS_DOT[key]}`} />
            </div>
            <p className={`text-lg font-semibold ${fg}`}>{counts[key]}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">{label}</p>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tr("Masa axtar…", "Search tables…")}
            className={`${inputCls} pl-8`}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {areas.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAreaFilter(a)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                areaFilter === a ? filterActive : filterIdle
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#14b8a6] border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  {[
                    "#",
                    tr("Ad", "Name"),
                    tr("Zona", "Area"),
                    tr("Oturacaq", "Seats"),
                    tr("Status", "Status"),
                    tr("Əməliyyat", "Actions"),
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-xs text-gray-400">
                      {tr("Masa tapılmadı", "No tables found")}
                    </td>
                  </tr>
                )}
                {filtered.map((table, idx) => {
                  const st = UI_STATUS[table.status];
                  return (
                    <tr
                      key={table.id}
                      className={`border-b border-gray-200 dark:border-gray-800 ${
                        idx % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/30"
                      } hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors`}
                    >
                      <td className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        #{table.number}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <p className="text-xs font-medium text-gray-900 dark:text-white">
                          {table.name}
                        </p>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {table.area || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                          <Users className="w-3 h-3" /> {table.seats}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <select
                          value={st}
                          onChange={(e) => void setStatus(table.id, e.target.value as UiStatus)}
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border cursor-pointer focus:outline-none ${STATUS_BADGE[st]}`}
                        >
                          <option value="available">{tr("Boş", "Available")}</option>
                          <option value="occupied">{tr("Dolu", "Occupied")}</option>
                          <option value="reserved">{tr("Rezerv", "Reserved")}</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setQrModal(table)}
                            className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            QR
                          </button>
                          <button
                            type="button"
                            onClick={() => setModal({ mode: "edit", table })}
                            className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              void (async () => {
                                try {
                                  await deleteDiningTable(table.id);
                                  setTables((prev) => prev.filter((t) => t.id !== table.id));
                                  toast.success(tr("Silindi", "Deleted"));
                                } catch (err) {
                                  toast.error(errMsg(err));
                                }
                              })();
                            }}
                            className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
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

      {modal === "add" && (
        <TableModal
          defaultNumber={nextNumber}
          onClose={() => setModal(null)}
          onSave={(d) => {
            void (async () => {
              try {
                const row = await createDiningTable({
                  number: d.number,
                  name: d.name,
                  seats: d.seats,
                  area: d.area,
                });
                setTables((prev) => [...prev, row].sort((a, b) => a.number - b.number));
                toast.success(`"${d.name}" ${tr("əlavə edildi", "added")}`);
              } catch (err) {
                toast.error(errMsg(err));
              }
            })();
          }}
        />
      )}
      {modal && typeof modal === "object" && (
        <TableModal
          initial={modal.table}
          defaultNumber={modal.table.number}
          onClose={() => setModal(null)}
          onSave={(d) => {
            void (async () => {
              try {
                const row = await updateDiningTable(modal.table.id, d);
                setTables((prev) =>
                  prev.map((t) => (t.id === row.id ? row : t)).sort((a, b) => a.number - b.number),
                );
                toast.success(tr("Yeniləndi", "Updated"));
              } catch (err) {
                toast.error(errMsg(err));
              }
            })();
          }}
        />
      )}

      {qrModal && (
        <QRModal
          table={qrModal}
          qrUrl={makeQrUrl(slug, qrModal.id)}
          onClose={() => setQrModal(null)}
        />
      )}

      {infoModal && (
        <InfoModal
          initial={info}
          onClose={() => setInfoModal(false)}
          onSave={async (next) => {
            const saved = await upsertDiningRestaurantInfo(next);
            setInfo({
              name: String(saved.name ?? ""),
              tagline: String(saved.tagline ?? ""),
              logoUrl: String(saved.logoUrl ?? ""),
              address: String(saved.address ?? ""),
              phone: String(saved.phone ?? ""),
              email: String(saved.email ?? ""),
              instagram: String(saved.instagram ?? ""),
              facebook: String(saved.facebook ?? ""),
              twitter: String(saved.twitter ?? ""),
              tiktok: String(saved.tiktok ?? ""),
              wifiSsid: String(saved.wifiSsid ?? ""),
              wifiPassword: String(saved.wifiPassword ?? ""),
            });
            toast.success(tr("Məlumat saxlanıldı", "Info saved"));
          }}
        />
      )}
    </div>
  );
}

export default RestaurantTables;
