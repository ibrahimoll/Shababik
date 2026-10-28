import { effectiveStatus, statusLabel } from "@/lib/utils";
import type { Business } from "@/lib/types";

export function StatusBadge({ business }: { business: Pick<Business, "status" | "next_payment_date"> }) {
  const s = effectiveStatus(business);
  return <span className={`status status-${s}`}>{statusLabel[s]}</span>;
}
