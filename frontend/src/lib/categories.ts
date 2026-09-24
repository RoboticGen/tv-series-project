import type { projectCategory } from "@/db/schema";

export type ProjectCategory = (typeof projectCategory.enumValues)[number];

// `satisfies` makes tsc flag a category added to the enum but not here.
const LABELS = {
  robotics: "Robotics",
  electronics: "Electronics",
  iot: "IoT",
  coding_software: "Coding & Software",
  ai_ml: "AI / ML",
  drones: "Drones",
  threed_printing: "3D Printing",
  sensors_automation: "Sensors & Automation",
  competitions: "Competitions",
  other: "Other",
} satisfies Record<ProjectCategory, string>;

// Widened so callers can look up untrusted strings (e.g. ?category=).
export const CATEGORY_LABELS: Record<string, string> = LABELS;
