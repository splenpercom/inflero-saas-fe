import type {
  OpticsEyeValues,
  OpticsPrescriptionMeta,
  OpticsPrescriptionSection,
} from "../../app/api/sales";

export type { OpticsEyeValues, OpticsPrescriptionMeta, OpticsPrescriptionSection };

export type OpticsSectionKey = "long" | "short" | "extra";
export type OpticsEyeSide = "right" | "left";

export const OPTICS_SECTION_KEYS: OpticsSectionKey[] = ["long", "short", "extra"];
export const OPTICS_EYE_SIDES: OpticsEyeSide[] = ["right", "left"];

/** Column keys matching the Rx grid: SPH, CYL, AX, DPP, Height, Description */
export const OPTICS_EYE_FIELDS: (keyof OpticsEyeValues)[] = [
  "sph",
  "cyl",
  "ax",
  "dpp",
  "height",
  "description",
];

/** Fixed clinical abbreviations (same in all languages). */
export const OPTICS_FIELD_LABELS: Record<keyof OpticsEyeValues, string> = {
  sph: "SPH",
  cyl: "CYL",
  ax: "AX",
  dpp: "DPP",
  height: "Height",
  description: "Description",
};

export const OPTICS_SECTION_LABELS: Record<
  OpticsSectionKey,
  { az: string; en: string; ru: string }
> = {
  long: { az: "UZAQ", en: "LONG", ru: "ДАЛЬ" },
  short: { az: "YAXIN", en: "SHORT", ru: "БЛИЗЬ" },
  extra: { az: "ƏLAVƏ", en: "EXTRA", ru: "ДОП." },
};

export const OPTICS_SIDE_LABELS: Record<
  OpticsEyeSide,
  { az: string; en: string; ru: string }
> = {
  right: { az: "Sağ", en: "Right", ru: "Правый" },
  left: { az: "Sol", en: "Left", ru: "Левый" },
};

export function emptyOpticsEye(): OpticsEyeValues {
  return {
    sph: "",
    cyl: "",
    ax: "",
    dpp: "",
    height: "",
    description: "",
  };
}

export function emptyOpticsSection(): OpticsPrescriptionSection {
  return {
    right: emptyOpticsEye(),
    left: emptyOpticsEye(),
    productId: null,
    productName: null,
  };
}

export function emptyOpticsMeta(): OpticsPrescriptionMeta {
  return {
    long: emptyOpticsSection(),
    short: emptyOpticsSection(),
    extra: emptyOpticsSection(),
  };
}

type LegacyEye = OpticsEyeValues & {
  axis?: string;
  add?: string;
  pd?: string;
};

type LegacySection = OpticsPrescriptionSection & {
  od?: LegacyEye;
  os?: LegacyEye;
};

function normalizeEye(raw: LegacyEye | null | undefined): OpticsEyeValues {
  const base = emptyOpticsEye();
  if (!raw || typeof raw !== "object") return base;
  return {
    sph: raw.sph ?? "",
    cyl: raw.cyl ?? "",
    ax: raw.ax ?? raw.axis ?? "",
    dpp: raw.dpp ?? raw.pd ?? "",
    height: raw.height ?? "",
    description: raw.description ?? raw.add ?? "",
  };
}

export function normalizeOpticsMeta(
  raw: OpticsPrescriptionMeta | null | undefined,
): OpticsPrescriptionMeta {
  const base = emptyOpticsMeta();
  if (!raw || typeof raw !== "object") return base;
  for (const key of OPTICS_SECTION_KEYS) {
    const section = raw[key] as LegacySection | undefined;
    if (!section) continue;
    base[key] = {
      right: normalizeEye(section.right ?? section.od),
      left: normalizeEye(section.left ?? section.os),
      productId: section.productId ?? null,
      productName: section.productName ?? null,
    };
  }
  return base;
}

/** True when any eye field or product is set. */
export function opticsMetaHasContent(meta: OpticsPrescriptionMeta | null | undefined): boolean {
  if (!meta) return false;
  for (const key of OPTICS_SECTION_KEYS) {
    const section = meta[key];
    if (!section) continue;
    if (section.productId || section.productName) return true;
    for (const eye of [section.right, section.left, section.od, section.os]) {
      if (!eye) continue;
      for (const field of OPTICS_EYE_FIELDS) {
        if ((eye[field] ?? "").trim()) return true;
      }
    }
  }
  return false;
}
