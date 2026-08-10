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

/** JSX route elements — nest under your layout Route */
export const myWebsiteRouteElements = (
  <>
    <Route path="my-website" element={<MyWebsitePage />} />
    <Route path="my-website/orders" element={<WebOrdersPage />} />
    <Route path="my-website/reports" element={<WebReportPage />} />
  </>
);

/** Flat config if you prefer data routers */
export const myWebsiteRouteConfig = [
  { path: "my-website", element: <MyWebsitePage /> },
  { path: "my-website/orders", element: <WebOrdersPage /> },
  { path: "my-website/reports", element: <WebReportPage /> },
];
