import type { PaidCallSimulation } from "@monetize-api/schemas";

export function renderPaidCallSimulationJson(simulation: PaidCallSimulation): string {
  return `${JSON.stringify(simulation, null, 2)}\n`;
}
