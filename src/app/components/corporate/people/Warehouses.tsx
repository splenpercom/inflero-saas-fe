import { useState, useEffect, useCallback } from "react";
import { cn } from "../../ui/utils";
import {
  Plus,
  RefreshCw,
  Trash2,
  Lock,
  Warehouse as WarehouseIcon,
  MapPin,
  Phone,
  Mail,
  Settings,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { useAuth } from "../../../context/AuthContext";
import { useBranch } from "../../../context/BranchContext";
import { useModulePermissions } from "../../../hooks/useModulePermissions";
import {
  fetchStores,
  fetchBranchQuota,
  fetchNewStoreManagerCandidates,
  createStore,
  updateStore,
  deleteStore,
  type StoreRecord,
  type BranchQuota,
  type StoreManagerCandidate,
} from "../../../api/stores";
import { notifyFromError, notifySuccess } from "../../../lib/toast";
import { useConfirm } from "../../../context/ConfirmContext";
import { AddWarehouseModal, type BranchFormData } from "./AddWarehouseModal";

import { pickLang } from "../../../i18n/pickLang";
export function Warehouses() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const { refreshBranches } = useBranch();
  const { canView, canCreate, canEdit, canDelete } = useModulePermissions("People");
  const askConfirm = useConfirm();
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [quota, setQuota] = useState<BranchQuota | null>(null);
  const [managers, setManagers] = useState<StoreManagerCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const loadData = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setStores([]);
      setQuota(null);
      setManagers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [storeRows, quotaRow, managerRows] = await Promise.all([
        fetchStores({ managed: true }),
        fetchBranchQuota(),
        fetchNewStoreManagerCandidates(),
      ]);
      setStores(storeRows);
      setQuota(quotaRow);
      setManagers(managerRows);
    } catch (err) {
      notifyFromError(err, tr("Filialları yükləmək alınmadı", "Failed to load branches"));
    } finally {
      setLoading(false);
    }
  }, [isDemo, isAuthenticated, canView, language]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    void loadData().finally(() => setIsRefreshing(false));
  };

  const handleSave = async (data: BranchFormData) => {
    if (isDemo || !isAuthenticated) return;
    if (editingStore ? !canEdit : !canCreate) return;
    setSaving(true);
    try {
      const body = {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        status: data.status,
      };
      if (editingStore) {
        await updateStore(editingStore.id, body);
        notifySuccess(tr("Filial yeniləndi", "Branch updated"));
      } else {
        await createStore({ ...body, branchManagerUserId: data.branchManagerUserId });
        notifySuccess(tr("Filial əlavə edildi", "Branch added"));
      }
      setIsModalOpen(false);
      setEditingStore(null);
      void loadData();
      void refreshBranches();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (storeId: string) => {
    if (!(await askConfirm({
      title: tr("Silmə təsdiqi", "Confirm deletion"),
      message: tr("Bu filialı silmək istədiyinizə əminsiniz?", "Are you sure you want to delete this branch?"),
      variant: "danger",
    }))) return;
    if (isDemo || !isAuthenticated || !canDelete) return;
    try {
      await deleteStore(storeId);
      notifySuccess(tr("Filial silindi", "Branch deleted"));
      void loadData();
      void refreshBranches();
    } catch (err) {
      notifyFromError(err);
    }
  };

  const used = quota?.used ?? stores.length;
  const maxBranches = quota?.maxBranches;
  const canAdd = quota?.canAdd ?? true;
  const lockedCount =
    maxBranches != null && !canAdd ? Math.max(0, maxBranches - used) : 0;

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
              {tr("Filial İdarəetməsi", "Branch Management")}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {tr("Filiallarınızı idarə edin", "Manage your branches")}
            </p>
          </div>
          <button onClick={handleRefresh} disabled={isRefreshing} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg disabled:opacity-50">
            <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
          </button>
        </div>

        <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{tr("Filial Slotları", "Branch Slots")}</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {maxBranches != null
              ? tr(`${used} aktiv / ${maxBranches} maksimum`, `${used} active / ${maxBranches} maximum`)
              : tr(`${used} aktiv filial`, `${used} active branches`)}
            {!canAdd && maxBranches != null ? tr(" · limit dolub", " · limit reached") : ""}
          </p>
        </div>

        {loading ? (
          <p className="text-xs text-gray-500 text-center py-8">{tr("Yüklənir...", "Loading...")}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stores.map((store) => (
              <div key={store.id} className="glass-card rounded-xl border border-green-200 dark:border-green-800/50 bg-green-50/50 dark:bg-green-900/10">
                <div className="px-4 py-3 border-b border-green-200 dark:border-green-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white">{store.name}</p>
                      <p className="text-[10px] text-green-600">{store.status}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-medium border border-green-300">{store.code}</span>
                </div>
                <div className="p-4 space-y-3">
                  {store.email && <div className="flex items-center gap-2 text-xs text-gray-600"><Mail className="w-3 h-3" /><span>{store.email}</span></div>}
                  {store.phone && <div className="flex items-center gap-2 text-xs text-gray-600"><Phone className="w-3 h-3" /><span>{store.phone}</span></div>}
                  {store.address && <div className="flex items-center gap-2 text-xs text-gray-600"><MapPin className="w-3 h-3" /><span>{store.address}</span></div>}
                  {store.branchManager && (
                    <p className="text-[10px] text-gray-500">{tr("Menecer", "Manager")}: {store.branchManager.firstName} {store.branchManager.lastName}</p>
                  )}
                  <div className="flex gap-2 pt-2 border-t border-green-200 dark:border-green-800/50">
                    {canEdit && (
                    <button onClick={() => { setEditingStore(store); setIsModalOpen(true); }} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs">
                      <Settings className="w-3 h-3" /><span>{tr("Tənzimlə", "Configure")}</span>
                    </button>
                    )}
                    {canDelete && (
                    <button onClick={() => void handleDelete(store.id)} className="px-3 py-1.5 bg-white border border-red-300 rounded-lg text-xs text-red-600"><Trash2 className="w-3 h-3" /></button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {canCreate && canAdd && (
              <div className="glass-card rounded-xl border border-[#0026f6]/20 bg-[#f0f3ff]/50 dark:bg-[#0026f6]/10">
                <div className="p-4 text-center py-6">
                  <WarehouseIcon className="w-8 h-8 mx-auto mb-2 text-[#0026f6]" />
                  <p className="text-xs font-medium text-gray-600 mb-3">{tr("Yeni filial əlavə et", "Add a new branch")}</p>
                  <button onClick={() => { setEditingStore(null); setIsModalOpen(true); }} className="px-3 py-1.5 bg-gradient-to-r from-[#0026f6] to-[#001db8] text-white text-xs font-medium rounded-lg flex items-center gap-1.5 mx-auto">
                    <Plus className="w-3 h-3" /><span>{tr("Konfiqurasiya Et", "Configure")}</span>
                  </button>
                </div>
              </div>
            )}

            {Array.from({ length: lockedCount }).map((_, i) => (
              <div key={`locked-${i}`} className="glass-card rounded-xl border border-gray-200 bg-gray-50 dark:bg-gray-900/50">
                <div className="p-4 text-center py-6">
                  <Lock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-xs font-medium text-gray-600">{tr("Bu slot bağlıdır", "This slot is locked")}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{tr("Paket limitinə çatılıb", "Package branch limit reached")}</p>
                </div>
              </div>
            ))}

            {!canAdd && stores.length === 0 && (
              <div className="glass-card rounded-xl border border-gray-200 p-6 text-center col-span-full">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-xs text-gray-500">{tr("Filial əlavə etmək mümkün deyil", "Cannot add branches")}</p>
              </div>
            )}
          </div>
        )}

        <AddWarehouseModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingStore(null); }}
          onSave={handleSave}
          store={editingStore}
          managers={managers}
          saving={saving}
        />
      </div>
    </div>
  );
}
