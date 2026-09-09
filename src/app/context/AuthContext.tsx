import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getAccessToken, getBranchStoreId, setBranchStoreId, setBranchTenantId } from "../api/client";
import { fetchMe, login as apiLogin, logout as apiLogout } from "../api/auth";
import type { PlatformUser, TenantModuleKey } from "../api/auth";
import {
  enterDemoSession,
  exitDemoSession,
  isDemoSession,
} from "../lib/demoSession";

interface AuthContextValue {
  user: PlatformUser | null;
  isLoading: boolean;
  /** True only for a real API session (not demo). */
  isAuthenticated: boolean;
  /** True when browsing the app with sample data and no API token. */
  isDemo: boolean;
  /** Demo or real auth — enough to open /dashboard routes. */
  hasAppAccess: boolean;
  enterDemo: () => void;
  exitDemo: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  modulesLoaded: boolean;
  hasModule: (module: TenantModuleKey) => boolean;
  hasPermission: (module: string, action?: "view" | "create" | "edit" | "delete") => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [isDemo, setIsDemo] = useState(() => isDemoSession());
  const [isLoading, setIsLoading] = useState(true);
  const [modulesLoaded, setModulesLoaded] = useState(() => isDemoSession());
  const [branchScopeId, setBranchScopeId] = useState<string | null>(() => getBranchStoreId());

  const syncDemoFlag = useCallback(() => {
    setIsDemo(isDemoSession());
  }, []);

  useEffect(() => {
    const onBranch = (ev: Event) => {
      const detail = (ev as CustomEvent<{ branchId: string | null }>).detail;
      setBranchScopeId(detail?.branchId ?? getBranchStoreId());
    };
    window.addEventListener("inflero:branch-changed", onBranch);
    return () => window.removeEventListener("inflero:branch-changed", onBranch);
  }, []);

  const refresh = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setModulesLoaded(isDemoSession());
      syncDemoFlag();
      return;
    }
    exitDemoSession();
    setIsDemo(false);
    const me = await fetchMe();
    if (me.actorType !== "USER") {
      setUser(null);
      setModulesLoaded(false);
      return;
    }
    setUser(me.user);
    setModulesLoaded(true);
    setBranchTenantId(me.user.tenant.id);
    // Only lock the header to the user's assigned store when Branch Management is on.
    // When BM is off, BranchContext pins to the canonical store (stale storeId toasts otherwise).
    if (me.user.storeId && me.user.tenant.modules?.BRANCH_MANAGEMENT && !me.user.isTenantOwner) {
      setBranchStoreId(me.user.storeId);
    }
    setBranchScopeId(getBranchStoreId());
  }, [syncDemoFlag]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      syncDemoFlag();
      setModulesLoaded(isDemoSession());
      setIsLoading(false);
      return;
    }
    refresh()
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, [refresh, syncDemoFlag]);

  const enterDemo = useCallback(() => {
    if (getAccessToken()) return;
    enterDemoSession();
    setIsDemo(true);
    setModulesLoaded(true);
    setUser(null);
  }, []);

  const exitDemo = useCallback(() => {
    exitDemoSession();
    setIsDemo(false);
    setModulesLoaded(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      exitDemoSession();
      setIsDemo(false);
      await apiLogin(email, password);
      await refresh();
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    exitDemoSession();
    setIsDemo(false);
    try {
      await apiLogout();
    } finally {
      setUser(null);
      setModulesLoaded(false);
      setBranchTenantId(null);
      setBranchStoreId(null);
    }
  }, []);

  const hasPermission = useCallback(
    (module: string, action: "view" | "create" | "edit" | "delete" = "view") => {
      if (isDemoSession()) return true;
      if (!user) return false;
      if (user.isTenantOwner) return true;
      const p = user.role?.permissions.find((x) => x.module === module);
      return !!p?.[action];
    },
    [user],
  );

  const isAuthenticated = !!user;
  const hasAppAccess = isAuthenticated || isDemo;
  const hasModule = useCallback(
    (module: TenantModuleKey) => {
      if (isDemo) return true;
      if (!modulesLoaded || !user) return false;
      if (user.tenant.modules?.[module] !== true) return false;
      if (module === "BRANCH_MANAGEMENT") return true;
      // BM off → sole-store world; tenant flag is enough.
      if (user.tenant.modules?.BRANCH_MANAGEMENT !== true) return true;
      const allowed = user.tenant.moduleStores?.[module as Exclude<TenantModuleKey, "BRANCH_MANAGEMENT">] ?? [];
      if (allowed.length === 0) return false;
      // Owner "all branches" (no header): module available if enabled on any store.
      if (!branchScopeId) return true;
      return allowed.includes(branchScopeId);
    },
    [isDemo, modulesLoaded, user, branchScopeId],
  );

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const refreshModules = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        // Keep the current session/UI if a transient /auth/me refresh fails.
        void refresh().catch(() => undefined);
      }, 400);
    };
    window.addEventListener("inflero:module-disabled", refreshModules);
    const onFocus = () => refreshModules();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refreshModules();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("inflero:module-disabled", refreshModules);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      isDemo,
      hasAppAccess,
      enterDemo,
      exitDemo,
      login,
      logout,
      refresh,
      modulesLoaded,
      hasModule,
      hasPermission,
    }),
    [
      user,
      isLoading,
      isAuthenticated,
      isDemo,
      hasAppAccess,
      enterDemo,
      exitDemo,
      login,
      logout,
      refresh,
      modulesLoaded,
      hasModule,
      hasPermission,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
