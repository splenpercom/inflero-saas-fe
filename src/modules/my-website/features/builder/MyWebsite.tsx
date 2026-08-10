/**
 * MyWebsite Plugin — Inflero
 * Supports standalone blocks AND multi-column row sections with DnD.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Globe, Layout, ShoppingBag, ChevronUp, ChevronDown,
  Trash2, Plus, Eye, EyeOff, Save, Settings2, Check,
  GripVertical, Star, Tag, ExternalLink, RefreshCw,
  Copy, Monitor, Smartphone, ArrowLeft, X, ChevronRight,
  Image as ImageIcon, AlignLeft, Layers, ShoppingCart,
  MessageCircle, Link2, Pencil, LayoutTemplate, Columns, Upload,
  CalendarDays, Clock, Users, Mail, MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../../i18n";
import { pickLang } from "../../../../app/i18n/pickLang";
import "../../styles/my-website.css";
import {
  loadWebsiteConfigBySlug,
  loadWebsiteConfigByTenant,
  saveWebsiteConfig,
} from "../../lib/websiteConfigStorage";
import { storePath, storeUrl } from "../../../../app/lib/bookingLinks";

import type {
  BlockType, ProductSource, Block, ColumnItem, RowItem, ContentItem,
  HeaderLink, PaymentMethod, WebsiteConfig, SelectedItem, DragInfo, DropTarget,
} from "./types";
import { isRow } from "./types";

// ─── Column Presets ───────────────────────────────────────────────────────────

interface ColumnPreset { id: string; label: string; ratios: number[]; }

const COLUMN_PRESETS: ColumnPreset[] = [
  { id: "full",    label: "Full width",  ratios: [1]       },
  { id: "1-1",     label: "½ + ½",       ratios: [1, 1]    },
  { id: "1-1-1",   label: "⅓ × 3",       ratios: [1, 1, 1] },
  { id: "1-1-1-1", label: "¼ × 4",       ratios: [1,1,1,1] },
  { id: "1-2",     label: "⅓ + ⅔",       ratios: [1, 2]    },
  { id: "2-1",     label: "⅔ + ⅓",       ratios: [2, 1]    },
  { id: "1-3",     label: "¼ + ¾",       ratios: [1, 3]    },
  { id: "3-1",     label: "¾ + ¼",       ratios: [3, 1]    },
  { id: "1-2-1",   label: "¼ + ½ + ¼",   ratios: [1, 2, 1] },
  { id: "2-1-1",   label: "½ + ¼ + ¼",   ratios: [2, 1, 1] },
  { id: "1-1-2",   label: "¼ + ¼ + ½",   ratios: [1, 1, 2] },
  { id: "1-2-3",   label: "⅙ + ⅓ + ½",   ratios: [1, 2, 3] },
  { id: "3-2-1",   label: "½ + ⅓ + ⅙",   ratios: [3, 2, 1] },
];

function PresetIcon({ ratios, active }: { ratios: number[]; active?: boolean }) {
  return (
    <div className="flex gap-0.5 w-full h-6">
      {ratios.map((r, i) => (
        <div key={i} className={`rounded-sm transition-colors ${active ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`} style={{ flex: r }} />
      ))}
    </div>
  );
}

// Width adjuster (step 2 when creating or editing a section)
function WidthAdjuster({ preset, initialRatios, onConfirm, onBack }: {
  preset: ColumnPreset; initialRatios: number[];
  onConfirm: (ratios: number[]) => void; onBack: () => void;
}) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const [ratios, setRatios] = useState(initialRatios);
  const total = ratios.reduce((a, b) => a + b, 0);
  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <button onClick={onBack} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
          <ArrowLeft className="w-3 h-3" /> {tr("Geri", "Back")}
        </button>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{tr("Sütun genişliklərini tənzimlə", "Adjust column widths")}</span>
      </div>

      <div className="flex gap-0.5 h-10 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        {ratios.map((r, i) => (
          <div key={i} className="flex items-center justify-center text-white text-[10px] font-bold bg-green-500 transition-all" style={{ flex: r }}>
            {Math.round((r / total) * 100)}%
          </div>
        ))}
      </div>

      <div className="space-y-2.5">
        {ratios.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 w-10 flex-shrink-0">{tr("Sütun", "Col")} {i + 1}</span>
            <input
              type="range" min={1} max={9} step={1} value={r}
              onChange={e => setRatios(prev => prev.map((v, j) => j === i ? Number(e.target.value) : v))}
              className="flex-1 accent-green-600"
            />
            <span className="text-[10px] font-mono text-gray-600 dark:text-gray-400 w-7 text-right flex-shrink-0">
              {Math.round((r / total) * 100)}%
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={() => onConfirm(ratios)}
        className="w-full py-2 text-xs font-semibold bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
      >
        {tr("Bölmə Yarat", "Create Section")}
      </button>
    </div>
  );
}

// ─── Static data ──────────────────────────────────────────────────────────────

const TEMPLATES = [
  {
    id: "minimal", name: "Minimal",
    bg: "bg-gray-50", nav: "bg-white border-b border-gray-200", accent: "#16a34a",
    // Sharp, clean, Swiss-grid feel
    btnRadius: "rounded-lg", cardRadius: "rounded-xl", imgRadius: "rounded-xl",
    fontHeading: "font-sans", fontBody: "font-sans",
    cardShadow: "shadow-sm", spacing: "normal",
    navStyle: "flat", badgeRadius: "rounded-md",
  },
  {
    id: "dark", name: "Dark",
    bg: "bg-gray-950", nav: "bg-gray-900 border-b border-gray-800", accent: "#22c55e",
    // Sleek, tech, angular edges
    btnRadius: "rounded-md", cardRadius: "rounded-lg", imgRadius: "rounded-lg",
    fontHeading: "font-mono", fontBody: "font-sans",
    cardShadow: "shadow-lg shadow-black/40", spacing: "normal",
    navStyle: "flat", badgeRadius: "rounded-sm",
  },
  {
    id: "elegant", name: "Elegant",
    bg: "bg-stone-50", nav: "bg-white border-b border-stone-100", accent: "#a16207",
    // Soft, luxury, serif headings, pill shapes, generous spacing
    btnRadius: "rounded-full", cardRadius: "rounded-3xl", imgRadius: "rounded-2xl",
    fontHeading: "font-serif", fontBody: "font-sans",
    cardShadow: "shadow-md shadow-stone-200/60", spacing: "loose",
    navStyle: "serif", badgeRadius: "rounded-full",
  },
  {
    id: "vibrant", name: "Vibrant",
    bg: "bg-white", nav: "bg-white border-b-4 border-emerald-400", accent: "#7c3aed",
    // Bold, expressive, chunky borders, heavy font weight, square-ish
    btnRadius: "rounded-2xl", cardRadius: "rounded-2xl", imgRadius: "rounded-xl",
    fontHeading: "font-black", fontBody: "font-medium",
    cardShadow: "shadow-[4px_4px_0px_0px_rgba(124,58,237,0.3)]", spacing: "normal",
    navStyle: "bold", badgeRadius: "rounded-lg",
  },
];
const CATEGORIES = [
  { id: "cat-1", name: "Electronics" }, { id: "cat-2", name: "Clothing" },
  { id: "cat-3", name: "Home & Garden" }, { id: "cat-4", name: "Sports" }, { id: "cat-5", name: "Beauty" },
];
const PRODUCTS = [
  { id: "p1", name: "Wireless Headphones", price: 129.99, originalPrice: 159.99, category: "cat-1", badge: "Best Seller", rating: 4.8, reviews: 312, image: "https://images.unsplash.com/photo-1612858249937-1cc0852093dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80" },
  { id: "p2", name: "Running Shoes",       price: 89.99,  originalPrice: 119.99, category: "cat-4", badge: "New",         rating: 4.6, reviews: 187, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80" },
  { id: "p3", name: "Ceramic Mug Set",     price: 34.99,  originalPrice: null,   category: "cat-3", badge: "",           rating: 4.9, reviews: 94,  image: "https://images.unsplash.com/photo-1616241673347-67fb5dfa3167?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80" },
  { id: "p4", name: "Yoga Mat",            price: 49.99,  originalPrice: 64.99,  category: "cat-4", badge: "Sale",        rating: 4.7, reviews: 256, image: "https://images.unsplash.com/photo-1637157216470-d92cd2edb2e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80" },
  { id: "p5", name: "Sunscreen SPF 50",    price: 19.99,  originalPrice: null,   category: "cat-5", badge: "",           rating: 4.5, reviews: 430, image: "https://images.unsplash.com/photo-1623676714504-edd78728155e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80" },
  { id: "p6", name: "Smart Watch",         price: 249.99, originalPrice: 299.99, category: "cat-1", badge: "Hot",         rating: 4.8, reviews: 521, image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80" },
  { id: "p7", name: "Linen Shirt",         price: 59.99,  originalPrice: null,   category: "cat-2", badge: "New",         rating: 4.4, reviews: 68,  image: "https://images.unsplash.com/photo-1740711152088-88a009e877bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80" },
  { id: "p8", name: "Desk Lamp",           price: 44.99,  originalPrice: 54.99,  category: "cat-3", badge: "Sale",        rating: 4.6, reviews: 143, image: "https://images.unsplash.com/photo-1667312939978-64cf31718a6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80" },
];
const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "epoint", name: "Epoint",            icon: "💳", enabled: false },
  { id: "cod",    name: "Cash on Delivery",  icon: "💵", enabled: true  },
];
const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram",   placeholder: "https://instagram.com/yourstore", color: "#e1306c" },
  { key: "facebook",  label: "Facebook",    placeholder: "https://facebook.com/yourstore",  color: "#1877f2" },
  { key: "twitter",   label: "X / Twitter", placeholder: "https://x.com/yourstore",         color: "#000000" },
  { key: "tiktok",    label: "TikTok",      placeholder: "https://tiktok.com/@yourstore",   color: "#010101" },
  { key: "youtube",   label: "YouTube",     placeholder: "https://youtube.com/@yourstore",  color: "#ff0000" },
  { key: "linkedin",  label: "LinkedIn",    placeholder: "https://linkedin.com/company/x", color: "#0a66c2" },
];

const BLOCK_META: Record<BlockType, { icon: React.ReactNode; label: string; description: string }> = {
  "hero":              { icon: <ImageIcon className="w-3.5 h-3.5" />,      label: "Hero Banner",     description: "Full-width hero with CTA" },
  "featured-products": { icon: <ShoppingBag className="w-3.5 h-3.5" />,   label: "Products",        description: "Product grid" },
  "category-grid":     { icon: <Layers className="w-3.5 h-3.5" />,        label: "Category Grid",   description: "Visual category navigation" },
  "banner":            { icon: <Tag className="w-3.5 h-3.5" />,           label: "Promo Banner",    description: "Announcement strip" },
  "testimonials":      { icon: <Star className="w-3.5 h-3.5" />,          label: "Testimonials",    description: "Customer reviews" },
  "custom-html":       { icon: <AlignLeft className="w-3.5 h-3.5" />,     label: "Custom HTML",     description: "Raw HTML / embed" },
  "image-block":       { icon: <ImageIcon className="w-3.5 h-3.5" />,     label: "Image",           description: "Image with caption" },
  "image-text":        { icon: <Layout className="w-3.5 h-3.5" />,        label: "Image + Text",    description: "Image beside text and CTA" },
  "whatsapp-widget":   { icon: <MessageCircle className="w-3.5 h-3.5" />, label: "WhatsApp Widget", description: "Floating chat button" },
  "reservation":       { icon: <CalendarDays className="w-3.5 h-3.5" />, label: "Reservation",     description: "Booking widget from your reservations" },
  "socials":           { icon: <Link2 className="w-3.5 h-3.5" />,         label: "Social Links",    description: "Social profile links" },
};

const BLOCK_GROUPS = [
  { label: "Content", types: ["hero", "banner", "image-block", "image-text"] as BlockType[] },
  { label: "Store",   types: ["featured-products", "category-grid"] as BlockType[] },
  { label: "Engage",  types: ["testimonials", "socials", "whatsapp-widget", "reservation"] as BlockType[] },
  { label: "Custom",  types: ["custom-html"] as BlockType[] },
];

const BLOCK_META_AZ: Record<BlockType, { label: string; description: string }> = {
  "hero":              { label: "Hero Banneri",      description: "CTA ilə tam enli hero" },
  "featured-products": { label: "Məhsullar",         description: "Məhsul şəbəkəsi" },
  "category-grid":     { label: "Kateqoriya Şəbəkəsi", description: "Vizual kateqoriya naviqasiyası" },
  "banner":            { label: "Promo Banneri",     description: "Elan zolağı" },
  "testimonials":      { label: "Rəylər",            description: "Müştəri rəyləri" },
  "custom-html":       { label: "Xüsusi HTML",       description: "HTML / embed kodu" },
  "image-block":       { label: "Şəkil",             description: "Başlıqlı şəkil" },
  "image-text":        { label: "Şəkil + Mətn",      description: "Şəkil və mətn yanı-yana" },
  "whatsapp-widget":   { label: "WhatsApp Düyməsi",  description: "Üzən söhbət düyməsi" },
  "reservation":       { label: "Rezervasiya",       description: "Rezervasiya formu" },
  "socials":           { label: "Sosial Linklər",    description: "Sosial media linkləri" },
};

const BLOCK_GROUPS_AZ = [
  { label: "Məzmun",  types: ["hero", "banner", "image-block", "image-text"] as BlockType[] },
  { label: "Mağaza",  types: ["featured-products", "category-grid"] as BlockType[] },
  { label: "Cəlbetmə", types: ["testimonials", "socials", "whatsapp-widget", "reservation"] as BlockType[] },
  { label: "Xüsusi",  types: ["custom-html"] as BlockType[] },
];

const DEFAULT_HEADER_LINKS: HeaderLink[] = [
  { id: "h1", label: "Home", href: "/" },
  { id: "h2", label: "Shop", href: "/shop" },
  { id: "h3", label: "About", href: "/about" },
];

const uid = () => Math.random().toString(36).slice(2, 9);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveProducts(src?: ProductSource) {
  if (!src) return PRODUCTS.slice(0, 4);
  if (src.mode === "category" && src.categoryId) return PRODUCTS.filter(p => p.category === src.categoryId).slice(0, src.limit);
  if (src.mode === "specific" && src.productIds.length) return PRODUCTS.filter(p => src.productIds.includes(p.id)).slice(0, src.limit);
  return PRODUCTS.slice(0, src.limit || 4);
}

const IMG_H: Record<string, string> = { sm: "h-24", md: "h-44", lg: "h-64" };
const PAD: Record<string, string> = { none: "py-0 px-0", sm: "py-2 px-2", md: "py-5 px-3", lg: "py-10 px-4" };
const GAP_CLS: Record<string, string> = { sm: "gap-1", md: "gap-3", lg: "gap-5" };

function makeBlock(type: BlockType): Block {
  const base: Block = { id: uid(), type, label: BLOCK_META[type].label, visible: true };
  if (type === "featured-products") return { ...base, productSource: { mode: "all", categoryId: "", productIds: [], limit: 4, title: "Featured Products" } };
  if (type === "hero")              return { ...base, heading: "Your Headline", subheading: "Add your subheading here.", ctaText: "Shop Now", ctaColor: "#16a34a", bgColor: "#f0fdf4" };
  if (type === "banner")            return { ...base, bannerText: "Summer Sale — Up to 40% Off", bannerSubtext: "Limited time offer. Shop now before it ends.", bannerBg: "#0f172a", ctaText: "Shop the Sale", ctaColor: "#16a34a" };
  if (type === "newsletter")        return { ...base, newsletterHeading: "Stay in the loop", newsletterPlaceholder: "Enter your email" };
  if (type === "image-block")       return { ...base, imageHeight: "md" };
  if (type === "image-text")        return { ...base, imageHeight: "md", imagePosition: "left", heading: "Section Title", subheading: "Tell your brand story.", ctaText: "Learn more", ctaColor: "#16a34a" };
  if (type === "whatsapp-widget")   return { ...base, waNumber: "", waMessage: "Hello! I have a question.", waLabel: "Chat with us" };
  if (type === "socials")           return { ...base, socialLinks: {} };
  if (type === "reservation")       return { ...base, reservationTitle: "Make a Reservation", reservationSubtext: "Book your spot in just a few clicks.", reservationServices: ["Table for 2", "Table for 4", "Private Room"], reservationShowGuests: true, reservationShowNotes: true };
  return base;
}

function makeRow(ratios: number[], presetId: string): RowItem {
  return {
    kind: "row", id: uid(), label: "New Section", visible: true,
    preset: presetId, padding: "md", gap: "md", bgColor: "",
    columns: ratios.map(ratio => ({ id: uid(), ratio, blocks: [] })),
  };
}

const DEFAULT_CONTENT: ContentItem[] = [
  {
    id: "b1", type: "hero", label: "Hero", visible: true,
    heading: "Shop the Latest Collection", subheading: "Free shipping on orders over $50. New arrivals every week.",
    ctaText: "Shop Now", ctaColor: "#16a34a", bgColor: "#0f172a",
  },
  {
    id: "b2", type: "featured-products", label: "Best Sellers", visible: true,
    productSource: { mode: "all", categoryId: "", productIds: [], limit: 8, title: "Best Sellers" },
  },
  {
    id: "banner1", type: "banner", label: "Promo Banner", visible: true,
    bannerText: "🔥 Summer Sale — Up to 40% Off",
    bannerSubtext: "Limited time offer. Use code SUMMER at checkout.",
    bannerBg: "#0f172a", ctaText: "Claim Offer", ctaColor: "#16a34a",
  },
  { id: "b3", type: "category-grid", label: "Shop by Category", visible: true },
  { id: "b4", type: "testimonials", label: "Testimonials", visible: true },
  { id: "b6", type: "whatsapp-widget", label: "WhatsApp", visible: true, waNumber: "", waMessage: "Hi! I need help with my order.", waLabel: "Need help?" },
  { id: "b7", type: "socials", label: "Social Links", visible: true, socialLinks: {} },
];

// ─── Social Platform Icons (inline SVG) ──────────────────────────────────────

function SocialIcon({ platform, size = 16, color = "currentColor" }: { platform: string; size?: number; color?: string }) {
  const s = size;
  switch (platform) {
    case "instagram":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke={color} strokeWidth="2"/>
          <circle cx="12" cy="12" r="4" stroke={color} strokeWidth="2"/>
          <circle cx="17.5" cy="6.5" r="1.2" fill={color}/>
        </svg>
      );
    case "facebook":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={color}>
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
        </svg>
      );
    case "twitter":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={color}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      );
    case "tiktok":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={color}>
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.16 8.16 0 0 0 4.77 1.52V6.75a4.85 4.85 0 0 1-1-.06z"/>
        </svg>
      );
    case "youtube":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={color}>
          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
          <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/>
        </svg>
      );
    case "linkedin":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={color}>
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
          <rect x="2" y="9" width="4" height="12"/>
          <circle cx="4" cy="4" r="2"/>
        </svg>
      );
    default:
      return <Link2 width={s} height={s} color={color} />;
  }
}

// ─── Image Uploader ───────────────────────────────────────────────────────────

function ImageUploader({ value, onChange, aspectHint }: {
  value?: string;
  onChange: (dataUrl: string) => void;
  aspectHint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onChange(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group">
          <img src={value} alt="" className="w-full h-28 object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 group-hover:bg-black/50 transition-all">
            <button
              onClick={() => inputRef.current?.click()}
              className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white text-xs font-medium text-gray-700 shadow-sm transition-opacity"
            >
              <Upload className="w-3 h-3" /> Replace
            </button>
            <button
              onClick={() => onChange("")}
              className="opacity-0 group-hover:opacity-100 px-2.5 py-1.5 rounded-lg bg-red-500 text-xs font-medium text-white shadow-sm transition-opacity"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full h-28 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-2 hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50/40 dark:hover:bg-green-900/10 transition-all text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400"
        >
          <Upload className="w-5 h-5" />
          <span className="text-xs font-medium">Click to upload image</span>
          {aspectHint && <span className="text-[10px] text-gray-300 dark:text-gray-600">{aspectHint}</span>}
        </button>
      )}
    </div>
  );
}

// ─── Drop Indicator ───────────────────────────────────────────────────────────

function DropLine({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="relative h-0.5 my-1 z-30 pointer-events-none">
      <div className="absolute inset-0 bg-blue-500 rounded-full" />
      <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white shadow" />
    </div>
  );
}

// ─── Preview Block ────────────────────────────────────────────────────────────

function PreviewBlock({
  block, config, selected, onClick, viewport, compact,
  onDragStart, onDragOver, onDragEnd, onDelete,
  isDragging, dropBefore, dropAfter,
}: {
  block: Block; config: WebsiteConfig; selected: boolean; onClick: () => void;
  viewport: "desktop" | "mobile"; compact?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent, pos: "before" | "after") => void;
  onDragEnd?: () => void;
  onDelete?: () => void;
  isDragging?: boolean;
  dropBefore?: boolean;
  dropAfter?: boolean;
}) {
  const _baseTmpl = TEMPLATES.find(t => t.id === config.template) ?? TEMPLATES[0];
  const tmpl = { ..._baseTmpl, accent: config.accentColor || _baseTmpl.accent };
  const isDark = config.template === "dark";
  const textBase = isDark ? "text-white" : "text-gray-900";
  const textMuted = isDark ? "text-gray-400" : "text-gray-500";
  const cardBg = isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const ring = selected ? "ring-2 ring-green-500 ring-offset-1" : "ring-1 ring-transparent hover:ring-green-300 hover:ring-offset-1";
  const opacityCls = isDragging ? "opacity-25 scale-95" : "";
  const isElegant = config.template === "elegant";
  const isVibrant = config.template === "vibrant";
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);

  if (!block.visible || block.type === "whatsapp-widget") return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    onDragOver?.(e, e.clientY < rect.top + rect.height / 2 ? "before" : "after");
  };

  const dragHandlers = onDragStart ? {
    draggable: true as const,
    onDragStart,
    onDragOver: handleDragOver,
    onDragEnd,
  } : {};

  const wrap = `relative cursor-pointer ${tmpl.cardRadius} transition-all ${ring} ${opacityCls} group select-none`;

  const Overlay = () => (
    <>
      {/* Drag handle — left */}
      {onDragStart && (
        <div className="absolute top-1/2 -translate-y-1/2 left-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500 pointer-events-none">
          <GripVertical className="w-3 h-3" />
        </div>
      )}
      {/* Right controls row */}
      <div className={`absolute top-1.5 right-1.5 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 ${selected ? "opacity-100" : ""} transition-opacity`}>
        {onDelete && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="p-1 rounded-md bg-white/80 dark:bg-gray-800/80 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 shadow-sm backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 transition-colors"
            title="Remove block"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        )}
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-green-500 text-white text-[9px] font-medium shadow-sm pointer-events-none">
          <Settings2 className="w-2 h-2" /> Edit
        </div>
      </div>
    </>
  );

  switch (block.type) {
    case "hero": {
      const hasHeroImg = !!block.imageUrl;
      const heroBg = block.bgColor || "#0f172a";
      const heroTxt = block.textColor || "#ffffff";
      const heroSub = heroTxt + "bf"; // ~75% opacity via hex alpha
      const overlayAlpha = Math.round(((block.overlayOpacity ?? 70) / 100) * 255).toString(16).padStart(2, "0");
      return (
        <>
          <DropLine active={!!dropBefore} />
          <div className={`${wrap} overflow-hidden`} onClick={onClick} {...dragHandlers} style={!hasHeroImg ? { background: `${heroBg}${overlayAlpha}` } : undefined}>
            {hasHeroImg && (
              <>
                <img src={block.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: `${heroBg}${overlayAlpha}` }} />
              </>
            )}
            <Overlay />
            <div className={`relative text-center ${compact ? "py-8 px-4" : viewport === "mobile" ? "py-10 px-4" : isElegant ? "py-20 px-12" : "py-16 px-8"}`}>
              {isElegant && !compact && <p className="text-xs tracking-[0.25em] uppercase mb-3 opacity-70" style={{color:heroTxt}}>Yeni Kolleksiya</p>}
              <h1 className={`${tmpl.fontHeading} ${isElegant?"font-light tracking-wide":isVibrant?"font-black":"font-bold"} mb-2 leading-tight ${compact ? "text-xl" : viewport === "mobile" ? "text-2xl" : isElegant?"text-5xl":"text-4xl"}`} style={{ color: heroTxt }}>
                {block.heading || "Ən Son Kolleksiyaya Baxın"}
              </h1>
              <p className={`mb-5 ${compact ? "text-xs" : isElegant?"text-sm tracking-wide":"text-sm"}`} style={{ color: heroSub }}>
                {block.subheading || "50 ₼-dən yuxarı sifarişlərə pulsuz çatdırılma."}
              </p>
              {isVibrant && !compact && <div className="w-12 h-1 mx-auto mb-4 rounded-full" style={{background:block.ctaColor||tmpl.accent}}/>}
              <button className={`${tmpl.btnRadius} font-semibold shadow-lg ${compact ? "px-4 py-1.5 text-xs" : isElegant?"px-10 py-3 text-sm tracking-widest uppercase":"px-6 py-2.5 text-sm"}`} style={{ background: block.ctaColor || tmpl.accent, color: block.ctaBtnTextColor || "#ffffff" }}>
                {block.ctaText || "İndi Al"}
              </button>
            </div>
          </div>
          <DropLine active={!!dropAfter} />
        </>
      );
    }

    case "featured-products": {
      const src = block.productSource;
      const userCols = src?.columns ?? 4;
      const userRows = src?.rows ?? 1;
      const maxProducts = compact ? 2 : userCols * userRows;
      const products = resolveProducts({ ...src, mode: src?.mode ?? "all", categoryId: src?.categoryId ?? "", productIds: src?.productIds ?? [], limit: maxProducts, title: src?.title ?? "" });
      const colsMap: Record<number,string> = {2:"grid-cols-2",3:"grid-cols-3",4:"grid-cols-4",5:"grid-cols-5",6:"grid-cols-6"};
      const colsClass = compact ? "grid-cols-2" : viewport === "mobile" ? "grid-cols-3" : (colsMap[userCols] ?? "grid-cols-4");
      const visibleProducts = products.slice(0, maxProducts);
      return (
        <>
          <DropLine active={!!dropBefore} />
          <div className={wrap} onClick={onClick} {...dragHandlers}>
            <Overlay />
            <div className={compact ? "py-4 px-3" : viewport === "mobile" ? "py-4 px-3" : "py-8 px-5"}>
              <div className="flex items-center justify-between mb-3">
                <p className={`font-bold ${compact || viewport === "mobile" ? "text-xs" : "text-base"} ${textBase}`}>{block.productSource?.title || "Seçilmiş Məhsullar"}</p>
                {!compact && <span className="text-[10px] font-medium px-2 py-1 rounded-full border" style={{ color: tmpl.accent, borderColor: tmpl.accent + "44" }}>Hamısına bax →</span>}
              </div>
              <div className={`grid ${colsClass} ${viewport === "mobile" ? "gap-2" : "gap-3"}`}>
                {visibleProducts.map(p => {
                  const isHovered = hoveredProductId === p.id;
                  const isMobile = viewport === "mobile";
                  return (
                  <div key={p.id}
                    onMouseEnter={() => setHoveredProductId(p.id)}
                    onMouseLeave={() => setHoveredProductId(null)}
                    className={`${tmpl.cardRadius} overflow-hidden border ${isVibrant?"border-2 border-purple-200":"border"} ${isDark ? "border-gray-700/60 bg-gray-800/60" : isElegant?"border-stone-200/60 bg-white":"border-gray-100 bg-white"} ${tmpl.cardShadow} ${isHovered?"shadow-lg":""} transition-all duration-200`}>
                    {/* Image — always square */}
                    <div className={`relative overflow-hidden aspect-square ${isDark ? "bg-gray-700" : isElegant?"bg-stone-50":"bg-gray-50"}`}>
                      <img src={p.image} alt={p.name} className={`w-full h-full object-cover transition-transform duration-300 ${isHovered?"scale-105":""}`} loading="lazy" />
                      {p.originalPrice && (
                        <span className={`absolute top-1.5 right-1.5 text-[7px] font-bold px-1 py-0.5 bg-red-500 text-white ${tmpl.badgeRadius}`}>
                          -{Math.round((1 - p.price / p.originalPrice) * 100)}%
                        </span>
                      )}
                      {/* Hover CTA — icon-only on mobile, text on desktop */}
                      {!compact && (
                        <div className={`absolute inset-0 flex items-end justify-center pb-2 transition-opacity duration-200 ${isHovered?"opacity-100":"opacity-0"}`}>
                          {isMobile ? (
                            <button className={`flex items-center justify-center w-7 h-7 ${tmpl.btnRadius} text-white shadow-lg`} style={{ background: tmpl.accent }}>
                              <ShoppingCart className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button className={`flex items-center gap-1 px-3 py-1.5 ${tmpl.btnRadius} text-white text-[9px] font-semibold shadow-lg`} style={{ background: tmpl.accent }}>
                              <ShoppingCart className="w-2.5 h-2.5" /> {isElegant ? "Çantaya Əlavə Et" : "Səbətə Əlavə Et"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className={`${compact ? "p-1.5" : isMobile ? "p-1.5" : isElegant?"p-3.5":"p-3"} space-y-0.5`}>
                      <p className={`${isElegant?"font-normal tracking-wide":isVibrant?"font-extrabold":"font-semibold"} leading-tight line-clamp-2 ${compact || isMobile ? "text-[9px]" : "text-xs"} ${textBase}`}>{p.name}</p>
                      {/* Stars — only on desktop */}
                      {!compact && !isMobile && (
                        <div className="flex items-center gap-1">
                          <div className="flex items-center gap-0.5">
                            {Array.from({length:5}).map((_,i)=>(
                              <Star key={i} className={`w-2 h-2 ${i < Math.floor(p.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}`} />
                            ))}
                          </div>
                          <span className={`text-[9px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>({p.reviews})</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className={`${isElegant?"font-light tracking-wide":isVibrant?"font-black":"font-bold"} ${compact || isMobile ? "text-[10px]" : "text-xs"}`} style={{ color: tmpl.accent }}>{p.price} ₼</span>
                        {p.originalPrice && <span className={`text-[8px] line-through ${isDark ? "text-gray-500" : "text-gray-400"}`}>{p.originalPrice} ₼</span>}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DropLine active={!!dropAfter} />
        </>
      );
    }

    case "category-grid": {
      const catAccentPalette = ["#16a34a","#2563eb","#dc2626","#9333ea","#ea580c","#0891b2"];
      return (
        <>
          <DropLine active={!!dropBefore} />
          <div className={wrap} onClick={onClick} {...dragHandlers}>
            <Overlay />
            <div className={compact ? "py-4 px-3" : "py-8 px-4"}>
              <div className="flex items-center justify-between mb-3">
                <p className={`font-bold text-xs ${textBase}`}>Kateqoriyaya görə Axtar</p>
                {!compact && <span className="text-[10px] font-medium" style={{color:tmpl.accent}}>Bütün kateqoriyalar →</span>}
              </div>
              <div className={`grid gap-2 ${{2:"grid-cols-2",3:"grid-cols-3",4:"grid-cols-4",5:"grid-cols-5",6:"grid-cols-6"}[compact||viewport==="mobile" ? 2 : (block.categoryColumns??3)]??"grid-cols-3"}`}>
                {CATEGORIES.slice(0, compact ? 2 : viewport === "mobile" ? 4 : CATEGORIES.length).map((c, i) => {
                  const accent = catAccentPalette[i % catAccentPalette.length];
                  return (
                    <div key={c.id} className={`${tmpl.cardRadius} border overflow-hidden cursor-pointer group transition-all hover:shadow-md ${isDark ? "border-gray-700" : "border-gray-100"}`}>
                      <div className="h-1.5" style={{background: accent}} />
                      <div className={`px-3 ${compact ? "py-2" : "py-3"} ${isDark ? "bg-gray-800" : "bg-white"}`}>
                        <p className={`font-semibold ${compact ? "text-[9px]" : "text-xs"} ${textBase} group-hover:opacity-80 transition-opacity`}>{c.name}</p>
                        {!compact && (
                          <p className={`text-[9px] mt-0.5 ${textMuted}`}>
                            {PRODUCTS.filter(p => p.category === c.id).length} məhsul
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DropLine active={!!dropAfter} />
        </>
      );
    }

    case "banner": {
      const hasBannerImg = !!block.bannerImageUrl;
      const bannerBg = block.bannerBg || "#0f172a";
      const bannerTxt = block.textColor || "#ffffff";
      const bannerSubTxt = bannerTxt + "cc";
      const overlayAlpha = Math.round(((block.overlayOpacity ?? 75) / 100) * 255).toString(16).padStart(2, "0");
      return (
        <>
          <DropLine active={!!dropBefore} />
          <div className={`${wrap} overflow-hidden`} onClick={onClick} {...dragHandlers} style={!hasBannerImg ? { background: `${bannerBg}${overlayAlpha}` } : undefined}>
            {hasBannerImg && (
              <>
                <img src={block.bannerImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: `${bannerBg}${overlayAlpha}` }} />
              </>
            )}
            {!hasBannerImg && (
              <div className="absolute inset-0 overflow-hidden opacity-10">
                <div className="absolute -top-4 -right-4 w-32 h-32 rounded-full bg-white/20" />
                <div className="absolute -bottom-6 -left-6 w-40 h-40 rounded-full bg-white/10" />
              </div>
            )}
            <Overlay />
            <div className={`relative flex flex-col items-center text-center ${compact ? "py-6 px-4 gap-2" : "py-10 px-8 gap-3"}`}>
              <p className={`font-bold drop-shadow ${compact ? "text-base" : "text-xl"} leading-tight`} style={{ color: bannerTxt }}>
                {block.bannerText || "Yay Endirimləri — 40%-ə qədər"}
              </p>
              {block.bannerSubtext && (
                <p className={`${compact ? "text-[10px]" : "text-xs"}`} style={{ color: bannerSubTxt }}>{block.bannerSubtext}</p>
              )}
              {block.ctaText && (
                <button
                  className={`mt-1 font-semibold rounded-lg shadow-md ${compact ? "px-3 py-1 text-[10px]" : "px-5 py-2 text-xs"}`}
                  style={{ background: block.ctaColor || "#16a34a", color: block.ctaBtnTextColor || "#ffffff" }}
                >
                  {block.ctaText}
                </button>
              )}
            </div>
          </div>
          <DropLine active={!!dropAfter} />
        </>
      );
    }

    case "testimonials": {
      const defaultReviews = [
        { name: "Sarah M.", text: "Great quality! Arrived fast and looks exactly as pictured.", rating: 5 },
        { name: "James K.", text: "Very happy with my purchase. Will definitely order again.", rating: 5 },
        { name: "Leila A.", text: "Excellent service and packaging. Highly recommend this store.", rating: 4 },
      ];
      const reviews = (block.testimonialItems && block.testimonialItems.length > 0) ? block.testimonialItems : defaultReviews;
      const shown = compact ? reviews.slice(0, 1) : viewport === "mobile" ? reviews.slice(0, 2) : reviews;
      return (
        <>
          <DropLine active={!!dropBefore} />
          <div className={wrap} onClick={onClick} {...dragHandlers}>
            <Overlay />
            <div className={compact ? "py-4 px-3" : "py-8 px-4"}>
              <p className={`font-bold text-xs mb-3 ${textBase}`}>Müştərilərimiz nə deyir</p>
              <div className={`grid gap-2 ${compact || viewport === "mobile" ? "grid-cols-1" : "grid-cols-3"}`}>
                {shown.map((r, i) => (
                  <div key={i} className={`${tmpl.cardRadius} border p-3 ${cardBg} ${tmpl.cardShadow}`}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" style={{background:tmpl.accent}}>{r.name[0]}</div>
                      <span className={`text-[10px] font-semibold ${textBase}`}>{r.name}</span>
                    </div>
                    <div className="flex gap-0.5 mb-1.5">
                      {[0,1,2,3,4].map(s => <Star key={s} className={`w-2.5 h-2.5 ${s < r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />)}
                    </div>
                    <p className={`text-[10px] leading-relaxed ${textMuted}`}>"{r.text}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DropLine active={!!dropAfter} />
        </>
      );
    }

    case "custom-html":
      return (
        <>
          <DropLine active={!!dropBefore} />
          <div className={wrap} onClick={onClick} {...dragHandlers}>
            <Overlay />
            <div className="py-5 px-4 text-center">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs ${cardBg} ${textMuted}`}>
                <AlignLeft className="w-3 h-3" /> Custom HTML Block
              </div>
            </div>
          </div>
          <DropLine active={!!dropAfter} />
        </>
      );

    case "image-block": {
      const h = compact ? "h-28" : IMG_H[block.imageHeight || "md"];
      return (
        <>
          <DropLine active={!!dropBefore} />
          <div className={wrap} onClick={onClick} {...dragHandlers}>
            <Overlay />
            {block.imageUrl
              ? <img src={block.imageUrl} alt={block.imageAlt || ""} className={`w-full ${h} object-cover rounded-lg`} />
              : <div className={`w-full ${h} flex flex-col items-center justify-center gap-2 rounded-lg ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
                  <ImageIcon className={`w-6 h-6 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
                  <p className={`text-[10px] ${textMuted}`}>Set image URL</p>
                </div>
            }
            {block.imageCaption && <p className={`text-center text-[10px] py-1.5 px-2 ${textMuted}`}>{block.imageCaption}</p>}
          </div>
          <DropLine active={!!dropAfter} />
        </>
      );
    }

    case "image-text": {
      const isRight = block.imagePosition === "right";
      const h = compact ? "h-20" : IMG_H[block.imageHeight || "md"];
      const imgEl = block.imageUrl
        ? <img src={block.imageUrl} alt={block.imageAlt || ""} className={`w-full ${h} object-cover rounded-lg`} />
        : <div className={`w-full ${h} flex items-center justify-center rounded-lg ${isDark ? "bg-gray-800" : "bg-gray-100"}`}><ImageIcon className={`w-5 h-5 ${isDark ? "text-gray-600" : "text-gray-300"}`} /></div>;
      const itTxt = block.textColor || (isDark ? "#ffffff" : "#111827");
      const itSub = block.textColor ? block.textColor + "99" : (isDark ? "#9ca3af" : "#6b7280");
      const textEl = (
        <div className="flex flex-col justify-center gap-2">
          <h3 className={`font-bold ${compact ? "text-sm" : "text-base"} leading-snug`} style={{ color: itTxt }}>{block.heading || "Section Title"}</h3>
          <p className="text-xs" style={{ color: itSub }}>{block.subheading || "Supporting description."}</p>
          {block.ctaText && <button className="self-start px-3 py-1 rounded-lg text-[10px] font-medium" style={{ background: block.ctaColor || tmpl.accent, color: block.ctaBtnTextColor || "#ffffff" }}>{block.ctaText}</button>}
        </div>
      );
      return (
        <>
          <DropLine active={!!dropBefore} />
          <div className={wrap} onClick={onClick} {...dragHandlers}>
            <Overlay />
            <div className={`grid ${compact || viewport === "mobile" ? "grid-cols-1" : "grid-cols-2"} gap-3 p-3`}>
              {isRight ? <>{textEl}{imgEl}</> : <>{imgEl}{textEl}</>}
            </div>
          </div>
          <DropLine active={!!dropAfter} />
        </>
      );
    }

    case "socials": {
      const links = block.socialLinks || {};
      const active = SOCIAL_PLATFORMS.filter(p => links[p.key]);
      const display = active.length > 0 ? active : SOCIAL_PLATFORMS.slice(0, 4);
      return (
        <>
          <DropLine active={!!dropBefore} />
          <div className={wrap} onClick={onClick} {...dragHandlers}>
            <Overlay />
            <div className={`text-center ${compact ? "py-3 px-3" : "py-6 px-4"}`}>
              <p className={`text-[10px] font-semibold mb-3 ${textBase}`}>Bizi izləyin</p>
              <div className="flex flex-wrap justify-center gap-2.5">
                {display.map(p => {
                  const isPlaceholder = active.length === 0;
                  return (
                    <div
                      key={p.key}
                      className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-transform hover:scale-110"
                      style={isPlaceholder
                        ? { background: "transparent", border: `2px solid ${p.color}` }
                        : { background: p.color }}
                      title={p.label}
                    >
                      <SocialIcon platform={p.key} size={15} color={isPlaceholder ? p.color : "#fff"} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DropLine active={!!dropAfter} />
        </>
      );
    }

    case "reservation": {
      const services = block.reservationServices ?? ["Table for 2", "Table for 4", "Private Room"];
      const resBg = isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100";
      const fieldCls = `w-full ${compact?"h-6 text-[9px]":"h-8 text-xs"} px-2 rounded-lg border ${isDark?"border-gray-600 bg-gray-700 text-gray-200":"border-gray-200 bg-gray-50 text-gray-700"} outline-none`;
      return (
        <>
          <DropLine active={!!dropBefore} />
          <div className={wrap} onClick={onClick} {...dragHandlers}>
            <Overlay />
            <div className={compact ? "py-4 px-3" : "py-8 px-5"}>
              {/* Header */}
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl mb-3" style={{background: tmpl.accent + "20"}}>
                  <CalendarDays className="w-5 h-5" style={{color: tmpl.accent}} />
                </div>
                <h3 className={`font-bold ${compact?"text-sm":"text-lg"} ${textBase}`}>{block.reservationTitle || "Rezervasiya Et"}</h3>
                {!compact && block.reservationSubtext && <p className={`text-xs mt-1 ${textMuted}`}>{block.reservationSubtext}</p>}
              </div>

              {/* Widget form */}
              <div className={`${tmpl.cardRadius} border p-4 ${resBg} ${tmpl.cardShadow} space-y-3`}>
                {/* Service selector */}
                <div>
                  <label className={`block text-[10px] font-semibold mb-1.5 ${textMuted} uppercase tracking-wide`}>Xidmət</label>
                  <div className="flex flex-wrap gap-1.5">
                    {services.slice(0, compact ? 2 : undefined).map((s, i) => (
                      <span key={i} className={`text-[10px] font-medium px-2.5 py-1 rounded-full border transition-colors ${i===0?"text-white border-transparent":"border-gray-200 dark:border-gray-600 " + textMuted}`}
                        style={i===0?{background:tmpl.accent}:{}}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {!compact && (
                  <>
                    {/* Date + Time */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={`block text-[10px] font-semibold mb-1 ${textMuted} uppercase tracking-wide`}>Tarix</label>
                        <div className={`${fieldCls} flex items-center gap-1.5`}>
                          <CalendarDays className="w-3 h-3 opacity-50 flex-shrink-0" />
                          <span className="opacity-50">Tarix seçin</span>
                        </div>
                      </div>
                      <div>
                        <label className={`block text-[10px] font-semibold mb-1 ${textMuted} uppercase tracking-wide`}>Vaxt</label>
                        <div className={`${fieldCls} flex items-center gap-1.5`}>
                          <Clock className="w-3 h-3 opacity-50 flex-shrink-0" />
                          <span className="opacity-50">Vaxt seçin</span>
                        </div>
                      </div>
                    </div>

                    {/* Guests */}
                    {block.reservationShowGuests !== false && (
                      <div>
                        <label className={`block text-[10px] font-semibold mb-1 ${textMuted} uppercase tracking-wide`}>Qonaqlar</label>
                        <div className={`${fieldCls} flex items-center gap-1.5`}>
                          <Users className="w-3 h-3 opacity-50 flex-shrink-0" />
                          <span className="opacity-50">Qonaq sayı</span>
                        </div>
                      </div>
                    )}

                    {/* Name + Contact */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={`block text-[10px] font-semibold mb-1 ${textMuted} uppercase tracking-wide`}>Ad</label>
                        <input className={fieldCls} placeholder="Adınız" readOnly />
                      </div>
                      <div>
                        <label className={`block text-[10px] font-semibold mb-1 ${textMuted} uppercase tracking-wide`}>Telefon</label>
                        <input className={fieldCls} placeholder="+994 ···" readOnly />
                      </div>
                    </div>

                    {/* Notes */}
                    {block.reservationShowNotes !== false && (
                      <div>
                        <label className={`block text-[10px] font-semibold mb-1 ${textMuted} uppercase tracking-wide`}>Qeydlər <span className="normal-case font-normal opacity-60">(istəyə bağlı)</span></label>
                        <div className={`w-full h-12 px-2 py-1.5 text-xs rounded-lg border ${isDark?"border-gray-600 bg-gray-700":"border-gray-200 bg-gray-50"} opacity-50 flex items-start`}>
                          <span className={textMuted}>Xüsusi istəkləriniz?</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <button className={`w-full py-2.5 ${tmpl.btnRadius} text-white text-xs font-bold shadow-md transition-opacity hover:opacity-90`} style={{background: tmpl.accent}}>
                  Rezervasiyanı Təsdiqlə
                </button>

                <p className={`text-center text-[9px] ${textMuted}`}>
                  Inflero Rezervasiyalarınıza bağlıdır — sifarişlər avtomatik sinxronlaşır.
                </p>
              </div>
            </div>
          </div>
          <DropLine active={!!dropAfter} />
        </>
      );
    }

    default: return null;
  }
}

// ─── Preview Column ───────────────────────────────────────────────────────────

function PreviewColumn({
  col, config, rowId, viewport,
  dropTarget, activeDragId,
  onBlockClick, onBlockDragStart, onBlockDragOver, onBlockDragEnd,
  onColumnDragOver, onColumnDrop, onColumnDragLeave,
  onDeleteBlock, onAddBlockClick,
  publicMode = false,
}: {
  col: ColumnItem; config: WebsiteConfig; rowId: string; viewport: "desktop" | "mobile";
  dropTarget: DropTarget | null; activeDragId: string | null;
  onBlockClick: (blockId: string) => void;
  onBlockDragStart: (e: React.DragEvent, blockId: string) => void;
  onBlockDragOver: (e: React.DragEvent, blockId: string, pos: "before" | "after") => void;
  onBlockDragEnd: () => void;
  onColumnDragOver: (e: React.DragEvent) => void;
  onColumnDrop: (e: React.DragEvent) => void;
  onColumnDragLeave: (e: React.DragEvent) => void;
  onDeleteBlock: (blockId: string) => void;
  onAddBlockClick: () => void;
  publicMode?: boolean;
}) {
  const isDark = config.template === "dark";
  const isColDropTarget = dropTarget?.rowId === rowId && dropTarget?.colId === col.id;
  const visibleBlocks = col.blocks.filter(b => b.visible && b.type !== "whatsapp-widget");

  return (
    <div
      className={`flex flex-col min-w-0 min-h-[60px] rounded-lg transition-all ${isColDropTarget ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}
      onDragOver={onColumnDragOver}
      onDrop={onColumnDrop}
      onDragLeave={onColumnDragLeave}
    >
      {visibleBlocks.length === 0 ? (
        publicMode ? (
          <div className="flex-1 min-h-[40px]" />
        ) : (
        <button
          onClick={onAddBlockClick}
          className={`flex-1 flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed min-h-[80px] transition-all ${
            isColDropTarget
              ? "border-blue-400 bg-blue-50/40 dark:bg-blue-900/10"
              : isDark ? "border-gray-700 hover:border-gray-500" : "border-gray-200 hover:border-green-400"
          }`}
        >
          <Plus className={`w-4 h-4 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
          <p className={`text-[10px] ${isDark ? "text-gray-600" : "text-gray-400"}`}>Add block</p>
        </button>
        )
      ) : (
        <div className="flex flex-col gap-1">
          <DropLine active={!!(isColDropTarget && dropTarget?.insertAt === 0)} />

          {col.blocks.map((block, bi) => {
            if (!block.visible || block.type === "whatsapp-widget") return null;
            const visIdx = visibleBlocks.indexOf(block);
            return (
              <PreviewBlock
                key={block.id}
                block={block}
                config={config}
                selected={false}
                onClick={() => onBlockClick(block.id)}
                viewport={viewport}
                compact
                isDragging={!publicMode && activeDragId === block.id}
                dropBefore={!publicMode && !!(isColDropTarget && dropTarget?.insertAt === visIdx)}
                dropAfter={!publicMode && !!(isColDropTarget && dropTarget?.insertAt === visIdx + 1)}
                onDragStart={publicMode ? undefined : e => onBlockDragStart(e, block.id)}
                onDragOver={publicMode ? undefined : (e, pos) => onBlockDragOver(e, block.id, pos)}
                onDragEnd={publicMode ? undefined : onBlockDragEnd}
                onDelete={publicMode ? undefined : () => onDeleteBlock(block.id)}
              />
            );
          })}

          <DropLine active={!!(isColDropTarget && dropTarget?.insertAt === visibleBlocks.length)} />

          {!publicMode && (
          <button
            onClick={onAddBlockClick}
            className={`flex items-center justify-center gap-1 py-1.5 rounded-lg border border-dashed text-[10px] transition-colors mt-0.5 ${isDark ? "border-gray-700 text-gray-600 hover:border-green-500 hover:text-green-400" : "border-gray-200 text-gray-300 hover:border-green-400 hover:text-green-600"}`}
          >
            <Plus className="w-3 h-3" /> Add block
          </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Preview Row ──────────────────────────────────────────────────────────────

function PreviewRow({
  row, config, isSelected, viewport,
  dropTarget, activeDragId,
  onSelectRow, onBlockClick,
  onBlockDragStart, onBlockDragOver, onBlockDragEnd,
  onColumnDragOver, onColumnDrop, onColumnDragLeave,
  onDeleteBlock,
  publicMode = false,
}: {
  row: RowItem; config: WebsiteConfig; isSelected: boolean;
  viewport: "desktop" | "mobile";
  dropTarget: DropTarget | null; activeDragId: string | null;
  onSelectRow: () => void;
  onBlockClick: (colId: string, blockId: string) => void;
  onBlockDragStart: (e: React.DragEvent, blockId: string, colId: string) => void;
  onBlockDragOver: (e: React.DragEvent, blockId: string, colId: string, pos: "before" | "after") => void;
  onBlockDragEnd: () => void;
  onColumnDragOver: (e: React.DragEvent, colId: string) => void;
  onColumnDrop: (e: React.DragEvent, colId: string) => void;
  onColumnDragLeave: (e: React.DragEvent) => void;
  onDeleteBlock: (blockId: string, colId: string) => void;
  publicMode?: boolean;
}) {
  if (!row.visible) return null;
  const padClass = PAD[row.padding || "md"];
  const gapClass = GAP_CLS[row.gap || "md"];
  const rowRing = publicMode ? "" : (isSelected ? "ring-2 ring-blue-500 ring-offset-2" : "ring-1 ring-transparent hover:ring-blue-300 hover:ring-offset-1");

  return (
    <div className={`relative rounded-xl transition-all ${rowRing} group`} style={{ background: row.bgColor || "transparent" }}>
      {!publicMode && (
      <div
        onClick={onSelectRow}
        className={`absolute -top-3 left-2 z-10 opacity-0 group-hover:opacity-100 ${isSelected ? "opacity-100" : ""} transition-opacity cursor-pointer`}
      >
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-medium shadow-sm transition-colors">
          <LayoutTemplate className="w-2 h-2" /> {row.label} · edit section
        </div>
      </div>
      )}

      <div
        className={`${viewport === "mobile" ? "flex flex-col" : "flex"} ${gapClass} ${padClass}`}
        onClick={e => e.stopPropagation()}
      >
        {row.columns.map(col => (
          <div key={col.id} className="min-w-0" style={{ flex: col.ratio }}>
            <PreviewColumn
              col={col}
              config={config}
              rowId={row.id}
              viewport={viewport}
              dropTarget={dropTarget}
              activeDragId={activeDragId}
              onBlockClick={blockId => onBlockClick(col.id, blockId)}
              onBlockDragStart={(e, blockId) => onBlockDragStart(e, blockId, col.id)}
              onBlockDragOver={(e, blockId, pos) => onBlockDragOver(e, blockId, col.id, pos)}
              onBlockDragEnd={onBlockDragEnd}
              onColumnDragOver={e => onColumnDragOver(e, col.id)}
              onColumnDrop={e => onColumnDrop(e, col.id)}
              onColumnDragLeave={onColumnDragLeave}
              onDeleteBlock={blockId => onDeleteBlock(blockId, col.id)}
              onAddBlockClick={onSelectRow}
              publicMode={publicMode}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Product Detail & Checkout Pages ─────────────────────────────────────────

const SAMPLE_PRODUCT = PRODUCTS[0];

function ProductOrCheckoutPage({ page, config, tmpl, isDark }: {
  page: "product" | "checkout";
  config: WebsiteConfig;
  tmpl: { accent: string; bg: string; nav: string; btnRadius: string; cardRadius: string };
  isDark: boolean;
}) {
  const isElegant = config.template === "elegant";
  const [cartStep, setCartStep] = useState<"bag" | "shipping" | "payment" | "done">("bag");
  const [activeThumb, setActiveThumb] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState(2);
  const [isWide, setIsWide] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setIsWide(entry.contentRect.width >= 600);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const txt = isDark ? "text-gray-100" : "text-gray-900";
  const sub = isDark ? "text-gray-400" : "text-gray-500";
  const card = isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const inputCls = `w-full px-3 py-2 text-xs rounded-lg border ${isDark?"border-gray-600 bg-gray-700 text-gray-100":"border-gray-300 bg-white text-gray-800"} outline-none focus:border-green-500 transition-colors`;

  if (page === "product") {
    const discPct = SAMPLE_PRODUCT.originalPrice
      ? Math.round((1 - SAMPLE_PRODUCT.price / SAMPLE_PRODUCT.originalPrice) * 100)
      : 0;
    const thumbProducts = [SAMPLE_PRODUCT, ...PRODUCTS.slice(1, 5)];
    const activeImage = thumbProducts[activeThumb]?.image ?? SAMPLE_PRODUCT.image;


    return (
      <div ref={containerRef} className={txt}>
        {isWide ? (
          /* ════════════════════════════════════════
             DESKTOP: Shopify-style 2-col layout
             ════════════════════════════════════════ */
          <div>
            {/* Breadcrumb */}
            <div className={`flex items-center gap-1.5 px-6 pt-4 pb-3 text-[10px] border-b ${isDark?"border-gray-700 text-gray-400":"border-gray-100 text-gray-500"}`}>
              <span className="hover:underline cursor-pointer">Ana Səhifə</span>
              <ChevronRight className="w-2.5 h-2.5 opacity-40"/>
              <span className="hover:underline cursor-pointer">Elektronika</span>
              <ChevronRight className="w-2.5 h-2.5 opacity-40"/>
              <span style={{color:tmpl.accent}} className="font-medium">{SAMPLE_PRODUCT.name}</span>
            </div>

            {/* 2-col grid */}
            <div className="flex gap-6 px-6 py-5">

              {/* LEFT — image + thumbnails */}
              <div className="w-[45%] flex-shrink-0 space-y-2">
                <div className={`relative w-full aspect-square rounded-2xl overflow-hidden border ${isDark?"bg-gray-800 border-gray-700":"bg-gray-50 border-gray-200"}`}>
                  <img src={activeImage} alt={SAMPLE_PRODUCT.name} className="w-full h-full object-cover transition-all duration-300"/>
                  {discPct > 0 && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
                      -{discPct}% ENDİRİM
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {thumbProducts.map((p,i)=>(
                    <button key={p.id} onClick={()=>setActiveThumb(i)}
                      className="flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all hover:opacity-90"
                      style={{width:58,height:58,borderColor:i===activeThumb?tmpl.accent:isDark?"#374151":"#e5e7eb",opacity:i===activeThumb?1:0.55}}>
                      <img src={p.image} alt="" className="w-full h-full object-cover"/>
                    </button>
                  ))}
                </div>
              </div>

              {/* RIGHT — all product info */}
              <div className="flex-1 min-w-0 space-y-4">
                <p className={`text-[9px] uppercase tracking-widest font-medium ${sub}`}>SKU: INF-{SAMPLE_PRODUCT.id.toString().padStart(3,"0")}</p>
                <h1 className={`text-xl font-bold leading-tight ${txt}`}>{SAMPLE_PRODUCT.name}</h1>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold" style={{color:tmpl.accent}}>{SAMPLE_PRODUCT.price} ₼</span>
                  {SAMPLE_PRODUCT.originalPrice && (
                    <><span className={`text-base line-through ${sub}`}>{SAMPLE_PRODUCT.originalPrice} ₼</span>
                    <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-md">-{discPct}%</span></>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({length:5}).map((_,i)=><Star key={i} className={`w-3.5 h-3.5 ${i<Math.floor(SAMPLE_PRODUCT.rating)?"fill-yellow-400 text-yellow-400":"text-gray-300"}`}/>)}
                  </div>
                  <span className={`text-xs ${sub}`}>({SAMPLE_PRODUCT.reviews} rəy)</span>
                  <span className="text-xs font-semibold text-emerald-500">· Stokda Var</span>
                </div>
                <p className={`text-xs leading-relaxed ${sub}`}>Gündəlik istifadə üçün premium keyfiyyətli məhsul. Qabaqcıl materiallar və dəqiq mühəndislik ilə hazırlanmış.</p>
                <div className={`h-px ${isDark?"bg-gray-700":"bg-gray-100"}`}/>
                {/* Color */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className={`text-xs font-semibold ${txt}`}>Rəng:</p>
                    <span className={`text-xs ${sub}`}>{["Tünd Qara","Tünd Yaşıl","Tünd Qırmızı","Tünd Mavi","Bej"][selectedColor]}</span>
                  </div>
                  <div className="flex gap-2">
                    {["#1a1a2e","#2d4a3e","#4a2d3e","#2d3a4a","#8b7355"].map((c,i)=>(
                      <button key={c} onClick={()=>setSelectedColor(i)} className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                        style={{background:c,borderColor:i===selectedColor?tmpl.accent:"transparent",boxShadow:i===selectedColor?`0 0 0 3px ${tmpl.accent}30`:"none"}}/>
                    ))}
                  </div>
                </div>
                {/* Size */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-semibold ${txt}`}>Ölçü</p>
                    <span className={`text-xs underline cursor-pointer ${sub}`}>Ölçü cədvəli</span>
                  </div>
                  <div className="flex gap-2">
                    {["XS","S","M","L","XL","XXL"].map((sz,i)=>(
                      <button key={sz} onClick={()=>setSelectedSize(i)}
                        className="h-9 min-w-[38px] px-2 rounded-lg border text-xs font-bold transition-all hover:opacity-80"
                        style={i===selectedSize?{background:tmpl.accent,borderColor:tmpl.accent,color:"#fff"}:{borderColor:isDark?"#374151":"#e5e7eb",color:isDark?"#9ca3af":"#6b7280",background:"transparent"}}>
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Description */}
                <div className={`rounded-xl p-3 ${isDark?"bg-gray-800":"bg-gray-50"}`}>
                  <p className={`text-xs font-semibold mb-1.5 ${txt}`}>Məhsul haqqında</p>
                  <p className={`text-xs leading-relaxed ${sub}`}>Gündəlik istifadə üçün premium keyfiyyətli məhsul. Qabaqcıl materiallar və dəqiq mühəndislik ilə hazırlanmış — etibarlı, zərif, hər mühitdə işləyir.</p>
                </div>
                {/* Qty + Add to cart */}
                <div className="flex items-center gap-3">
                  <div className={`flex items-center rounded-xl border overflow-hidden ${isDark?"border-gray-600":"border-gray-200"}`}>
                    <button onClick={()=>setQty(q=>Math.max(1,q-1))} className={`w-10 h-10 flex items-center justify-center text-lg ${isDark?"hover:bg-gray-700 text-gray-200":"hover:bg-gray-50 text-gray-700"}`}>−</button>
                    <span className={`w-10 text-center text-sm font-bold ${txt}`}>{qty}</span>
                    <button onClick={()=>setQty(q=>q+1)} className={`w-10 h-10 flex items-center justify-center text-lg ${isDark?"hover:bg-gray-700 text-gray-200":"hover:bg-gray-50 text-gray-700"}`}>+</button>
                  </div>
                  <button className={`flex-1 flex items-center justify-center gap-2 py-2.5 ${tmpl.btnRadius} text-sm font-bold text-white shadow-md hover:opacity-90 active:scale-95 transition-all`} style={{background:tmpl.accent}}>
                    <ShoppingCart className="w-4 h-4"/>{isElegant?"Çantaya Əlavə Et":"Səbətə Əlavə Et"}
                  </button>
                </div>
                <button className={`w-full flex items-center justify-center py-2.5 ${tmpl.btnRadius} text-sm font-bold border-2 transition-all hover:opacity-80 active:scale-95`} style={{borderColor:tmpl.accent,color:tmpl.accent}}>İndi Satın Al</button>
                {/* Safe checkout */}
                <div className={`rounded-xl border px-3 py-2.5 ${isDark?"border-gray-700 bg-gray-800":"border-gray-200 bg-gray-50"}`}>
                  <p className={`text-[10px] font-semibold text-center mb-2 ${txt}`}>🔒 Zəmanətli Təhlükəsiz Ödəniş</p>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {["Visa","MC","PayPal","Amex","Stripe"].map(m=>(
                      <span key={m} className={`text-[9px] font-bold px-2 py-0.5 rounded border ${isDark?"border-gray-600 text-gray-400":"border-gray-300 text-gray-500"}`}>{m}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Full-width description details */}
            <div className={`px-6 pb-5 border-t ${isDark?"border-gray-700":"border-gray-100"}`}>
              <div className="pt-4 space-y-2">
                <h3 className={`text-sm font-bold ${txt}`}>Ətraflı Məlumat</h3>
                <ul className={`space-y-1.5 text-xs leading-relaxed ${sub}`}>
                  {["100% premium keyfiyyətli material","Klassik dizayn, hər gün geyilə bilər","Yüngül və nəfəs alan quruluş — bütün mövsümlər üçün","Uzunömürlü tikişlər ilə davamlılıq","Şalvar, şort və ya geyim dəstləri ilə mükəmməl uyğunluq"].map(f=>(
                    <li key={f} className="flex items-start gap-2"><span style={{color:tmpl.accent}} className="flex-shrink-0">•</span>{f}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Related products */}
            <div className="px-6 pb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-bold ${txt}`}>Bəlkə Bunlar da Xoşunuza Gələr</h3>
                <span className="text-xs font-medium cursor-pointer" style={{color:tmpl.accent}}>Hamısına bax →</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1" style={{scrollbarWidth:"none"}}>
                {PRODUCTS.slice(1,6).map(p=>(
                  <div key={p.id} className={`flex-shrink-0 w-36 ${tmpl.cardRadius} overflow-hidden border ${isDark?"border-gray-700 bg-gray-800":"border-gray-100 bg-white"} cursor-pointer hover:shadow-md transition-all`}>
                    <div className="w-full aspect-square overflow-hidden">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"/>
                    </div>
                    <div className="p-2 space-y-0.5">
                      <p className={`text-[10px] font-semibold line-clamp-2 ${txt}`}>{p.name}</p>
                      <div className="flex gap-0.5">{Array.from({length:5}).map((_,i)=><Star key={i} className={`w-2 h-2 ${i<Math.floor(p.rating)?"fill-yellow-400 text-yellow-400":"text-gray-300"}`}/>)}</div>
                      <p className="text-xs font-bold" style={{color:tmpl.accent}}>{p.price} ₼</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ── MOBILE: single column ── */
          <div className={isDark?"bg-gray-900":"bg-white"}>

            {/* Hero image */}
            <div className={`relative w-full overflow-hidden ${isDark?"bg-gray-800":"bg-gray-100"}`} style={{aspectRatio:"4/3"}}>
              <img src={activeImage} alt={SAMPLE_PRODUCT.name} className="w-full h-full object-cover transition-all duration-300"/>
              {discPct > 0 && (
                <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                  -{discPct}% ENDİRİM
                </div>
              )}
              <div className="absolute top-3 right-3">
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-medium backdrop-blur-md shadow ${isDark?"bg-black/50 text-gray-200":"bg-white/80 text-gray-700"}`}>
                  <span>Ana Səhifə</span>
                  <ChevronRight className="w-2 h-2 opacity-50"/>
                  <span style={{color:tmpl.accent}} className="font-semibold truncate max-w-[90px]">{SAMPLE_PRODUCT.name}</span>
                </div>
              </div>
            </div>

            {/* Thumbnail strip */}
            <div className={`flex gap-2 px-4 py-2.5 border-b ${isDark?"border-gray-800":"border-gray-100"}`}>
              {thumbProducts.map((p,i)=>(
                <button key={p.id} onClick={()=>setActiveThumb(i)}
                  className="flex-shrink-0 rounded-lg overflow-hidden transition-all active:scale-95"
                  style={{width:52,height:52,border:`2px solid ${i===activeThumb?tmpl.accent:isDark?"#374151":"#e5e7eb"}`,opacity:i===activeThumb?1:0.45,boxShadow:i===activeThumb?`0 0 0 2px ${tmpl.accent}25`:"none"}}>
                  <img src={p.image} alt="" className="w-full h-full object-cover"/>
                </button>
              ))}
            </div>

            {/* Name / brand / rating */}
            <div className="px-4 pt-4 pb-3">
              <p className={`text-[9px] font-semibold uppercase tracking-widest mb-1 ${sub}`}>Inflero</p>
              <h1 className={`text-lg font-bold leading-snug mb-2 ${txt}`}>{SAMPLE_PRODUCT.name}</h1>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {Array.from({length:5}).map((_,i)=><Star key={i} className={`w-3.5 h-3.5 ${i<Math.floor(SAMPLE_PRODUCT.rating)?"fill-yellow-400 text-yellow-400":"text-gray-300"}`}/>)}
                </div>
                <span className={`text-xs ${sub}`}>{SAMPLE_PRODUCT.rating} · {SAMPLE_PRODUCT.reviews} rəy</span>
                <span className="text-xs font-semibold text-emerald-500 ml-auto">✓ Stokda</span>
              </div>
            </div>

            {/* Price */}
            <div className={`flex items-center gap-2.5 px-4 py-3 border-t border-b ${isDark?"border-gray-800":"border-gray-100"}`}>
              <span className="text-2xl font-extrabold" style={{color:tmpl.accent}}>{SAMPLE_PRODUCT.price} ₼</span>
              {SAMPLE_PRODUCT.originalPrice && (
                <><span className={`text-sm line-through ${sub}`}>{SAMPLE_PRODUCT.originalPrice} ₼</span>
                <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">-{discPct}%</span></>
              )}
            </div>

            {/* Color */}
            <div className={`px-4 py-4 border-b ${isDark?"border-gray-800":"border-gray-100"}`}>
              <div className="flex items-center justify-between mb-3">
                <p className={`text-sm font-semibold ${txt}`}>Rəng</p>
                <span className={`text-xs ${sub}`}>{["Tünd Qara","Tünd Yaşıl","Tünd Qırmızı","Tünd Mavi","Bej"][selectedColor]}</span>
              </div>
              <div className="flex gap-3">
                {["#1a1a2e","#2d4a3e","#4a2d3e","#2d3a4a","#8b7355"].map((c,i)=>(
                  <button key={c} onClick={()=>setSelectedColor(i)} className="w-8 h-8 rounded-full transition-all active:scale-90"
                    style={{background:c,border:`2px solid ${i===selectedColor?tmpl.accent:"transparent"}`,
                      boxShadow:i===selectedColor?`0 0 0 3px ${tmpl.accent}35`:"none",
                      transform:i===selectedColor?"scale(1.18)":"scale(1)"}}/>
                ))}
              </div>
            </div>

            {/* Size */}
            <div className={`px-4 py-4 border-b ${isDark?"border-gray-800":"border-gray-100"}`}>
              <div className="flex items-center justify-between mb-3">
                <p className={`text-sm font-semibold ${txt}`}>Ölçü</p>
                <span className={`text-xs underline cursor-pointer ${sub}`}>Ölçü cədvəli</span>
              </div>
              <div className="flex gap-2">
                {["XS","S","M","L","XL","XXL"].map((sz,i)=>(
                  <button key={sz} onClick={()=>setSelectedSize(i)}
                    className="flex-1 h-10 rounded-xl border-2 text-xs font-bold transition-all active:scale-95"
                    style={i===selectedSize
                      ?{background:tmpl.accent,borderColor:tmpl.accent,color:"#fff",boxShadow:`0 4px 12px ${tmpl.accent}40`}
                      :{borderColor:isDark?"#374151":"#e5e7eb",color:isDark?"#9ca3af":"#6b7280",background:"transparent"}}>
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className={`px-4 py-4 border-b ${isDark?"border-gray-800":"border-gray-100"}`}>
              <p className={`text-sm font-semibold mb-2 ${txt}`}>Məhsul haqqında</p>
              <p className={`text-xs leading-relaxed ${sub}`}>Gündəlik istifadə üçün premium keyfiyyətli məhsul. Qabaqcıl materiallar və dəqiq mühəndislik ilə hazırlanmış — etibarlı, zərif, hər mühitdə işləyir.</p>
              <ul className={`mt-2 space-y-1 text-xs ${sub}`}>
                {["100% premium material","Klassik dizayn, hər gün geyilə bilər","Yüngül və nəfəs alan quruluş","Uzunömürlü tikişlər"].map(f=>(
                  <li key={f} className="flex items-start gap-1.5"><span style={{color:tmpl.accent}} className="flex-shrink-0">•</span>{f}</li>
                ))}
              </ul>
            </div>

            {/* Qty */}
            <div className={`px-4 py-4 border-b ${isDark?"border-gray-800":"border-gray-100"}`}>
              <div className="flex items-center justify-between">
                <p className={`text-sm font-semibold ${txt}`}>Miqdar</p>
                <div className={`flex items-center rounded-xl border-2 overflow-hidden ${isDark?"border-gray-700":"border-gray-200"}`}>
                  <button onClick={()=>setQty(q=>Math.max(1,q-1))} className={`w-10 h-10 flex items-center justify-center text-xl ${isDark?"hover:bg-gray-800 text-gray-200":"hover:bg-gray-50 text-gray-700"}`}>−</button>
                  <span className={`w-10 text-center text-sm font-bold ${txt}`}>{qty}</span>
                  <button onClick={()=>setQty(q=>q+1)} className={`w-10 h-10 flex items-center justify-center text-xl ${isDark?"hover:bg-gray-800 text-gray-200":"hover:bg-gray-50 text-gray-700"}`}>+</button>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="px-4 py-4 flex gap-3">
              <button className={`flex-1 flex items-center justify-center gap-2 py-3.5 ${tmpl.btnRadius} text-sm font-bold border-2 transition-all active:scale-95`}
                style={{borderColor:tmpl.accent,color:tmpl.accent}}>
                <ShoppingCart className="w-4 h-4"/>{isElegant?"Çantaya Əlavə Et":"Səbətə Əlavə Et"}
              </button>
              <button className={`flex-1 flex items-center justify-center py-3.5 ${tmpl.btnRadius} text-sm font-bold text-white shadow-lg transition-all active:scale-95`}
                style={{background:tmpl.accent}}>
                İndi Satın Al
              </button>
            </div>

            {/* Trust strip */}
            <div className={`flex items-center justify-center gap-5 py-3 border-t ${isDark?"border-gray-800":"border-gray-100"}`}>
              {[["🚚","Pulsuz Çatdırılma"],["↩️","30 Gün"],["🔒","Təhlükəsiz"]].map(([icon,label])=>(
                <div key={label as string} className="flex items-center gap-1">
                  <span className="text-sm">{icon}</span>
                  <span className={`text-[9px] font-medium ${sub}`}>{label}</span>
                </div>
              ))}
            </div>

            {/* You may also like */}
            <div className={`px-4 pt-4 pb-6 border-t ${isDark?"border-gray-800 bg-gray-900":"border-gray-100 bg-gray-50"}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-bold ${txt}`}>Bəlkə Bunlar da Xoşunuza Gələr</h3>
                <span className="text-xs font-medium cursor-pointer" style={{color:tmpl.accent}}>Hamısına bax →</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1" style={{scrollbarWidth:"none"}}>
                {PRODUCTS.slice(1,6).map(p=>(
                  <div key={p.id} className={`flex-shrink-0 w-32 ${tmpl.cardRadius} overflow-hidden border ${isDark?"border-gray-700 bg-gray-800":"border-gray-200 bg-white"} cursor-pointer active:scale-95 transition-all`}>
                    <div className="w-full aspect-square overflow-hidden">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover"/>
                    </div>
                    <div className="p-2 space-y-0.5">
                      <p className={`text-[10px] font-semibold line-clamp-2 ${txt}`}>{p.name}</p>
                      <div className="flex gap-0.5">{Array.from({length:5}).map((_,i)=><Star key={i} className={`w-2 h-2 ${i<Math.floor(p.rating)?"fill-yellow-400 text-yellow-400":"text-gray-300"}`}/>)}</div>
                      <p className="text-xs font-bold" style={{color:tmpl.accent}}>{p.price} ₼</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Checkout page
  const steps = ["bag","shipping","payment","done"] as const;
  const stepIdx = steps.indexOf(cartStep);

  return (
    <div className={`p-4 space-y-4 ${txt}`}>
      {/* Step progress */}
      <div className="flex items-center gap-0 mb-2">
        {["Səbət","Çatdırılma","Ödəniş","Hazır"].map((s,i)=>(
          <div key={s} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold flex-shrink-0 transition-colors ${i<=stepIdx?"text-white":"text-gray-400 border border-gray-300 dark:border-gray-600"}`}
              style={i<=stepIdx?{background:tmpl.accent}:{}}>
              {i<stepIdx?<Check className="w-3 h-3"/>:i+1}
            </div>
            <span className={`text-[9px] ml-1 font-medium ${i===stepIdx?"text-green-600":sub}`}>{s}</span>
            {i<3&&<div className={`flex-1 h-px mx-1 ${i<stepIdx?"bg-green-400":"bg-gray-200 dark:bg-gray-700"}`}/>}
          </div>
        ))}
      </div>

      {cartStep === "bag" && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold">Səbətiniz</h2>
          {PRODUCTS.slice(0,2).map(p => (
            <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border ${card}`}>
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700">
                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{p.name}</p>
                <p className={`text-[10px] ${sub} mt-0.5`}>Ölçü: M · Say: 1</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-sm font-bold block" style={{color:tmpl.accent}}>{p.price} ₼</span>
                {p.originalPrice && <span className={`text-[9px] line-through ${sub}`}>{p.originalPrice} ₼</span>}
              </div>
            </div>
          ))}
          <div className={`rounded-xl border ${card} p-3 space-y-1.5 text-xs`}>
            <div className={`flex justify-between ${sub}`}><span>Aralıq cəmi</span><span>219.98 ₼</span></div>
            <div className={`flex justify-between ${sub}`}><span>Çatdırılma</span><span className="text-green-600">Pulsuz</span></div>
            <div className={`flex justify-between font-bold border-t pt-1.5 ${isDark?"border-gray-700":""}`}><span>Cəmi</span><span style={{color:tmpl.accent}}>219.98 ₼</span></div>
          </div>
          <button onClick={()=>setCartStep("shipping")} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90" style={{background:tmpl.accent}}>
            Çatdırılmaya keçin →
          </button>
        </div>
      )}

      {cartStep === "shipping" && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold">Çatdırılma Məlumatları</h2>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={`text-[10px] ${sub} block mb-1`}>Ad</label><input className={inputCls} placeholder="Əli"/></div>
            <div><label className={`text-[10px] ${sub} block mb-1`}>Soyad</label><input className={inputCls} placeholder="Əliyev"/></div>
          </div>
          {config.shippingEmailEnabled && <div><label className={`text-[10px] ${sub} block mb-1`}>E-poçt</label><input className={inputCls} placeholder="ali@example.com" type="email"/></div>}
          <div><label className={`text-[10px] ${sub} block mb-1`}>Telefon</label><input className={inputCls} placeholder="+994 50 000 0000"/></div>
          <div><label className={`text-[10px] ${sub} block mb-1`}>Ünvan</label><input className={inputCls} placeholder="Nizami küç. 45"/></div>
          {(config.shippingCityEnabled || config.shippingZipEnabled) && (
            <div className={`grid gap-2 ${config.shippingCityEnabled && config.shippingZipEnabled ? "grid-cols-2" : "grid-cols-1"}`}>
              {config.shippingCityEnabled && <div><label className={`text-[10px] ${sub} block mb-1`}>Şəhər</label><input className={inputCls} placeholder="Bakı"/></div>}
              {config.shippingZipEnabled && <div><label className={`text-[10px] ${sub} block mb-1`}>Poçt Kodu</label><input className={inputCls} placeholder="AZ1000"/></div>}
            </div>
          )}
          <div className={`rounded-xl border ${card} p-3 space-y-2`}>
            <p className={`text-[10px] font-semibold ${txt}`}>Çatdırılma üsulu</p>
            {config.shippingMethod === "free" && (
              <label className={`flex items-center justify-between gap-2 p-2 rounded-lg border border-green-500 bg-green-50/50 dark:bg-green-900/10`}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-green-500 bg-green-500 flex-shrink-0"/>
                  <span className="text-[10px]">Pulsuz Çatdırılma</span>
                </div>
                <span className="text-[10px] font-medium text-green-600">Pulsuz</span>
              </label>
            )}
            {config.shippingMethod === "standard" && (
              <label className={`flex items-center justify-between gap-2 p-2 rounded-lg border border-green-500 bg-green-50/50 dark:bg-green-900/10`}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-green-500 bg-green-500 flex-shrink-0"/>
                  <span className="text-[10px]">Standart Çatdırılma</span>
                </div>
                <span className="text-[10px] font-medium text-green-600">{config.shippingPrice} ₼</span>
              </label>
            )}
            {config.shippingMethod === "free_above" && (
              <label className={`flex items-center justify-between gap-2 p-2 rounded-lg border border-green-500 bg-green-50/50 dark:bg-green-900/10`}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-green-500 bg-green-500 flex-shrink-0"/>
                  <span className="text-[10px]">{config.shippingFreeAbove} ₼ üzərində pulsuz</span>
                </div>
                <span className="text-[10px] font-medium text-green-600">Pulsuz</span>
              </label>
            )}
            {config.shippingMethod === "distance" && (
              <label className={`flex items-center justify-between gap-2 p-2 rounded-lg border border-green-500 bg-green-50/50 dark:bg-green-900/10`}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-green-500 bg-green-500 flex-shrink-0"/>
                  <div>
                    <span className="text-[10px] block">Məsafəyə görə çatdırılma</span>
                    <span className={`text-[9px] ${sub}`}>{config.shippingDistanceBase} ₼/km · max {config.shippingDistanceMaxKm} km</span>
                  </div>
                </div>
                <span className={`text-[10px] font-medium ${sub}`}>Hesablanır</span>
              </label>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={()=>setCartStep("bag")} className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${isDark?"border-gray-600 hover:bg-gray-700":"border-gray-300 hover:bg-gray-50"}`}>← Geri</button>
            <button onClick={()=>setCartStep("payment")} className="flex-1 py-2 rounded-xl text-xs font-semibold text-white shadow-md transition-opacity hover:opacity-90" style={{background:tmpl.accent}}>Davam et →</button>
          </div>
        </div>
      )}

      {cartStep === "payment" && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold">Ödəniş</h2>
          <div className={`rounded-xl border ${card} p-3 space-y-2`}>
            <p className={`text-[10px] font-semibold ${txt} mb-1`}>Ödəniş üsulunu seçin</p>
            {config.paymentMethods.filter(m=>m.enabled).map((m,i)=>(
              <label key={m.id} className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer border transition-colors ${i===0?"border-green-500 bg-green-50/50 dark:bg-green-900/10":`border-transparent ${isDark?"hover:bg-gray-700":"hover:bg-gray-50"}`}`}>
                <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${i===0?"border-green-500 bg-green-500":"border-gray-300"}`}/>
                <span className="text-sm">{m.icon}</span>
                <span className="text-[10px]">{m.name}</span>
              </label>
            ))}
          </div>
          <div className={`rounded-xl border ${card} p-3 space-y-2`}>
            <div><label className={`text-[10px] ${sub} block mb-1`}>Kart Nömrəsi</label><input className={inputCls} placeholder="4242 4242 4242 4242"/></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={`text-[10px] ${sub} block mb-1`}>Son istifadə tarixi</label><input className={inputCls} placeholder="MM / YY"/></div>
              <div><label className={`text-[10px] ${sub} block mb-1`}>CVV</label><input className={inputCls} placeholder="•••"/></div>
            </div>
            <div><label className={`text-[10px] ${sub} block mb-1`}>Kartdakı Ad</label><input className={inputCls} placeholder="Əli Əliyev"/></div>
          </div>
          <div className={`rounded-xl border ${card} p-3 space-y-1 text-xs`}>
            <div className={`flex justify-between ${sub}`}><span>2 məhsul</span><span>219.98 ₼</span></div>
            <div className={`flex justify-between ${sub}`}><span>Çatdırılma</span><span className="text-green-600">Pulsuz</span></div>
            <div className={`flex justify-between font-bold border-t pt-1.5 ${isDark?"border-gray-700":""}`}><span>Cəmi</span><span style={{color:tmpl.accent}}>219.98 ₼</span></div>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>setCartStep("shipping")} className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${isDark?"border-gray-600 hover:bg-gray-700":"border-gray-300 hover:bg-gray-50"}`}>← Geri</button>
            <button onClick={()=>setCartStep("done")} className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white shadow-md transition-opacity hover:opacity-90" style={{background:tmpl.accent}}>Sifariş Ver 🎉</button>
          </div>
        </div>
      )}

      {cartStep === "done" && (
        <div className="py-8 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Check className="w-7 h-7 text-green-600"/>
          </div>
          <div>
            <h2 className="text-sm font-bold mb-1">Sifariş Təsdiqləndi!</h2>
            <p className={`text-xs ${sub}`}>Alışınız üçün təşəkkür edirik. Tezliklə təsdiq e-poçtu alacaqsınız.</p>
          </div>
          <div className={`w-full rounded-xl border ${card} p-3 text-left space-y-1 text-xs`}>
            <div className={`flex justify-between ${sub}`}><span>Sifariş #</span><span className="font-mono">INF-{Math.floor(Math.random()*90000+10000)}</span></div>
            <div className={`flex justify-between ${sub}`}><span>Ödənildi</span><span className="font-semibold" style={{color:tmpl.accent}}>219.98 ₼</span></div>
            <div className={`flex justify-between ${sub}`}><span>Təxmini çatdırılma</span><span>5–7 iş günü</span></div>
          </div>
          <button onClick={()=>setCartStep("bag")} className="px-6 py-2 rounded-xl text-xs font-semibold text-white shadow-md" style={{background:tmpl.accent}}>Alış-verişə Davam Et</button>
        </div>
      )}
    </div>
  );
}

// ─── Live Preview ─────────────────────────────────────────────────────────────

function LivePreview({
  config, selected, viewport,
  dropTarget, activeDragId,
  onSelectHeader, onSelectBlock, onSelectRow,
  onBlockDragStart, onBlockDragOver, onBlockDragEnd,
  onColumnDragOver, onColumnDrop, onColumnDragLeave,
  onTopLevelDragOver, onTopLevelDrop,
  onDeleteBlock, onDeleteTopLevelBlock,
  publicMode = false,
}: {
  config: WebsiteConfig; selected: SelectedItem; viewport: "desktop" | "mobile";
  dropTarget: DropTarget | null; activeDragId: string | null;
  onSelectHeader: () => void;
  onSelectBlock: (encoded: string) => void;
  onSelectRow: (rowId: string) => void;
  onBlockDragStart: (e: React.DragEvent, blockId: string, rowId: string, colId: string) => void;
  onBlockDragOver: (e: React.DragEvent, blockId: string, rowId: string, colId: string, pos: "before" | "after") => void;
  onBlockDragEnd: () => void;
  onColumnDragOver: (e: React.DragEvent, rowId: string, colId: string) => void;
  onColumnDrop: (e: React.DragEvent, rowId: string, colId: string) => void;
  onColumnDragLeave: (e: React.DragEvent) => void;
  onTopLevelDragOver: (e: React.DragEvent, blockId: string, pos: "before" | "after") => void;
  onTopLevelDrop: (e: React.DragEvent) => void;
  onDeleteBlock: (blockId: string, rowId: string, colId: string) => void;
  onDeleteTopLevelBlock: (blockId: string) => void;
  publicMode?: boolean;
}) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const _baseTmpl = TEMPLATES.find(t => t.id === config.template) ?? TEMPLATES[0];
  const tmpl = { ..._baseTmpl, accent: config.accentColor || _baseTmpl.accent };
  const isDark = config.template === "dark";
  const isElegant = config.template === "elegant";
  const isVibrant = config.template === "vibrant";
  const headerRing = selected?.kind === "header" ? "ring-2 ring-green-500 ring-offset-1" : "ring-1 ring-transparent hover:ring-green-300";
  const waBlock = config.content.find(c => !isRow(c) && (c as Block).type === "whatsapp-widget" && c.visible) as Block | undefined;
  const [previewPage, setPreviewPage] = useState<"home" | "product" | "checkout">("home");

  const pageLabels = {
    home: tr("🏠 Ana Səhifə", "🏠 Home", "🏠 Главная"),
    product: tr("📦 Məhsul", "📦 Product", "📦 Товар"),
    checkout: tr("💳 Ödəniş", "💳 Checkout", "💳 Оплата"),
  } as const;

  return (
    <div className={`h-full flex flex-col gap-2 overflow-hidden ${publicMode ? "gap-0" : ""}`}>
    {/* Page switcher */}
    {!publicMode && (
    <div className="flex-shrink-0 flex items-center gap-1 px-1">
      {(["home","product","checkout"] as const).map(pg => (
        <button key={pg} onClick={() => setPreviewPage(pg)}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${previewPage===pg?"bg-green-500 text-white":"bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-green-400"}`}>
          {pageLabels[pg]}
        </button>
      ))}
      <span className="ml-auto text-[10px] text-gray-400 italic">{tr("Önizləmə", "Preview", "Предпросмотр")}</span>
    </div>
    )}
    <div className={`flex-1 overflow-y-auto ${publicMode ? "rounded-none border-0" : "rounded-xl border"} ${isDark ? "border-gray-700" : "border-gray-200"} ${publicMode ? "" : "shadow-sm"} ${tmpl.bg} relative ${viewport === "mobile" && !publicMode ? "max-w-[375px] mx-auto w-full" : "w-full"}`}>
      {/* Header */}
      <div
        onClick={publicMode ? undefined : onSelectHeader}
        className={`sticky top-0 z-10 ${tmpl.nav} px-4 h-12 flex items-center justify-between ${publicMode ? "" : "cursor-pointer"} rounded-t-xl transition-all ${publicMode ? "" : headerRing} group`}
        style={config.primaryColor ? { background: config.primaryColor } : undefined}
      >
        {config.logoUrl
          ? <img src={config.logoUrl} alt={config.storeName} className="h-7 w-auto object-contain max-w-[110px]" />
          : <span className={`text-sm ${isElegant?"font-light tracking-[0.15em] uppercase":isVibrant?"font-black text-base":"font-bold"}`} style={{ color: tmpl.accent }}>{config.storeName || "My Store"}</span>
        }
        <div className="hidden sm:flex gap-3">
          {(config.headerLinks || DEFAULT_HEADER_LINKS).map(n => (
            <span key={n.id} className={`text-xs ${isElegant?"tracking-widest uppercase text-[9px]":""} ${isDark ? "text-gray-400" : "text-gray-500"}`}>{n.label}</span>
          ))}
        </div>
        <div className="relative">
          <ShoppingCart className="w-4 h-4" style={{ color: tmpl.accent }} />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-white text-[8px] font-bold flex items-center justify-center" style={{ background: tmpl.accent }}>2</span>
        </div>
        <div className={`absolute top-2 right-10 opacity-0 group-hover:opacity-100 ${selected?.kind === "header" ? "opacity-100" : ""} transition-opacity pointer-events-none ${publicMode ? "hidden" : ""}`}>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-green-500 text-white text-[9px] font-medium"><Pencil className="w-2 h-2" /> Header</div>
        </div>
      </div>

      {/* Content — home page */}
      {previewPage !== "home" && (
        <ProductOrCheckoutPage page={previewPage} config={config} tmpl={tmpl} isDark={isDark} />
      )}
      <div
        className={`p-3 space-y-3 ${previewPage !== "home" ? "hidden" : ""}`}
        onDragOver={e => e.preventDefault()}
        onDrop={onTopLevelDrop}
      >
        {config.content.map((item, itemIdx) => {
          if (isRow(item)) {
            return (
              <PreviewRow
                key={item.id}
                row={item}
                config={config}
                isSelected={!publicMode && selected?.kind === "row" && selected.rowId === item.id}
                viewport={viewport}
                dropTarget={publicMode ? null : dropTarget}
                activeDragId={publicMode ? null : activeDragId}
                publicMode={publicMode}
                onSelectRow={publicMode ? () => {} : () => onSelectRow(item.id)}
                onBlockClick={publicMode ? () => {} : (colId, blockId) => onSelectBlock(`__row__${item.id}__col__${colId}__block__${blockId}`)}
                onBlockDragStart={publicMode ? () => {} : (e, blockId, colId) => onBlockDragStart(e, blockId, item.id, colId)}
                onBlockDragOver={publicMode ? () => {} : (e, blockId, colId, pos) => onBlockDragOver(e, blockId, item.id, colId, pos)}
                onBlockDragEnd={publicMode ? () => {} : onBlockDragEnd}
                onColumnDragOver={publicMode ? () => {} : (e, colId) => onColumnDragOver(e, item.id, colId)}
                onColumnDrop={publicMode ? () => {} : (e, colId) => onColumnDrop(e, item.id, colId)}
                onColumnDragLeave={publicMode ? () => {} : onColumnDragLeave}
                onDeleteBlock={publicMode ? () => {} : (blockId, colId) => onDeleteBlock(blockId, item.id, colId)}
              />
            );
          }
          const block = item as Block;
          if (block.type === "whatsapp-widget") return null;
          const isTopDropBefore = !!(dropTarget?.rowId === null && dropTarget?.colId === null && dropTarget?.insertAt === itemIdx);
          const isTopDropAfter = !!(dropTarget?.rowId === null && dropTarget?.colId === null && dropTarget?.insertAt === itemIdx + 1);
          return (
            <PreviewBlock
              key={block.id}
              block={block}
              config={config}
              selected={!publicMode && selected?.kind === "block" && selected.blockId === block.id}
              onClick={publicMode ? () => {} : () => onSelectBlock(block.id)}
              viewport={viewport}
              isDragging={!publicMode && activeDragId === block.id}
              dropBefore={!publicMode && isTopDropBefore}
              dropAfter={!publicMode && isTopDropAfter}
              onDragStart={publicMode ? undefined : e => {
                e.dataTransfer.setData("application/json", JSON.stringify({ blockId: block.id, rowId: null, colId: null }));
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={publicMode ? undefined : (e, pos) => onTopLevelDragOver(e, block.id, pos)}
              onDragEnd={publicMode ? undefined : onBlockDragEnd}
              onDelete={publicMode ? undefined : () => onDeleteTopLevelBlock(block.id)}
            />
          );
        })}

        {config.content.filter(c => c.visible && (isRow(c) || (c as Block).type !== "whatsapp-widget")).length === 0 && (
          <div className={`py-20 text-center ${isDark ? "text-gray-600" : "text-gray-300"}`}>
            <Layers className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No visible blocks. Add from the panel.</p>
          </div>
        )}
      </div>

      {previewPage === "home" && <div className={`mt-4 px-4 py-6 border-t ${isDark ? "border-gray-800 text-gray-600" : "border-gray-200 text-gray-400"}`}>
        <p className="text-xs text-center">© 2025 {config.storeName}. Powered by Inflero.</p>
      </div>}

      {waBlock && previewPage === "home" && (
        <button
          onClick={publicMode ? undefined : () => onSelectBlock(waBlock.id)}
          className={`sticky bottom-4 ml-auto mr-3 flex items-center gap-1.5 px-3 py-2 rounded-full text-white text-xs font-medium shadow-lg hover:scale-105 transition-all ${!publicMode && selected?.kind === "block" && selected.blockId === waBlock.id ? "ring-2 ring-green-300 ring-offset-2" : ""}`}
          style={{ background: "#25d366", display: "flex", width: "fit-content" }}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {waBlock.waLabel || "Chat with us"}
        </button>
      )}
    </div>
    </div>
  );
}

// ─── Shared Field ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  );
}
const inputCls = "w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow";
const textareaCls = `${inputCls} resize-none font-mono`;

// ─── Block Settings Panel ─────────────────────────────────────────────────────

function ProductSourceEditor({ src, onChange }: { src: ProductSource; onChange: (s: ProductSource) => void }) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const filtered = src.mode === "category" && src.categoryId ? PRODUCTS.filter(p => p.category === src.categoryId) : PRODUCTS;
  return (
    <div className="space-y-3">
      <Field label={tr("Bölmə Başlığı", "Section Title")}><input className={inputCls} value={src.title} onChange={e => onChange({ ...src, title: e.target.value })} /></Field>
      <Field label={tr("Mənbə", "Source")}>
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {(["all","category","specific"] as const).map(m => (
            <button key={m} onClick={() => onChange({ ...src, mode: m })} className={`flex-1 py-1.5 text-xs font-medium transition-colors ${src.mode===m?"bg-green-500 text-white":"bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
              {m==="all"?tr("Hamısı","All"):m==="category"?tr("Kateqoriya","Category"):tr("Seç","Pick")}
            </button>
          ))}
        </div>
      </Field>
      {src.mode === "category" && <Field label={tr("Kateqoriya","Category")}><select className={inputCls} value={src.categoryId} onChange={e => onChange({ ...src, categoryId: e.target.value })}><option value="">— {tr("seçin","choose")} —</option>{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>}
      {src.mode === "specific" && (
        <Field label={tr("Məhsulları Seçin","Select Products")}>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {filtered.map(p => {
              const on = src.productIds.includes(p.id);
              return (
                <button key={p.id} onClick={() => onChange({ ...src, productIds: on ? src.productIds.filter(id=>id!==p.id) : [...src.productIds,p.id] })} className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left text-xs transition-colors ${on?"border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20":"border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"}`}>
                  <div className={`w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center ${on?"bg-green-500 border-green-600":"border-gray-300 dark:border-gray-600"}`}>{on&&<Check className="w-2.5 h-2.5 text-white"/>}</div>
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="text-gray-400">{p.price} ₼</span>
                </button>
              );
            })}
          </div>
        </Field>
      )}
      <Field label={tr("Sütun sayı","Columns per row")}>
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {[2,3,4,5,6].map(n => (
            <button key={n} onClick={() => onChange({ ...src, columns: n })} className={`flex-1 py-1.5 text-xs font-medium transition-colors ${(src.columns??4)===n?"bg-green-500 text-white":"bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>{n}</button>
          ))}
        </div>
      </Field>
      <Field label={tr("Cərgə sayı","Rows")}>
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {[1,2,3,4,5,6].map(n => (
            <button key={n} onClick={() => onChange({ ...src, rows: n })} className={`flex-1 py-1.5 text-xs font-medium transition-colors ${(src.rows??1)===n?"bg-green-500 text-white":"bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>{n}</button>
          ))}
        </div>
      </Field>
      <p className="text-[10px] text-gray-400">{tr(`Maksimum ${(src.columns??4) * (src.rows??1)} məhsul göstərilir`, `Showing up to ${(src.columns??4) * (src.rows??1)} products`)}</p>
    </div>
  );
}

function BlockSettingsPanel({ block, onChange, onClose }: { block: Block; onChange: (b: Block) => void; onClose: () => void }) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const set = (patch: Partial<Block>) => onChange({ ...block, ...patch });
  const meta = BLOCK_META[block.type];
  const metaAz = BLOCK_META_AZ[block.type];
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">{meta.icon}</div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{pickLang(language, metaAz.label, meta.label)}</p>
            <p className="text-[10px] text-gray-400">{pickLang(language, metaAz.description, meta.description)}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <Field label={tr("Ad", "Label")}><input className={inputCls} value={block.label} onChange={e => set({ label: e.target.value })} /></Field>
        {block.type==="hero"&&(<>
          <Field label={tr("Arxa Fon Şəkli", "Background Image")}>
            <ImageUploader value={block.imageUrl} onChange={v=>set({imageUrl:v})} aspectHint={tr("Tövsiyə: 1400×600px, geniş", "Recommended: 1400×600px, wide landscape")} />
          </Field>
          <Field label={block.imageUrl ? tr("Üst qat rəngi", "Overlay Color") : tr("Arxa fon rəngi", "Background Color")}>
            <div className="flex items-center gap-2">
              <input type="color" value={block.bgColor??"#0f172a"} onChange={e=>set({bgColor:e.target.value})} className="w-8 h-8 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent p-0.5"/>
              <span className="text-xs text-gray-400 font-mono">{block.bgColor??"#0f172a"}</span>
            </div>
          </Field>
          <Field label={tr("Başlıq", "Headline")}><input className={inputCls} value={block.heading??""} onChange={e=>set({heading:e.target.value})}/></Field>
          <Field label={tr("Alt başlıq", "Subheading")}><textarea className={textareaCls} rows={2} value={block.subheading??""} onChange={e=>set({subheading:e.target.value})}/></Field>
          <Field label={tr("Mətn rəngi", "Text Color")}><div className="flex items-center gap-2"><input type="color" value={block.textColor??"#ffffff"} onChange={e=>set({textColor:e.target.value})} className="w-8 h-8 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent p-0.5"/><span className="text-xs text-gray-400 font-mono">{block.textColor??"#ffffff"}</span></div></Field>
          <Field label={tr("Düymə mətni", "Button Text")}><input className={inputCls} value={block.ctaText??""} onChange={e=>set({ctaText:e.target.value})}/></Field>
          <Field label={tr("Düymə rəngi", "Button Color")}><div className="flex items-center gap-2"><input type="color" value={block.ctaColor??"#16a34a"} onChange={e=>set({ctaColor:e.target.value})} className="w-8 h-8 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent p-0.5"/><span className="text-xs text-gray-400 font-mono">{block.ctaColor??"#16a34a"}</span></div></Field>
          <Field label={tr("Düymə mətn rəngi", "Button Text Color")}><div className="flex items-center gap-2"><input type="color" value={block.ctaBtnTextColor??"#ffffff"} onChange={e=>set({ctaBtnTextColor:e.target.value})} className="w-8 h-8 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent p-0.5"/><span className="text-xs text-gray-400 font-mono">{block.ctaBtnTextColor??"#ffffff"}</span></div></Field>
          <Field label={`${block.imageUrl ? tr("Üst qat", "Overlay") : tr("Arxa fon", "Background")} ${tr("Şəffaflığı", "Opacity")} — ${block.overlayOpacity??70}%`}><input type="range" min={0} max={100} value={block.overlayOpacity??70} onChange={e=>set({overlayOpacity:Number(e.target.value)})} className="w-full accent-green-600"/></Field>
        </>)}
        {block.type==="featured-products"&&<ProductSourceEditor src={block.productSource??{mode:"all",categoryId:"",productIds:[],limit:4,title:"Featured Products"}} onChange={src=>set({productSource:src})}/>}
        {block.type==="banner"&&(<>
          <Field label={tr("Arxa Fon Şəkli", "Background Image")}>
            <ImageUploader value={block.bannerImageUrl} onChange={v=>set({bannerImageUrl:v})} aspectHint={tr("Tövsiyə: 1400×400px, geniş", "Recommended: 1400×400px, wide landscape")} />
          </Field>
          <Field label={block.bannerImageUrl ? tr("Üst qat rəngi", "Overlay Color") : tr("Arxa fon rəngi", "Background Color")}>
            <div className="flex items-center gap-2">
              <input type="color" value={block.bannerBg??"#0f172a"} onChange={e=>set({bannerBg:e.target.value})} className="w-8 h-8 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent p-0.5"/>
              <span className="text-xs text-gray-400 font-mono">{block.bannerBg??"#0f172a"}</span>
            </div>
          </Field>
          <Field label={tr("Başlıq", "Headline")}><input className={inputCls} value={block.bannerText??""} onChange={e=>set({bannerText:e.target.value})} placeholder={tr("Yay Satışı — 40%-ə qədər endirim", "Summer Sale — Up to 40% Off")}/></Field>
          <Field label={tr("Alt mətn", "Subtext")}><input className={inputCls} value={block.bannerSubtext??""} onChange={e=>set({bannerSubtext:e.target.value})} placeholder={tr("Məhdud müddətli təklif", "Limited time offer")}/></Field>
          <Field label={tr("Mətn rəngi", "Text Color")}><div className="flex items-center gap-2"><input type="color" value={block.textColor??"#ffffff"} onChange={e=>set({textColor:e.target.value})} className="w-8 h-8 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent p-0.5"/><span className="text-xs text-gray-400 font-mono">{block.textColor??"#ffffff"}</span></div></Field>
          <Field label={tr("Düymə mətni", "Button Text")}><input className={inputCls} value={block.ctaText??""} onChange={e=>set({ctaText:e.target.value})} placeholder={tr("Gizlətmək üçün boş buraxın", "Leave empty to hide")}/></Field>
          {block.ctaText&&<Field label={tr("Düymə rəngi", "Button Color")}><div className="flex items-center gap-2"><input type="color" value={block.ctaColor??"#16a34a"} onChange={e=>set({ctaColor:e.target.value})} className="w-8 h-8 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent p-0.5"/><span className="text-xs text-gray-400 font-mono">{block.ctaColor??"#16a34a"}</span></div></Field>}
          {block.ctaText&&<Field label={tr("Düymə mətn rəngi", "Button Text Color")}><div className="flex items-center gap-2"><input type="color" value={block.ctaBtnTextColor??"#ffffff"} onChange={e=>set({ctaBtnTextColor:e.target.value})} className="w-8 h-8 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent p-0.5"/><span className="text-xs text-gray-400 font-mono">{block.ctaBtnTextColor??"#ffffff"}</span></div></Field>}
          <Field label={`${block.bannerImageUrl ? tr("Üst qat", "Overlay") : tr("Arxa fon", "Background")} ${tr("Şəffaflığı", "Opacity")} — ${block.overlayOpacity??75}%`}><input type="range" min={0} max={100} value={block.overlayOpacity??75} onChange={e=>set({overlayOpacity:Number(e.target.value)})} className="w-full accent-green-600"/></Field>
        </>)}
        {block.type==="custom-html"&&<Field label="HTML / Embed"><textarea className={textareaCls} rows={8} value={block.html??""} onChange={e=>set({html:e.target.value})} placeholder="<div>Your HTML</div>"/></Field>}
        {block.type==="image-block"&&(<>
          <Field label={tr("Şəkil", "Image")}>
            <ImageUploader value={block.imageUrl} onChange={v=>set({imageUrl:v})} aspectHint={tr("İstənilən ölçü — tam en", "Any size — displayed full width")} />
          </Field>
          <Field label={tr("Alt mətn", "Alt Text")}><input className={inputCls} value={block.imageAlt??""} onChange={e=>set({imageAlt:e.target.value})} placeholder={tr("Şəkili təsvir edin", "Describe the image")}/></Field>
          <Field label={tr("Başlıq", "Caption")}><input className={inputCls} value={block.imageCaption??""} onChange={e=>set({imageCaption:e.target.value})} placeholder={tr("İstəyə bağlı başlıq", "Optional caption below image")}/></Field>
          <Field label={tr("Hündürlük", "Height")}><div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">{(["sm","md","lg"] as const).map(h=><button key={h} onClick={()=>set({imageHeight:h})} className={`flex-1 py-1.5 text-xs font-medium capitalize transition-colors ${(block.imageHeight||"md")===h?"bg-green-500 text-white":"bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>{h==="sm"?tr("Kiçik","Small"):h==="md"?tr("Orta","Medium"):tr("Böyük","Large")}</button>)}</div></Field>
        </>)}
        {block.type==="image-text"&&(<>
          <Field label={tr("Şəkil", "Image")}>
            <ImageUploader value={block.imageUrl} onChange={v=>set({imageUrl:v})} aspectHint={tr("Tövsiyə: kare və ya 4:3", "Recommended: square or 4:3")} />
          </Field>
          <Field label={tr("Şəkil mövqeyi", "Image Position")}><div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">{(["left","right"] as const).map(p=><button key={p} onClick={()=>set({imagePosition:p})} className={`flex-1 py-1.5 text-xs font-medium capitalize transition-colors ${(block.imagePosition||"left")===p?"bg-green-500 text-white":"bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>{tr("Şəkil", "Image")} {p==="left"?tr("solda","left"):tr("sağda","right")}</button>)}</div></Field>
          <Field label={tr("Başlıq", "Headline")}><input className={inputCls} value={block.heading??""} onChange={e=>set({heading:e.target.value})}/></Field>
          <Field label={tr("Alt mətn", "Subtext")}><textarea className={textareaCls} rows={2} value={block.subheading??""} onChange={e=>set({subheading:e.target.value})}/></Field>
          <Field label={tr("Mətn rəngi", "Text Color")}><div className="flex items-center gap-2"><input type="color" value={block.textColor??"#111827"} onChange={e=>set({textColor:e.target.value})} className="w-8 h-8 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent p-0.5"/><span className="text-xs text-gray-400 font-mono">{block.textColor??"#111827"}</span></div></Field>
          <Field label={tr("Düymə mətni", "Button Text")}><input className={inputCls} value={block.ctaText??""} onChange={e=>set({ctaText:e.target.value})} placeholder={tr("Gizlətmək üçün boş buraxın", "Leave empty to hide")}/></Field>
          {block.ctaText&&<Field label={tr("Düymə rəngi", "Button Color")}><div className="flex items-center gap-2"><input type="color" value={block.ctaColor??"#16a34a"} onChange={e=>set({ctaColor:e.target.value})} className="w-8 h-8 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent p-0.5"/><span className="text-xs text-gray-400 font-mono">{block.ctaColor??"#16a34a"}</span></div></Field>}
          {block.ctaText&&<Field label={tr("Düymə mətn rəngi", "Button Text Color")}><div className="flex items-center gap-2"><input type="color" value={block.ctaBtnTextColor??"#ffffff"} onChange={e=>set({ctaBtnTextColor:e.target.value})} className="w-8 h-8 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent p-0.5"/><span className="text-xs text-gray-400 font-mono">{block.ctaBtnTextColor??"#ffffff"}</span></div></Field>}
        </>)}
        {block.type==="whatsapp-widget"&&(<>
          <div className="px-3 py-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <p className="text-xs font-medium text-green-700 dark:text-green-400">{tr("Üzən WhatsApp Düyməsi", "Floating WhatsApp Button")}</p>
            <p className="text-[10px] text-green-600 dark:text-green-500 mt-0.5">{tr("Sağ aşağı küncdə yapışqan düymə.", "Sticky button in the bottom-right corner.")}</p>
          </div>
          <Field label={tr("Telefon nömrəsi", "Phone Number")}><input className={inputCls} value={block.waNumber??""} onChange={e=>set({waNumber:e.target.value})} placeholder="+994501234567"/></Field>
          <Field label={tr("Hazır mesaj", "Pre-filled Message")}><textarea className={textareaCls} rows={2} value={block.waMessage??""} onChange={e=>set({waMessage:e.target.value})}/></Field>
          <Field label={tr("Düymə yazısı", "Button Label")}><input className={inputCls} value={block.waLabel??""} onChange={e=>set({waLabel:e.target.value})} placeholder={tr("Bizimlə əlaqə", "Chat with us")}/></Field>
        </>)}
        {block.type==="socials"&&(<>
          <p className="text-[10px] text-gray-400">{tr("Profil URL-lərini əlavə edin. Gizlətmək üçün boş buraxın.", "Add profile URLs. Leave empty to hide.")}</p>
          {SOCIAL_PLATFORMS.map(p=>(
            <Field key={p.key} label={p.label}>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full flex-shrink-0" style={{background:p.color}}/><input className={inputCls} value={(block.socialLinks||{})[p.key]??""} onChange={e=>set({socialLinks:{...(block.socialLinks||{}),[p.key]:e.target.value}})} placeholder={p.placeholder}/></div>
            </Field>
          ))}
        </>)}
        {block.type==="reservation"&&(<>
          <Field label={tr("Başlıq", "Title")}><input className={inputCls} value={block.reservationTitle??""} onChange={e=>set({reservationTitle:e.target.value})} placeholder={tr("Rezervasiya edin", "Make a Reservation")}/></Field>
          <Field label={tr("Alt mətn", "Subtext")}><input className={inputCls} value={block.reservationSubtext??""} onChange={e=>set({reservationSubtext:e.target.value})} placeholder={tr("Bir neçə klikdə yerinizi qeyd edin.", "Book your spot in just a few clicks.")}/></Field>
          <Field label={tr("Xidmətlər", "Services")}>
            <div className="space-y-1.5">
              {(block.reservationServices||[]).map((s,i)=>(
                <div key={i} className="flex items-center gap-2">
                  <input className={`${inputCls} flex-1`} value={s} onChange={e=>{const arr=[...(block.reservationServices||[])];arr[i]=e.target.value;set({reservationServices:arr});}} placeholder={`${tr("Xidmət","Service")} ${i+1}`}/>
                  <button onClick={()=>set({reservationServices:(block.reservationServices||[]).filter((_,j)=>j!==i)})} className="p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"><X className="w-3.5 h-3.5"/></button>
                </div>
              ))}
              <button onClick={()=>set({reservationServices:[...(block.reservationServices||[]),""]})} className="flex items-center gap-1 text-[10px] font-medium text-green-600 hover:text-green-700 transition-colors">
                <Plus className="w-3 h-3"/> {tr("Xidmət əlavə et", "Add service")}
              </button>
            </div>
          </Field>
          <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <span className="text-xs text-gray-700 dark:text-gray-300">{tr("Qonaq sayı sahəsini göstər", "Show Guests field")}</span>
            <button onClick={()=>set({reservationShowGuests:!(block.reservationShowGuests??true)})} className={`relative w-9 h-5 rounded-full transition-colors ${(block.reservationShowGuests??true)?"bg-green-500":"bg-gray-200 dark:bg-gray-700"}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${(block.reservationShowGuests??true)?"translate-x-4":"translate-x-0.5"}`}/>
            </button>
          </div>
          <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <span className="text-xs text-gray-700 dark:text-gray-300">{tr("Qeydlər sahəsini göstər", "Show Notes field")}</span>
            <button onClick={()=>set({reservationShowNotes:!(block.reservationShowNotes??true)})} className={`relative w-9 h-5 rounded-full transition-colors ${(block.reservationShowNotes??true)?"bg-green-500":"bg-gray-200 dark:bg-gray-700"}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${(block.reservationShowNotes??true)?"translate-x-4":"translate-x-0.5"}`}/>
            </button>
          </div>
          <div className="px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-[10px] font-medium text-blue-700 dark:text-blue-400">{tr("Inflero Rezervasiyaları ilə sinxronizasiya", "Synced with Inflero Reservations")}</p>
            <p className="text-[10px] text-blue-500 dark:text-blue-500 mt-0.5">{tr("Bütün rezervasiyalar avtomatik olaraq idarə panelinizdə görünür.", "All bookings appear in your reservations dashboard automatically.")}</p>
          </div>
        </>)}
        {block.type==="category-grid"&&(<>
          <p className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800/60 rounded-lg p-3">{tr("Kateqoriyalar mağazanızdan avtomatik çəkilir.", "Categories are pulled from your store automatically.")}</p>
          <Field label={tr("Sütun sayı", "Columns")}>
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {[2,3,4,5,6].map(n=>(
                <button key={n} onClick={()=>set({categoryColumns:n})} className={`flex-1 py-1.5 text-xs font-medium transition-colors ${(block.categoryColumns??3)===n?"bg-green-500 text-white":"bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>{n}</button>
              ))}
            </div>
          </Field>
        </>)}
        {block.type==="testimonials"&&(<>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{tr("Rəylər", "Reviews")}</p>
            <button onClick={()=>set({testimonialItems:[...(block.testimonialItems||[{name:"Sarah M.",text:"Great quality! Arrived fast.",rating:5},{name:"James K.",text:"Will definitely order again.",rating:5},{name:"Leila A.",text:"Highly recommend this store.",rating:4}]),{name:"",text:"",rating:5}]})} className="flex items-center gap-1 text-[10px] font-medium text-green-600 hover:text-green-700 transition-colors">
              <Plus className="w-3 h-3"/> {tr("Rəy əlavə et", "Add review")}
            </button>
          </div>
          <div className="space-y-3">
            {(block.testimonialItems||[{name:"Sarah M.",text:"Great quality! Arrived fast.",rating:5},{name:"James K.",text:"Will definitely order again.",rating:5},{name:"Leila A.",text:"Highly recommend this store.",rating:4}]).map((r,i)=>(
              <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">{tr("Rəy", "Review")} {i+1}</span>
                  <button onClick={()=>set({testimonialItems:(block.testimonialItems||[]).filter((_,j)=>j!==i)})} className="p-0.5 text-gray-300 hover:text-red-500 transition-colors"><X className="w-3 h-3"/></button>
                </div>
                <input className={inputCls} placeholder={tr("Müştəri adı", "Customer name")} value={r.name} onChange={e=>{const items=[...(block.testimonialItems||[])];items[i]={...items[i],name:e.target.value};set({testimonialItems:items});}}/>
                <textarea className={textareaCls} rows={2} placeholder={tr("Rəy mətni", "Review text")} value={r.text} onChange={e=>{const items=[...(block.testimonialItems||[])];items[i]={...items[i],text:e.target.value};set({testimonialItems:items});}}/>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-500 mr-1">{tr("Qiymət:", "Rating:")}</span>
                  {[1,2,3,4,5].map(s=>(
                    <button key={s} onClick={()=>{const items=[...(block.testimonialItems||[])];items[i]={...items[i],rating:s};set({testimonialItems:items});}}>
                      <Star className={`w-3.5 h-3.5 ${s<=r.rating?"fill-yellow-400 text-yellow-400":"text-gray-300"}`}/>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>)}
      </div>
    </div>
  );
}

// ─── Row Settings Panel ───────────────────────────────────────────────────────

function RowSettingsPanel({ row, onChange, onClose, onAddBlockToColumn }: {
  row: RowItem; onChange: (r: RowItem) => void; onClose: () => void;
  onAddBlockToColumn: (colId: string, type: BlockType) => void;
}) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const [changingLayout, setChangingLayout] = useState(false);
  const [adjustingWidths, setAdjustingWidths] = useState(false);
  const [pickingForCol, setPickingForCol] = useState<string | null>(null);
  const set = (patch: Partial<RowItem>) => onChange({ ...row, ...patch });

  const changePreset = (preset: ColumnPreset) => {
    setChangingLayout(false);
    const newCols = preset.ratios.map((ratio, i) => ({
      id: row.columns[i]?.id ?? uid(), ratio, blocks: row.columns[i]?.blocks ?? [],
    }));
    onChange({ ...row, preset: preset.id, columns: newCols });
  };

  const currentPreset = COLUMN_PRESETS.find(p => p.id === row.preset);

  if (adjustingWidths) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <button onClick={() => setAdjustingWidths(false)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"><ArrowLeft className="w-3 h-3"/> {tr("Geri", "Back")}</button>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{tr("Sütun genişliklərini tənzimlə", "Adjust column widths")}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <WidthAdjuster
            preset={currentPreset ?? COLUMN_PRESETS[0]}
            initialRatios={row.columns.map(c => c.ratio)}
            onConfirm={ratios => {
              onChange({ ...row, columns: row.columns.map((c, i) => ({ ...c, ratio: ratios[i] ?? c.ratio })) });
              setAdjustingWidths(false);
            }}
            onBack={() => setAdjustingWidths(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400"><LayoutTemplate className="w-3.5 h-3.5"/></div>
          <div><p className="text-sm font-semibold text-gray-900 dark:text-white">{tr("Bölmə Parametrləri", "Section Settings")}</p><p className="text-[10px] text-gray-400">{row.columns.length} {tr("sütun", "columns")}</p></div>
        </div>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"><X className="w-4 h-4"/></button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        <Field label={tr("Bölmə adı", "Section Label")}><input className={inputCls} value={row.label} onChange={e=>set({label:e.target.value})}/></Field>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{tr("Sütun Düzümü", "Column Layout")}</p>
            <div className="flex gap-2">
              <button onClick={() => setAdjustingWidths(true)} className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">{tr("Genişlikləri tənzimlə", "Adjust widths")}</button>
              <button onClick={() => setChangingLayout(v => !v)} className="text-xs text-green-600 dark:text-green-400 font-medium hover:underline">{changingLayout ? tr("Ləğv et", "Cancel") : tr("Dəyişdir", "Change")}</button>
            </div>
          </div>
          {changingLayout ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-64 overflow-y-auto">
              <div className="grid grid-cols-2 gap-1 p-2">
                {COLUMN_PRESETS.map(preset => (
                  <button key={preset.id} onClick={() => changePreset(preset)} className="flex flex-col gap-1.5 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-left">
                    <PresetIcon ratios={preset.ratios}/>
                    <span className="text-[10px] text-gray-400">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
              <div className="flex gap-0.5 h-7 rounded overflow-hidden mb-2">
                {row.columns.map(col => {
                  const total = row.columns.reduce((a,c)=>a+c.ratio,0);
                  return <div key={col.id} className="bg-blue-500 flex items-center justify-center text-white text-[9px] font-bold" style={{flex:col.ratio}}>{Math.round(col.ratio/total*100)}%</div>;
                })}
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">{currentPreset?.label ?? row.preset} · {row.columns.length} {tr("sütun", "column")}{language !== "az" && row.columns.length!==1?"s":""}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={tr("Boşluq (kənar)", "Padding")}><select className={inputCls} value={row.padding??"md"} onChange={e=>set({padding:e.target.value as RowItem["padding"]})}><option value="none">{tr("Yox", "None")}</option><option value="sm">{tr("Kiçik", "Small")}</option><option value="md">{tr("Orta", "Medium")}</option><option value="lg">{tr("Böyük", "Large")}</option></select></Field>
          <Field label={tr("Aralıq", "Gap")}><select className={inputCls} value={row.gap??"md"} onChange={e=>set({gap:e.target.value as RowItem["gap"]})}><option value="sm">{tr("Kiçik", "Small")}</option><option value="md">{tr("Orta", "Medium")}</option><option value="lg">{tr("Böyük", "Large")}</option></select></Field>
        </div>
        <Field label={tr("Arxa fon rəngi", "Background Color")}>
          <div className="flex items-center gap-2">
            <input type="color" value={row.bgColor||"#ffffff"} onChange={e=>set({bgColor:e.target.value})} className="w-8 h-8 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent p-0.5"/>
            <input className={`${inputCls} flex-1`} value={row.bgColor??""} onChange={e=>set({bgColor:e.target.value})} placeholder={tr("Şəffaf", "Transparent")}/>
          </div>
        </Field>

        <div>
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">{tr("Sütunlardakı Blokları İdarə et", "Manage Blocks in Columns")}</p>
          <div className="space-y-3">
            {row.columns.map((col, ci) => {
              const total = row.columns.reduce((a,c)=>a+c.ratio,0);
              return (
                <div key={col.id} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
                    <Columns className="w-3 h-3 text-blue-500"/>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{tr("Sütun", "Column")} {ci+1}</span>
                    <span className="text-[10px] text-gray-400 ml-auto">{Math.round(col.ratio/total*100)}%</span>
                  </div>
                  <div className="px-3 py-2 space-y-1">
                    {col.blocks.map(block => (
                      <div key={block.id} className="flex items-center gap-2 py-1 group">
                        <div className="text-gray-400 flex-shrink-0">{BLOCK_META[block.type].icon}</div>
                        <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">{block.label}</span>
                        <button
                          onClick={() => onChange({ ...row, columns: row.columns.map(c => c.id!==col.id?c:{ ...c, blocks: c.blocks.filter(b=>b.id!==block.id) }) })}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        >
                          <Trash2 className="w-3 h-3"/>
                        </button>
                      </div>
                    ))}
                    {col.blocks.length === 0 && <p className="text-[10px] text-gray-300 dark:text-gray-600 italic py-0.5">{tr("Boş — bura blok buraxın", "Empty — drop a block here")}</p>}

                    {pickingForCol === col.id ? (
                      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden mt-1">
                        {(language === "az" ? BLOCK_GROUPS_AZ : BLOCK_GROUPS).map(group => (
                          <div key={group.label}>
                            <div className="px-2.5 py-1 bg-gray-50 dark:bg-gray-900/50">
                              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">{group.label}</span>
                            </div>
                            {group.types.map(type => (
                              <button key={type} onClick={() => { onAddBlockToColumn(col.id, type); setPickingForCol(null); }} className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-left border-b border-gray-100 dark:border-gray-700/50 last:border-0 transition-colors">
                                <div className="text-green-600 dark:text-green-400">{BLOCK_META[type].icon}</div>
                                <p className="text-xs text-gray-700 dark:text-gray-200">{pickLang(language, BLOCK_META_AZ[type].label, BLOCK_META[type].label)}</p>
                              </button>
                            ))}
                          </div>
                        ))}
                        <button onClick={() => setPickingForCol(null)} className="w-full py-1.5 text-xs text-gray-400 hover:text-gray-600 border-t border-gray-100 dark:border-gray-700 transition-colors">{tr("Ləğv et", "Cancel")}</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setPickingForCol(col.id)}
                        className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-xs text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:border-green-400 dark:hover:border-green-600 transition-colors mt-1"
                      >
                        <Plus className="w-3 h-3"/> {tr(`${ci+1}-ci sütuna blok əlavə et`, `Add block to col ${ci+1}`)}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Header Settings Panel ────────────────────────────────────────────────────

function HeaderSettingsPanel({ config, onUpdateConfig, onClose }: { config: WebsiteConfig; onUpdateConfig: (p: Partial<WebsiteConfig>) => void; onClose: () => void }) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const links = config.headerLinks || DEFAULT_HEADER_LINKS;
  const updateLink = (id: string, patch: Partial<HeaderLink>) => onUpdateConfig({ headerLinks: links.map(l => l.id===id?{...l,...patch}:l) });
  const addLink = () => onUpdateConfig({ headerLinks: [...links, { id: uid(), label: tr("Yeni Səhifə","New Page"), href: "/new-page" }] });
  const removeLink = (id: string) => onUpdateConfig({ headerLinks: links.filter(l => l.id!==id) });
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400"><Layout className="w-3.5 h-3.5"/></div>
          <div><p className="text-sm font-semibold text-gray-900 dark:text-white">{tr("Başlıq", "Header")}</p><p className="text-[10px] text-gray-400">{tr("Logo, naviqasiya, səbət", "Logo, navigation, cart")}</p></div>
        </div>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"><X className="w-4 h-4"/></button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        <div>
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">{tr("Loqo", "Logo")}</p>
          {config.logoUrl ? (
            <div className="relative rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center p-4">
              <img src={config.logoUrl} alt="Logo" className="h-10 w-auto object-contain max-w-full" onError={e=>{(e.target as HTMLImageElement).style.display="none"}}/>
              <button
                onClick={() => onUpdateConfig({ logoUrl: "" })}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/40 text-red-500 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-800/60 transition-colors"
              >
                <X className="w-3 h-3"/>
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50/30 dark:hover:bg-green-900/10 cursor-pointer transition-colors group">
              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors">
                <Upload className="w-4 h-4 text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors"/>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">{tr("Loqo yükləyin", "Upload logo")}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{tr("PNG, SVG, JPG · maks 2MB", "PNG, SVG, JPG · max 2MB")}</p>
              </div>
              <input
                type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="sr-only"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => onUpdateConfig({ logoUrl: ev.target?.result as string });
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          )}
          <p className="text-[10px] text-gray-400 mt-1.5">{tr("Boş buraxsanız mağaza adı göstəriləcək.", "Leave empty to show store name.")}</p>
        </div>
        <Field label={tr("Mağaza adı (ehtiyat)", "Store Name (fallback)")}><input className={inputCls} value={config.storeName} onChange={e=>onUpdateConfig({storeName:e.target.value})}/></Field>
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{tr("Nav Linkləri", "Nav Links")}</p>
            <button onClick={addLink} className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"><Plus className="w-3 h-3"/>{tr("Əlavə et", "Add")}</button>
          </div>
          <div className="space-y-1.5">
            {links.map(link=>(
              <div key={link.id} className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <GripVertical className="w-3 h-3 text-gray-300 flex-shrink-0"/>
                <input className="flex-1 min-w-0 text-xs bg-transparent text-gray-900 dark:text-white focus:outline-none" value={link.label} onChange={e=>updateLink(link.id,{label:e.target.value})}/>
                <input className="w-20 text-xs bg-transparent text-gray-400 focus:outline-none text-right" value={link.href} onChange={e=>updateLink(link.id,{href:e.target.value})}/>
                <button onClick={()=>removeLink(link.id)} className="p-1 rounded-md text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"><Trash2 className="w-3 h-3"/></button>
              </div>
            ))}
          </div>
        </div>
        <div className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <ShoppingCart className="w-3.5 h-3.5 text-gray-500"/>
          <p className="text-xs text-gray-600 dark:text-gray-400">{tr("Badceli səbət ikonu — həmişə görünür", "Cart icon with badge — always visible")}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Panel Tab Bar ────────────────────────────────────────────────────────────

type PanelTab = "blocks" | "design" | "payments" | "settings" | "email";
type AddPhase = null | "menu" | "blocks" | { kind: "layout" } | { kind: "widths"; preset: ColumnPreset; ratios: number[] };

function PanelTabBar({ active, onChange }: { active: PanelTab; onChange: (t: PanelTab) => void }) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const tabs: { key: PanelTab; label: string }[] = [
    { key: "blocks",   label: tr("Bloklar", "Blocks") },
    { key: "design",   label: tr("Dizayn",  "Design") },
    { key: "payments", label: tr("Ödəniş",  "Payments") },
    { key: "settings", label: tr("Ayarlar", "Settings") },
    { key: "email",    label: tr("E-poçt",  "Email") },
  ];
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-800">
      {tabs.map(t => <button key={t.key} onClick={() => onChange(t.key)} className={`flex-1 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${active===t.key?"border-green-500 text-green-600 dark:text-green-400":"border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}>{t.label}</button>)}
    </div>
  );
}

// ─── Blocks Panel ─────────────────────────────────────────────────────────────

function BlocksPanel({ config, selected, onSelect, onUpdate }: {
  config: WebsiteConfig; selected: SelectedItem;
  onSelect: (s: SelectedItem) => void; onUpdate: (c: ContentItem[]) => void;
}) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const [addPhase, setAddPhase] = useState<AddPhase>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(["r1"]));

  const toggleExpand = (id: string) => setExpandedRows(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  const moveItem = (i: number, dir: -1|1) => { const arr=[...config.content]; const t=i+dir; if(t<0||t>=arr.length)return; [arr[i],arr[t]]=[arr[t],arr[i]]; onUpdate(arr); };
  const removeItem = (id: string) => onUpdate(config.content.filter(c=>c.id!==id));
  const toggleVisible = (id: string) => onUpdate(config.content.map(c=>c.id===id?{...c,visible:!c.visible}:c));

  const addTopLevelBlock = (type: BlockType) => {
    const block = makeBlock(type);
    onUpdate([...config.content, block]);
    onSelect({ kind: "block", blockId: block.id });
    setAddPhase(null);
    toast.success(`${pickLang(language, BLOCK_META_AZ[type].label, BLOCK_META[type].label)} ${tr("əlavə edildi", "added")}`);
  };

  const addRow = (ratios: number[], presetId: string) => {
    const row = makeRow(ratios, presetId);
    onUpdate([...config.content, row]);
    onSelect({ kind: "row", rowId: row.id });
    setExpandedRows(prev => new Set([...prev, row.id]));
    setAddPhase(null);
    toast.success(tr("Bölmə əlavə edildi", "Section added"));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 flex items-center justify-between flex-shrink-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{tr("Seçmək və redaktə etmək üçün klikləyin", "Click to select & edit")}</p>
        <button
          onClick={() => setAddPhase(v => v ? null : "menu")}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
        >
          <Plus className="w-3 h-3"/> {tr("Yeni", "Add")}
        </button>
      </div>

      {/* Add menu */}
      {addPhase !== null && (
        <div className="mx-4 mb-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden flex-shrink-0">
          {addPhase === "menu" && (
            <div className="flex">
              <button onClick={() => setAddPhase("blocks")} className="flex-1 flex flex-col items-center gap-1.5 py-3 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors border-r border-gray-100 dark:border-gray-700">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600"><Layers className="w-4 h-4"/></div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{tr("Blok", "Block")}</span>
                <span className="text-[10px] text-gray-400">{tr("Tək element", "Single element")}</span>
              </button>
              <button onClick={() => setAddPhase({ kind: "layout" })} className="flex-1 flex flex-col items-center gap-1.5 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600"><LayoutTemplate className="w-4 h-4"/></div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{tr("Bölmə", "Section")}</span>
                <span className="text-[10px] text-gray-400">{tr("Çox sütunlu cərgə", "Multi-column row")}</span>
              </button>
              <button onClick={() => setAddPhase(null)} className="px-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 self-start pt-2"><X className="w-3.5 h-3.5"/></button>
            </div>
          )}

          {addPhase === "blocks" && (
            <>
              <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <button onClick={() => setAddPhase("menu")} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><ArrowLeft className="w-3.5 h-3.5"/></button>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{tr("Blok növünü seçin", "Choose block type")}</span>
                <button onClick={() => setAddPhase(null)} className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-3.5 h-3.5"/></button>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {(language === "az" ? BLOCK_GROUPS_AZ : BLOCK_GROUPS).map(group => (
                  <div key={group.label}>
                    <div className="px-3 py-1 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700/50">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{group.label}</span>
                    </div>
                    {group.types.map(type => (
                      <button key={type} onClick={() => addTopLevelBlock(type)} className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left border-b border-gray-100 dark:border-gray-700/50 last:border-0 transition-colors">
                        <div className="w-5 h-5 flex items-center justify-center text-green-600 dark:text-green-400">{BLOCK_META[type].icon}</div>
                        <div><p className="text-xs font-medium text-gray-800 dark:text-gray-200">{pickLang(language, BLOCK_META_AZ[type].label, BLOCK_META[type].label)}</p><p className="text-[10px] text-gray-400">{pickLang(language, BLOCK_META_AZ[type].description, BLOCK_META[type].description)}</p></div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}

          {typeof addPhase === "object" && addPhase.kind === "layout" && (
            <>
              <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <button onClick={() => setAddPhase("menu")} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><ArrowLeft className="w-3.5 h-3.5"/></button>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{tr("Sütun düzümünü seçin", "Choose column layout")}</span>
                <button onClick={() => setAddPhase(null)} className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-3.5 h-3.5"/></button>
              </div>
              <div className="max-h-60 overflow-y-auto p-2 grid grid-cols-2 gap-1.5">
                {COLUMN_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => setAddPhase({ kind: "widths", preset, ratios: [...preset.ratios] })}
                    className="flex flex-col gap-1.5 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left"
                  >
                    <PresetIcon ratios={preset.ratios}/>
                    <span className="text-[10px] text-gray-400">{preset.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {typeof addPhase === "object" && addPhase.kind === "widths" && (
            <WidthAdjuster
              preset={addPhase.preset}
              initialRatios={addPhase.ratios}
              onConfirm={ratios => addRow(ratios, addPhase.preset.id)}
              onBack={() => setAddPhase({ kind: "layout" })}
            />
          )}
        </div>
      )}

      {/* Content tree */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5">
        {config.content.map((item, i) => {
          if (isRow(item)) {
            const row = item;
            const expanded = expandedRows.has(row.id);
            const isSel = selected?.kind === "row" && selected.rowId === row.id;
            return (
              <div key={row.id} className={`rounded-xl border transition-all ${isSel?"border-blue-300 dark:border-blue-700":"border-gray-200 dark:border-gray-700"}`}>
                <div className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer rounded-xl transition-colors ${isSel?"bg-blue-50 dark:bg-blue-900/20":"bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"} ${expanded?"rounded-b-none":""}`} onClick={() => onSelect({ kind: "row", rowId: row.id })}>
                  <button onClick={e=>{e.stopPropagation();toggleExpand(row.id)}} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded?"":"-rotate-90"}`}/>
                  </button>
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${isSel?"bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400":"bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}><LayoutTemplate className="w-3.5 h-3.5"/></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{row.label}</p>
                    <p className="text-[10px] text-gray-400">{row.columns.length} {tr("sütun", "cols")} · {COLUMN_PRESETS.find(p=>p.id===row.preset)?.label??row.preset}</p>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0" onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>moveItem(i,-1)} disabled={i===0} className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-20"><ChevronUp className="w-3 h-3"/></button>
                    <button onClick={()=>moveItem(i,1)} disabled={i===config.content.length-1} className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-20"><ChevronDown className="w-3 h-3"/></button>
                    <button onClick={()=>toggleVisible(row.id)} className={`p-1 rounded-md transition-colors ${row.visible?"text-green-600":"text-gray-400"}`}>{row.visible?<Eye className="w-3 h-3"/>:<EyeOff className="w-3 h-3"/>}</button>
                    <button onClick={()=>removeItem(row.id)} className="p-1 rounded-md text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3"/></button>
                  </div>
                </div>
                {expanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700/50">
                    {row.columns.map((col, ci) => {
                      const total = row.columns.reduce((a,c)=>a+c.ratio,0);
                      return (
                        <div key={col.id} className="px-3 py-2 bg-gray-50/50 dark:bg-gray-900/20">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"/>
                            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">{tr("Sütun", "Col")} {ci+1} — {Math.round(col.ratio/total*100)}%</span>
                          </div>
                          <div className="space-y-1 pl-3">
                            {col.blocks.map(block => {
                              const isSB = selected?.kind==="row-block"&&selected.rowId===row.id&&selected.colId===col.id&&selected.blockId===block.id;
                              return (
                                <div key={block.id} onClick={()=>onSelect({kind:"row-block",rowId:row.id,colId:col.id,blockId:block.id})} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border cursor-pointer transition-all group ${isSB?"border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20":"border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300"}`}>
                                  <div className={`flex-shrink-0 ${isSB?"text-green-600 dark:text-green-400":"text-gray-400"}`}>{BLOCK_META[block.type].icon}</div>
                                  <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">{block.label}</span>
                                  <button onClick={e=>{e.stopPropagation();const nr={...row,columns:row.columns.map(c=>c.id!==col.id?c:{...c,blocks:c.blocks.filter(b=>b.id!==block.id)})};onUpdate(config.content.map(c=>isRow(c)&&c.id===row.id?nr:c));}} className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0"><Trash2 className="w-3 h-3"/></button>
                                </div>
                              );
                            })}
                            {col.blocks.length===0&&<p className="text-[10px] text-gray-300 dark:text-gray-600 italic py-0.5">{tr("Boş — bura blok buraxın", "Empty — drop a block here")}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          const block = item as Block;
          const meta = BLOCK_META[block.type];
          const isSel = selected?.kind==="block"&&selected.blockId===block.id;
          const isWa = block.type==="whatsapp-widget";
          return (
            <div key={block.id} onClick={()=>onSelect({kind:"block",blockId:block.id})} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${isSel?"border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20":block.visible?"border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300":"border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 opacity-50"}`}>
              <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0"/>
              <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${isSel?"bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400":isWa?"bg-green-100 dark:bg-green-900/20 text-green-600":"bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>{meta.icon}</div>
              <div className="flex-1 min-w-0"><p className="text-xs font-medium text-gray-900 dark:text-white truncate">{block.label}</p><p className="text-[10px] text-gray-400">{isWa ? tr("Üzən düymə", "Floating widget") : (pickLang(language, BLOCK_META_AZ[block.type].label, meta.label))}</p></div>
              <div className="flex items-center gap-0.5 flex-shrink-0" onClick={e=>e.stopPropagation()}>
                <button onClick={()=>moveItem(i,-1)} disabled={i===0} className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-20"><ChevronUp className="w-3 h-3"/></button>
                <button onClick={()=>moveItem(i,1)} disabled={i===config.content.length-1} className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-20"><ChevronDown className="w-3 h-3"/></button>
                <button onClick={()=>toggleVisible(block.id)} className={`p-1 rounded-md transition-colors ${block.visible?"text-green-600":"text-gray-400"}`}>{block.visible?<Eye className="w-3 h-3"/>:<EyeOff className="w-3 h-3"/>}</button>
                <button onClick={()=>removeItem(block.id)} className="p-1 rounded-md text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3"/></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Design / Payments / Settings ────────────────────────────────────────────

function DesignPanel({ config, onUpdate }: { config: WebsiteConfig; onUpdate: (c: Partial<WebsiteConfig>) => void }) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-5">
      <div>
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">{tr("Şablon", "Template")}</p>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map(t => (
            <button key={t.id} onClick={() => onUpdate({ template: t.id })} className={`relative overflow-hidden border-2 transition-all text-left ${t.cardRadius} ${config.template===t.id?"border-green-500 shadow-md shadow-green-500/20":"border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}>
              {/* Mini preview of style */}
              <div className={`h-16 ${t.bg} p-2 flex flex-col gap-1.5`}>
                {/* Nav bar */}
                <div className={`flex items-center justify-between px-1.5 py-0.5 rounded-md ${t.id==="dark"?"bg-gray-900":"bg-white/80"}`}>
                  <div className={`text-[7px] font-bold ${t.id==="elegant"?"tracking-widest":t.id==="vibrant"?"font-black":""}`} style={{color:t.accent}}>STORE</div>
                  <div className="flex gap-1">
                    {["",""," "].map((_,i)=><div key={i} className={`h-1 ${i===2?"w-2":"w-3"} rounded-sm ${t.id==="dark"?"bg-gray-700":"bg-gray-200"}`}/>)}
                  </div>
                </div>
                {/* Mock card */}
                <div className={`flex-1 ${t.cardRadius} overflow-hidden flex`} style={{background:t.id==="dark"?"#1f2937":t.id==="vibrant"?"#f5f3ff":"#f9f9f9",border:`1px solid ${t.id==="vibrant"?"#c4b5fd":"#e5e7eb"}`}}>
                  <div className="w-8 flex-shrink-0" style={{background:t.accent+"22"}}/>
                  <div className="flex-1 p-1 flex flex-col gap-0.5 justify-center">
                    <div className={`h-1 w-10 rounded-sm ${t.id==="dark"?"bg-gray-600":"bg-gray-200"}`}/>
                    <div className={`h-1.5 w-6 ${t.btnRadius} mt-0.5`} style={{background:t.accent}}/>
                  </div>
                </div>
              </div>
              <div className="px-2.5 py-1.5 bg-white dark:bg-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-900 dark:text-white block leading-none">{t.name}</span>
                  <span className="text-[9px] text-gray-400 leading-none">{t.id==="minimal"?tr("Kəskin & səliqəli","Sharp & clean"):t.id==="dark"?tr("Hamar & müasir","Sleek & modern"):t.id==="elegant"?tr("Lüks & zərif","Luxury & refined"):tr("Cəsarətli & ifadəli","Bold & expressive")}</span>
                </div>
                {config.template===t.id&&<div className="w-4 h-4 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white"/></div>}
              </div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">{tr("Marka Rəngləri", "Brand Colors")}</p>
        <div className="space-y-2">
          {[{label:tr("Əsas (Nav)","Primary (Nav)"),key:"primaryColor" as const,fallback:"#ffffff"},{label:tr("Vurğu (Düymələr/Qiymətlər)","Accent (Buttons/Prices)"),key:"accentColor" as const,fallback:"#16a34a"}].map(({label,key,fallback})=>(
            <div key={key} className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-md border border-gray-200 dark:border-gray-600" style={{background:config[key]||fallback}}/><span className="text-xs text-gray-700 dark:text-gray-300">{label}</span></div>
              <div className="flex items-center gap-1.5"><span className="text-[10px] font-mono text-gray-400">{config[key]||fallback}</span><input type="color" value={config[key]||fallback} onChange={e=>onUpdate({[key]:e.target.value})} className="w-7 h-7 rounded cursor-pointer border border-gray-200 dark:border-gray-600 bg-transparent p-0.5"/></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PaymentsPanel({ config, onUpdate }: { config: WebsiteConfig; onUpdate: (c: Partial<WebsiteConfig>) => void }) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const toggle = (id: string) => onUpdate({ paymentMethods: config.paymentMethods.map(m => m.id===id?{...m,enabled:!m.enabled}:m) });
  const epointEnabled = config.paymentMethods.find(m=>m.id==="epoint")?.enabled ?? false;

  const shippingMethods: { value: "standard" | "free_above" | "free" | "distance"; az: string; en: string; desc?: string }[] = [
    { value: "standard",   az: "Standart (Qiymət daxil et)", en: "Standard (Input price)" },
    { value: "free_above", az: "X AZN üzərində pulsuz",      en: "Free above X AZN" },
    { value: "free",       az: "Pulsuz Çatdırılma",          en: "Free Shipping" },
    { value: "distance",   az: "Məsafə Qaydası",             en: "Distance Rule" },
  ];

  const [locating, setLocating] = useState(false);
  const [addrSearching, setAddrSearching] = useState(false);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      onUpdate({ shippingOriginLat: lat, shippingOriginLng: lng });
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const data = await res.json();
        onUpdate({ shippingOriginAddress: data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
      } catch {
        onUpdate({ shippingOriginAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
      }
      setLocating(false);
    }, () => setLocating(false));
  };

  const searchAddress = async (addr: string) => {
    if (!addr.trim()) return;
    setAddrSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1`);
      const data = await res.json();
      if (data[0]) {
        onUpdate({ shippingOriginLat: parseFloat(data[0].lat), shippingOriginLng: parseFloat(data[0].lon), shippingOriginAddress: data[0].display_name });
      }
    } catch { /* ignore */ }
    setAddrSearching(false);
  };

  const ToggleRow = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-xs text-gray-700 dark:text-gray-300">{label}</span>
      <button onClick={onChange} className={`relative w-9 h-5 rounded-full flex-shrink-0 transition-colors ${checked ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`}/>
      </button>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-5">
      {/* Shipping */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{tr("Çatdırılma", "Shipping")}</p>
        {/* Field toggles */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 divide-y divide-gray-100 dark:divide-gray-800">
          <ToggleRow
            label={tr("E-poçt sahəsi", "Email field")}
            checked={config.shippingEmailEnabled}
            onChange={() => onUpdate({ shippingEmailEnabled: !config.shippingEmailEnabled })}
          />
          <ToggleRow
            label={tr("Şəhər sahəsi", "City field")}
            checked={config.shippingCityEnabled}
            onChange={() => onUpdate({ shippingCityEnabled: !config.shippingCityEnabled })}
          />
          <ToggleRow
            label={tr("Poçt kodu sahəsi", "ZIP code field")}
            checked={config.shippingZipEnabled}
            onChange={() => onUpdate({ shippingZipEnabled: !config.shippingZipEnabled })}
          />
        </div>
        {/* Shipping method */}
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{tr("Çatdırılma üsulu", "Shipping method")}</p>
          <div className="space-y-1.5">
            {shippingMethods.map(m => (
              <label key={m.value} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${config.shippingMethod === m.value ? "border-green-500 bg-green-50 dark:bg-green-900/10" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${config.shippingMethod === m.value ? "border-green-500 bg-green-500" : "border-gray-300 dark:border-gray-600"}`}/>
                <span className="text-xs text-gray-700 dark:text-gray-300 flex-1">{pickLang(language, m.az, m.en)}</span>
                <input type="radio" className="sr-only" checked={config.shippingMethod === m.value} onChange={() => onUpdate({ shippingMethod: m.value })}/>
              </label>
            ))}
          </div>
          {config.shippingMethod === "standard" && (
            <div className="mt-2">
              <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{tr("Çatdırılma qiyməti (₼)", "Shipping price (₼)")}</label>
              <input
                type="number" min={0} step={0.5}
                className={inputCls}
                value={config.shippingPrice}
                onChange={e => onUpdate({ shippingPrice: parseFloat(e.target.value) || 0 })}
                placeholder="5"
              />
            </div>
          )}
          {config.shippingMethod === "free_above" && (
            <div className="mt-2">
              <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{tr("Pulsuz çatdırılma limiti (₼)", "Free shipping threshold (₼)")}</label>
              <input
                type="number" min={0} step={1}
                className={inputCls}
                value={config.shippingFreeAbove}
                onChange={e => onUpdate({ shippingFreeAbove: parseFloat(e.target.value) || 0 })}
                placeholder="50"
              />
            </div>
          )}
          {config.shippingMethod === "distance" && (
            <div className="mt-3 space-y-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-900/10 p-3">
              {/* Pricing fields */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">{tr("Qiymətləndirmə", "Pricing")}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">{tr("Sabit qiymət / km (₼)", "Fixed price / km (₼)")}</label>
                    <input
                      type="number" min={0} step={0.1}
                      className={inputCls}
                      value={config.shippingDistanceBase}
                      onChange={e => onUpdate({ shippingDistanceBase: parseFloat(e.target.value) || 0 })}
                      placeholder="2"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">{tr("Əlavə dəyişən / km (₼)", "Extra variable / km (₼)")}</label>
                    <input
                      type="number" min={0} step={0.1}
                      className={inputCls}
                      value={config.shippingDistancePerKm}
                      onChange={e => onUpdate({ shippingDistancePerKm: parseFloat(e.target.value) || 0 })}
                      placeholder="0.5"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">{tr("Maksimum radius (km)", "Maximum radius (km)")}</label>
                  <input
                    type="number" min={1} step={1}
                    className={inputCls}
                    value={config.shippingDistanceMaxKm}
                    onChange={e => onUpdate({ shippingDistanceMaxKm: parseInt(e.target.value) || 1 })}
                    placeholder="15"
                  />
                  <p className="text-[9px] text-gray-400 mt-1">{tr(`Bu radiusdan kənarda çatdırılma olmayacaq.`, `No delivery beyond this radius.`)}</p>
                </div>
              </div>

              {/* Visual radius indicator */}
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="relative flex-shrink-0 w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-blue-300 dark:border-blue-600 opacity-60"/>
                  <div className="absolute inset-2 rounded-full border-2 border-dashed border-blue-400 dark:border-blue-500 opacity-40"/>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"/>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{tr("Çatdırılma zonası", "Delivery zone")}</p>
                  <p className="text-[9px] text-gray-400">{tr(`${config.shippingDistanceMaxKm} km radius · ${config.shippingDistanceBase} ₼/km + ${config.shippingDistancePerKm} ₼ əlavə`, `${config.shippingDistanceMaxKm} km radius · ${config.shippingDistanceBase} ₼/km + ${config.shippingDistancePerKm} ₼ extra`)}</p>
                </div>
              </div>

              {/* Origin location */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">{tr("Başlanğıc nöqtəsi", "Origin Location")}</p>
                <div className="flex gap-1.5">
                  <input
                    className={`${inputCls} flex-1`}
                    value={config.shippingOriginAddress}
                    onChange={e => onUpdate({ shippingOriginAddress: e.target.value })}
                    onKeyDown={e => e.key === "Enter" && searchAddress(config.shippingOriginAddress)}
                    placeholder={tr("Ünvan daxil edin…", "Enter address…")}
                  />
                  <button
                    onClick={() => searchAddress(config.shippingOriginAddress)}
                    disabled={addrSearching}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-[10px] font-medium transition-colors flex-shrink-0"
                  >
                    {addrSearching ? "…" : tr("Axtar", "Search")}
                  </button>
                </div>
                <button
                  onClick={detectLocation}
                  disabled={locating}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 text-[10px] font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
                >
                  <MapPin className="w-3 h-3"/>
                  {locating ? tr("Axtarılır…", "Locating…") : tr("Cari məkanımı istifadə et", "Use my current location")}
                </button>
                {config.shippingOriginLat !== null && config.shippingOriginLng !== null && (
                  <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <MapPin className="w-3 h-3 text-green-600 flex-shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] text-green-700 dark:text-green-400 font-medium truncate">{config.shippingOriginAddress || tr("Məkan təyin edildi", "Location set")}</p>
                      <p className="text-[9px] text-green-600 dark:text-green-500 font-mono">{config.shippingOriginLat?.toFixed(5)}, {config.shippingOriginLng?.toFixed(5)}</p>
                    </div>
                    <button onClick={() => onUpdate({ shippingOriginLat: null, shippingOriginLng: null, shippingOriginAddress: "" })} className="text-green-400 hover:text-green-600 transition-colors flex-shrink-0">
                      <X className="w-3 h-3"/>
                    </button>
                  </div>
                )}
                {config.shippingOriginLat === null && (
                  <p className="text-[9px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <span>⚠</span> {tr("Məkan hələ seçilməyib. Çatdırılma hesablaması işləməyəcək.", "No origin set. Distance calculation won't work.")}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700"/>
      {/* Payments */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{tr("Ödəniş üsulları", "Payment Methods")}</p>
        <p className="text-xs text-gray-400">{tr("Mağazanızda hansı ödəniş üsullarını qəbul edəcəyinizi seçin.", "Choose which payment methods to accept in your store.")}</p>
        {config.paymentMethods.map(m => (
          <div key={m.id} className={`rounded-xl border transition-all overflow-hidden ${m.enabled?"border-green-200 dark:border-green-800":"border-gray-200 dark:border-gray-700"}`}>
            <div className={`flex items-center gap-3 px-3 py-3 ${m.enabled?"bg-green-50 dark:bg-green-900/10":"bg-white dark:bg-gray-800"}`}>
              <span className="text-xl">{m.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{m.name}</p>
                <p className="text-[10px] text-gray-400">{m.id==="epoint" ? tr("Epoint ödəniş şlüzü vasitəsilə onlayn kart ödənişi", "Online card payment via Epoint gateway") : tr("Müştəri çatdırılma zamanı nağd ödəyir", "Customer pays in cash upon delivery")}</p>
              </div>
              <button onClick={() => toggle(m.id)} className={`relative w-9 h-5 rounded-full flex-shrink-0 transition-colors ${m.enabled?"bg-green-500":"bg-gray-200 dark:bg-gray-700"}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${m.enabled?"translate-x-4":"translate-x-0.5"}`}/>
              </button>
            </div>
            {m.id==="epoint" && epointEnabled && (
              <div className="px-3 pb-3 pt-1 bg-white dark:bg-gray-800 border-t border-green-100 dark:border-green-900 space-y-2">
                <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{tr("Epoint Şəxsi Açarı", "Epoint Private Key")}</label>
                <input
                  type="password"
                  className={inputCls}
                  value={config.epointPrivateKey ?? ""}
                  onChange={e => onUpdate({ epointPrivateKey: e.target.value })}
                  placeholder="sk_live_xxxxxxxxxxxxxxxx"
                />
                <p className="text-[10px] text-gray-400">{tr("Şəxsi açarınızı Epoint satıcı idarə panelinin API parametrlərindən tapın.", "Find your private key in the Epoint merchant dashboard under API settings.")}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Email Panel ──────────────────────────────────────────────────────────────

type EmailTemplate = { id: string; label: string; subject: string; body: string };

const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "order_received",
    label: "Order Received",
    subject: "We received your order #{order_id}",
    body: `Hi {customer_name},\n\nThank you for your order! We've received it and it's being processed.\n\nOrder ID: #{order_id}\nTotal: {order_total}\n\nWe'll notify you once your order ships.\n\nThanks,\n{store_name}`,
  },
  {
    id: "order_confirmed",
    label: "Order Confirmed",
    subject: "Your order #{order_id} is confirmed",
    body: `Hi {customer_name},\n\nGreat news — your order has been confirmed and is being prepared.\n\nOrder ID: #{order_id}\nEstimated delivery: {estimated_delivery}\n\nThanks for shopping with us!\n\n{store_name}`,
  },
  {
    id: "order_shipped",
    label: "Order Shipped",
    subject: "Your order is on the way! 📦",
    body: `Hi {customer_name},\n\nYour order #{order_id} has been shipped.\n\nTracking number: {tracking_number}\nCarrier: {carrier}\n\nYou can track your package using the link below.\n\n{store_name}`,
  },
  {
    id: "order_completed",
    label: "Order Completed",
    subject: "Your order #{order_id} has been delivered",
    body: `Hi {customer_name},\n\nYour order has been delivered! We hope you love your purchase.\n\nIf you have any questions or feedback, feel free to reply to this email.\n\nEnjoy your order!\n\n{store_name}`,
  },
  {
    id: "order_cancelled",
    label: "Order Cancelled",
    subject: "Your order #{order_id} has been cancelled",
    body: `Hi {customer_name},\n\nYour order #{order_id} has been cancelled as requested.\n\nIf you paid online, a refund will be processed within 3–5 business days.\n\nIf you have any questions, please contact us.\n\n{store_name}`,
  },
];

const EMAIL_TEMPLATE_LABELS: Record<string, { az: string; en: string }> = {
  order_received:  { az: "Sifariş Alındı",      en: "Order Received" },
  order_confirmed: { az: "Sifariş Təsdiqləndi", en: "Order Confirmed" },
  order_shipped:   { az: "Sifariş Göndərildi",  en: "Order Shipped" },
  order_completed: { az: "Sifariş Tamamlandı",  en: "Order Completed" },
  order_cancelled: { az: "Sifariş Ləğv Edildi", en: "Order Cancelled" },
};

function EmailPanel() {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_EMAIL_TEMPLATES);
  const [activeId, setActiveId] = useState<string>(DEFAULT_EMAIL_TEMPLATES[0].id);

  const active = templates.find(t => t.id === activeId)!;
  const update = (patch: Partial<EmailTemplate>) => setTemplates(prev => prev.map(t => t.id === activeId ? { ...t, ...patch } : t));

  const VARS = ["{customer_name}", "{order_id}", "{order_total}", "{store_name}", "{tracking_number}", "{estimated_delivery}"];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Template selector tabs */}
      <div className="shrink-0 flex gap-1.5 flex-wrap px-4 pt-4 pb-2 border-b border-gray-200 dark:border-gray-800">
        {templates.map(t => (
          <button key={t.id} onClick={() => setActiveId(t.id)}
            className={`text-[10px] font-medium px-2.5 py-1 rounded-full transition-colors ${activeId===t.id?"bg-green-500 text-white":"bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
            {(EMAIL_TEMPLATE_LABELS[t.id]?.[language as "az"|"en"]) ?? t.label}
          </button>
        ))}
      </div>
      {/* Editor */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <Field label={tr("E-poçt mövzusu", "Email Subject")}>
          <input className={inputCls} value={active.subject} onChange={e => update({ subject: e.target.value })} placeholder={tr("E-poçt mövzusu", "Email subject line")} />
        </Field>
        <Field label={tr("E-poçt məzmunu", "Email Body")}>
          <textarea
            className={`${inputCls} min-h-[220px] resize-y font-mono text-[11px] leading-relaxed`}
            value={active.body}
            onChange={e => update({ body: e.target.value })}
          />
        </Field>
        {/* Variable reference */}
        <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/20 px-3 py-3 space-y-2">
          <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-400">{tr("İstifadə edilə bilən dəyişənlər", "Available variables")}</p>
          <div className="flex flex-wrap gap-1.5">
            {VARS.map(v => (
              <span key={v} className="text-[9px] font-mono px-2 py-0.5 rounded bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 cursor-pointer select-all">{v}</span>
            ))}
          </div>
        </div>
        {/* Save */}
        <button
          onClick={() => toast.success(tr(`"${EMAIL_TEMPLATE_LABELS[active.id]?.az ?? active.label}" e-poçt şablonu saxlanıldı`, `"${active.label}" email saved`))}
          className="w-full py-2 text-xs font-semibold bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors">
          {tr("E-poçt Şablonunu Saxla", "Save Email Template")}
        </button>
      </div>
    </div>
  );
}

function SettingsPanel({ config, onUpdate }: { config: WebsiteConfig; onUpdate: (c: Partial<WebsiteConfig>) => void }) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const freeStorePath = storePath(config.domain || "mystore");
  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-5">
      {/* Custom Domain */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{tr("Xüsusi Domen", "Custom Domain")}</p>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
          <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="text-xs text-gray-400 flex-1">{tr("Öz domeninizi bağlayın", "Connect your own domain")}</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">{tr("Tezliklə", "Coming Soon")}</span>
        </div>
        <p className="text-[10px] text-gray-400">{tr("Pulsuz mağaza URL-iniz:", "Your free store URL:")} <span className="font-medium text-gray-600 dark:text-gray-300">{freeStorePath}</span></p>
      </div>
      {/* Danger Zone */}
      <div className="px-3 py-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
        <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2">{tr("Təhlükəli zona", "Danger Zone")}</p>
        <button onClick={() => toast.error(tr("Mağazanı Hesab → Saytlar bölməsindən deaktiv edin.", "Unpublish your store from Account → Sites."))} className="px-3 py-1.5 text-xs font-medium border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">{tr("Mağazanı Deaktiv et", "Unpublish Store")}</button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export type MyWebsiteProps = {
  tenantId?: string | null;
  companySlug?: string | null;
};

function defaultWebsiteConfig(companySlug?: string | null): WebsiteConfig {
  const slug = (companySlug?.trim() || "mystore").toLowerCase();
  return {
    template: "minimal", storeName: "My Store", tagline: "Quality products, delivered fast.",
    primaryColor: "", accentColor: "#16a34a", domain: slug, currency: "USD",
    content: DEFAULT_CONTENT, paymentMethods: PAYMENT_METHODS,
    globalShowAllProducts: true, selectedCategories: [], logoUrl: "",
    headerLinks: DEFAULT_HEADER_LINKS,
    shippingEmailEnabled: true, shippingCityEnabled: true, shippingZipEnabled: true,
    shippingMethod: "standard", shippingPrice: 5, shippingFreeAbove: 50,
    shippingDistanceBase: 2, shippingDistancePerKm: 0.5, shippingDistanceMaxKm: 15,
    shippingOriginLat: null, shippingOriginLng: null, shippingOriginAddress: "",
  };
}

export function MyWebsite({ tenantId = null, companySlug = null }: MyWebsiteProps = {}) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const [config, setConfig] = useState<WebsiteConfig>(() => {
    if (tenantId) {
      const saved = loadWebsiteConfigByTenant(tenantId);
      if (saved) return saved;
    }
    if (companySlug) {
      const saved = loadWebsiteConfigBySlug(companySlug);
      if (saved) return saved;
    }
    return defaultWebsiteConfig(companySlug);
  });

  useEffect(() => {
    if (!tenantId && !companySlug) return;
    const saved =
      (tenantId ? loadWebsiteConfigByTenant(tenantId) : null) ||
      (companySlug ? loadWebsiteConfigBySlug(companySlug) : null);
    if (saved) setConfig(saved);
  }, [tenantId, companySlug]);

  // Keep path-style domain in sync with company slug
  useEffect(() => {
    if (!companySlug?.trim()) return;
    const slug = companySlug.trim().toLowerCase();
    setConfig((prev) => (prev.domain === slug ? prev : { ...prev, domain: slug }));
  }, [companySlug]);

  const [panelTab, setPanelTab] = useState<PanelTab>("blocks");
  const [selected, setSelected] = useState<SelectedItem>(null);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [saving, setSaving] = useState(false);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const updateConfig = useCallback((patch: Partial<WebsiteConfig>) => setConfig(prev => ({ ...prev, ...patch })), []);
  const updateContent = useCallback((content: ContentItem[]) => setConfig(prev => ({ ...prev, content })), []);

  // ── Move block (DnD core) ────────────────────────────────────────────────────
  const moveBlock = useCallback((src: DragInfo, dstRowId: string | null, dstColId: string | null, insertAt: number) => {
    setConfig(prev => {
      let block: Block | undefined;

      const withoutSrc: ContentItem[] = prev.content.reduce<ContentItem[]>((acc, item) => {
        if (src.rowId === null) {
          if (!isRow(item) && item.id === src.blockId) { block = item; return acc; }
          return [...acc, item];
        }
        if (!isRow(item) || item.id !== src.rowId) return [...acc, item];
        return [...acc, {
          ...item,
          columns: item.columns.map(col => {
            if (col.id !== src.colId) return col;
            const idx = col.blocks.findIndex(b => b.id === src.blockId);
            if (idx >= 0) block = col.blocks[idx];
            return { ...col, blocks: col.blocks.filter(b => b.id !== src.blockId) };
          }),
        }];
      }, []);

      if (!block) return prev;

      if (dstRowId === null) {
        const at = Math.max(0, Math.min(insertAt, withoutSrc.length));
        return { ...prev, content: [...withoutSrc.slice(0, at), block, ...withoutSrc.slice(at)] };
      }

      return {
        ...prev,
        content: withoutSrc.map(item => {
          if (!isRow(item) || item.id !== dstRowId) return item;
          return {
            ...item,
            columns: item.columns.map(col => {
              if (col.id !== dstColId) return col;
              const at = Math.max(0, Math.min(insertAt, col.blocks.length));
              return { ...col, blocks: [...col.blocks.slice(0, at), block!, ...col.blocks.slice(at)] };
            }),
          };
        }),
      };
    });
  }, []);

  // ── DnD handlers ─────────────────────────────────────────────────────────────
  const handleBlockDragStart = useCallback((e: React.DragEvent, blockId: string, rowId: string, colId: string) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ blockId, rowId, colId }));
    e.dataTransfer.effectAllowed = "move";
    setActiveDragId(blockId);
  }, []);

  const handleBlockDragOver = useCallback((e: React.DragEvent, blockId: string, rowId: string, colId: string, pos: "before" | "after") => {
    e.preventDefault();
    e.stopPropagation();
    setConfig(prev => {
      const row = prev.content.find(c => isRow(c) && c.id === rowId) as RowItem | undefined;
      const col = row?.columns.find(c => c.id === colId);
      const idx = col?.blocks.findIndex(b => b.id === blockId) ?? 0;
      setDropTarget({ rowId, colId, insertAt: pos === "before" ? idx : idx + 1 });
      return prev;
    });
  }, []);

  const handleBlockDragEnd = useCallback(() => {
    setActiveDragId(null);
    setDropTarget(null);
  }, []);

  const handleColumnDragOver = useCallback((e: React.DragEvent, rowId: string, colId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(prev => {
      if (prev?.rowId === rowId && prev?.colId === colId) return prev;
      return { rowId, colId, insertAt: 9999 };
    });
  }, []);

  const handleColumnDrop = useCallback((e: React.DragEvent, rowId: string, colId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const src: DragInfo = JSON.parse(e.dataTransfer.getData("application/json"));
      setDropTarget(prev => {
        const insertAt = prev?.rowId === rowId && prev?.colId === colId ? prev.insertAt : 9999;
        moveBlock(src, rowId, colId, insertAt);
        return null;
      });
    } catch { setDropTarget(null); }
    setActiveDragId(null);
  }, [moveBlock]);

  const handleColumnDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTarget(null);
  }, []);

  const handleTopLevelDragOver = useCallback((e: React.DragEvent, blockId: string, pos: "before" | "after") => {
    e.preventDefault();
    e.stopPropagation();
    setConfig(prev => {
      const idx = prev.content.findIndex(c => !isRow(c) && c.id === blockId);
      if (idx >= 0) setDropTarget({ rowId: null, colId: null, insertAt: pos === "before" ? idx : idx + 1 });
      return prev;
    });
  }, []);

  const handleTopLevelDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    try {
      const src: DragInfo = JSON.parse(e.dataTransfer.getData("application/json"));
      setDropTarget(prev => {
        const insertAt = prev?.rowId === null && prev?.colId === null ? prev.insertAt : 9999;
        moveBlock(src, null, null, insertAt);
        return null;
      });
    } catch { setDropTarget(null); }
    setActiveDragId(null);
  }, [moveBlock]);

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDeleteBlock = useCallback((blockId: string, rowId: string, colId: string) => {
    setConfig(prev => ({
      ...prev,
      content: prev.content.map(item => {
        if (!isRow(item) || item.id !== rowId) return item;
        return { ...item, columns: item.columns.map(col => col.id !== colId ? col : { ...col, blocks: col.blocks.filter(b => b.id !== blockId) }) };
      }),
    }));
    if (selected?.kind === "row-block" && selected.blockId === blockId) setSelected(null);
  }, [selected]);

  const handleDeleteTopLevelBlock = useCallback((blockId: string) => {
    setConfig(prev => ({ ...prev, content: prev.content.filter(c => isRow(c) || c.id !== blockId) }));
    if (selected?.kind === "block" && selected.blockId === blockId) setSelected(null);
  }, [selected]);

  // ── Selection ─────────────────────────────────────────────────────────────────
  const handlePreviewBlockSelect = useCallback((encoded: string) => {
    const m = encoded.match(/^__row__(.+)__col__(.+)__block__(.+)$/);
    if (m) setSelected({ kind: "row-block", rowId: m[1], colId: m[2], blockId: m[3] });
    else setSelected({ kind: "block", blockId: encoded });
    setPanelTab("blocks");
  }, []);

  const updateSelectedBlock = useCallback((updated: Block) => {
    setConfig(prev => {
      if (selected?.kind === "block") return { ...prev, content: prev.content.map(c => !isRow(c) && c.id === updated.id ? updated : c) };
      if (selected?.kind === "row-block") {
        const { rowId, colId } = selected;
        return { ...prev, content: prev.content.map(c => { if (!isRow(c) || c.id !== rowId) return c; return { ...c, columns: c.columns.map(col => col.id !== colId ? col : { ...col, blocks: col.blocks.map(b => b.id === updated.id ? updated : b) }) }; }) };
      }
      return prev;
    });
  }, [selected]);

  const updateSelectedRow = useCallback((updated: RowItem) => {
    setConfig(prev => ({ ...prev, content: prev.content.map(c => isRow(c) && c.id === updated.id ? updated : c) }));
  }, []);

  const addBlockToColumn = useCallback((colId: string, type: BlockType) => {
    if (selected?.kind !== "row") return;
    const block = makeBlock(type);
    const rowId = selected.rowId;
    setConfig(prev => ({ ...prev, content: prev.content.map(c => { if (!isRow(c) || c.id !== rowId) return c; return { ...c, columns: c.columns.map(col => col.id !== colId ? col : { ...col, blocks: [...col.blocks, block] }) }; }) }));
    setSelected({ kind: "row-block", rowId, colId, blockId: block.id });
    toast.success(`${pickLang(language, BLOCK_META_AZ[type].label, BLOCK_META[type].label)} ${tr("əlavə edildi", "added")}`);
  }, [selected]);

  const publicStoreUrl = storeUrl(companySlug?.trim() || config.domain || "mystore");
  const publicStorePath = storePath(companySlug?.trim() || config.domain || "mystore");

  const handleSave = async () => {
    setSaving(true);
    const slug = (companySlug?.trim() || config.domain || "mystore").toLowerCase();
    const toSave = { ...config, domain: slug };
    setConfig(toSave);
    saveWebsiteConfig({ config: toSave, tenantId, companySlug: slug });
    await new Promise(r => setTimeout(r, 400));
    setSaving(false);
    toast.success(tr("Sayt saxlanıldı!", "Website saved!"));
  };


  // Resolved selection
  const selectedBlock = (() => {
    if (!selected || selected.kind === "header" || selected.kind === "row") return null;
    if (selected.kind === "block") { const item = config.content.find(c => !isRow(c) && c.id === selected.blockId); return item && !isRow(item) ? item : null; }
    if (selected.kind === "row-block") {
      const row = config.content.find(c => isRow(c) && c.id === selected.rowId) as RowItem | undefined;
      return row?.columns.find(c => c.id === selected.colId)?.blocks.find(b => b.id === selected.blockId) ?? null;
    }
    return null;
  })();

  const selectedRow = selected?.kind === "row"
    ? config.content.find(c => isRow(c) && c.id === selected.rowId) as RowItem | undefined
    : undefined;

  const showBlock = !!selectedBlock;
  const showRow = !!selectedRow;
  const showHeader = selected?.kind === "header";

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Top bar */}
      <div className="flex-shrink-0 h-12 flex items-center justify-between px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0"><Globe className="w-4 h-4 text-white"/></div>
          <div><p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">{tr("Mənim Saytım", "My Website", "Мой сайт")}</p><p className="text-[10px] text-gray-400 mt-0.5 leading-none">{tr("Canlı redaktor", "Live editor", "Живой редактор")}</p></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <button onClick={() => setViewport("desktop")} className={`px-2.5 py-1.5 transition-colors ${viewport==="desktop"?"bg-green-500 text-white":"text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"}`}><Monitor className="w-3.5 h-3.5"/></button>
            <button onClick={() => setViewport("mobile")} className={`px-2.5 py-1.5 transition-colors ${viewport==="mobile"?"bg-green-500 text-white":"text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"}`}><Smartphone className="w-3.5 h-3.5"/></button>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>
            <span className="text-[10px] text-green-700 dark:text-green-400 font-medium">{publicStorePath}</span>
            <button onClick={() => {
              const url = publicStoreUrl;
              try {
                navigator.clipboard.writeText(url).then(() => toast.success("URL copied!")).catch(() => { const el = document.createElement("textarea"); el.value = url; document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el); toast.success("URL copied!"); });
              } catch { toast.success("URL: " + url); }
            }}><Copy className="w-3 h-3 text-green-600 ml-0.5"/></button>
          </div>
          <a href={publicStorePath} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><ExternalLink className="w-3 h-3"/> {tr("Aç", "Open", "Открыть")}</a>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-60">
            {saving ? <RefreshCw className="w-3 h-3 animate-spin"/> : <Save className="w-3 h-3"/>}
            {saving ? tr("Saxlanılır…", "Saving…") : tr("Saxla", "Save")}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <div className="w-72 flex-shrink-0 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
          {showBlock && (
            <>
              <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-800">
                <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"><ArrowLeft className="w-3.5 h-3.5"/> {tr("Geri", "Back")}</button>
                <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600"/>
                <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{selectedBlock!.label}</span>
              </div>
              <div className="flex-1 overflow-hidden"><BlockSettingsPanel block={selectedBlock!} onChange={updateSelectedBlock} onClose={() => setSelected(null)}/></div>
            </>
          )}
          {!showBlock && showRow && (
            <>
              <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-800">
                <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"><ArrowLeft className="w-3.5 h-3.5"/> {tr("Geri", "Back")}</button>
                <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600"/>
                <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{selectedRow!.label}</span>
              </div>
              <div className="flex-1 overflow-hidden"><RowSettingsPanel row={selectedRow!} onChange={updateSelectedRow} onClose={() => setSelected(null)} onAddBlockToColumn={addBlockToColumn}/></div>
            </>
          )}
          {!showBlock && !showRow && showHeader && (
            <>
              <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-800">
                <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"><ArrowLeft className="w-3.5 h-3.5"/> {tr("Geri", "Back")}</button>
                <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600"/>
                <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{tr("Başlıq", "Header")}</span>
              </div>
              <div className="flex-1 overflow-hidden"><HeaderSettingsPanel config={config} onUpdateConfig={updateConfig} onClose={() => setSelected(null)}/></div>
            </>
          )}
          {!showBlock && !showRow && !showHeader && (
            <>
              <PanelTabBar active={panelTab} onChange={setPanelTab}/>
              <div className="flex-1 overflow-hidden">
                {panelTab==="blocks"   && <BlocksPanel config={config} selected={selected} onSelect={setSelected} onUpdate={updateContent}/>}
                {panelTab==="design"   && <DesignPanel config={config} onUpdate={updateConfig}/>}
                {panelTab==="payments" && <PaymentsPanel config={config} onUpdate={updateConfig}/>}
                {panelTab==="settings" && <SettingsPanel config={config} onUpdate={updateConfig}/>}
                {panelTab==="email" && <EmailPanel />}
              </div>
            </>
          )}
        </div>

        {/* Preview canvas */}
        <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-950 p-4">
          <div className={`h-full transition-all duration-300 ${viewport === "mobile" ? "flex justify-center" : ""}`}>
            <LivePreview
              config={config}
              selected={selected}
              viewport={viewport}
              dropTarget={dropTarget}
              activeDragId={activeDragId}
              onSelectHeader={() => setSelected({ kind: "header" })}
              onSelectBlock={handlePreviewBlockSelect}
              onSelectRow={rowId => { setSelected({ kind: "row", rowId }); setPanelTab("blocks"); }}
              onBlockDragStart={handleBlockDragStart}
              onBlockDragOver={handleBlockDragOver}
              onBlockDragEnd={handleBlockDragEnd}
              onColumnDragOver={handleColumnDragOver}
              onColumnDrop={handleColumnDrop}
              onColumnDragLeave={handleColumnDragLeave}
              onTopLevelDragOver={handleTopLevelDragOver}
              onTopLevelDrop={handleTopLevelDrop}
              onDeleteBlock={handleDeleteBlock}
              onDeleteTopLevelBlock={handleDeleteTopLevelBlock}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Read-only storefront canvas (public My Store page). */
export function StorefrontView({ config }: { config: WebsiteConfig }) {
  const noop = () => {};
  return (
    <div className="h-full min-h-screen bg-white dark:bg-gray-950">
      <LivePreview
        config={config}
        selected={null}
        viewport="desktop"
        dropTarget={null}
        activeDragId={null}
        publicMode
        onSelectHeader={noop}
        onSelectBlock={noop}
        onSelectRow={noop}
        onBlockDragStart={noop}
        onBlockDragOver={noop}
        onBlockDragEnd={noop}
        onColumnDragOver={noop}
        onColumnDrop={noop}
        onColumnDragLeave={noop}
        onTopLevelDragOver={noop}
        onTopLevelDrop={noop}
        onDeleteBlock={noop}
        onDeleteTopLevelBlock={noop}
      />
    </div>
  );
}
