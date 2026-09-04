import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "../../i18n";
import { toast } from "sonner";
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Utensils,
  RefreshCw,
  Bell,
  Filter,
} from "lucide-react";
import { fetchKotOrders, patchKotStatus, type KotOrder } from "../../../../app/api/dining";
import { ApiError } from "../../../../app/api/client";
import { useBranchRevision } from "../../../../app/hooks/useBranchRevision";

type KOTStatus = "pending" | "preparing" | "done" | "served";

interface KOTItem {
  name: string;
  qty: number;
  notes?: string;
}

interface UiKotOrder {
  id: string;
  tableNumber: number | null;
  tableName: string;
  orderNumber: string;
  status: KOTStatus;
  expected: KotOrder["kotStatus"];
  source: string;
  items: KOTItem[];
  placedAt: Date;
  updatedAt: Date;
}

const API_TO_UI: Record<string, KOTStatus> = {
  PENDING: "pending",
  PREPARING: "preparing",
  READY: "done",
  SERVED: "served",
};

const UI_TO_API: Record<KOTStatus, "PENDING" | "PREPARING" | "READY" | "SERVED"> = {
  pending: "PENDING",
  preparing: "PREPARING",
  done: "READY",
  served: "SERVED",
};

const STATUS_CFG: Record<
  KOTStatus,
  { az: string; en: string; dot: string; headerBg: string; cardBg: string; cardBorder: string }
> = {
  pending: {
    az: "Gözləyir",
    en: "Pending",
    dot: "bg-amber-500",
    headerBg: "bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800",
    cardBg: "bg-white dark:bg-gray-900",
    cardBorder: "border-amber-300 dark:border-amber-700",
  },
  preparing: {
    az: "Hazırlanır",
    en: "Preparing",
    dot: "bg-blue-500",
    headerBg: "bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800",
    cardBg: "bg-white dark:bg-gray-900",
    cardBorder: "border-blue-300 dark:border-blue-700",
  },
  done: {
    az: "Hazır",
    en: "Ready",
    dot: "bg-green-500",
    headerBg: "bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800",
    cardBg: "bg-white dark:bg-gray-900",
    cardBorder: "border-green-300 dark:border-green-700",
  },
  served: {
    az: "Verildi",
    en: "Served",
    dot: "bg-gray-400",
    headerBg: "bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700",
    cardBg: "bg-white dark:bg-gray-900",
    cardBorder: "border-gray-200 dark:border-gray-700",
  },
};

const NEXT_STATUS: Partial<Record<KOTStatus, KOTStatus>> = {
  pending: "preparing",
  preparing: "done",
  done: "served",
};

const NEXT_BTN: Partial<Record<KOTStatus, { az: string; en: string; cls: string }>> = {
  pending: {
    az: "Hazırlamağa Başla",
    en: "Start Preparing",
    cls: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  preparing: {
    az: "Hazır Et",
    en: "Mark Ready",
    cls: "bg-green-600 hover:bg-green-700 text-white",
  },
  done: {
    az: "Verildi",
    en: "Mark Served",
    cls: "bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 text-white",
  },
};

function errMsg(err: unknown) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Request failed";
}

const elapsed = (d: Date): string => {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
};

function mapOrder(o: KotOrder): UiKotOrder {
  const status = API_TO_UI[o.kotStatus ?? "PENDING"] ?? "pending";
  const placed = o.kotSentAt || o.createdAt;
  const updated = o.kotUpdatedAt || placed;
  return {
    id: o.id,
    tableNumber: o.table?.number ?? null,
    tableName: o.table ? `#${o.table.number} ${o.table.name}` : "—",
    orderNumber: o.reference || o.documentNo || o.id.slice(0, 8),
    status,
    expected: o.kotStatus,
    source: o.source,
    items: o.items.map((i) => ({ name: i.name, qty: i.qty })),
    placedAt: new Date(placed),
    updatedAt: new Date(updated),
  };
}

function KOTCard({
  order,
  onAdvance,
  advancing,
  language,
}: {
  order: UiKotOrder;
  onAdvance: (id: string, next: KOTStatus, expected: KotOrder["kotStatus"]) => void;
  advancing: boolean;
  language: string;
}) {
  const cfg = STATUS_CFG[order.status];
  const next = NEXT_STATUS[order.status];
  const btn = next ? NEXT_BTN[order.status] : undefined;
  const isUrgent =
    order.status === "pending" && Date.now() - order.placedAt.getTime() > 8 * 60000;
  const totalQty = order.items.reduce((s, i) => s + i.qty, 0);

  return (
    <div
      className={`rounded-xl border-2 ${cfg.cardBorder} ${cfg.cardBg} overflow-hidden ${
        isUrgent ? "ring-2 ring-red-500 ring-offset-1" : ""
      }`}
    >
      <div className={`${cfg.headerBg} px-3 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot} ${isUrgent ? "animate-pulse" : ""}`} />
          <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{order.tableName}</p>
          <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 flex-shrink-0">
            {order.orderNumber}
          </span>
          <span className="text-[9px] text-gray-400 flex-shrink-0">
            {order.source === "QR_MENU" ? "QR" : "POS"}
          </span>
        </div>
        {isUrgent && (
          <span className="text-[9px] font-bold text-red-600 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded animate-pulse flex-shrink-0">
            URGENT
          </span>
        )}
      </div>
      <div className="px-3 py-2.5 space-y-1.5">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="w-5 h-5 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-700 dark:text-gray-300 flex-shrink-0 mt-0.5">
              {item.qty}
            </span>
            <div>
              <p className="text-xs font-medium text-gray-800 dark:text-gray-200 leading-tight">{item.name}</p>
              {item.notes && (
                <p className="text-[10px] text-orange-600 dark:text-orange-400 italic">⚠ {item.notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="px-3 pb-2.5 space-y-2">
        <div className="flex items-center justify-between text-[10px] text-gray-400">
          <span className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> {elapsed(order.placedAt)}
          </span>
          <span>
            {totalQty} {totalQty === 1 ? "item" : "items"}
          </span>
        </div>
        {btn && next && (
          <button
            type="button"
            disabled={advancing}
            onClick={() => onAdvance(order.id, next, order.expected)}
            className={`w-full py-1.5 rounded-lg text-[10px] font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed ${btn.cls}`}
          >
            {advancing
              ? language === "az"
                ? "Yenilənir…"
                : "Updating…"
              : language === "az"
                ? btn.az
                : btn.en}
          </button>
        )}
        {order.status === "served" && (
          <div className="w-full py-1.5 rounded-lg text-[10px] font-semibold text-center text-gray-400 bg-gray-100 dark:bg-gray-800">
            ✓ {language === "az" ? "Tamamlandı" : "Completed"}
          </div>
        )}
      </div>
    </div>
  );
}

export function RestaurantKOT() {
  const { language } = useLanguage();
  const tr = (az: string, en: string) => (language === "az" ? az : en);
  const branchRevision = useBranchRevision();
  const [orders, setOrders] = useState<UiKotOrder[]>([]);
  const [filterStatus, setFilterStatus] = useState<KOTStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [advancingIds, setAdvancingIds] = useState<Record<string, true>>({});

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      // Always include served so the 4-column board matches the original UI.
      const rows = await fetchKotOrders(true);
      setOrders(rows.map(mapOrder));
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const poll = setInterval(() => void load({ silent: true }), 8000);
    const clock = setInterval(() => setTick((t) => t + 1), 30000);
    return () => {
      clearInterval(poll);
      clearInterval(clock);
    };
  }, [load, branchRevision]);

  const advance = async (id: string, next: KOTStatus, expected: KotOrder["kotStatus"]) => {
    if (advancingIds[id]) return;
    setAdvancingIds((prev) => ({ ...prev, [id]: true }));
    try {
      await patchKotStatus(id, {
        kotStatus: UI_TO_API[next],
        expectedKotStatus: expected,
      });
      const lbl: Record<KOTStatus, string> = {
        pending: "Pending",
        preparing: "Preparing",
        done: "Ready",
        served: "Served",
      };
      toast.success(`Order → ${lbl[next]}`);
      await load({ silent: true });
    } catch (err) {
      toast.error(errMsg(err));
      await load({ silent: true });
    } finally {
      setAdvancingIds((prev) => {
        const nextMap = { ...prev };
        delete nextMap[id];
        return nextMap;
      });
    }
  };

  const statusOrder: KOTStatus[] = ["pending", "preparing", "done", "served"];
  const visible = orders.filter((o) => filterStatus === "all" || o.status === filterStatus);
  const counts: Record<KOTStatus, number> = {
    pending: orders.filter((o) => o.status === "pending").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    done: orders.filter((o) => o.status === "done").length,
    served: orders.filter((o) => o.status === "served").length,
  };
  const urgent = orders.filter(
    (o) => o.status === "pending" && Date.now() - o.placedAt.getTime() > 8 * 60000,
  ).length;

  const filterActiveCls =
    "bg-[#14b8a6] border-[#14b8a6] text-white";
  const filterIdleCls =
    "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800";

  return (
    <div className="p-4 space-y-4" key={tick}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-[#14b8a6]" />
            {tr("Mətbəx Sifarişləri", "Kitchen Order Tickets")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {counts.pending + counts.preparing} {tr("aktiv", "active")}
            {urgent > 0 && (
              <span className="ml-2 text-red-500 font-medium animate-pulse">
                · {urgent} {tr("təcili", "urgent")}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {urgent > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800">
              <Bell className="w-2.5 h-2.5 animate-pulse" /> {urgent} {tr("Gözləyir", "Waiting")}
            </span>
          )}
          <button
            type="button"
            onClick={() => void load()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {statusOrder.map((s) => {
          const cfg = STATUS_CFG[s];
          return (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
              className={`bg-white dark:bg-gray-900 border rounded-xl p-2.5 text-left transition-all ${
                filterStatus === s
                  ? "border-[#14b8a6] dark:border-[#0d9488] ring-1 ring-[#14b8a6] dark:ring-[#0d9488]"
                  : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                  {language === "az" ? cfg.az : cfg.en}
                </span>
              </div>
              <p className="text-base font-semibold text-gray-900 dark:text-white">{counts[s]}</p>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => setFilterStatus("all")}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
            filterStatus === "all" ? filterActiveCls : filterIdleCls
          }`}
        >
          <Filter className="w-3 h-3" /> {tr("Hamısı", "All")} ({orders.length})
        </button>
        {statusOrder.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              filterStatus === s ? filterActiveCls : filterIdleCls
            }`}
          >
            {language === "az" ? STATUS_CFG[s].az : STATUS_CFG[s].en} ({counts[s]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#14b8a6] border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="hidden lg:grid grid-cols-4 gap-3">
            {statusOrder.map((s) => {
              const cfg = STATUS_CFG[s];
              const col =
                filterStatus === "all" || filterStatus === s
                  ? orders.filter((o) => o.status === s)
                  : [];
              return (
                <div key={s}>
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200 dark:border-gray-800">
                    <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      {language === "az" ? cfg.az : cfg.en}
                    </p>
                    <span className="ml-auto text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                      {orders.filter((o) => o.status === s).length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {col.length === 0 && (
                      <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-5 flex flex-col items-center gap-1.5">
                        {s === "pending" ? (
                          <Utensils className="w-4 h-4 text-gray-300" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-gray-300" />
                        )}
                        <p className="text-[10px] text-gray-400">{tr("Boş", "Empty")}</p>
                      </div>
                    )}
                    {col.map((o) => (
                      <KOTCard
                        key={o.id}
                        order={o}
                        onAdvance={advance}
                        advancing={!!advancingIds[o.id]}
                        language={language}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visible.length === 0 && (
              <div className="col-span-2 py-10 text-center">
                <ChefHat className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">{tr("Aktiv sifariş yoxdur", "No active orders")}</p>
              </div>
            )}
            {visible.map((o) => (
              <KOTCard
                key={o.id}
                order={o}
                onAdvance={advance}
                advancing={!!advancingIds[o.id]}
                language={language}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
