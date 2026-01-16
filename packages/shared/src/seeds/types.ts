export type SeedMeta<T = unknown> = {
  id: string;
  version: number;
  description: string;
  data: T;
};

export type SeedRecord = {
  id: string;
  version: number;
  checksum: string;
  appliedAt: string;
};
