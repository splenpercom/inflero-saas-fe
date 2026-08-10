import { useState } from "react";
import {
  Wallet,
  CreditCard,
  Smartphone,
  ArrowLeftRight,
  Clock,
  DollarSign,
  X,
  Delete,
} from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { cn } from "./ui/utils";
import { SplitBillModal } from "./SplitBillModal";
import { AddTipModal } from "./AddTipModal";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  totalAmount: number;
}

type PaymentMethod = "cash" | "card" | "upi" | "transfer" | "due" | null;
type Tab = "full" | "split";

export function PaymentModal({
  isOpen,
  onClose,
  orderNumber,
  totalAmount,
}: PaymentModalProps) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>("full");
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>(null);
  const [amount, setAmount] = useState("0");
  const [tipAmount, setTipAmount] = useState(0);
  const [tipNote, setTipNote] = useState("");
  const [showSplitBill, setShowSplitBill] = useState(false);
  const [showAddTip, setShowAddTip] = useState(false);

  if (!isOpen) return null;

  const quickAmounts = [50, 100, 500, 1000];

  const paymentMethods = [
    { id: "cash" as PaymentMethod, icon: Wallet, label: language === "en" ? "Cash" : "Nağd" },
    { id: "card" as PaymentMethod, icon: CreditCard, label: language === "en" ? "Card" : "Kart" },
    { id: "upi" as PaymentMethod, icon: Smartphone, label: "UPI" },
    { id: "transfer" as PaymentMethod, icon: ArrowLeftRight, label: language === "en" ? "Bank Transfer" : "Bank Köçürməsi" },
    { id: "due" as PaymentMethod, icon: Clock, label: language === "en" ? "Due" : "Borc" },
  ];

  const handleNumberClick = (num: string) => {
    if (amount === "0") {
      setAmount(num);
    } else {
      setAmount(amount + num);
    }
  };

  const handleDecimalClick = () => {
    if (!amount.includes(".")) {
      setAmount(amount + ".");
    }
  };

  const handleBackspace = () => {
    if (amount.length === 1) {
      setAmount("0");
    } else {
      setAmount(amount.slice(0, -1));
    }
  };

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  const getCurrentTotal = () => {
    return totalAmount + tipAmount;
  };

  const getPayableAmount = () => {
    return parseFloat(amount) || 0;
  };

  const getDueAmount = () => {
    return Math.max(0, getCurrentTotal() - getPayableAmount());
  };

  const formatCurrency = (value: number) => {
    return language === "en" 
      ? `$${value.toFixed(2)}`
      : `${value.toFixed(2)} ₼`;
  };

  const handleCompletePayment = () => {
    // Handle payment completion logic here
    onClose();
  };

  if (showSplitBill) {
    return (
      <SplitBillModal
        isOpen={true}
        onClose={() => setShowSplitBill(false)}
        orderNumber={orderNumber}
        totalAmount={getCurrentTotal()}
        onComplete={onClose}
      />
    );
  }

  if (showAddTip) {
    return (
      <AddTipModal
        isOpen={true}
        onClose={() => setShowAddTip(false)}
        currentTotal={totalAmount}
        onSave={(tip, note) => {
          setTipAmount(tip);
          setTipNote(note);
          setShowAddTip(false);
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-white/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {language === "en" ? "Payment" : "Ödəniş"}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {language === "en" ? "Order" : "Sifariş"} #{orderNumber}
              </p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(getCurrentTotal())}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Tabs */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setActiveTab("full")}
              className={cn(
                "flex-1 py-3 text-sm font-semibold rounded-xl transition-all",
                activeTab === "full"
                  ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/30"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              {language === "en" ? "Full Payment" : "Tam Ödəniş"}
            </button>
            <button
              onClick={() => {
                setActiveTab("split");
                setShowSplitBill(true);
              }}
              className={cn(
                "flex-1 py-3 text-sm font-semibold rounded-xl transition-all",
                activeTab === "split"
                  ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/30"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              {language === "en" ? "Split Bill" : "Hesabı Böl"}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Payment Methods and Amount */}
            <div className="space-y-6">
              {/* Payment Methods */}
              <div className="grid grid-cols-3 gap-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all border-2",
                        selectedPaymentMethod === method.id
                          ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border-blue-500 dark:border-blue-400"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5",
                          selectedPaymentMethod === method.id
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-600 dark:text-gray-400"
                        )}
                      />
                      <span
                        className={cn(
                          "text-xs font-medium",
                          selectedPaymentMethod === method.id
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-700 dark:text-gray-300"
                        )}
                      >
                        {method.label}
                      </span>
                    </button>
                  );
                })}
                <button
                  onClick={() => setShowAddTip(true)}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all border-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600"
                >
                  <DollarSign className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {language === "en" ? "Add Tip" : "Bəxşiş Əlavə et"}
                  </span>
                </button>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === "en" ? "Amount" : "Məbləğ"}
                </label>
                <input
                  type="text"
                  value={amount}
                  readOnly
                  className="w-full px-4 py-3 text-2xl font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Summary */}
              <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {language === "en" ? "Total" : "Cəmi"}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(getCurrentTotal())}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-600 dark:text-blue-400">
                    {language === "en" ? "Payable Amount" : "Ödəniləcək Məbləğ"}
                  </span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {formatCurrency(getPayableAmount())}
                  </span>
                </div>
                {getDueAmount() > 0 && (
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-blue-600 dark:text-blue-400">
                      {language === "en" ? "Due Amount" : "Qalan Məbləğ"}
                    </span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {formatCurrency(getDueAmount())}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Quick Amounts and Number Pad */}
            <div className="space-y-4">
              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {quickAmounts.map((quickAmount) => (
                  <button
                    key={quickAmount}
                    onClick={() => handleQuickAmount(quickAmount)}
                    className="py-3 text-sm font-semibold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {formatCurrency(quickAmount)}
                  </button>
                ))}
              </div>

              {/* Number Pad */}
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumberClick(num.toString())}
                    className="py-4 text-lg font-semibold bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={handleDecimalClick}
                  className="py-4 text-lg font-semibold bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  .
                </button>
                <button
                  onClick={() => handleNumberClick("0")}
                  className="py-4 text-lg font-semibold bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  0
                </button>
                <button
                  onClick={handleBackspace}
                  className="py-4 flex items-center justify-center bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleCompletePayment}
              disabled={!selectedPaymentMethod}
              className={cn(
                "flex-1 py-3 text-sm font-semibold rounded-xl transition-all",
                selectedPaymentMethod
                  ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
                  : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed"
              )}
            >
              {language === "en" ? "Complete Payment" : "Ödənişi Tamamla"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
