import { useLanguage } from "../../i18n/LanguageContext";
import { pickLang } from "../../i18n/pickLang";

export function CorporateSettings() {
  const { t, language } = useLanguage();

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t.settings}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {pickLang(language, "Korporativ tənzimləmələr", "Corporate settings")}
          </p>
        </div>

        {/* Empty State */}
        <div className="glass-strong rounded-2xl p-12 text-center">
          <div className="max-w-sm mx-auto">
            <div className="w-20 h-20 rounded-full glass mx-auto mb-6 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {pickLang(language, "Hazırlanır", "Coming Soon")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {pickLang(language, "Tənzimləmələr səhifəsi tezliklə əlavə ediləcək", "Settings page will be added soon")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
