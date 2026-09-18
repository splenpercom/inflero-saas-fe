import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Loader2,
  Printer,
  RefreshCw,
  Save,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { pickLang } from "../../i18n/pickLang";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { NoAccessPanel } from "../permissions/NoAccessPanel";
import { ModernSelect } from "../ui/ModernSelect";
import { notifyFromError, notifySuccess, notifyWarning } from "../../lib/toast";
import {
  getPosTerminalId,
  loadPosPrinterSettings,
  savePosPrinterSettings,
  type PaperWidthMm,
  type PosPrinterSettings,
} from "../../lib/posPrinterSettings";
import {
  ensureQzConnected,
  getQzConnectionHint,
  isQzAvailable,
  listQzPrinters,
} from "../../lib/qzTrayClient";
import { printPosTicket } from "../../lib/posPrint";
import type { ThermalReceiptPayload } from "../../lib/thermalReceipt";

function samplePayload(language: "az" | "en" | "ru"): ThermalReceiptPayload {
  const isAz = language === "az";
  return {
    orderNo: "TEST-001",
    date: new Date().toLocaleString(),
    customer: isAz ? "Test musterisi" : "Test customer",
    customerPhone: "+994500000000",
    employee: isAz ? "Kassir" : "Cashier",
    items: [
      { name: isAz ? "Test mehsul" : "Test item", qty: 2, price: 5 },
      { name: isAz ? "Icki" : "Drink", qty: 1, price: 3 },
    ],
    subtotal: 13,
    shipping: 0,
    serviceFee: 0,
    discount: 0,
    discountLabel: isAz ? "Endirim" : "Discount",
    total: 13,
    paymentMethod: isAz ? "Nagd" : "Cash",
    paymentStatusLabel: isAz ? "Odenilib" : "Paid",
    tableLabel: isAz ? "Gelən müşteri" : "Walk-in",
    companyName: "Inflero POS",
    siteFooter: "app.inflero.com",
  };
}

export function PosPrinterSettings({
  embedded = false,
  /** Cashiers on POS use Sales; Settings page uses Settings RBAC. */
  accessModule = "Settings",
}: {
  embedded?: boolean;
  accessModule?: "Settings" | "Sales";
}) {
  const { language } = useLanguage();
  const { canView, canEdit } = useModulePermissions(accessModule);
  /** Terminal printer map is local — Sales users with view can configure this PC. */
  const canMutate = accessModule === "Sales" ? canView : canEdit;
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const [settings, setSettings] = useState<PosPrinterSettings>(() => loadPosPrinterSettings());
  const [printers, setPrinters] = useState<string[]>([]);
  const [qzOnline, setQzOnline] = useState(false);
  const [loadingPrinters, setLoadingPrinters] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<"receipt" | "kot" | null>(null);
  const terminalId = getPosTerminalId();

  const refreshQz = useCallback(async () => {
    setLoadingPrinters(true);
    try {
      await ensureQzConnected();
      const online = await isQzAvailable();
      setQzOnline(online);
      if (online) {
        const list = await listQzPrinters();
        setPrinters(list);
      } else {
        setPrinters([]);
      }
    } catch {
      setQzOnline(false);
      setPrinters([]);
    } finally {
      setLoadingPrinters(false);
    }
  }, []);

  useEffect(() => {
    void refreshQz();
  }, [refreshQz]);

  const handleSave = () => {
    if (!canMutate) return;
    setSaving(true);
    try {
      savePosPrinterSettings(settings);
      notifySuccess(tr("Printer parametrləri saxlanıldı", "Printer settings saved"));
    } catch (err) {
      notifyFromError(err, tr("Saxlanılmadı", "Failed to save"));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (role: "receipt" | "kot") => {
    const printer = role === "receipt" ? settings.receiptPrinter : settings.kotPrinter;
    if (!printer.trim()) {
      notifyWarning(
        tr(
          role === "receipt" ? "Qəbz printeri seçin" : "KOT printeri seçin",
          role === "receipt" ? "Select a receipt printer" : "Select a KOT printer",
        ),
      );
      return;
    }
    savePosPrinterSettings(settings);
    setTesting(role);
    try {
      const result = await printPosTicket({
        role,
        language,
        payload: samplePayload(language),
      });
      notifySuccess(
        result.channel === "qz"
          ? tr(
              `Çap edildi → ${result.printer}`,
              `Printed → ${result.printer}`,
            )
          : tr(
              "Brauzer çap dialoqu açıldı (QZ mövcud deyil və ya uğursuz oldu)",
              "Browser print dialog opened (QZ unavailable or failed)",
            ),
      );
    } catch (err) {
      notifyFromError(err, getQzConnectionHint(language === "ru" ? "ru" : language === "az" ? "az" : "en"));
    } finally {
      setTesting(null);
    }
  };

  if (!canView) return <NoAccessPanel />;

  const printerOptions = [
    { value: "", label: tr("Seçilməyib", "Not selected") },
    ...printers.map((name) => ({ value: name, label: name })),
    ...(settings.receiptPrinter && !printers.includes(settings.receiptPrinter)
      ? [{ value: settings.receiptPrinter, label: `${settings.receiptPrinter} (saved)` }]
      : []),
    ...(settings.kotPrinter &&
    settings.kotPrinter !== settings.receiptPrinter &&
    !printers.includes(settings.kotPrinter)
      ? [{ value: settings.kotPrinter, label: `${settings.kotPrinter} (saved)` }]
      : []),
  ];

  return (
    <div className={embedded ? "" : "flex-1 overflow-auto bg-gray-50 dark:bg-gray-950"}>
      <div className={embedded ? "" : "p-4 sm:p-6 max-w-3xl mx-auto"}>
        {!embedded && (
          <div className="mb-4 flex items-start gap-3">
            <Link
              to="/dashboard/settings"
              className="mt-0.5 p-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#14b8a6]" />
                {tr("POS Printerlər", "POS Printers")}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {tr(
                  "Bu kompüter/terminal üçün qəbz və KOT printerlərini təyin edin. QZ Tray ilə səssiz çap.",
                  "Map receipt and KOT printers for this PC/terminal. Silent print via QZ Tray.",
                )}
              </p>
            </div>
          </div>
        )}

        <div className={embedded ? "p-4 space-y-4" : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-4"}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              {qzOnline ? (
                <span className="inline-flex items-center gap-1.5 text-green-700 dark:text-green-400 font-medium">
                  <Wifi className="w-3.5 h-3.5" />
                  {tr("QZ Tray qoşulub", "QZ Tray connected")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
                  <WifiOff className="w-3.5 h-3.5" />
                  {tr("QZ Tray qoşulmayıb", "QZ Tray offline")}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => void refreshQz()}
              disabled={loadingPrinters}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              {loadingPrinters ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              {tr("Printerləri yenilə", "Refresh printers")}
            </button>
          </div>

          {!qzOnline && (
            <p className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
              {getQzConnectionHint(language === "ru" ? "ru" : language === "az" ? "az" : "en")}{" "}
              <a
                href="https://qz.io/download/"
                target="_blank"
                rel="noreferrer"
                className="underline font-medium"
              >
                qz.io/download
              </a>
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Qəbz / Bill printeri", "Receipt / Bill printer")}
              </label>
              <ModernSelect
                value={settings.receiptPrinter}
                onChange={(value) => setSettings((s) => ({ ...s, receiptPrinter: value }))}
                options={printerOptions}
                className="w-full"
                placeholder={tr("Printer seçin", "Select printer")}
                disabled={!canMutate}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("KOT / Mətbəx printeri", "KOT / Kitchen printer")}
              </label>
              <ModernSelect
                value={settings.kotPrinter}
                onChange={(value) => setSettings((s) => ({ ...s, kotPrinter: value }))}
                options={printerOptions}
                className="w-full"
                placeholder={tr("Printer seçin", "Select printer")}
                disabled={!canMutate}
              />
              {settings.receiptPrinter.trim() && !settings.kotPrinter.trim() && (
                <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-1">
                  {tr(
                    "KOT boşdursa qəbz printerindən istifadə olunur.",
                    "If KOT is empty, the receipt printer is used.",
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Kağız eni", "Paper width")}
              </label>
              <ModernSelect
                value={String(settings.paperWidthMm)}
                onChange={(value) =>
                  setSettings((s) => ({
                    ...s,
                    paperWidthMm: (Number(value) === 58 ? 58 : 80) as PaperWidthMm,
                  }))
                }
                options={[
                  { value: "80", label: "80 mm" },
                  { value: "58", label: "58 mm" },
                ]}
                className="w-full"
                disabled={!canMutate}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={settings.preferQz}
                  onChange={(e) => setSettings((s) => ({ ...s, preferQz: e.target.checked }))}
                  disabled={!canMutate}
                  className="rounded border-gray-300 text-[#14b8a6] focus:ring-[#14b8a6]"
                />
                {tr("QZ Tray ilə səssiz çap (mümkün olduqda)", "Silent print via QZ Tray when available")}
              </label>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 font-mono break-all">
            {tr("Terminal ID", "Terminal ID")}: {terminalId}
          </p>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => void handleTest("receipt")}
              disabled={!!testing || !canMutate}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-[#14b8a6] hover:bg-[#0d9488] rounded-lg disabled:opacity-50"
            >
              {testing === "receipt" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
              {tr("Test qəbz", "Test receipt")}
            </button>
            <button
              type="button"
              onClick={() => void handleTest("kot")}
              disabled={!!testing || !canMutate}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg disabled:opacity-50"
            >
              {testing === "kot" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
              {tr("Test KOT", "Test KOT")}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !canMutate}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 ml-auto"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {tr("Saxla", "Save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
