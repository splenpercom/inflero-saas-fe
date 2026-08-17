/**
 * Drop these routes into your React Router tree.
 *
 * Example:
 *   import { myWebsiteRoutes } from "./my-website-module/src/routes";
 *   <Route path="/dashboard">{myWebsiteRoutes}</Route>
 *
 * Or mount at any base path you prefer.
 */
import { Route } from "react-router";
import { MyWebsitePage, WebOrdersPage, WebReportPage } from "./pages";
import { ModuleRouteGuard } from "../../app/components/modules/ModuleRouteGuard";

/** JSX route elements — nest under your layout Route */
export const myWebsiteRouteElements = (
  <>
    <Route path="my-website" element={<ModuleRouteGuard module="WEB_EDITOR"><MyWebsitePage /></ModuleRouteGuard>} />
    <Route path="my-website/orders" element={<ModuleRouteGuard module="WEB_EDITOR"><WebOrdersPage /></ModuleRouteGuard>} />
    <Route path="my-website/reports" element={<ModuleRouteGuard module="WEB_EDITOR"><WebReportPage /></ModuleRouteGuard>} />
  </>
);

/** Flat config if you prefer data routers */
export const myWebsiteRouteConfig = [
  { path: "my-website", element: <ModuleRouteGuard module="WEB_EDITOR"><MyWebsitePage /></ModuleRouteGuard> },
  { path: "my-website/orders", element: <ModuleRouteGuard module="WEB_EDITOR"><WebOrdersPage /></ModuleRouteGuard> },
  { path: "my-website/reports", element: <ModuleRouteGuard module="WEB_EDITOR"><WebReportPage /></ModuleRouteGuard> },
];
