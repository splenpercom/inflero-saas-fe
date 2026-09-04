export { DiningProvider } from "./DiningProvider";

export { RestaurantMenu } from "./features/menu";
export { RestaurantTables } from "./features/tables";
export { RestaurantKOT } from "./features/kot";
export { RestaurantBookings } from "./features/bookings";
export { QRMenuSite } from "./features/qr-menu";
export { BookTablePage } from "./features/book-table";

export {
  MenuPage,
  TablesPage,
  KotPage,
  BookingsPage,
  QRMenuPage,
  BookTablePublicPage,
} from "./pages";

export {
  diningDashboardRouteElements,
  diningPublicRouteElements,
  diningDashboardRouteConfig,
  diningPublicRouteConfig,
} from "./routes";

export type {
  RestaurantTable,
  RestaurantInfo,
  ActiveTableOrder,
  MenuItem,
  MenuCategory,
  TableBooking,
  BookingSettings,
} from "./lib/restaurantStorage";

export {
  getTables,
  saveTables,
  getRestaurantInfo,
  saveRestaurantInfo,
  getActiveOrders,
  saveActiveOrders,
  getMenuCategories,
  saveMenuCategories,
  getBookings,
  saveBooking,
  saveBookings,
  getBookingSettings,
  saveBookingSettings,
  makeTableQrUrl,
} from "./lib/restaurantStorage";
