import { useCallback, useEffect, useState } from "react";
import { Car, Edit2, Plus, Trash2, X } from "lucide-react";
import {
  createCustomerVehicle,
  deleteCustomerVehicle,
  fetchCustomerVehicles,
  updateCustomerVehicle,
  type CustomerVehicle,
  type PeopleCustomer,
} from "../../../api/people";
import { notifyFromError } from "../../../lib/toast";
import { AddVehicleModal, type VehicleFormData } from "./AddVehicleModal";
import { useAuth } from "../../../context/AuthContext";
import { useModulePermissions } from "../../../hooks/useModulePermissions";
import { useConfirm } from "../../../context/ConfirmContext";

export function CustomerVehiclesModal({
  customer,
  onClose,
  onChanged,
}: {
  customer: PeopleCustomer | null;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const { isDemo, isAuthenticated } = useAuth();
  const { canCreate, canEdit, canDelete } = useModulePermissions("People");
  const askConfirm = useConfirm();
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([]);
  const [editing, setEditing] = useState<CustomerVehicle | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!customer) return;
    try {
      setVehicles(await fetchCustomerVehicles(customer.id));
    } catch (error) {
      notifyFromError(error);
    }
  }, [customer]);

  useEffect(() => { void load(); }, [load]);
  if (!customer) return null;

  const save = async (data: VehicleFormData) => {
    if (isDemo || !isAuthenticated || (editing ? !canEdit : !canCreate)) return;
    setSaving(true);
    const body = {
      make: data.make.trim() || null,
      model: data.model.trim() || null,
      year: data.year ? Number(data.year) : null,
      plate: data.plate.trim() || null,
      mileage: data.mileage ? Number(data.mileage) : null,
      vin: data.vin.trim() || null,
      notes: data.notes.trim() || null,
    };
    try {
      if (editing) await updateCustomerVehicle(customer.id, editing.id, { ...body, status: data.status });
      else await createCustomerVehicle(customer.id, body);
      setEditorOpen(false);
      setEditing(null);
      await load();
      onChanged?.();
    } catch (error) {
      notifyFromError(error);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (vehicle: CustomerVehicle) => {
    if (isDemo || !isAuthenticated || !canDelete) return;
    if (!(await askConfirm({
      title: "Delete vehicle",
      message: `Delete ${[vehicle.make, vehicle.model, vehicle.plate].filter(Boolean).join(" ") || "this vehicle"}?`,
      variant: "danger",
    }))) return;
    try {
      await deleteCustomerVehicle(customer.id, vehicle.id);
      await load();
      onChanged?.();
    } catch (error) {
      notifyFromError(error);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl dark:bg-gray-900">
          <div className="flex items-center justify-between border-b p-4 dark:border-gray-800">
            <div><h2 className="text-sm font-semibold">Cars</h2><p className="text-xs text-gray-500">{customer.name}</p></div>
            <button type="button" onClick={onClose}><X className="h-4 w-4" /></button>
          </div>
          <div className="max-h-[55vh] space-y-2 overflow-y-auto p-4">
            {vehicles.length === 0 && <p className="py-8 text-center text-xs text-gray-500">No vehicles added.</p>}
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="flex items-center gap-3 rounded-lg border p-3 dark:border-gray-800">
                <Car className="h-5 w-5 text-[#14b8a6]" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{[vehicle.make, vehicle.model].filter(Boolean).join(" ") || "Vehicle"}</p>
                  <p className="text-xs text-gray-500">{vehicle.plate || "—"}{vehicle.mileage != null ? ` · ${vehicle.mileage} km` : ""}</p>
                </div>
                {!isDemo && canEdit && <button type="button" onClick={() => { setEditing(vehicle); setEditorOpen(true); }}><Edit2 className="h-4 w-4" /></button>}
                {!isDemo && canDelete && <button type="button" className="text-red-600" onClick={() => void remove(vehicle)}><Trash2 className="h-4 w-4" /></button>}
              </div>
            ))}
          </div>
          {!isDemo && canCreate && <div className="flex justify-end border-t p-4 dark:border-gray-800">
            <button type="button" onClick={() => { setEditing(null); setEditorOpen(true); }} className="flex items-center gap-1 rounded-lg bg-[#14b8a6] px-4 py-2 text-xs text-white"><Plus className="h-3.5 w-3.5" /> Add vehicle</button>
          </div>}
        </div>
      </div>
      {!isDemo && <AddVehicleModal isOpen={editorOpen} onClose={() => setEditorOpen(false)} onSave={save} vehicle={editing} saving={saving} />}
    </>
  );
}
