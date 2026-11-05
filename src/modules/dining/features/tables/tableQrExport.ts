import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { QRCodeSVG } from "qrcode.react";
import { zipSync } from "fflate";
import jsPDF from "jspdf";

const QR_PX = 280;
/** Space between QR bottom edge and label baseline area (keep compact for print/PDF). */
const LABEL_GAP_PX = 4;
const LABEL_PX = 26;

function safeFilePart(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "table";
}

function waitForSvg(host: HTMLElement, attempts = 30): Promise<SVGElement> {
  return new Promise((resolve, reject) => {
    let left = attempts;
    const tick = () => {
      const svg = host.querySelector("svg");
      if (svg) {
        resolve(svg);
        return;
      }
      left -= 1;
      if (left <= 0) {
        reject(new Error("QR render failed"));
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

async function renderQrSvgMarkup(value: string, size: number): Promise<string> {
  const code = value.trim();
  if (!code) throw new Error("QR render failed");

  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = "position:fixed;left:-9999px;top:0;pointer-events:none;";
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    // React 18 createRoot.render is async — flush so SVG exists before we read it.
    flushSync(() => {
      root.render(
        createElement(QRCodeSVG, {
          value: code,
          size,
          level: "H",
          includeMargin: false,
        }),
      );
    });
    const svg = await waitForSvg(host);
    const clone = svg.cloneNode(true) as SVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    return new XMLSerializer().serializeToString(clone);
  } finally {
    root.unmount();
    host.remove();
  }
}

function svgMarkupToPngDataUrl(svgMarkup: string, size: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas unavailable"));
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        reject(err);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to rasterize QR"));
    };
    img.src = url;
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = src;
  });
}

/** PNG with QR on top and table name centered underneath. */
export async function buildLabeledQrPng(
  qrUrl: string,
  tableName: string,
): Promise<{ dataUrl: string; bytes: Uint8Array }> {
  const svgMarkup = await renderQrSvgMarkup(qrUrl, QR_PX);
  const qrDataUrl = await svgMarkupToPngDataUrl(svgMarkup, QR_PX);
  const qrImg = await loadImage(qrDataUrl);

  const canvas = document.createElement("canvas");
  canvas.width = QR_PX;
  canvas.height = QR_PX + LABEL_GAP_PX + LABEL_PX;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(qrImg, 0, 0, QR_PX, QR_PX);

  ctx.fillStyle = "#111111";
  ctx.font = "600 18px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const label = tableName.trim() || "Table";
  const maxWidth = QR_PX - 12;
  let draw = label;
  if (ctx.measureText(draw).width > maxWidth) {
    while (draw.length > 1 && ctx.measureText(`${draw}…`).width > maxWidth) {
      draw = draw.slice(0, -1);
    }
    draw = `${draw}…`;
  }
  ctx.fillText(draw, QR_PX / 2, QR_PX + LABEL_GAP_PX + LABEL_PX / 2);

  const dataUrl = canvas.toDataURL("image/png");
  const bin = atob(dataUrl.split(",")[1] ?? "");
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { dataUrl, bytes };
}

function triggerDownload(blob: Blob, filename: string) {
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob),
    download: filename,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

export type TableQrExportItem = {
  id: string;
  name: string;
  number: number;
  qrUrl: string;
};

/** ZIP of labeled PNGs — one file per table, filename includes table name. */
export async function downloadAllTableQrsZip(items: TableQrExportItem[]): Promise<void> {
  if (items.length === 0) throw new Error("No tables");
  const files: Record<string, Uint8Array> = {};
  const used = new Set<string>();
  for (const item of items) {
    const { bytes } = await buildLabeledQrPng(item.qrUrl, item.name);
    let base = `qr-${item.number}-${safeFilePart(item.name)}`;
    let name = `${base}.png`;
    let n = 2;
    while (used.has(name)) {
      name = `${base}-${n}.png`;
      n += 1;
    }
    used.add(name);
    files[name] = bytes;
  }
  const zipped = zipSync(files, { level: 6 });
  triggerDownload(new Blob([zipped], { type: "application/zip" }), "table-qr-codes.zip");
}

/** A4 PDF grid: each cell is QR with table name underneath (baked into PNG). */
export async function downloadAllTableQrsPdf(items: TableQrExportItem[]): Promise<void> {
  if (items.length === 0) throw new Error("No tables");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 12;
  const cols = 3;
  const gapX = 8;
  const gapY = 6;
  const cellW = (pageW - margin * 2 - gapX * (cols - 1)) / cols;
  const imgW = cellW * 0.92;
  const imgH = imgW * ((QR_PX + LABEL_GAP_PX + LABEL_PX) / QR_PX);
  const cellH = imgH;

  let col = 0;
  let y = margin;
  let first = true;

  for (const item of items) {
    if (!first && col === 0 && y + cellH > pageH - margin) {
      doc.addPage();
      y = margin;
    }
    first = false;

    const x = margin + col * (cellW + gapX);
    const { dataUrl } = await buildLabeledQrPng(item.qrUrl, item.name);
    const imgX = x + (cellW - imgW) / 2;
    doc.addImage(dataUrl, "PNG", imgX, y, imgW, imgH);

    col += 1;
    if (col >= cols) {
      col = 0;
      y += cellH + gapY;
    }
  }

  doc.save("table-qr-codes.pdf");
}
