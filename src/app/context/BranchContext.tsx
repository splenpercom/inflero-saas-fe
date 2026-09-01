import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getBranchStoreId, setBranchStoreId } from "../api/client";
import { fetchBranchSwitcherStores, type BranchSwitcherStore } from "../api/stores";
import { useAuth } from "./AuthContext";

export interface BranchContextValue {
  branches: BranchSwitcherStore[];
  branchId: string | null;
  selectedBranch: BranchSwitcherStore | null;
  /** User is assigned to a single branch and cannot switch. */
  isBranchLocked: boolean;
  /** No branch header sent — tenant-wide view (all branches + global records). */
  isGlobalMode: boolean;
  /** Hub Branch Management module is enabled for this tenant. */
  branchManagementEnabled: boolean;
  hasBranches: boolean;
  /** Increments when branch selection changes so pages can refetch. */
  branchRevision: number;
  isLoading: boolean;
  ready: boolean;
  setBranchId: (id: string | null) => void;
  refreshBranches: () => Promise<void>;
}

const BranchContext = createContext<BranchContextValue | null>(null);

export function BranchProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isDemo, isLoading: authLoading, hasModule, modulesLoaded } = useAuth();
  const branchManagementEnabled = hasModule("BRANCH_MANAGEMENT");
  const [branches, setBranches] = useState<BranchSwitcherStore[]>([]);
  const [branchId, setBranchIdState] = useState<string | null>(() => getBranchStoreId());
  const [branchRevision, setBranchRevision] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [branchesLoaded, setBranchesLoaded] = useState(false);

  const isBranchLocked = branchManagementEnabled && !!user?.storeId && !user?.isTenantOwner;

  const refreshBranches = useCallback(async () => {
    if (!(isAuthenticated || isDemo)) {
      setBranches([]);
      return;
    }
    setIsLoading(true);
    try {
      const rows = await fetchBranchSwitcherStores();
      setBranches(rows);
    } catch {
      setBranches([]);
    } finally {
      setIsLoading(false);
      setBranchesLoaded(true);
    }
  }, [isDemo, isAuthenticated]);

  useEffect(() => {
    if (authLoading || !(isAuthenticated || isDemo)) {
      setBranches([]);
      setBranchesLoaded(false);
      return;
    }
    setBranchesLoaded(false);
    void refreshBranches();
  }, [authLoading, isDemo, isAuthenticated, refreshBranches, branchManagementEnabled]);

  useEffect(() => {
    const onBranchCleared = () => {
      setBranchIdState(null);
      setBranchRevision((n) => n + 1);
    };
    window.addEventListener("inflero:branch-cleared", onBranchCleared);
    return () => window.removeEventListener("inflero:branch-cleared", onBranchCleared);
  }, []);

  useEffect(() => {
    if (authLoading) {
      setBranchIdState(getBranchStoreId());
      return;
    }

    if (!user) {
      setBranchIdState(getBranchStoreId());
      return;
    }

    const stored = getBranchStoreId();

    if (!modulesLoaded && !isDemo) {
      if (stored) setBranchIdState(stored);
      return;
    }

    if (!branchesLoaded) {
      if (stored) setBranchIdState(stored);
      return;
    }

    if (!branchManagementEnabled) {
      if (branches.length === 0) {
        if (stored) {
          setBranchStoreId(null);
          setBranchIdState(null);
          setBranchRevision((n) => n + 1);
        }
        return;
      }
      const requiredId = branches[0].id;
      if (stored !== requiredId) {
        setBranchStoreId(requiredId);
        setBranchIdState(requiredId);
        setBranchRevision((n) => n + 1);
      }
      return;
    }

    if (user.storeId && !user.isTenantOwner) {
      if (stored !== user.storeId) {
        setBranchStoreId(user.storeId);
        setBranchIdState(user.storeId);
        setBranchRevision((n) => n + 1);
      }
      return;
    }

    if (stored && branches.some((b) => b.id === stored)) {
      setBranchIdState(stored);
      return;
    }

    if (
      !stored &&
      !user.isTenantOwner &&
      user.branchesAsManager.length > 0 &&
      branches.length > 0
    ) {
      const managed = user.branchesAsManager.find((b) => branches.some((s) => s.id === b.id));
      if (managed) {
        setBranchStoreId(managed.id);
        setBranchIdState(managed.id);
        setBranchRevision((n) => n + 1);
        return;
      }
    }

    if (stored && branches.length > 0 && !branches.some((b) => b.id === stored)) {
      setBranchStoreId(null);
      setBranchIdState(null);
      setBranchRevision((n) => n + 1);
      return;
    }

    if (!stored) {
      setBranchIdState(null);
    }
  }, [user, branches, branchesLoaded, authLoading, branchManagementEnabled, modulesLoaded, isDemo]);

  const setBranchId = useCallback(
    (id: string | null) => {
      const locked = branchManagementEnabled && !!user?.storeId && !user?.isTenantOwner;
      if (locked || (!branchManagementEnabled && id === null)) return;
      const prev = getBranchStoreId();
      setBranchStoreId(id);
      setBranchIdState(id);
      if (prev !== id) {
        setBranchRevision((n) => n + 1);
      }
    },
    [branchManagementEnabled, user?.storeId, user?.isTenantOwner],
  );

  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === branchId) ?? null,
    [branches, branchId],
  );

  const isGlobalMode = branchManagementEnabled && !isBranchLocked && branchId === null;
  const hasBranches = branches.length > 0;
  const ready =
    authLoading || !(isAuthenticated || isDemo)
      ? true
      : !modulesLoaded && !isDemo
        ? false
        : branchManagementEnabled
          ? true
          : branchesLoaded && (branches.length === 0 || branchId !== null);

  const value = useMemo(
    () => ({
      branches,
      branchId,
      selectedBranch,
      isBranchLocked,
      isGlobalMode,
      branchManagementEnabled,
      hasBranches,
      branchRevision,
      isLoading,
      ready,
      setBranchId,
      refreshBranches,
    }),
    [
      branches,
      branchId,
      selectedBranch,
      isBranchLocked,
      isGlobalMode,
      branchManagementEnabled,
      hasBranches,
      branchRevision,
      isLoading,
      ready,
      setBranchId,
      refreshBranches,
    ],
  );

  return <BranchContext.Provider value={value}>{ready ? children : null}</BranchContext.Provider>;
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used within BranchProvider");
  return ctx;
}
