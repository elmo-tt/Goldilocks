export type OutlookEvent = { id: string; subject: string; start: string; end: string; location?: string; organizer?: string };
export type FilevineTask = { id: string; title: string; assignee: string; due?: string; status: "open" | "done" };

export const OUTLOOK_EVENTS: OutlookEvent[] = [
  { id: "o-101", subject: "Consult – Smith (Truck MVA)", start: "2025-10-09T10:00:00-04:00", end: "2025-10-09T10:30:00-04:00", location: "Conference A", organizer: "Intake" },
  { id: "o-102", subject: "Hearing – Rivera", start: "2025-10-10T09:30:00-04:00", end: "2025-10-10T10:30:00-04:00", location: "Zoom" },
  { id: "o-103", subject: "Marketing Review", start: "2025-10-11T11:00:00-04:00", end: "2025-10-11T11:45:00-04:00" }
];

export const FILEVINE_TASKS: FilevineTask[] = [
  { id: "fv-201", title: "Call client – Smith", assignee: "Paralegal", due: "2025-10-09", status: "open" },
  { id: "fv-202", title: "Review demand letter – Gomez", assignee: "Attorney", due: "2025-10-10", status: "open" },
  { id: "fv-203", title: "Prep discovery – Rivera", assignee: "Paralegal", due: "2025-10-12", status: "open" }
];

export function simulatePushTaskToFilevine(title: string) {
  const id = "fv-" + Math.floor(1000 + Math.random() * 9000);
  return { id, title, assignee: "Unassigned", status: "open" as const };
}
