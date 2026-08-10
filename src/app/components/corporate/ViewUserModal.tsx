import { useEffect, useState } from "react";
import { X, ChevronLeft, Calendar, Briefcase } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { getUserManagementTranslation } from "../../i18n/userManagementTranslations";
import {
  fetchTenantUserCommission,
  type TenantUserRow,
  type UserCommissionDetail,
} from "../../api/userManagement";
import { formatDate } from "../../lib/dateFormat";
import { useAuth } from "../../context/AuthContext";

interface ViewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: TenantUserRow | null;
}

function formatMoney(value: string | number | null | undefined) {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? "0"));
  if (Number.isNaN(n)) return "₼0.00";
  return `₼${n.toFixed(2)}`;
}

function rateLabel(
  type: "FIXED" | "PERCENT" | null | undefined,
  value: string | null | undefined,
  t: (key: any) => string,
) {
  if (!type || value == null || value === "") return "—";
  if (type === "PERCENT") return `${value}% (${t("commissionPercent")})`;
  return `${formatMoney(value)} (${t("commissionFixed")})`;
}

export function ViewUserModal({ isOpen, onClose, user }: ViewUserModalProps) {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const t = (key: any) => getUserManagementTranslation(key, language);

  const [commission, setCommission] = useState<UserCommissionDetail | null>(null);
  const [commissionLoading, setCommissionLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !user || !(isAuthenticated || isDemo)) {
      setCommission(null);
      return;
    }
    let cancelled = false;
    setCommissionLoading(true);
    fetchTenantUserCommission(user.id)
      .then((data) => {
        if (!cancelled) setCommission(data);
      })
      .catch(() => {
        if (!cancelled) setCommission(null);
      })
      .finally(() => {
        if (!cancelled) setCommissionLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, user, isAuthenticated, isDemo]);

  if (!isOpen || !user) return null;

  const showCommission = Boolean(commission?.hasCommission);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {t("backToList")}
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Profile Card */}
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-[#0026f6] to-[#001db8] rounded-xl p-6 text-white">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl mb-4 border-4 border-white/30">
                      {user.avatar}
                    </div>
                    <h2 className="text-xl font-semibold mb-1">{user.name}</h2>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm border border-white/30">
                      {user.role}
                    </span>
                    <button className="mt-4 px-4 py-2 bg-white text-[#0026f6] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                      {t("editProfile")}
                    </button>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Briefcase className="w-4 h-4 opacity-80" />
                      <div>
                        <div className="text-xs opacity-80">{t("team")}</div>
                        <div className="font-medium">{user.team}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 opacity-80" />
                      <div>
                        <div className="text-xs opacity-80">{t("dateOfJoin")}</div>
                        <div className="font-medium">{user.dateOfJoin}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    {t("basicInformation")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">
                        {t("phone")}
                      </label>
                      <div className="text-sm text-gray-900 dark:text-white mt-1">
                        {user.phone}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">
                        {t("email")}
                      </label>
                      <div className="text-sm text-gray-900 dark:text-white mt-1">
                        {user.email}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">
                        {t("birthday")}
                      </label>
                      <div className="text-sm text-gray-900 dark:text-white mt-1">
                        {user.birthday}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">{t("employeeId")}</label>
                      <div className="text-sm text-gray-900 dark:text-white mt-1">
                        {user.employeeId || "—"}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">{t("branch")}</label>
                      <div className="text-sm text-gray-900 dark:text-white mt-1">{user.branch}</div>
                    </div>
                  </div>
                </div>

                {/* About Employee */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    {t("about")}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {user.about || "—"}
                  </p>
                </div>

                {/* Commission record — only when employee has rate and/or sale snapshots */}
                {!commissionLoading && showCommission && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                      {t("commissionRecord")}
                    </h3>

                    {commission && commission.hasCommission ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400">
                              {t("configuredRate")}
                            </label>
                            <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                              {rateLabel(
                                commission.biller?.commissionType,
                                commission.biller?.commissionValue,
                                t,
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400">
                              {t("commissionAddonStatus")}
                            </label>
                            <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                              {commission.employeeCommissionEnabled
                                ? t("commissionAddonOn")
                                : t("commissionAddonOff")}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400">
                              {t("totalCommission")}
                            </label>
                            <div className="text-sm font-semibold text-[#0026f6] dark:text-[#0026f6] mt-1">
                              {formatMoney(commission.totals.totalCommission)}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              {commission.totals.saleCount} {t("commissionSales")} ·{" "}
                              {formatMoney(commission.totals.totalSales)} {t("salesTotal")}
                            </div>
                          </div>
                        </div>

                        {commission.records.length === 0 ? (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t("noCommissionSalesYet")}
                          </p>
                        ) : (
                          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                            <table className="w-full min-w-[640px]">
                              <thead>
                                <tr className="bg-white dark:bg-gray-900 text-left">
                                  <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase">
                                    {t("saleReference")}
                                  </th>
                                  <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase">
                                    {t("saleDate")}
                                  </th>
                                  <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase">
                                    {t("customer")}
                                  </th>
                                  <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase text-right">
                                    {t("saleTotal")}
                                  </th>
                                  <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase">
                                    {t("commissionRateAtSale")}
                                  </th>
                                  <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase text-right">
                                    {t("commissionAmount")}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {commission.records.map((row) => (
                                  <tr
                                    key={row.posOrderId}
                                    className="border-t border-gray-100 dark:border-gray-800"
                                  >
                                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">
                                      {row.reference}
                                    </td>
                                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                                      {formatDate(row.date, language)}
                                    </td>
                                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                                      {row.customerName ?? "—"}
                                    </td>
                                    <td className="px-3 py-2 text-xs text-right text-gray-900 dark:text-white">
                                      {formatMoney(row.grandTotal)}
                                    </td>
                                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                                      {rateLabel(row.commissionType, row.commissionValue, t)}
                                    </td>
                                    <td className="px-3 py-2 text-xs text-right font-medium text-gray-900 dark:text-white">
                                      {formatMoney(row.commissionAmount)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    {t("bankInformation")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">
                        {t("bankName")}
                      </label>
                      <div className="text-sm text-gray-900 dark:text-white mt-1">
                        {user.bankName}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">
                        {t("accountNumber")}
                      </label>
                      <div className="text-sm text-gray-900 dark:text-white mt-1">
                        {user.accountNo}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">
                        {t("ifscCode")}
                      </label>
                      <div className="text-sm text-gray-900 dark:text-white mt-1">
                        {user.ifsc}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">
                        {t("branch")}
                      </label>
                      <div className="text-sm text-gray-900 dark:text-white mt-1">
                        {user.branch}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
