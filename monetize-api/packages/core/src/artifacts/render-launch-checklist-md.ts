import type { MonetizationReport } from "@monetize-api/schemas";

function statusLabel(status: string): string {
  switch (status) {
    case "done":
      return "[x]";
    case "in_progress":
      return "[~]";
    default:
      return "[ ]";
  }
}

export function renderLaunchChecklistMd(report: MonetizationReport): string {
  const { launchChecklist } = report;
  const items = launchChecklist.items
    .map((item) => {
      const note = item.notes ? ` — ${item.notes}` : "";
      return `- ${statusLabel(item.status)} **${item.label}** (\`${item.id}\`)${note}`;
    })
    .join("\n");

  return [`# ${launchChecklist.title}`, "", items, ""].join("\n");
}
