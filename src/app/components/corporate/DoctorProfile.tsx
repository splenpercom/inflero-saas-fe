import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Phone, Mail, Receipt, Edit2, BadgeCheck } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useBranchRevision } from "../../hooks/useBranchRevision";
import {
  fetchDoctorSales,
  updateDoctor,
  type DoctorSalesOrderRow,
  type PeopleDoctor,
} from "../../api/people";
import { formatSalesDate } from "../../lib/salesMappers";
import { formatCurrency } from "../../utils/currency";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { AddDoctorModal, type DoctorFormData } from "./people/AddDoctorModal";
import { pickLang } from "../../i18n/pickLang";

function StatusBadge({ status }: { status: string }) {
  const active = status === "Active";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
        active
          ? "border-green-300 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "border-gray-300 bg-gray-100 text-gray-500 dark:bg-gray-800"
      }`}
    >
      <BadgeCheck className="h-3 w-3" />
      {status}
    </span>
  );
}

export function DoctorProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { isDemo, isAuthenticated, hasModule } = useAuth();
  const opticsEnabled = hasModule("OPTICS");
  const { canView, canEdit } = useModulePermissions("Customers");
  const branchRevision = useBranchRevision();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const [doctor, setDoctor] = useState<PeopleDoctor | null>(null);
  const [orders, setOrders] = useState<DoctorSalesOrderRow[]>([]);
  const [commissionSum, setCommissionSum] = useState(0);
  const [loading, setLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!opticsEnabled) {
      navigate("/dashboard/people/customers", { replace: true });
    }
  }, [opticsEnabled, navigate]);

  const loadData = useCallback(async () => {
    if (!id || !(isAuthenticated || isDemo) || !canView || !opticsEnabled) {
      setDoctor(null);
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setSalesLoading(true);
    try {
      const summary = await fetchDoctorSales(id, { page: 1, pageSize: 100 });
      setDoctor(summary.doctor);
      setOrders(summary.orders);
      setCommissionSum(summary.commissionSum);
    } catch (err) {
      notifyFromError(err);
      setDoctor(null);
      setOrders([]);
    } finally {
      setLoading(false);
      setSalesLoading(false);
    }
  }, [id, isDemo, isAuthenticated, canView, opticsEnabled, branchRevision]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSave = async (data: DoctorFormData) => {
    if (!id || !(isAuthenticated || isDemo) || !canEdit) return;
    setSaving(true);
    try {
      const commissionType = data.commissionType === "" ? null : data.commissionType;
      const commissionValue =
        commissionType == null || data.commissionValue.trim() === ""
          ? null
          : Number(data.commissionValue);
      const updated = await updateDoctor(id, {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        commissionType,
        commissionValue,
        ...(data.status ? { status: data.status } : {}),
      });
      setDoctor(updated);
      setEditOpen(false);
      notifySuccess(tr("Həkim yeniləndi", "Doctor updated"));
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  if (!opticsEnabled) return null;

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-gray-500">{tr("Yüklənir...", "Loading...")}</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <p className="text-sm text-gray-500">{tr("Həkim tapılmadı", "Doctor not found")}</p>
          <button
            onClick={() => navigate("/dashboard/people/doctors")}
            className="mt-3 text-xs text-[#14b8a6] hover:underline"
          >
            {tr("Geri qayıt", "Go back")}
          </button>
        </div>
      </div>
    );
  }

  const commissionLabel =
    doctor.commissionType && doctor.commissionValue != null
      ? doctor.commissionType === "PERCENT"
        ? `${doctor.commissionValue}%`
        : `${doctor.commissionValue} ₼`
      : "—";

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
        <button
          onClick={() => navigate("/dashboard/people/doctors")}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {tr("Həkimlər", "Doctors")}
        </button>

        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#14b8a6]">
              <span className="text-xl font-bold text-white">{doctor.name.charAt(0)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">{doctor.name}</h1>
                <StatusBadge status={doctor.status} />
                <span className="font-mono text-xs text-gray-400">{doctor.code}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                {doctor.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    {doctor.phone}
                  </span>
                )}
                {doctor.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {doctor.email}
                  </span>
                )}
              </div>
            </div>
            {canEdit && (
              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs dark:border-gray-700"
              >
                <Edit2 className="h-3.5 w-3.5" />
                {tr("Redaktə", "Edit")}
              </button>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-50 px-3 py-3 text-center dark:bg-gray-800/50">
              <p className="text-lg font-bold text-[#14b8a6]">{orders.length}</p>
              <p className="text-[10px] text-gray-400">{tr("Satış", "Sales")}</p>
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-3 text-center dark:bg-gray-800/50">
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(commissionSum)}
              </p>
              <p className="text-[10px] text-gray-400">
                {tr("Cəmi komissiya", "Total commission")}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-3 text-center dark:bg-gray-800/50">
              <p className="text-lg font-bold text-gray-900 dark:text-white">{commissionLabel}</p>
              <p className="text-[10px] text-gray-400">{tr("Qayda", "Rule")}</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {tr("Satışlar", "Sales")}
          </h2>
          {salesLoading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs text-gray-400">{tr("Yüklənir...", "Loading...")}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
              <Receipt className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-xs text-gray-400">
                {tr("Satış tarixçəsi yoxdur", "No sales history")}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
                      <th className="px-4 py-3 text-left text-[10px] font-medium uppercase text-gray-500">
                        {tr("İstinad", "Reference")}
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-medium uppercase text-gray-500">
                        {tr("Tarix", "Date")}
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-medium uppercase text-gray-500">
                        {tr("Status", "Status")}
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-medium uppercase text-gray-500">
                        {tr("Ödəniş", "Payment")}
                      </th>
                      <th className="px-4 py-3 text-right text-[10px] font-medium uppercase text-gray-500">
                        {tr("Məbləğ", "Amount")}
                      </th>
                      <th className="px-4 py-3 text-right text-[10px] font-medium uppercase text-gray-500">
                        {tr("Komissiya", "Commission")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        onClick={() =>
                          navigate(
                            `/dashboard/sales/pos-orders?orderId=${encodeURIComponent(order.id)}`,
                          )
                        }
                        className="cursor-pointer border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/40"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-gray-900 dark:text-white">
                          {order.reference}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {formatSalesDate(order.date)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {order.status}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {order.paymentStatus}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-gray-900 dark:text-white">
                          {formatCurrency(order.grandTotal)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-gray-600 dark:text-gray-400">
                          {order.doctorCommissionAmount != null
                            ? formatCurrency(order.doctorCommissionAmount)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <AddDoctorModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          onSave={handleSave}
          doctor={doctor}
          saving={saving}
        />
      </div>
    </div>
  );
}
