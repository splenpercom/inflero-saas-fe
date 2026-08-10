type ShowTextLabels = {
  showing: string;
  to: string;
  of: string;
  results: string;
};

type DataPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
  showText?: ShowTextLabels;
  className?: string;
};

export function DataPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  showText,
  className,
}: DataPaginationProps) {
  if (totalPages <= 1 && totalItems <= itemsPerPage) return null;

  const start = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  const labels = showText ?? {
    showing: "Showing",
    to: "to",
    of: "of",
    results: "results",
  };

  return (
    <div
      className={
        className ??
        "flex flex-col sm:flex-row items-center justify-between gap-3 px-1"
      }
    >
      <div className="text-xs text-gray-600 dark:text-gray-400">
        {labels.showing} {start} {labels.to} {end} {labels.of} {totalItems}{" "}
        {labels.results}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <span className="text-xs text-gray-600 dark:text-gray-400">
          Page {currentPage} of {Math.max(1, totalPages)}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
