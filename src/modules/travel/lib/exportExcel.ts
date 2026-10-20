/**
 * Export data to a properly-formatted CSV file that opens correctly in Excel.
 *
 * Rules applied:
 *  - UTF-8 BOM so Excel recognises the encoding and doesn't mangle non-ASCII chars
 *  - Every field is double-quoted so commas inside values don't break columns
 *  - Embedded double-quotes are escaped as ""  (RFC 4180)
 *  - CRLF line endings (what Excel expects)
 */
export function exportToExcel(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
  filename: string
): void {
  const escape = (v: string | number | boolean | null | undefined): string => {
    const s = String(v ?? "").replace(/"/g, '""');
    return `"${s}"`;
  };

  const lines: string[] = [
    headers.map(escape).join(","),
    ...rows.map(row => row.map(escape).join(",")),
  ];

  const csv = "﻿" + lines.join("\r\n"); // BOM + CRLF
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
