import type { RuntimeConfigModel } from "../models/runtime-config.model";

export type RuntimeConfig = typeof RuntimeConfigModel.$inferSelect;
