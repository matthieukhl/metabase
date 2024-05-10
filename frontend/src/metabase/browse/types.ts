import type { RecentCollectionItem } from "metabase-types/api";
import type { WeakSearchResult } from "metabase-types/entities/search";

/** Model retrieved through the search endpoint */
export type ModelResult = WeakSearchResult<number, "dataset">;

/** A recently viewed model */
export type RecentModel = Omit<RecentCollectionItem, "model"> & {
  model: "dataset";
};
