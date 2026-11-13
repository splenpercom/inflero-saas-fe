import { useCallback, useEffect, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../../app/context/AuthContext";
import { useBranch } from "../../app/context/BranchContext";
import { useLanguage } from "../../app/i18n/LanguageContext";
import { pickLang } from "../../app/i18n/pickLang";
import { useModulePermissions } from "../../app/hooks/useModulePermissions";
import {
  assignLoyaltyRateToAll,
  createBuyGetOffer,
  createLoyaltyRate,
  deleteBuyGetOffer,
  deleteLoyaltyRate,
  fetchBuyGetOffers,
  fetchLoyaltyRates,
  fetchLoyaltySettings,
  fetchLoyaltyStats,
  updateBuyGetOffer,
  updateLoyaltyRate,
  updateLoyaltySettings,
  type LoyaltyBuyGetOffer,
  type LoyaltyProgramType,
  type LoyaltyRate,
  type LoyaltyStats,
} from "../../app/api/loyalty";
import { fetchCategories, fetchProducts } from "../../app/api/inventory";
import { fetchCustomers } from "../../app/api/people";
import { notifyFromError, notifySuccess } from "../../app/lib/toast";
import { useConfirm } from "../../app/context/ConfirmContext";
import { ModuleRouteGuard } from "../../app/components/modules/ModuleRouteGuard";
import { CreateLoyaltyRateModal } from "./CreateLoyaltyRateModal";
import {
  CreateBuyGetOfferModal,
  type BuyGetOfferFormData,
} from "./CreateBuyGetOfferModal";

type CatalogOption = {
  id: string;
  name: string;
  sku?: string | null;
  categoryId?: string | null;
};

function LoyaltyPageInner() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const { branchId, branchManagementEnabled } = useBranch();
  const { canView, canCreate, canEdit, canDelete } = useModulePermissions("Loyalty");
  const askConfirm = useConfirm();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const [programType, setProgramType] = useState<LoyaltyProgramType>("DISCOUNT");
  const [rates, setRates] = useState<LoyaltyRate[]>([]);
  const [offers, setOffers] = useState<LoyaltyBuyGetOffer[]>([]);
  const [stats, setStats] = useState<LoyaltyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const [products, setProducts] = useState<CatalogOption[]>([]);
  const [categories, setCategories] = useState<CatalogOption[]>([]);
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; code: string }>>([]);

  const branchReady = !branchManagementEnabled || Boolean(branchId);

  const loadCatalog = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || isDemo) return;
    setCatalogLoading(true);
    try {
      // forPos loads the full POS catalog (no pageSize cap). Status must be ACTIVE (API enum).
      const [prodRes, catRes, custRes] = await Promise.all([
        fetchProducts({ page: 1, pageSize: 100, forPos: true, status: "ACTIVE" }),
        fetchCategories(),
        fetchCustomers({ limit: 500 }),
      ]);
      setProducts(
        (prodRes.items ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku ?? null,
          categoryId: p.categoryId ?? null,
        })),
      );
      setCategories(
        (catRes ?? [])
          .filter((c) => c.status === "active")
          .map((c) => ({ id: c.id, name: c.name })),
      );
      const customerList = Array.isArray(custRes) ? custRes : [];
      setCustomers(customerList.map((c) => ({ id: c.id, name: c.name, code: c.code })));
    } catch (err) {
      notifyFromError(err, tr("Kataloq yüklənmədi", "Failed to load catalog"));
    } finally {
      setCatalogLoading(false);
    }
  }, [isAuthenticated, isDemo, language]);

  const load = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setRates([]);
      setOffers([]);
      setStats(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (isDemo) {
        setProgramType("DISCOUNT");
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
        setOffers([]);
        setStats({
          freeProductQty: "12.000",
          freeProductWorth: "240.00",
          freeProductOrders: 8,
          cashbackRedeemed: "150.00",
          cashbackEarned: "420.00",
          storeId: null,
        });
      } else {
        const [settings, nextStats] = await Promise.all([
          fetchLoyaltySettings(),
          fetchLoyaltyStats().catch(() => null),
        ]);
        setProgramType(settings.loyaltyProgramType);
        setStats(nextStats);
        if (settings.loyaltyProgramType === "DISCOUNT") {
          setRates(await fetchLoyaltyRates());
          setOffers([]);
        } else {
          setOffers(await fetchBuyGetOffers());
          setRates(await fetchLoyaltyRates().catch(() => []));
          await loadCatalog();
        }
      }
    } catch (err) {
      notifyFromError(err, tr("Loyalty yüklənmədi", "Failed to load loyalty"));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isDemo, canView, language, loadCatalog]);

  useEffect(() => {
    void load();
  }, [load, branchId]);

  const handleSwitchProgram = async (next: LoyaltyProgramType) => {
    if (!canEdit || isDemo || next === programType) return;
    if (!branchReady) {
      notifyFromError(new Error(tr("Filial seçin", "Select a branch")));
      return;
    }
    const ok = await askConfirm({
      title: tr("Loyalty tipini dəyiş", "Change loyalty type"),
      message: tr(
        "Bu filial üçün yalnız bir tip aktiv ola bilər. Keçid digər tipin POS davranışını dayandırır (məlumat silinmir).",
        "Only one type can be active for this branch. Switching pauses the other type on POS (data is kept).",
      ),
      confirmLabel: tr("Dəyiş", "Switch"),
    });
    if (!ok) return;
    setSaving(true);
    try {
      const s = await updateLoyaltySettings({ loyaltyProgramType: next });
      setProgramType(s.loyaltyProgramType);
      setCreateOpen(false);
      notifySuccess(tr("Yeniləndi", "Updated"));
      await load();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  const openCreate = async () => {
    if (!canCreate || isDemo) return;
    if (programType === "BUY_GET_FREE") {
      if (!branchReady) {
        notifyFromError(new Error(tr("Filial seçin", "Select a branch")));
        return;
      }
      await loadCatalog();
    }
    setCreateOpen(true);
  };

  const handleCreateRate = async (data: { name: string; percent: number }) => {
    if (!canCreate || isDemo) return;
    setSaving(true);
    try {
      await createLoyaltyRate({ name: data.name, percent: data.percent, active: true });
      notifySuccess(tr("Tarif yaradıldı", "Rate created"));
      setCreateOpen(false);
      await load();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateOffer = async (data: BuyGetOfferFormData) => {
    if (!canCreate || isDemo) return;
    if (!branchReady) {
      notifyFromError(new Error(tr("Filial seçin", "Select a branch")));
      return;
    }
    setSaving(true);
    try {
      await createBuyGetOffer({
        name: data.name,
        active: true,
        buyMetric: data.buyMetric,
        buyThreshold: data.buyThreshold,
        buyTargetType: data.buyTargetType,
        buyProductId: data.buyProductId,
        buyCategoryId: data.buyCategoryId,
        getQty: data.getQty,
        getTargetType: data.getTargetType,
        getProductId: data.getProductId,
        getCategoryId: data.getCategoryId,
        progressMode: data.progressMode,
        audience: data.audience,
        customerIds: data.customerIds,
      });
      notifySuccess(tr("Təklif yaradıldı", "Offer created"));
      setCreateOpen(false);
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

  const handleToggleOffer = async (offer: LoyaltyBuyGetOffer) => {
    if (!canEdit || isDemo) return;
    setSaving(true);
    try {
      await updateBuyGetOffer(offer.id, { active: !offer.active });
      notifySuccess(offer.active ? tr("Deaktiv edildi", "Deactivated") : tr("Aktiv edildi", "Activated"));
      await load();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOffer = async (offer: LoyaltyBuyGetOffer) => {
    if (!canDelete || isDemo) return;
    const ok = await askConfirm({
      title: tr("Təklifi sil", "Delete offer"),
      message: tr(`"${offer.name}" silinsin?`, `Delete "${offer.name}"?`),
      confirmLabel: tr("Sil", "Delete"),
    });
    if (!ok) return;
    setSaving(true);
    try {
      await deleteBuyGetOffer(offer.id);
      notifySuccess(tr("Silindi", "Deleted"));
      await load();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  const createDisabled =
    !canCreate ||
    isDemo ||
    (programType === "BUY_GET_FREE" && !branchReady);

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-lg xl:text-xl 2xl:text-2xl">
              {tr("Loyalty", "Loyalty")}
            </h1>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {programType === "DISCOUNT"
                ? tr(
                    "Cashback tarifləri — istifadə məhsul alt-cəmi ilə məhdudlaşır.",
                    "Cashback rates — redeem capped by merchandise subtotal.",
                  )
                : tr(
                    "Al X götür X pulsuz — təkliflər və progress yalnız bu filial üçündür.",
                    "Buy X get X free — offers and progress apply to this branch only.",
                  )}
              {branchManagementEnabled && !branchReady
                ? ` ${tr("BXGX üçün filial seçin.", "Select a branch for BXGX.")}`
                : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5 dark:border-gray-700 dark:bg-gray-900">
              <button
                type="button"
                disabled={saving || isDemo || !canEdit}
                onClick={() => void handleSwitchProgram("DISCOUNT")}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                  programType === "DISCOUNT"
                    ? "bg-[#14b8a6] text-white"
                    : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                {tr("Endirim", "Discount")}
              </button>
              <button
                type="button"
                disabled={saving || isDemo || !canEdit || !branchReady}
                onClick={() => void handleSwitchProgram("BUY_GET_FREE")}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                  programType === "BUY_GET_FREE"
                    ? "bg-[#14b8a6] text-white"
                    : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                {tr("Al-götür pulsuz", "Buy-get free")}
              </button>
            </div>
            {canCreate && (
              <button
                type="button"
                disabled={createDisabled || saving || catalogLoading}
                onClick={() => void openCreate()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#14b8a6] px-2.5 py-1.5 text-xs text-white disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>
                  {catalogLoading && programType === "BUY_GET_FREE"
                    ? tr("Yüklənir...", "Loading...")
                    : programType === "DISCOUNT"
                      ? tr("Tarif əlavə et", "Add rate")
                      : tr("Təklif əlavə et", "Add offer")}
                </span>
              </button>
            )}
          </div>
        </div>

        {stats ? (
          <div
            className={`mb-4 grid grid-cols-2 gap-3 ${
              programType === "BUY_GET_FREE" ? "lg:grid-cols-3" : "lg:grid-cols-2 max-w-lg"
            }`}
          >
            {programType === "BUY_GET_FREE" ? (
              <>
                <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                  <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {tr("Pulsuz məhsullar", "Free products given", "Бесплатных товаров")}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {Number(stats.freeProductQty).toLocaleString(undefined, {
                      maximumFractionDigits: 3,
                    })}
                  </p>
                  <p className="mt-0.5 text-[10px] text-gray-400">
                    {tr("Ümumi miqdar", "Total quantity", "Общее количество")}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                  <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {tr("Pulsuz dəyər", "Value given away", "Стоимость подарков")}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {Number(stats.freeProductWorth).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    ₼
                  </p>
                  <p className="mt-0.5 text-[10px] text-gray-400">
                    {tr(
                      "Pərakəndə qiymətə görə (təxmini)",
                      "At retail price (estimated)",
                      "По розничной цене (оценка)",
                    )}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                  <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {tr("Sifarişlər", "Orders with free items", "Заказов с подарками")}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {stats.freeProductOrders}
                  </p>
                  <p className="mt-0.5 text-[10px] text-gray-400">
                    {tr(
                      "Pulsuz sətirli satışlar",
                      "Sales that included free lines",
                      "Продажи с бесплатными позициями",
                    )}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                  <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {tr("Cashback qazanılıb", "Cashback earned", "Кэшбэк начислен")}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {Number(stats.cashbackEarned).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    ₼
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                  <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {tr("Cashback istifadə", "Cashback redeemed", "Кэшбэк списан")}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {Number(stats.cashbackRedeemed).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    ₼
                  </p>
                </div>
              </>
            )}
          </div>
        ) : null}

        {programType === "DISCOUNT" ? (
          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {tr("Cashback tarifləri", "Cashback rates")}
              </h2>
            </div>
            {loading ? (
              <p className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                {tr("Yüklənir...", "Loading...")}
              </p>
            ) : rates.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                {tr("Hələ tarif yoxdur", "No rates yet")}
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {rates.map((rate) => (
                  <li key={rate.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {rate.name}{" "}
                        <span className="font-semibold text-[#14b8a6]">{rate.percent}%</span>
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
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
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                      >
                        {rate.assignedToAllCards ? (
                          <Check className="h-3.5 w-3.5 text-[#14b8a6]" />
                        ) : null}
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
                        className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
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
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {tr("Təkliflər", "Offers")}
              </h2>
            </div>
            {loading ? (
              <p className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                {tr("Yüklənir...", "Loading...")}
              </p>
            ) : offers.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                {tr("Hələ təklif yoxdur", "No offers yet")}
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {offers.map((offer) => (
                  <li key={offer.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {offer.name}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {tr("Al", "Buy")}{" "}
                        {offer.buyMetric === "MONEY"
                          ? `${Number(offer.buyThreshold).toFixed(2)}₼`
                          : String(Number(offer.buyThreshold))}{" "}
                        {offer.buyProductName || offer.buyCategoryName} →{" "}
                        {tr("pulsuz", "free")} {String(Number(offer.getQty))}×{" "}
                        {offer.getProductName || offer.getCategoryName}
                        {" · "}
                        {offer.progressMode === "ACCUMULATE"
                          ? tr("Yığılma (ziyarətlər arası)", "Accumulate across visits")
                          : tr("Eyni satış (bu sifariş)", "Same visit (this order)")}
                        {" · "}
                        {offer.audience === "ALL"
                          ? tr("Hamı", "All")
                          : tr(
                              `${offer.customerIds.length} müştəri`,
                              `${offer.customerIds.length} customers`,
                            )}
                        {" · "}
                        {offer.active ? tr("Aktiv", "Active") : tr("Qeyri-aktiv", "Inactive")}
                      </p>
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        disabled={saving || isDemo}
                        onClick={() => void handleToggleOffer(offer)}
                        className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                      >
                        {offer.active ? tr("Deaktiv et", "Deactivate") : tr("Aktiv et", "Activate")}
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        disabled={saving || isDemo}
                        onClick={() => void handleDeleteOffer(offer)}
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
        )}
      </div>

      <CreateLoyaltyRateModal
        isOpen={createOpen && programType === "DISCOUNT"}
        saving={saving}
        onClose={() => setCreateOpen(false)}
        onSave={handleCreateRate}
      />
      <CreateBuyGetOfferModal
        isOpen={createOpen && programType === "BUY_GET_FREE"}
        saving={saving}
        products={products}
        categories={categories}
        customers={customers}
        onClose={() => setCreateOpen(false)}
        onSave={handleCreateOffer}
      />
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
