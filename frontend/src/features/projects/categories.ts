import type { projectCategory } from "@/lib/db/schema";

export type ProjectCategory = (typeof projectCategory.enumValues)[number];

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

export const CATEGORY_LABELS: Record<string, string> = LABELS;
