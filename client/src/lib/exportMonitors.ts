import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Monitor } from "@/api/monitorApi";

function ts() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function statusLabel(m: Monitor) {
  if (!m.isActive) return "Paused";
  return m.status.charAt(0).toUpperCase() + m.status.slice(1);
}

export function exportMonitorsToCSV(monitors: Monitor[], filterLabel = "monitors") {
  const rows = [
    ["Name", "URL", "Status", "Uptime (24h)", "Interval (min)", "Latency threshold (ms)", "Downtime threshold (min)", "Last checked"],
    ...monitors.map((m) => [
      m.name,
      m.url,
      statusLabel(m),
      m.uptimePercent24h != null ? `${m.uptimePercent24h.toFixed(2)}%` : "—",
      String(m.intervalMinutes),
      String(m.latencyThresholdMs),
      String(m.downtimeThresholdMinutes),
      m.lastCheckedAt ? new Date(m.lastCheckedAt).toISOString() : "—",
    ]),
  ];
  const csv = rows
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pulseboard-${filterLabel}-${ts()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportMonitorsToPDF(monitors: Monitor[], filterLabel = "monitors") {
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Pulseboard — Monitors Report", 40, 46);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(`Filter: ${filterLabel}`, 40, 66);
  doc.text(`Total monitors: ${monitors.length}`, 40, 82);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 98);

  autoTable(doc, {
    startY: 120,
    head: [["Name", "URL", "Status", "Uptime 24h", "Interval", "Latency thr.", "Downtime thr.", "Last checked"]],
    body: monitors.map((m) => [
      m.name,
      m.url,
      statusLabel(m),
      m.uptimePercent24h != null ? `${m.uptimePercent24h.toFixed(2)}%` : "—",
      `${m.intervalMinutes}m`,
      `${m.latencyThresholdMs}ms`,
      `${m.downtimeThresholdMinutes}m`,
      m.lastCheckedAt ? new Date(m.lastCheckedAt).toLocaleString() : "—",
    ]),
    styles: { font: "helvetica", fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [244, 247, 251] },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 2) {
        const v = String(data.cell.raw ?? "");
        if (v === "Down") {
          data.cell.styles.textColor = [200, 30, 30];
          data.cell.styles.fontStyle = "bold";
        } else if (v === "Paused") {
          data.cell.styles.textColor = [140, 100, 20];
        }
      }
    },
  });

  doc.save(`pulseboard-${filterLabel}-${ts()}.pdf`);
}