export interface SeedMeta<T = unknown> {
  id: string;
  version: number;
  description: string;
  data: T;
}

export interface SeedRecord {
  id: string;
  version: number;
  checksum: string;
  appliedAt: string;
}
