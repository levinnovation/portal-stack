import type { Payload } from "payload";
import type { DatasetContext, DatasetResult } from "../runner";

export type DatasetHandler = (
  payload: Payload,
  ctx?: DatasetContext,
  query?: Record<string, unknown>,
) => Promise<DatasetResult>;

import { payloadCountHandler } from "./payload-count";
import { restJsonHandler } from "./rest-json";
import { externalDbHandler } from "./external-db";

/** Static registry — ponytail: no dynamic imports (webpack-safe). */
export const DATASET_HANDLERS: Record<string, DatasetHandler> = {
  "payload-count": payloadCountHandler,
  "rest-json": restJsonHandler,
  "external-db": externalDbHandler,
};

export function getDatasetHandler(name: string): DatasetHandler | undefined {
  return DATASET_HANDLERS[name];
}
