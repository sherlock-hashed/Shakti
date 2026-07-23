import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Check, MonitorDetail } from "@/api/mockData";

function safeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "monitor";
}

function violation(check: Check, monitor: MonitorDetail): string {
  const reasons: string[] = [];
  if (!check.isUp) reasons.push("Down");
  if (check.responseTimeMs > monitor.latencyThresholdMs) reasons.push("Slow");
  return reasons.join(", ") || "OK";
}

export function exportChecksToCSV(monitor: MonitorDetail) {
  const rows = [
    ["Timestamp", "Status Code", "Response Time (ms)", "Is Up", "Violation"],
    ...monitor.checks
      .slice()
      .reverse()
      .map((c) => [
        new Date(c.checkedAt).toISOString(),
        String(c.statusCode),
        String(c.responseTimeMs),
        c.isUp ? "yes" : "no",
        violation(c, monitor),
      ]),
  ];
  const csv = rows
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName(monitor.name)}-checks.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportChecksToPDF(monitor: MonitorDetail) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Monitor Report", 40, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(90);
  doc.text(`Name: ${monitor.name}`, 40, 76);
  doc.text(`URL: ${monitor.url}`, 40, 92);
  doc.text(`Status: ${monitor.status.toUpperCase()}`, 40, 108);
  doc.text(
    `Uptime (24h): ${monitor.uptimePercent24h != null ? monitor.uptimePercent24h.toFixed(2) + "%" : "—"}`,
    pageWidth / 2,
    76,
  );
  doc.text(`Latency threshold: ${monitor.latencyThresholdMs}ms`, pageWidth / 2, 92);
  doc.text(`Downtime threshold: ${monitor.downtimeThresholdMinutes} min`, pageWidth / 2, 108);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 124);

  autoTable(doc, {
    startY: 144,
    head: [["Timestamp", "Status", "Response (ms)", "Result"]],
    body: monitor.checks
      .slice()
      .reverse()
      .map((c) => [
        new Date(c.checkedAt).toLocaleString(),
        String(c.statusCode),
        String(c.responseTimeMs),
        violation(c, monitor),
      ]),
    styles: { font: "helvetica", fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [244, 247, 251] },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 3) {
        const value = String(data.cell.raw ?? "");
        if (value !== "OK") {
          data.cell.styles.textColor = [200, 30, 30];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  doc.save(`${safeName(monitor.name)}-report.pdf`);
}