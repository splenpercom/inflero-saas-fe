import { useBranch } from "../context/BranchContext";

/** Returns branchRevision — include in data-load effect deps so lists refetch when branch changes. */
export function useBranchRevision(): number {
  return useBranch().branchRevision;
}
