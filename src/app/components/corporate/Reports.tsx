import { Link } from "react-router";
import { useLanguage } from "../../i18n/LanguageContext";
import {
  TrendingUp,
  Award,
  ShoppingCart,
  Package,
  Clock,
  FileCheck,
  FileText,
  Users,
  UserCheck,
  AlertTriangle,
  DollarSign,
  CreditCard,
  Receipt,
  PieChart,
  Calendar,
  ChevronRight,
} from "lucide-react";

import { pickLang } from "../../i18n/pickLang";
import { useAuth } from "../../context/AuthContext";
export function Reports() {
  const { language } = useLanguage();
  const { hasModule } = useAuth();
  const stockEnabled = hasModule("STOCK");
  const t = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const reportCategories = [
    {
      title: t("Satış Hesabatları", "Sales Reports"),
      icon: TrendingUp,
      color: "blue",
      reports: [
        {
          name: t("Satış Hesabatı", "Sales Report"),
          path: "/dashboard/reports/sales",
          icon: TrendingUp,
          live: true,
        },
        {
          name: t("İşçi Satış Hesabatı", "Employee Sales Report"),
          path: "/dashboard/reports/employee-sales",
          icon: Users,
          live: true,
        },
        {
          name: t("Ən Çox Satılan", "Best Seller"),
          path: "/reports/best-seller",
          icon: Award,
        },
        {
          name: t("Faktura Hesabatı", "Invoice Report"),
          path: "/reports/invoice",
          icon: FileText,
        },
        {
          name: t("Satılmış Stok", "Sold Stock"),
          path: "/reports/sold-stock",
          icon: FileCheck,
        },
      ],
    },
    {
      title: t("Satınalma Hesabatları", "Purchase Reports"),
      icon: ShoppingCart,
      color: "purple",
      reports: [
        {
          name: t("Satınalma Tarixçəsi", "Purchase History"),
          path: "/reports/purchase-history",
          icon: ShoppingCart,
        },
      ],
    },
    {
      title: t("İnventar Hesabatları", "Inventory Reports"),
      icon: Package,
      color: "green",
      reports: [
        {
          name: t("İnventar Hesabatı", "Inventory Report"),
          path: "/reports/inventory",
          icon: Package,
        },
        {
          name: t("Stok Tarixçəsi", "Stock History"),
          path: "/reports/stock-history",
          icon: Clock,
        },
      ],
    },
    {
      title: t("Müştəri & Təchizatçı", "Customer & Supplier"),
      icon: Users,
      color: "orange",
      reports: [
        {
          name: t("Təchizatçı Hesabatı", "Supplier Report"),
          path: "/reports/supplier",
          icon: Users,
        },
        {
          name: t("Təchizatçı Borcları", "Supplier Due Report"),
          path: "/reports/supplier-due",
          icon: UserCheck,
        },
        {
          name: t("Müştəri Hesabatı", "Customer Report"),
          path: "/reports/customer",
          icon: Users,
        },
        {
          name: t("Müştəri Borcları", "Customer Due Report"),
          path: "/reports/customer-due",
          icon: UserCheck,
        },
      ],
    },
    {
      title: t("Məhsul Hesabatları", "Product Reports"),
      icon: Package,
      color: "teal",
      reports: [
        {
          name: t("Məhsul Hesabatı", "Product Report"),
          path: "/dashboard/reports/product",
          icon: Package,
          live: true,
        },
        {
          name: t("Məhsul Bitmə Tarixi", "Product Expiry Report"),
          path: "/reports/product-expiry",
          icon: Clock,
        },
        {
          name: t("Miqdar Xəbərdarlığı", "Product Quantity Alert"),
          path: "/reports/product-quantity-alert",
          icon: AlertTriangle,
        },
      ],
    },
    {
      title: t("Maliyyə Hesabatları", "Financial Reports"),
      icon: DollarSign,
      color: "indigo",
      reports: [
        {
          name: t("Maliyyə Hesabatı", "Finance Report"),
          path: "/dashboard/reports/finance",
          icon: PieChart,
          live: true,
        },
        {
          name: t("Xərc Hesabatı", "Expense Report"),
          path: "/reports/expense",
          icon: CreditCard,
        },
        {
          name: t("Gəlir Hesabatı", "Income Report"),
          path: "/reports/income",
          icon: DollarSign,
        },
        {
          name: t("Vergi Hesabatı", "Tax Report"),
          path: "/reports/tax",
          icon: Receipt,
        },
        {
          name: t("Mənfəət və Zərər", "Profit & Loss"),
          path: "/reports/profit-loss",
          icon: PieChart,
        },
        {
          name: t("İllik Hesabat", "Annual Report"),
          path: "/dashboard/reports/annual",
          icon: Calendar,
          live: true,
        },
      ],
    },
  ].map((category) => ({
    ...category,
    reports: category.reports.filter((report) =>
      stockEnabled ||
      ![
        "/reports/inventory",
        "/reports/stock-history",
        "/reports/sold-stock",
        "/reports/product-expiry",
        "/reports/product-quantity-alert",
      ].includes(report.path),
    ),
  })).filter((category) => category.reports.length > 0);

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      blue: {
        bg: "bg-[#ccfbf1] dark:bg-[#14b8a6]/20",
        text: "text-[#14b8a6] dark:text-[#14b8a6]",
        border: "border-[#b3c0ff] dark:border-[#14b8a6]",
      },
      purple: {
        bg: "bg-purple-50 dark:bg-purple-900/20",
        text: "text-purple-600 dark:text-purple-400",
        border: "border-purple-200 dark:border-purple-800",
      },
      green: {
        bg: "bg-green-50 dark:bg-green-900/20",
        text: "text-green-600 dark:text-green-400",
        border: "border-green-200 dark:border-green-800",
      },
      orange: {
        bg: "bg-orange-50 dark:bg-orange-900/20",
        text: "text-orange-600 dark:text-orange-400",
        border: "border-orange-200 dark:border-orange-800",
      },
      teal: {
        bg: "bg-teal-50 dark:bg-teal-900/20",
        text: "text-teal-600 dark:text-teal-400",
        border: "border-teal-200 dark:border-teal-800",
      },
      indigo: {
        bg: "bg-indigo-50 dark:bg-indigo-900/20",
        text: "text-indigo-600 dark:text-indigo-400",
        border: "border-indigo-200 dark:border-indigo-800",
      },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
              {t("Hesabatlar", "Reports")}
            </h1>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t("Biznes hesabatlarınızı nəzərdən keçirin və yaradın", "View and generate business reports")}
          </p>
        </div>

        {/* Report Categories */}
        <div className="space-y-6">
          {reportCategories.map((category, idx) => {
            const colorClasses = getColorClasses(category.color);
            const Icon = category.icon;

            return (
              <div
                key={idx}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden"
              >
                {/* Category Header */}
                <div className={`px-4 py-3 border-b ${colorClasses.border} ${colorClasses.bg}`}>
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${colorClasses.text}`} />
                    <h2 className={`text-sm font-semibold ${colorClasses.text}`}>
                      {category.title}
                    </h2>
                  </div>
                </div>

                {/* Reports Grid */}
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {category.reports.map((report, reportIdx) => {
                    const ReportIcon = report.icon;
                    return (
                      <Link
                        key={reportIdx}
                        to={report.path}
                        className="group flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-[#b3c0ff] dark:hover:border-[#14b8a6] bg-white dark:bg-gray-900 hover:bg-[#ccfbf1] dark:hover:bg-[#14b8a6]/10 transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center group-hover:from-[#ccfbf1] group-hover:to-[#ccfbf1] dark:group-hover:from-[#14b8a6]/30 dark:group-hover:to-[#14b8a6]/30 transition-all shrink-0">
                            <ReportIcon className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-[#14b8a6] dark:group-hover:text-[#14b8a6] transition-colors" />
                          </div>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-[#14b8a6] dark:group-hover:text-[#14b8a6] transition-colors truncate">
                            {report.name}
                          </span>
                          {!(report as { live?: boolean }).live && (
                            <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded uppercase">
                              {t("Tezliklə", "Soon")}
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#14b8a6] transition-colors" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}