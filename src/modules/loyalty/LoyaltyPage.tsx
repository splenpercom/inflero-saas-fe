import { useCallback, useEffect, useState } from "react";
import { Award, Check, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../../app/context/AuthContext";
import { useLanguage } from "../../app/i18n/LanguageContext";
import { pickLang } from "../../app/i18n/pickLang";
import { useModulePermissions } from "../../app/hooks/useModulePermissions";
import {
  assignLoyaltyRateToAll,
  createLoyaltyRate,
  deleteLoyaltyRate,
  fetchLoyaltyRates,
  updateLoyaltyRate,
  type LoyaltyRate,
} from "../../app/api/loyalty";
import { notifyFromError, notifySuccess } from "../../app/lib/toast";
import { useConfirm } from "../../app/context/ConfirmContext";
import { ModuleRouteGuard } from "../../app/components/modules/ModuleRouteGuard";

function LoyaltyPageInner() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const { canView, canCreate, canEdit, canDelete } = useModulePermissions("Loyalty");
  const askConfirm = useConfirm();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const [rates, setRates] = useState<LoyaltyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [percent, setPercent] = useState("5");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setRates([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (isDemo) {
        setRates([
          {
            id: "demo-rate",
            name: "Standard 5%",
            percent: "5.00",
            active: true,
            assignedToAllCards: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
      } else {
        setRates(await fetchLoyaltyRates());
      }
    } catch (err) {
      notifyFromError(err, tr("Tarifləri yükləmək alınmadı", "Failed to load rates"));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isDemo, canView, language]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    if (!canCreate || isDemo) return;
    const p = Number(percent);
    if (!name.trim() || !Number.isFinite(p) || p < 0 || p > 100) {
      notifyFromError(new Error(tr("Ad və 0–100% daxil edin", "Enter a name and 0–100%")));
      return;
    }
    setSaving(true);
    try {
      await createLoyaltyRate({ name: name.trim(), percent: p, active: true });
      setName("");
      notifySuccess(tr("Tarif yaradıldı", "Rate created"));
      await load();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async (rateId: string) => {
    if (!canEdit || isDemo) return;
    setSaving(true);
    try {
      await assignLoyaltyRateToAll(rateId);
      notifySuccess(tr("Bütün kartlara təyin edildi", "Assigned to all cards"));
      await load();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (rate: LoyaltyRate) => {
    if (!canEdit || isDemo) return;
    setSaving(true);
    try {
      await updateLoyaltyRate(rate.id, { active: !rate.active });
      notifySuccess(rate.active ? tr("Deaktiv edildi", "Deactivated") : tr("Aktiv edildi", "Activated"));
      await load();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rate: LoyaltyRate) => {
    if (!canDelete || isDemo) return;
    const ok = await askConfirm({
      title: tr("Tarifi sil", "Delete rate"),
      message: tr(
        `"${rate.name}" silinsin? Keçmiş əməliyyatlar dəyişmir.`,
        `Delete "${rate.name}"? Past ledger entries are unchanged.`,
      ),
      confirmLabel: tr("Sil", "Delete"),
    });
    if (!ok) return;
    setSaving(true);
    try {
      await deleteLoyaltyRate(rate.id);
      notifySuccess(tr("Silindi", "Deleted"));
      await load();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#14b8a6]/10">
            <Award className="h-5 w-5 text-[#14b8a6]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {tr("Loyalty", "Loyalty")}
            </h1>
            <p className="mt-1 text-xs text-gray-500">
              {tr(
                "Kart barkodu ilə pulback. POS-da hər satışda ya qazan, ya da istifadə et — eyni vaxtda yox.",
                "Card barcode cashback. On POS each sale can earn or redeem — never both.",
              )}
            </p>
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          <p className="font-semibold mb-1">{tr("Qaydalar", "Rules")}</p>
          <ul className="list-disc space-y-1 pl-4">
            <li>
              {tr(
                "İstifadə: cüzdanın tam balansı, amma məhsul alt-cəmi ilə məhdudlaşır; qalanı qalır.",
                "Redeem: attempts full wallet balance, capped by merchandise subtotal; leftover stays.",
              )}
            </li>
            <li>
              {tr(
                "Qaytarma: avtomatik cüzdan geri yazılmır (qazanılmış qalır; istifadə olunmuş geri yazılmır).",
                "Returns: no automatic wallet reverse (earned stays; redeemed is not re-credited).",
              )}
            </li>
            <li>
              {tr(
                "Plugin söndürülsə: UI gizlənir, balanslar saxlanılır (freeze).",
                "If the plugin is disabled: UI is hidden; balances are kept (freeze).",
              )}
            </li>
          </ul>
        </div>

        {canCreate && (
          <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              {tr("Yeni cashback tarifi", "New cashback rate")}
            </h2>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={tr("Ad", "Name")}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              />
              <input
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                type="number"
                min={0}
                max={100}
                step="0.01"
                placeholder="%"
                className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              />
              <button
                type="button"
                disabled={saving || isDemo}
                onClick={() => void handleCreate()}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#14b8a6] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {tr("Əlavə et", "Add")}
              </button>
            </div>
            {isDemo && (
              <p className="mt-2 text-[11px] text-gray-400">
                {tr("Demo rejimində saxlanılmır", "Not persisted in demo mode")}
              </p>
            )}
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {tr("Cashback tarifləri", "Cashback rates")}
            </h2>
            <p className="mt-0.5 text-[11px] text-gray-500">
              {tr(
                "Eyni vaxtda yalnız bir tarif bütün kartlara təyin oluna bilər. Təyin yoxdursa POS-da qazanma söndürülür.",
                "Only one rate can be assigned to all cards. Without an assignment, earn is disabled in POS.",
              )}
            </p>
          </div>
          {loading ? (
            <p className="p-6 text-center text-xs text-gray-400">{tr("Yüklənir...", "Loading...")}</p>
          ) : rates.length === 0 ? (
            <p className="p-6 text-center text-xs text-gray-400">
              {tr("Hələ tarif yoxdur", "No rates yet")}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {rates.map((rate) => (
                <li key={rate.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {rate.name}{" "}
                      <span className="font-mono text-[#14b8a6]">{rate.percent}%</span>
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {rate.active ? tr("Aktiv", "Active") : tr("Qeyri-aktiv", "Inactive")}
                      {rate.assignedToAllCards
                        ? ` · ${tr("Bütün kartlara təyin edilib", "Assigned to all cards")}`
                        : ""}
                    </p>
                  </div>
                  {canEdit && (
                    <button
                      type="button"
                      disabled={saving || isDemo || rate.assignedToAllCards || !rate.active}
                      onClick={() => void handleAssign(rate.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs disabled:opacity-40 dark:border-gray-700"
                    >
                      {rate.assignedToAllCards ? <Check className="h-3.5 w-3.5 text-[#14b8a6]" /> : null}
                      {rate.assignedToAllCards
                        ? tr("Təyin edilib", "Assigned")
                        : tr("Hamısına təyin et", "Assign to all")}
                    </button>
                  )}
                  {canEdit && (
                    <button
                      type="button"
                      disabled={saving || isDemo}
                      onClick={() => void handleDeactivate(rate)}
                      className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-700"
                    >
                      {rate.active ? tr("Deaktiv et", "Deactivate") : tr("Aktiv et", "Activate")}
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      disabled={saving || isDemo}
                      onClick={() => void handleDelete(rate)}
                      className="rounded-lg border border-red-200 p-1.5 text-red-600 dark:border-red-900"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function LoyaltyPage() {
  return (
    <ModuleRouteGuard module="LOYALTY">
      <LoyaltyPageInner />
    </ModuleRouteGuard>
  );
}
