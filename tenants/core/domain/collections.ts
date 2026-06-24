import type { CollectionConfig } from "payload";
import { Projects } from "./collections/Projects";
import { ProjectPhases } from "./collections/ProjectPhases";
import { Units } from "./collections/Units";
import { Investors } from "./collections/Investors";
import { Investments } from "./collections/Investments";
import { Distributions } from "./collections/Distributions";
import { Customers } from "./collections/Customers";
import { Sales } from "./collections/Sales";
import { Payments } from "./collections/Payments";

/**
 * All collections belonging to the real-estate vertical.
 * Imported by tenants/core/config.ts and registered into payload.config.ts
 * when the active tenant's verticals include "realestate".
 */
export const realestateCollections: CollectionConfig[] = [
  Projects,
  ProjectPhases,
  Units,
  Investors,
  Investments,
  Distributions,
  Customers,
  Sales,
  Payments,
];
