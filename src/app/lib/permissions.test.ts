import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { matchesPathPrefix, resolveRoutePermission } from "./permissions";

describe("matchesPathPrefix", () => {
  it("matches exact and child paths only", () => {
    assert.equal(matchesPathPrefix("/dashboard/sales/pos", "/dashboard/sales/pos"), true);
    assert.equal(matchesPathPrefix("/dashboard/sales/pos/settings", "/dashboard/sales/pos"), true);
    assert.equal(matchesPathPrefix("/dashboard/sales/pos-orders", "/dashboard/sales/pos"), false);
    assert.equal(matchesPathPrefix("/dashboard/inventory/sub-category", "/dashboard/inventory/category"), false);
  });
});

describe("resolveRoutePermission", () => {
  const cases: Array<[string, string, string]> = [
    ["/dashboard/sales/pos-orders", "Orders", "view"],
    ["/dashboard/sales/pos-orders/abc", "Orders", "view"],
    ["/dashboard/sales/pos", "POS", "view"],
    ["/dashboard/sales/pos/printer", "POS", "view"],
    ["/dashboard/sales/return", "Sales Returns", "view"],
    ["/dashboard/sales/return/1", "Sales Returns", "view"],
    ["/dashboard/sales/invoices", "Orders", "view"],
    ["/dashboard/orders", "Orders", "view"],
    ["/dashboard/inventory/products", "Products", "view"],
    ["/dashboard/inventory/products/create", "Products", "create"],
    ["/dashboard/inventory/products/abc/edit", "Products", "edit"],
    ["/dashboard/inventory/category", "Categories", "view"],
    ["/dashboard/inventory/sub-category", "Sub Categories", "view"],
    ["/dashboard/inventory/brands", "Brands", "view"],
    ["/dashboard/inventory/units", "Units", "view"],
    ["/dashboard/finances/expenses", "Expenses", "view"],
    ["/dashboard/finances/income", "Income", "view"],
    ["/dashboard/finances/payments", "Payments", "view"],
    ["/dashboard/people/customers", "Customers", "view"],
    ["/dashboard/people/suppliers", "Purchases", "view"],
    ["/dashboard/people/warehouses", "Stock", "view"],
    ["/dashboard/restaurant/menu", "Menu", "view"],
    ["/dashboard/restaurant/tables", "Tables", "view"],
    ["/dashboard/restaurant/bookings", "Bookings", "view"],
    ["/dashboard/restaurant/kot", "Menu", "view"],
    ["/dashboard/stock/manage", "Stock", "view"],
    ["/dashboard/purchases/return", "Purchases", "view"],
    ["/dashboard", "Dashboard", "view"],
    ["/dashboard/tasks", "Tasks", "view"],
    ["/dashboard/offers", "Offers", "view"],
    ["/dashboard/profile", "", ""], // always allowed → null
  ];

  for (const [path, module, action] of cases) {
    it(`${path} → ${module || "null"} ${action}`.trim(), () => {
      const rule = resolveRoutePermission(path);
      if (!module) {
        assert.equal(rule, null);
        return;
      }
      assert.deepEqual(rule, { module, action });
    });
  }

  it("does not let shorter prefixes steal sibling paths", () => {
    // If sorting/boundary broke, these would flip modules.
    assert.deepEqual(resolveRoutePermission("/dashboard/sales/pos-orders"), {
      module: "Orders",
      action: "view",
    });
    assert.deepEqual(resolveRoutePermission("/dashboard/sales/pos"), {
      module: "POS",
      action: "view",
    });
    assert.deepEqual(resolveRoutePermission("/dashboard/inventory/category"), {
      module: "Categories",
      action: "view",
    });
    assert.deepEqual(resolveRoutePermission("/dashboard/inventory/sub-category"), {
      module: "Sub Categories",
      action: "view",
    });
  });
});
