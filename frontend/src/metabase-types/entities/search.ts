import type {
  SearchResultId,
  SearchModel,
  SearchResult,
} from "metabase-types/api";

/** SearchResult with most properties optional */
export type WeakSearchResult<
  Id extends SearchResultId = SearchResultId,
  Model extends SearchModel = SearchModel,
> = Partial<SearchResult<Id, Model>> &
  Pick<SearchResult<Id, Model>, "id" | "name" | "model">;
