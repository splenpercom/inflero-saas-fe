import { useState } from "react";
import { Loader2, Save, Wifi } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { pickLang } from "../../i18n/pickLang";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { NoAccessPanel } from "../permissions/NoAccessPanel";
import { notifyFromError, notifySuccess, notifyWarning } from "../../lib/toast";
import { getPosTerminalId } from "../../lib/posPrinterSettings";
import {
  loadOmnicashierSettings,
  saveOmnicashierSettings,
  type OmnicashierSettings,
} from "../../lib/omnicashierSettings";
import { clearOmnicashierSession, ensureOmnicashierSession } from "../../lib/omnicashier/session";

/**
 * Per-PC OmniCashier fiscal device settings (Settings → OmniCashier).
 * Same localStorage as the fiscal client; independent from POS printers.
 */
export function OmnicashierSettingsPanel({
  embedded = true,
  accessModule = "Settings",
}: {
  embedded?: boolean;
  accessModule?: "Settings" | "POS";
}) {
  const { language } = useLanguage();
  const { canView, canEdit } = useModulePermissions(accessModule);
  const canMutate = accessModule === "POS" ? canView : canEdit;
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const [omni, setOmni] = useState<OmnicashierSettings>(() => loadOmnicashierSettings());
  const [saving, setSaving] = useState(false);
  const [testingOmni, setTestingOmni] = useState(false);
  const terminalId = getPosTerminalId();

  const handleSave = () => {
    if (!canMutate) return;
    setSaving(true);
    try {
      saveOmnicashierSettings(omni);
      clearOmnicashierSession();
      notifySuccess(tr("OmniCashier parametrləri saxlanıldı", "OmniCashier settings saved"));
    } catch (err) {
      notifyFromError(err, tr("Saxlanılmadı", "Failed to save"));
    } finally {
      setSaving(false);
    }
  };

  const handleTestOmniLogin = async () => {
    if (!canMutate) return;
    if (!omni.host.trim() || !omni.username.trim()) {
      notifyWarning(
        tr("OmniCashier host və istifadəçi adı tələb olunur", "OmniCashier host and username are required"),
      );
      return;
    }
    setTestingOmni(true);
    try {
      saveOmnicashierSettings({ ...omni, enabled: true });
      clearOmnicashierSession();
      await ensureOmnicashierSession({ ...omni, enabled: true });
      notifySuccess(tr("OmniCashier giriş uğurlu", "OmniCashier login OK"));
    } catch (err) {
      notifyFromError(err, tr("OmniCashier giriş uğursuz", "OmniCashier login failed"));
    } finally {
      setTestingOmni(false);
    }
  };

  if (!canView) return <NoAccessPanel />;

  return (
    <div className={embedded ? "p-4 space-y-4" : "p-4 sm:p-6 max-w-3xl mx-auto space-y-4"}>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {tr(
          "Kart ödənişlərində və satış qaytarmalarında fiskal qəbz. Cihaz eyni Wi‑Fi-də olmalıdır (port 8989). Lokal mock üçün host: proxy və ya 127.0.0.1.",
          "Fiscal receipts for Card payments and sales returns. Device must be on the same Wi‑Fi (port 8989). For local mock use host: proxy or 127.0.0.1.",
        )}
      </p>

      <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
        <input
          type="checkbox"
          checked={omni.enabled}
          onChange={(e) => setOmni((s) => ({ ...s, enabled: e.target.checked }))}
          disabled={!canMutate}
          className="rounded border-gray-300 text-[#14b8a6] focus:ring-[#14b8a6]"
        />
        {tr("OmniCashier aktiv", "Enable OmniCashier")}
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
            {tr("Cihaz IP / host", "Device IP / host")}
          </label>
          <input
            type="text"
            value={omni.host}
            onChange={(e) => setOmni((s) => ({ ...s, host: e.target.value }))}
            disabled={!canMutate}
            placeholder="192.168.1.103 or proxy"
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
            {tr("Port", "Port")}
          </label>
          <input
            type="number"
            value={omni.port}
            onChange={(e) => setOmni((s) => ({ ...s, port: Number(e.target.value) || 8989 }))}
            disabled={!canMutate}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
            {tr("API istifadəçi", "API username")}
          </label>
          <input
            type="text"
            value={omni.username}
            onChange={(e) => setOmni((s) => ({ ...s, username: e.target.value }))}
            disabled={!canMutate}
            placeholder="SuperApi"
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
            {tr("API şifrə", "API password")}
          </label>
          <input
            type="password"
            value={omni.password}
            onChange={(e) => setOmni((s) => ({ ...s, password: e.target.value }))}
            disabled={!canMutate}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
            {tr("Defolt ƏDV %", "Default VAT %")}
          </label>
          <input
            type="number"
            step="0.1"
            value={omni.defaultVatPercent}
            onChange={(e) =>
              setOmni((s) => ({
                ...s,
                defaultVatPercent: Number(e.target.value) || 18,
              }))
            }
            disabled={!canMutate}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50"
          />
        </div>
      </div>

      <p className="text-[10px] text-gray-400 font-mono break-all">
        {tr("Terminal ID", "Terminal ID")}: {terminalId}
      </p>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={() => void handleTestOmniLogin()}
          disabled={testingOmni || !canMutate}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-slate-700 hover:bg-slate-800 rounded-lg disabled:opacity-50"
        >
          {testingOmni ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />}
          {tr("OmniCashier test giriş", "Test OmniCashier login")}
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
  );
}
