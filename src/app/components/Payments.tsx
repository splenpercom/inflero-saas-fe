import { useState } from "react";
import { Search, Download, CreditCard, Smartphone, Banknote, ArrowLeft } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

type PaymentMethod = "card" | "upi" | "cash" | "bankTransfer";

interface Payment {
  id: number;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId: string;
  orderId: number;
  dateTime: string;
  timeAgo: string;
}

export function Payments() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  const [payments] = useState<Payment[]>([
    {
      id: 9,
      amount: 714.0,
      paymentMethod: "card",
      transactionId: "TXN8274651",
      orderId: 9,
      dateTime: "09:02 AM",
      timeAgo: "41m ago",
    },
    {
      id: 8,
      amount: 2531.0,
      paymentMethod: "upi",
      transactionId: "TXN8274650",
      orderId: 8,
      dateTime: "09:02 AM",
      timeAgo: "41m ago",
    },
    {
      id: 7,
      amount: 189.0,
      paymentMethod: "upi",
      transactionId: "TXN8274649",
      orderId: 7,
      dateTime: "09:02 AM",
      timeAgo: "41m ago",
    },
    {
      id: 6,
      amount: 1344.0,
      paymentMethod: "card",
      transactionId: "TXN8274648",
      orderId: 6,
      dateTime: "09:02 AM",
      timeAgo: "41m ago",
    },
    {
      id: 5,
      amount: 126.0,
      paymentMethod: "cash",
      transactionId: "TXN8274647",
      orderId: 5,
      dateTime: "09:02 AM",
      timeAgo: "41m ago",
    },
    {
      id: 4,
      amount: 756.0,
      paymentMethod: "upi",
      transactionId: "TXN8274646",
      orderId: 4,
      dateTime: "09:02 AM",
      timeAgo: "41m ago",
    },
    {
      id: 3,
      amount: 137.0,
      paymentMethod: "cash",
      transactionId: "TXN8274645",
      orderId: 3,
      dateTime: "09:02 AM",
      timeAgo: "41m ago",
    },
  ]);

  const filteredPayments = payments.filter(
    (payment) =>
      payment.amount.toString().includes(searchQuery) ||
      payment.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.orderId.toString().includes(searchQuery)
  );

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case "card":
        return <CreditCard className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />;
      case "upi":
        return <Smartphone className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />;
      case "cash":
        return <Banknote className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />;
      default:
        return <CreditCard className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />;
    }
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case "card":
        return t.paymentsPage.card;
      case "upi":
        return t.paymentsPage.upi;
      case "cash":
        return t.paymentsPage.cash;
      default:
        return t.paymentsPage.bankTransfer;
    }
  };

  const handleExport = () => {
    const csv = [
      ["ID", "Amount", "Payment Method", "Transaction ID", "Order", "Date & Time"],
      ...payments.map((p) => [
        p.id,
        `₼${p.amount.toFixed(2)}`,
        getPaymentMethodLabel(p.paymentMethod),
        p.transactionId,
        `Order #${p.orderId}`,
        p.dateTime,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payments.csv";
    a.click();
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white mb-3">
            {t.paymentsPage.title}
          </h1>

          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder={t.paymentsPage.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Export Button */}
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full sm:w-auto justify-center"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.paymentsPage.export}</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    {t.paymentsPage.id}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    {t.paymentsPage.amount}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    {t.paymentsPage.paymentMethod}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    {t.paymentsPage.transactionId}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    {t.paymentsPage.order}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    {t.paymentsPage.dateTime}
                  </th>
                  <th className="text-right text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    {t.paymentsPage.action}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    {/* ID */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-900 dark:text-white">
                        {payment.id}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900 dark:text-white">
                        {payment.amount.toFixed(2)}₼
                      </div>
                    </td>

                    {/* Payment Method */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {getPaymentMethodIcon(payment.paymentMethod)}
                        <span className="text-xs text-gray-900 dark:text-white">
                          {getPaymentMethodLabel(payment.paymentMethod)}
                        </span>
                      </div>
                    </td>

                    {/* Transaction ID */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {payment.transactionId}
                      </div>
                    </td>

                    {/* Order */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <a
                        href={`#order-${payment.orderId}`}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {t.paymentsPage.order} #{payment.orderId}
                      </a>
                    </td>

                    {/* Date & Time */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          {payment.dateTime}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                          {payment.timeAgo}
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-3 py-2 whitespace-nowrap text-right">
                      <button className="flex items-center gap-1 px-2 py-1 text-[10px] bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ml-auto">
                        <ArrowLeft className="w-3 h-3" />
                        <span>{t.paymentsPage.refund}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredPayments.length === 0 && (
            <div className="text-center py-8">
              <CreditCard className="w-10 h-10 text-gray-400 dark:text-gray-600 mx-auto mb-2 opacity-50" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t.paymentsPage.noPaymentsFound}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}