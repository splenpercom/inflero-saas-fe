export type UiPeopleStatus = "Active" | "Inactive";

export function generalStatusToUi(status: string): UiPeopleStatus {
  return status === "ACTIVE" || status === "Active" ? "Active" : "Inactive";
}

export function uiStatusToGeneral(status: UiPeopleStatus): "ACTIVE" | "INACTIVE" {
  return status === "Active" ? "ACTIVE" : "INACTIVE";
}
