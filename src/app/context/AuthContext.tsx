import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getAccessToken, setBranchStoreId, setBranchTenantId } from "../api/client";
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

  const syncDemoFlag = useCallback(() => {
    setIsDemo(isDemoSession());
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
    if (me.user.storeId) {
      setBranchStoreId(me.user.storeId);
    }
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
    (module: TenantModuleKey) => (isDemo ? true : modulesLoaded && user?.tenant.modules?.[module] === true),
    [isDemo, modulesLoaded, user],
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
