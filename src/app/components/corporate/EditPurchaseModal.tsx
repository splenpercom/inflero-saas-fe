import { AddPurchaseModal } from "./AddPurchaseModal";

interface EditPurchaseModalProps {
  purchaseId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

/** Edit uses the same form as Add Purchase, prefilled from the purchase detail. */
export function EditPurchaseModal({
  purchaseId,
  isOpen,
  onClose,
  onSaved,
}: EditPurchaseModalProps) {
  return (
    <AddPurchaseModal
      isOpen={isOpen && !!purchaseId}
      purchaseId={purchaseId}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}
