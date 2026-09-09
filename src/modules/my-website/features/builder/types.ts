export type BlockType =
  | "hero" | "featured-products" | "category-grid" | "banner"
  | "testimonials" | "custom-html"
  | "image-block" | "image-text" | "whatsapp-widget" | "socials"
  | "reservation"
  | "branches";

export interface ProductSource {
  mode: "all" | "category" | "specific";
  categoryId: string; productIds: string[]; limit: number; title: string;
  columns?: number; rows?: number;
}

export interface Block {
  id: string; type: BlockType; label: string; visible: boolean;
  heading?: string; subheading?: string; ctaText?: string; ctaColor?: string; bgColor?: string;
  textColor?: string; ctaBtnTextColor?: string;
  overlayOpacity?: number;
  bannerText?: string; bannerSubtext?: string; bannerBg?: string; bannerImageUrl?: string;
  newsletterHeading?: string; newsletterPlaceholder?: string;
  html?: string;
  productSource?: ProductSource;
  imageUrl?: string; imageAlt?: string; imageCaption?: string;
  imageHeight?: "sm" | "md" | "lg"; imagePosition?: "left" | "right";
  waNumber?: string; waMessage?: string; waLabel?: string;
  socialLinks?: Record<string, string>;
  testimonialItems?: { name: string; text: string; rating: number }[];
  categoryColumns?: number;
  reservationTitle?: string; reservationSubtext?: string;
  reservationServices?: string[]; reservationShowGuests?: boolean; reservationShowNotes?: boolean;
  /** Branches selling block */
  branchesTitle?: string;
  branchesSubtext?: string;
  branchStoreIds?: string[];
}

export interface ColumnItem { id: string; ratio: number; blocks: Block[]; }

export interface RowItem {
  kind: "row"; id: string; label: string; visible: boolean;
  preset: string; columns: ColumnItem[];
  bgColor?: string; padding?: "none" | "sm" | "md" | "lg"; gap?: "sm" | "md" | "lg";
}

export type ContentItem = Block | RowItem;
export function isRow(item: ContentItem): item is RowItem { return (item as RowItem).kind === "row"; }

export interface HeaderLink { id: string; label: string; href: string; }
export interface PaymentMethod { id: string; name: string; icon: string; enabled: boolean; }

export interface WebsiteConfig {
  template: string; storeName: string; tagline: string;
  primaryColor: string; accentColor: string; domain: string; currency: string;
  content: ContentItem[]; paymentMethods: PaymentMethod[];
  globalShowAllProducts: boolean; selectedCategories: string[];
  logoUrl: string; headerLinks: HeaderLink[];
  epointPrivateKey?: string;
  shippingEmailEnabled: boolean;
  shippingCityEnabled: boolean;
  shippingZipEnabled: boolean;
  shippingMethod: "standard" | "free_above" | "free" | "distance";
  shippingPrice: number;
  shippingFreeAbove: number;
  shippingDistanceBase: number;
  shippingDistancePerKm: number;
  shippingDistanceMaxKm: number;
  shippingOriginLat: number | null;
  shippingOriginLng: number | null;
  shippingOriginAddress: string;
}

export type SelectedItem =
  | null
  | { kind: "header" }
  | { kind: "block"; blockId: string }
  | { kind: "row"; rowId: string }
  | { kind: "row-block"; rowId: string; colId: string; blockId: string };

export interface DragInfo { blockId: string; rowId: string | null; colId: string | null; }
export interface DropTarget { rowId: string | null; colId: string | null; insertAt: number; }

