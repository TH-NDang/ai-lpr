import type { ColumnSchema, FacetMetadataSchema } from "./schema";
import { type SearchParamsType, searchParamsSerializer } from "./search-params";
import { infiniteQueryOptions, keepPreviousData } from "@tanstack/react-query";

// Định nghĩa LogsMeta là đối tượng trống, vì không còn cần percentiles
export type LogsMeta = Record<string, never>;

export type InfiniteQueryMeta<TMeta = Record<string, unknown>> = {
  totalRowCount: number;
  filterRowCount: number;
  chartData: { timestamp: number; [key: string]: number }[];
  facets: Record<string, FacetMetadataSchema>;
  metadata?: TMeta;
};

export const dataOptions = (search: SearchParamsType) => {
  return infiniteQueryOptions({
    queryKey: ["data-table", searchParamsSerializer({ ...search, uuid: null })], // remove uuid as it would otherwise retrigger a fetch
    queryFn: async ({ pageParam = 0 }) => {
      const start = (pageParam as number) * search.size;
      const serialize = searchParamsSerializer({ ...search, start });
      const response = await fetch(`/overview/api${serialize}`);
      return response.json() as Promise<{
        data: ColumnSchema[];
        meta: InfiniteQueryMeta<LogsMeta>;
      }>;
    },
    initialPageParam: 0,
    getNextPageParam: (_lastGroup, groups) => groups.length,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
};
