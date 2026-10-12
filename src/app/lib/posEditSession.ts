const POS_EDIT_ORDER_KEY = "inflero_pos_edit_order_id";

export function readPosEditOrderId(): string | null {
  try {
    return sessionStorage.getItem(POS_EDIT_ORDER_KEY);
  } catch {
    return null;
  }
}

export function writePosEditOrderId(id: string | null) {
  try {
    if (id) sessionStorage.setItem(POS_EDIT_ORDER_KEY, id);
    else sessionStorage.removeItem(POS_EDIT_ORDER_KEY);
  } catch {
    /* ignore */
  }
}

/** Clear sticky edit-order restore (header / sidebar “open POS”). */
export function clearPosEditOrderSession() {
  writePosEditOrderId(null);
}
