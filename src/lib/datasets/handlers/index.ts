import type { Payload } from "payload";
import type { DatasetResult } from "../runner";

export type DatasetHandler = (
  payload: Payload,
  ctx?: { user?: { id: string; role: string } },
  query?: Record<string, unknown>,
) => Promise<DatasetResult>;

import { payloadCountHandler } from "./payload-count";
import { restJsonHandler } from "./rest-json";

/** Static registry — ponytail: no dynamic imports (webpack-safe). */
export const DATASET_HANDLERS: Record<string, DatasetHandler> = {
  "payload-count": payloadCountHandler,
  "rest-json": restJsonHandler,
};

export function getDatasetHandler(name: string): DatasetHandler | undefined {
  return DATASET_HANDLERS[name];
}
