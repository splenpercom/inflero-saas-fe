import assert from "node:assert/strict";
import test from "node:test";
import {
  formatNetworkPrinterTarget,
  parsePrinterTarget,
  printerTargetLabel,
} from "./posPrinterSettings";

test("parses net:host:port kitchen/bar targets", () => {
  assert.deepEqual(parsePrinterTarget("net:192.168.0.22:9100"), {
    kind: "network",
    host: "192.168.0.22",
    port: 9100,
  });
  assert.deepEqual(parsePrinterTarget("192.168.0.21"), {
    kind: "network",
    host: "192.168.0.21",
    port: 9100,
  });
  assert.deepEqual(parsePrinterTarget("192.168.0.21:9100"), {
    kind: "network",
    host: "192.168.0.21",
    port: 9100,
  });
});

test("parses named Windows printers", () => {
  assert.deepEqual(parsePrinterTarget("EPSON TM-T20"), {
    kind: "named",
    name: "EPSON TM-T20",
  });
});

test("format + label", () => {
  assert.equal(formatNetworkPrinterTarget("192.168.0.22", 9100), "net:192.168.0.22:9100");
  assert.equal(printerTargetLabel("net:192.168.0.22:9100"), "192.168.0.22:9100 (LAN)");
});
