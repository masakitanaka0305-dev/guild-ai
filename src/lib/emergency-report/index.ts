// Emergency Report — inappropriate content reporting system

export type ReportReason = "Spam" | "Plagiarism" | "Illegal" | "Other";

export interface EmergencyReport {
  id: string;
  guildId: string;
  reporterHandle: string;
  reason: ReportReason;
  description: string;
  reportedAt: string;
  status: "pending" | "reviewed" | "dismissed";
}

const reports: EmergencyReport[] = [];
let seq = 1;

export function sendReport(
  guildId: string,
  reporterHandle: string,
  reason: ReportReason,
  description: string,
): EmergencyReport {
  const report: EmergencyReport = {
    id: `rpt_${String(seq).padStart(4, "0")}`,
    guildId,
    reporterHandle,
    reason,
    description,
    reportedAt: new Date("2026-04-30T09:00:00+09:00").toISOString(),
    status: "pending",
  };
  reports.push(report);
  seq++;
  return report;
}

export function getReports(): EmergencyReport[] {
  return [...reports];
}

export function getPendingCount(): number {
  return reports.filter((r) => r.status === "pending").length;
}

export function _resetEmergencyReport(): void {
  reports.length = 0;
  seq = 1;
}
