import "./styles/my-website.css";

export { LanguageProvider, useLanguage, useTr } from "./i18n";
export type { Language } from "./i18n";

export { MyWebsiteProvider } from "./MyWebsiteProvider";

export { MyWebsite, StorefrontView } from "./features/builder";
export type {
  BlockType,
  Block,
  WebsiteConfig,
  ContentItem,
  RowItem,
} from "./features/builder/types";
export {
  loadWebsiteConfigBySlug,
  loadWebsiteConfigByTenant,
  saveWebsiteConfig,
} from "./lib/websiteConfigStorage";

export { WebOrders } from "./features/orders";
export type { WebOrder, OrderItem } from "./features/orders/types";

export { WebReport } from "./features/reports";
export type { Period } from "./features/reports/data";

export { MyWebsitePage, WebOrdersPage, WebReportPage } from "./pages";
export { myWebsiteRouteElements, myWebsiteRouteConfig } from "./routes";

export { cn } from "./ui";
