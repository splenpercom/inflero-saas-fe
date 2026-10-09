import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
};

type Props = {
  products: SearchableProductOption[];
  valueId: string | null | undefined;
  valueLabel?: string | null;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
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
  disabled,
  compact,
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    if (valueLabel) return valueLabel;
    if (!valueId) return null;
    return products.find((p) => p.id === valueId)?.name ?? null;
  }, [products, valueId, valueLabel]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
          <ChevronsUpDown
            className={cn(
              "shrink-0 text-gray-400",
              compact ? "h-3.5 w-3.5" : "h-3.5 w-3.5",
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        sideOffset={4}
      >
        <Command shouldFilter>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={`${product.name} ${product.code ?? ""} ${product.barcode ?? ""}`}
                  onSelect={() => {
                    onSelect(product);
                    setOpen(false);
                  }}
                  className="text-xs"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3.5 w-3.5",
                      valueId === product.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{product.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
