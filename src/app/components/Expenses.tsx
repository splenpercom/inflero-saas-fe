import { useState } from "react";
import { Search, Filter, Plus, Eye, Edit2, Trash2, CreditCard, Banknote } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useConfirm } from "../context/ConfirmContext";
import { DateInput } from "./ui/DateInput";

type PaymentStatus = "paid" | "pending" | "cancelled";
type PaymentMethod = "creditCard" | "cash" | "bankTransfer";
type ExpenseCategory = "rent" | "equipment" | "utilities" | "salary" | "other";

interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: string;
  paymentStatus: PaymentStatus;
  paymentDate: string;
  dueDate: string;
  paymentMethod: PaymentMethod;
}

export function Expenses() {
  const { t } = useLanguage();
  const askConfirm = useConfirm();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);

  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: "1",
      title: "Demo 2",
      category: "rent",
      amount: 5568.0,
      expenseDate: "11/02/2026",
      paymentStatus: "paid",
      paymentDate: "21/02/2026",
      dueDate: "11/02/2026",
      paymentMethod: "creditCard",
    },
    {
      id: "2",
      title: "Demo",
      category: "equipment",
      amount: 55005.0,
      expenseDate: "11/02/2026",
      paymentStatus: "pending",
      paymentDate: "11/02/2026",
      dueDate: "11/02/2026",
      paymentMethod: "cash",
    },
  ]);

  const [newExpense, setNewExpense] = useState({
    title: "",
    category: "other" as ExpenseCategory,
    amount: "",
    expenseDate: "",
    paymentStatus: "pending" as PaymentStatus,
    paymentDate: "",
    dueDate: "",
    paymentMethod: "cash" as PaymentMethod,
  });

  const filteredExpenses = expenses.filter((expense) =>
    expense.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddExpense = () => {
    if (newExpense.title && newExpense.amount && newExpense.expenseDate) {
      const expense: Expense = {
        id: Date.now().toString(),
        title: newExpense.title,
        category: newExpense.category,
        amount: parseFloat(newExpense.amount),
        expenseDate: newExpense.expenseDate,
        paymentStatus: newExpense.paymentStatus,
        paymentDate: newExpense.paymentDate,
        dueDate: newExpense.dueDate,
        paymentMethod: newExpense.paymentMethod,
      };
      setExpenses([...expenses, expense]);
      setNewExpense({
        title: "",
        category: "other",
        amount: "",
        expenseDate: "",
        paymentStatus: "pending",
        paymentDate: "",
        dueDate: "",
        paymentMethod: "cash",
      });
      setIsAddExpenseModalOpen(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (await askConfirm({
      title: "Confirm deletion",
      message: t.expensesPage.confirmDelete,
      variant: "danger",
    })) {
      setExpenses(expenses.filter((expense) => expense.id !== id));
    }
  };

  const getCategoryLabel = (category: ExpenseCategory) => {
    switch (category) {
      case "rent":
        return t.expensesPage.rent;
      case "equipment":
        return t.expensesPage.equipment;
      case "utilities":
        return t.expensesPage.utilities;
      case "salary":
        return t.expensesPage.salary;
      default:
        return t.expensesPage.other;
    }
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case "creditCard":
        return t.expensesPage.creditCard;
      case "cash":
        return t.expensesPage.cash;
      default:
        return t.expensesPage.bankTransfer;
    }
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    if (method === "creditCard") {
      return <CreditCard className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />;
    }
    return <Banknote className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />;
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white mb-3">
            {t.expensesPage.title}
          </h1>

          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder={t.expensesPage.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 w-full sm:w-auto">
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <Filter className="w-3.5 h-3.5" />
                <span>{t.expensesPage.showFilters}</span>
              </button>
              <button
                onClick={() => setIsAddExpenseModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.expensesPage.addExpense}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    {t.expensesPage.expenseTitle}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    {t.expensesPage.category}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    {t.expensesPage.amount}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    {t.expensesPage.expenseDate}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    {t.expensesPage.paymentStatus}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    {t.expensesPage.paymentDate}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    {t.expensesPage.dueDate}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    {t.expensesPage.paymentMethod}
                  </th>
                  <th className="text-right text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    {t.expensesPage.action}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    {/* Title */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900 dark:text-white">
                        {expense.title}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {getCategoryLabel(expense.category)}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900 dark:text-white">
                        {expense.amount.toFixed(2)}₼
                      </div>
                    </td>

                    {/* Expense Date */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {expense.expenseDate}
                      </div>
                    </td>

                    {/* Payment Status */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded uppercase ${
                          expense.paymentStatus === "paid"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : expense.paymentStatus === "pending"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {expense.paymentStatus === "paid"
                          ? t.expensesPage.paid
                          : expense.paymentStatus === "pending"
                          ? t.expensesPage.pending
                          : t.expensesPage.cancelled}
                      </span>
                    </td>

                    {/* Payment Date */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {expense.paymentDate}
                      </div>
                    </td>

                    {/* Due Date */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {expense.dueDate}
                      </div>
                    </td>

                    {/* Payment Method */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {getPaymentMethodIcon(expense.paymentMethod)}
                        <span className="text-xs text-gray-900 dark:text-white">
                          {getPaymentMethodLabel(expense.paymentMethod)}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <Eye className="w-3 h-3" />
                        </button>

                        <button className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <Edit2 className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredExpenses.length === 0 && (
            <div className="text-center py-8">
              <Banknote className="w-10 h-10 text-gray-400 dark:text-gray-600 mx-auto mb-2 opacity-50" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t.expensesPage.noExpensesFound}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg w-full max-w-md shadow-xl">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t.expensesPage.addNewExpense}
              </h2>
            </div>

            {/* Modal Body */}
            <div className="px-4 py-3 space-y-3">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.expensesPage.expenseTitle}
                </label>
                <input
                  type="text"
                  value={newExpense.title}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, title: e.target.value })
                  }
                  placeholder={t.expensesPage.enterTitle}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.expensesPage.category}
                </label>
                <select
                  value={newExpense.category}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      category: e.target.value as ExpenseCategory,
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="rent">{t.expensesPage.rent}</option>
                  <option value="equipment">{t.expensesPage.equipment}</option>
                  <option value="utilities">{t.expensesPage.utilities}</option>
                  <option value="salary">{t.expensesPage.salary}</option>
                  <option value="other">{t.expensesPage.other}</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.expensesPage.amount}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, amount: e.target.value })
                  }
                  placeholder={t.expensesPage.enterAmount}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Expense Date */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.expensesPage.expenseDate}
                </label>
                <DateInput
                  value={newExpense.expenseDate}
                  onChange={(expenseDate) =>
                    setNewExpense({ ...newExpense, expenseDate })
                  }
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Payment Status */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.expensesPage.paymentStatus}
                </label>
                <select
                  value={newExpense.paymentStatus}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      paymentStatus: e.target.value as PaymentStatus,
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">{t.expensesPage.pending}</option>
                  <option value="paid">{t.expensesPage.paid}</option>
                  <option value="cancelled">{t.expensesPage.cancelled}</option>
                </select>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.expensesPage.paymentMethod}
                </label>
                <select
                  value={newExpense.paymentMethod}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      paymentMethod: e.target.value as PaymentMethod,
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cash">{t.expensesPage.cash}</option>
                  <option value="creditCard">{t.expensesPage.creditCard}</option>
                  <option value="bankTransfer">{t.expensesPage.bankTransfer}</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex gap-2 justify-end">
              <button
                onClick={() => setIsAddExpenseModalOpen(false)}
                className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t.expensesPage.cancel}
              </button>
              <button
                onClick={handleAddExpense}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {t.expensesPage.addExpense}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}