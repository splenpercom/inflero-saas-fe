/**
 * Drop these routes into your React Router tree.
 *
 * Example:
 *   import { myWebsiteRoutes } from "./my-website-module/src/routes";
 *   <Route path="/dashboard">{myWebsiteRoutes}</Route>
 *
 * Or mount at any base path you prefer.
 */
import { Navigate, Route } from "react-router";
import { MyWebsitePage, WebReportPage } from "./pages";
import { ModuleRouteGuard } from "../../app/components/modules/ModuleRouteGuard";
import { WebsiteEditorRouteGuard } from "../../app/components/modules/WebsiteEditorRouteGuard";

/** JSX route elements — nest under your layout Route */
export const myWebsiteRouteElements = (
  <>
    <Route path="my-website" element={<WebsiteEditorRouteGuard><MyWebsitePage /></WebsiteEditorRouteGuard>} />
    <Route path="my-website/orders" element={<Navigate to="/dashboard/sales/pos-orders?source=WEB" replace />} />
    <Route path="my-website/reports" element={<ModuleRouteGuard module="WEB_EDITOR"><WebReportPage /></ModuleRouteGuard>} />
  </>
);

/** Flat config if you prefer data routers */
export const myWebsiteRouteConfig = [
  { path: "my-website", element: <WebsiteEditorRouteGuard><MyWebsitePage /></WebsiteEditorRouteGuard> },
  { path: "my-website/orders", element: <Navigate to="/dashboard/sales/pos-orders?source=WEB" replace /> },
  { path: "my-website/reports", element: <ModuleRouteGuard module="WEB_EDITOR"><WebReportPage /></ModuleRouteGuard> },
];
