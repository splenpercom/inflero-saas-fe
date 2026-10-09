import { useCallback, useEffect, useState } from "react";
import { Glasses, Keyboard, X } from "lucide-react";
import { TouchKeyboard } from "../../app/components/ui/TouchKeyboard";
import {
  useLastPointerType,
  usePrefersTouchKeyboard,
} from "../../app/hooks/usePrefersTouchKeyboard";
import {
  SearchableProductSelect,
  type SearchableProductOption,
} from "./SearchableProductSelect";
import {
  OPTICS_EYE_FIELDS,
  OPTICS_EYE_SIDES,
  OPTICS_FIELD_LABELS,
  OPTICS_SECTION_KEYS,
  OPTICS_SECTION_LABELS,
  OPTICS_SIDE_LABELS,
  emptyOpticsMeta,
  normalizeOpticsMeta,
  type OpticsEyeSide,
  type OpticsEyeValues,
  type OpticsPrescriptionMeta,
  type OpticsSectionKey,
} from "./opticsTypes";

type Props = {
  open: boolean;
  value: OpticsPrescriptionMeta | null;
  products: SearchableProductOption[];
  tr: (az: string, en: string, ru?: string) => string;
  onClose: () => void;
  onApply: (meta: OpticsPrescriptionMeta) => void;
  /** Called when a product is picked; return true to bind it on the section. */
  onTryAddProduct: (product: SearchableProductOption) => boolean;
};

type TouchField = {
  sectionKey: OpticsSectionKey;
  eye: OpticsEyeSide;
  field: keyof OpticsEyeValues;
};

function fieldHeaderLabel(
  field: keyof OpticsEyeValues,
  tr: Props["tr"],
): string {
  if (field === "description") return tr("Məlumat", "Description", "Информация");
  if (field === "height") return tr("Height", "Height", "Высота");
  return OPTICS_FIELD_LABELS[field];
}

export function OpticsPrescriptionDialog({
  open,
  value,
  products,
  tr,
  onClose,
  onApply,
  onTryAddProduct,
}: Props) {
  const prefersTouchKeyboard = usePrefersTouchKeyboard();
  const lastPointerType = useLastPointerType();
  const [draft, setDraft] = useState<OpticsPrescriptionMeta>(() =>
    normalizeOpticsMeta(value),
  );
  const [touchField, setTouchField] = useState<TouchField | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(normalizeOpticsMeta(value));
      setTouchField(null);
    }
  }, [open, value]);

  const openTouchKb = useCallback(
    (target: TouchField, force = false) => {
      const fromTouch =
        lastPointerType.current === "touch" || lastPointerType.current === "pen";
      if (force || prefersTouchKeyboard || fromTouch) {
        setTouchField(target);
      }
    },
    [lastPointerType, prefersTouchKeyboard],
  );

  if (!open) return null;

  const setEyeField = (
    sectionKey: OpticsSectionKey,
    eye: OpticsEyeSide,
    field: keyof OpticsEyeValues,
    next: string,
  ) => {
    setDraft((prev) => {
      const base = prev ?? emptyOpticsMeta();
      const section = base[sectionKey] ?? emptyOpticsMeta()[sectionKey]!;
      const eyeValues = { ...(section[eye] ?? {}), [field]: next };
      return {
        ...base,
        [sectionKey]: { ...section, [eye]: eyeValues },
      };
    });
  };

  const bindProduct = (sectionKey: OpticsSectionKey, product: SearchableProductOption) => {
    const ok = onTryAddProduct(product);
    if (!ok) return;
    setDraft((prev) => {
      const base = prev ?? emptyOpticsMeta();
      const section = base[sectionKey] ?? emptyOpticsMeta()[sectionKey]!;
      return {
        ...base,
        [sectionKey]: {
          ...section,
          productId: product.id,
          productName: product.name,
        },
      };
    });
  };

  const touchValue =
    touchField != null
      ? draft[touchField.sectionKey]?.[touchField.eye]?.[touchField.field] ?? ""
      : "";

  const touchTitle =
    touchField != null
      ? `${OPTICS_SECTION_LABELS[touchField.sectionKey].en} · ${OPTICS_SIDE_LABELS[touchField.eye].en} · ${fieldHeaderLabel(touchField.field, tr)}`
      : undefined;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-3"
      role="presentation"
      onClick={() => {
        setTouchField(null);
        onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="optics-rx-title"
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-800">
          <div className="flex items-center gap-1.5">
            <Glasses className="h-4 w-4 text-[#14b8a6]" />
            <h2
              id="optics-rx-title"
              className="text-sm font-semibold text-gray-900 dark:text-white"
            >
              {tr("Resept", "Prescription", "Рецепт")}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setTouchField(null);
              onClose();
            }}
            className="rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1 space-y-2.5 overflow-y-auto px-3 py-3">
          {OPTICS_SECTION_KEYS.map((sectionKey) => {
            const section = draft[sectionKey] ?? emptyOpticsMeta()[sectionKey]!;
            const label = OPTICS_SECTION_LABELS[sectionKey];
            return (
              <section
                key={sectionKey}
                className="rounded-lg border border-gray-200 px-2.5 py-2 dark:border-gray-700"
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                    {tr(label.az, label.en, label.ru)}
                  </h3>
                  <div className="min-w-0 flex-1 max-w-[55%]">
                    <SearchableProductSelect
                      products={products}
                      valueId={section.productId}
                      valueLabel={section.productName}
                      placeholder={tr("Məhsul", "Product", "Товар")}
                      searchPlaceholder={tr("Axtar…", "Search...", "Поиск...")}
                      emptyLabel={tr("Məhsul yoxdur", "No products", "Нет товаров")}
                      compact
                      onSelect={(product) => bindProduct(sectionKey, product)}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[440px] border-collapse text-[11px]">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="w-10 px-1 py-1 font-medium" />
                        {OPTICS_EYE_FIELDS.map((f) => (
                          <th key={f} className="px-1 py-1 font-medium">
                            {fieldHeaderLabel(f, tr)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {OPTICS_EYE_SIDES.map((eye) => {
                        const side = OPTICS_SIDE_LABELS[eye];
                        return (
                          <tr key={eye}>
                            <td className="px-1 py-1 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {tr(side.az, side.en, side.ru)}
                            </td>
                            {OPTICS_EYE_FIELDS.map((field) => {
                              const target: TouchField = { sectionKey, eye, field };
                              const active =
                                touchField?.sectionKey === sectionKey &&
                                touchField.eye === eye &&
                                touchField.field === field;
                              return (
                                <td key={field} className="px-1 py-1">
                                  <div className="relative">
                                    <input
                                      type="text"
                                      inputMode="none"
                                      value={section[eye]?.[field] ?? ""}
                                      onChange={(e) =>
                                        setEyeField(sectionKey, eye, field, e.target.value)
                                      }
                                      onFocus={() => openTouchKb(target)}
                                      className={`w-full rounded border bg-white py-1 pl-1.5 pr-6 text-[11px] leading-snug text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#14b8a6] dark:bg-gray-950 dark:text-white ${
                                        active
                                          ? "border-[#14b8a6]"
                                          : "border-gray-300 dark:border-gray-700"
                                      }`}
                                    />
                                    <button
                                      type="button"
                                      className="absolute right-0.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-[#14b8a6]"
                                      title={tr("Klaviatura", "Keyboard", "Клавиатура")}
                                      onClick={() => openTouchKb(target, true)}
                                    >
                                      <Keyboard className="h-3 w-3" />
                                    </button>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>

        <div className="flex gap-2 border-t border-gray-200 px-3 py-2 dark:border-gray-800">
          <button
            type="button"
            onClick={() => {
              setTouchField(null);
              onClose();
            }}
            className="flex-1 rounded-md bg-gray-100 py-1.5 text-[11px] font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {tr("Bağla", "Close", "Закрыть")}
          </button>
          <button
            type="button"
            onClick={() => {
              setTouchField(null);
              onApply(draft);
            }}
            className="flex-1 rounded-md bg-[#14b8a6] py-1.5 text-[11px] font-medium text-white hover:bg-[#0d9488]"
          >
            {tr("Tətbiq et", "Apply", "Применить")}
          </button>
        </div>
      </div>

      {touchField && (
        <TouchKeyboard
          open
          mode={touchField.field === "description" ? "full" : "numpad"}
          allowNegative={touchField.field !== "description"}
          zClassName="z-[90]"
          value={touchValue}
          title={touchTitle}
          onChange={(next) =>
            setEyeField(touchField.sectionKey, touchField.eye, touchField.field, next)
          }
          onClose={() => setTouchField(null)}
        />
      )}
    </div>
  );
}
