import type { PrColumn } from "./pr";

export interface PrFilters {
  columns?: PrColumn[];
  repos?: number[];
  author?: string;
  reviewer?: string;
  labels?: string[];
  search?: string;
  sort?: "updated" | "created" | "comments";
  order?: "asc" | "desc";
  stale?: boolean;
}
