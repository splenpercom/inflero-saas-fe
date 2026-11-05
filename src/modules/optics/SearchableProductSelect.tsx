import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../../app/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../app/components/ui/command";
import { cn } from "../../app/components/ui/utils";

export type SearchableProductOption = {
  id: string;
  name: string;
  code?: string;
  barcode?: string;
  /** Inventory category name — used for the category filter. */
  category?: string;
};

type Props = {
  products: SearchableProductOption[];
  valueId: string | null | undefined;
  valueLabel?: string | null;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  /** Label for the "all categories" filter option. */
  allCategoriesLabel?: string;
  /** Placeholder / aria label for the category filter. */
  categoryFilterLabel?: string;
  disabled?: boolean;
  /** Smaller trigger for dense Rx grids. */
  compact?: boolean;
  onSelect: (product: SearchableProductOption) => void;
};

export function SearchableProductSelect({
  products,
  valueId,
  valueLabel,
  placeholder = "PRODUCT",
  searchPlaceholder = "Search...",
  emptyLabel = "No products",
  allCategoriesLabel = "All categories",
  categoryFilterLabel = "Category",
  disabled,
  compact,
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    if (valueLabel) return valueLabel;
    if (!valueId) return null;
    return products.find((p) => p.id === valueId)?.name ?? null;
  }, [products, valueId, valueLabel]);

  const categories = useMemo(() => {
    const names = new Set<string>();
    for (const p of products) {
      const c = p.category?.trim();
      if (c) names.add(c);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [products]);

  const categoryOptions = useMemo(
    () => [
      { value: "", label: allCategoriesLabel },
      ...categories.map((c) => ({ value: c, label: c })),
    ],
    [allCategoriesLabel, categories],
  );

  const selectedCategoryLabel =
    categoryOptions.find((o) => o.value === category)?.label ?? allCategoriesLabel;

  const filteredProducts = useMemo(() => {
    if (!category) return products;
    return products.filter((p) => (p.category?.trim() || "") === category);
  }, [products, category]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setCategory("");
      setCategoryOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex w-full items-center justify-between gap-1.5 border border-gray-300 bg-white text-left text-gray-900",
            "hover:border-[#14b8a6] focus:outline-none focus:ring-1 focus:ring-[#14b8a6]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:border-gray-700 dark:bg-gray-900 dark:text-white",
            compact
              ? "rounded-md px-2 py-1 text-[11px] leading-snug"
              : "rounded-lg px-3 py-2 text-xs",
          )}
        >
          <span className={cn("truncate", !selectedLabel && "text-gray-400")}>
            {selectedLabel || placeholder}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(100vw-2rem,280px)] p-0"
        align="end"
        sideOffset={4}
      >
        {categories.length > 0 && (
          <div className="relative z-20 border-b border-gray-100 px-2 py-1.5 dark:border-gray-800">
            <span className="sr-only">{categoryFilterLabel}</span>
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={categoryOpen}
              aria-label={categoryFilterLabel}
              onClick={() => setCategoryOpen((v) => !v)}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-left text-[11px] text-gray-900",
                "hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]",
                "dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:border-gray-600",
                categoryOpen && "border-[#14b8a6] ring-2 ring-[#14b8a6]",
              )}
            >
              <span className="min-w-0 flex-1 truncate">{selectedCategoryLabel}</span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform",
                  categoryOpen && "rotate-180",
                )}
              />
            </button>
            {categoryOpen && (
              <div
                role="listbox"
                aria-label={categoryFilterLabel}
                className="absolute left-2 right-2 top-[calc(100%-2px)] z-30 max-h-44 overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
              >
                {categoryOptions.map((option) => {
                  const selected = option.value === category;
                  return (
                    <button
                      key={option.value || "__all__"}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        setCategory(option.value);
                        setCategoryOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-[11px] transition-colors",
                        "hover:bg-gray-100 dark:hover:bg-gray-800",
                        selected
                          ? "bg-[#ccfbf1] text-[#14b8a6] dark:bg-[#14b8a6]/20"
                          : "text-gray-900 dark:text-white",
                      )}
                      title={option.label}
                    >
                      <span className="min-w-0 flex-1 truncate">{option.label}</span>
                      {selected && <Check className="h-3.5 w-3.5 shrink-0 text-[#14b8a6]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        <Command shouldFilter>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {filteredProducts.map((product) => (
                <CommandItem
                  key={product.id}
                  value={`${product.name} ${product.code ?? ""} ${product.barcode ?? ""} ${product.category ?? ""}`}
                  onSelect={() => {
                    onSelect(product);
                    setOpen(false);
                    setCategory("");
                    setCategoryOpen(false);
                  }}
                  className="text-xs"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3.5 w-3.5",
                      valueId === product.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate">{product.name}</span>
                  {product.category?.trim() ? (
                    <span className="ml-2 max-w-[40%] shrink-0 truncate text-[10px] text-gray-400">
                      {product.category}
                    </span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
