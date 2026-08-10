import { useState } from "react";
import { SuperAdminSidebar } from "./SuperAdminSidebar";
import { Outlet } from "react-router";
import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "../../i18n/ThemeContext";
import { cn } from "../ui/utils";

export function SuperAdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <SuperAdminSidebar
        collapsed={sidebarCollapsed}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "md:ml-16" : "md:ml-56"
        )}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-3 sm:px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
              >
                <Menu className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:block p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>

              {/* Admin Profile */}
              <div className="flex items-center gap-2 ml-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-[10px] font-semibold">
                  A
                </div>
                <div className="hidden sm:block">
                  <p className="text-[11px] font-semibold text-gray-900 dark:text-white leading-tight">
                    Admin
                  </p>
                  <p className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight">
                    Super Admin
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-52px)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}