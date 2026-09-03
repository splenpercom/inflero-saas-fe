import { useLanguage } from "../../i18n/LanguageContext";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Link } from "react-router";

import { pickLang } from "../../i18n/pickLang";
interface ComingSoonProps {
  title: string;
  titleAz: string;
  description?: string;
  descriptionAz?: string;
}

export function ComingSoon({ title, titleAz, description, descriptionAz }: ComingSoonProps) {
  const { language } = useLanguage();
  const t = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const pageTitle = pickLang(language, titleAz, title);
  const pageDescription = description && descriptionAz 
    ? pickLang(language, descriptionAz, description)
    : t(
        "Bu səhifə hazırda inkişaf mərhələsindədir və tezliklə əlçatan olacaq.",
        "This page is currently under development and will be available soon."
      );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Link
            to="/reports"
            className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-[#14b8a6] dark:hover:text-[#14b8a6] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t("Hesabatlara qayıt", "Back to Reports")}</span>
          </Link>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          {pageTitle}
        </h1>
      </div>

      {/* Coming Soon Card */}
      <div className="glass-card rounded-2xl p-8 sm:p-12 text-center shadow-glass-lg border border-white/20">
        <div className="max-w-2xl mx-auto">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#f0fdfa]/20 to-[#14b8a6]/20 flex items-center justify-center backdrop-blur-xl border border-[#14b8a6]/20 shadow-lg shadow-[#14b8a6]/10">
            <Sparkles className="w-10 h-10 text-[#14b8a6] dark:text-[#14b8a6]" />
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {t("Tezliklə", "Coming Soon")}
          </h2>

          {/* Description */}
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            {pageDescription}
          </p>

          {/* Features Badge */}
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#14b8a6]/10 to-[#115e59]/10 border border-[#14b8a6]/20 backdrop-blur-xl">
            <div className="w-2 h-2 rounded-full bg-[#115e59] animate-pulse"></div>
            <span className="text-sm font-medium text-[#14b8a6] dark:text-[#14b8a6]">
              {t("Aktiv inkişaf mərhələsində", "In Active Development")}
            </span>
          </div>

          {/* Timeline */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="glass-card rounded-xl p-4 border border-white/10">
              <div className="w-8 h-8 mx-auto mb-3 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {t("Dizayn", "Design")}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t("Tamamlandı", "Completed")}
              </p>
            </div>

            <div className="glass-card rounded-xl p-4 border border-white/10">
              <div className="w-8 h-8 mx-auto mb-3 rounded-lg bg-gradient-to-br from-[#f0fdfa]/20 to-[#14b8a6]/20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-[#ccfbf1]0 animate-pulse"></div>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {t("İnkişaf", "Development")}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t("Davam edir", "In Progress")}
              </p>
            </div>

            <div className="glass-card rounded-xl p-4 border border-white/10">
              <div className="w-8 h-8 mx-auto mb-3 rounded-lg bg-gradient-to-br from-gray-500/20 to-gray-600/20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {t("Buraxılış", "Release")}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t("Planlaşdırılır", "Planned")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
