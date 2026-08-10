import { ShieldOff } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

import { pickLang } from "../../i18n/pickLang";
export function NoAccessPanel() {
  const { language } = useLanguage();
  const message =
    pickLang(language, "Bu bölməyə giriş icazəniz yoxdur.", "You do not have permission to access this section.");

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <ShieldOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}
