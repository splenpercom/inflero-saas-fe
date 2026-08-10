import { useAuth } from "../context/AuthContext";

export function DemoBanner() {
  const { isDemo } = useAuth();

  if (!isDemo) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/50 px-3 py-2 text-center text-xs text-amber-900 dark:text-amber-200">
      <span className="font-semibold">Demo mode</span>
      <span className="text-amber-800/80 dark:text-amber-300/80">
        {" "}
        — you are viewing sample data only. Sign in later for your live workspace.
      </span>
    </div>
  );
}
