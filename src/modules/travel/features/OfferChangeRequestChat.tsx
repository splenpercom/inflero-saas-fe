import type { OfferChangeRequestRow } from "../../../app/api/offers";

export type ChangeChatLabels = {
  client: string;
  agency: string;
  empty: string;
  waiting?: string;
};

type Props = {
  items: OfferChangeRequestRow[];
  /** When true, the latest client message without a staff reply is highlighted as open. */
  openLatest?: boolean;
  labels: ChangeChatLabels;
  className?: string;
  /** Compact height for staff drawer; public page can omit for fuller thread. */
  maxHeightClass?: string;
};

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

/**
 * Shared chat-style thread for client change requests + staff replies.
 * Client bubbles on the left, agency bubbles on the right.
 */
export function OfferChangeRequestChat({
  items,
  openLatest = false,
  labels,
  className = "",
  maxHeightClass = "max-h-64",
}: Props) {
  if (!items.length) {
    return (
      <p className={`text-[11px] text-gray-500 dark:text-gray-400 ${className}`}>
        {labels.empty}
      </p>
    );
  }

  const lastIdx = items.length - 1;

  const scrollable = Boolean(maxHeightClass && maxHeightClass !== "max-h-none");

  return (
    <div
      className={`flex flex-col gap-3 pr-0.5 ${scrollable ? `overflow-y-auto ${maxHeightClass}` : ""} ${className}`}
      role="log"
      aria-live="polite"
    >
      {items.map((c, idx) => {
        const isOpen = openLatest && idx === lastIdx && !c.staffReply;
        return (
          <div key={c.id} className="flex flex-col gap-2">
            {/* Client message */}
            <div className="flex justify-start">
              <div
                className={`max-w-[88%] rounded-2xl rounded-bl-md px-3 py-2 shadow-sm ${
                  isOpen
                    ? "bg-orange-100 dark:bg-orange-950/50 border border-orange-300 dark:border-orange-700"
                    : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {labels.client}
                    {isOpen ? " · · ·" : ""}
                  </span>
                  <span className="text-[9px] text-gray-400 whitespace-nowrap">
                    {fmtWhen(c.createdAt)}
                  </span>
                </div>
                {c.rating != null && c.rating > 0 && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mb-0.5 leading-none">
                    {"★".repeat(c.rating)}
                  </p>
                )}
                <p className="text-[12px] text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                  {c.note}
                </p>
              </div>
            </div>

            {/* Staff reply */}
            {c.staffReply ? (
              <div className="flex justify-end">
                <div className="max-w-[88%] rounded-2xl rounded-br-md px-3 py-2 bg-[#001058] text-white shadow-sm">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/70">
                      {labels.agency}
                    </span>
                    {c.staffRepliedAt && (
                      <span className="text-[9px] text-white/50 whitespace-nowrap">
                        {fmtWhen(c.staffRepliedAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-white whitespace-pre-wrap leading-relaxed">
                    {c.staffReply}
                  </p>
                </div>
              </div>
            ) : isOpen && labels.waiting ? (
              <div className="flex justify-end">
                <p className="text-[10px] italic text-orange-600 dark:text-orange-400 px-1">
                  {labels.waiting}
                </p>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
