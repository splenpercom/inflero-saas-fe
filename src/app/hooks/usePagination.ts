import { useState, useMemo, useEffect, useCallback } from "react";

interface UsePaginationProps<T> {
  data: T[];
  itemsPerPage?: number;
  /** When this key changes, page resets to 1 (e.g. search/filter signature). */
  resetKey?: string | number | boolean | null;
}

interface UsePaginationReturn<T> {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  paginatedData: T[];
  setCurrentPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  resetToFirstPage: () => void;
  itemsPerPage: number;
}

export function usePagination<T>({
  data,
  itemsPerPage = 10,
  resetKey,
}: UsePaginationProps<T>): UsePaginationReturn<T> {
  const [currentPage, setCurrentPageState] = useState(1);
  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage) || 1);

  // Reset only when filter/search identity changes (not on data length from save/delete).
  useEffect(() => {
    if (resetKey === undefined) return;
    setCurrentPageState(1);
  }, [resetKey]);

  // Clamp when list shrinks (e.g. delete last item on last page).
  useEffect(() => {
    setCurrentPageState((prev) => Math.min(Math.max(1, prev), totalPages));
  }, [totalPages]);

  const paginatedData = useMemo(() => {
    const page = Math.min(Math.max(1, currentPage), totalPages);
    const startIndex = (page - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  }, [data, currentPage, itemsPerPage, totalPages]);

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPageState(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages],
  );

  const nextPage = useCallback(() => {
    setCurrentPageState((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPageState((prev) => Math.max(prev - 1, 1));
  }, []);

  const resetToFirstPage = useCallback(() => {
    setCurrentPageState(1);
  }, []);

  return {
    currentPage: Math.min(currentPage, totalPages),
    totalPages,
    totalItems,
    paginatedData,
    setCurrentPage: goToPage,
    nextPage,
    prevPage,
    goToPage,
    resetToFirstPage,
    itemsPerPage,
  };
}

export interface ServerPaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  setCurrentPage: (page: number) => void;
  setTotals: (totalItems: number, totalPages?: number) => void;
  resetToFirstPage: () => void;
}

/** Server-driven page state. Persist page across reload; reset via resetToFirstPage on filter change. */
export function useServerPagination(pageSize = 10): ServerPaginationState {
  const [currentPage, setCurrentPageState] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const setTotals = useCallback(
    (items: number, pages?: number) => {
        const nextPages = Math.max(1, pages ?? (Math.ceil(items / pageSize) || 1));
      setTotalItems(items);
      setTotalPages(nextPages);
      setCurrentPageState((prev) => Math.min(Math.max(1, prev), nextPages));
    },
    [pageSize],
  );

  const setCurrentPage = useCallback(
    (page: number) => {
      setCurrentPageState(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages],
  );

  const resetToFirstPage = useCallback(() => {
    setCurrentPageState(1);
  }, []);

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage: pageSize,
    setCurrentPage,
    setTotals,
    resetToFirstPage,
  };
}

export const DEFAULT_LIST_PAGE_SIZE = 10;
export const DEFAULT_REPORT_PAGE_SIZE = 20;
