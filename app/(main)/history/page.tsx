"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryStates, parseAsJson } from "nuqs";
import { useDebounce } from "use-debounce";
import {
  type ColumnFiltersState,
  type SortingState,
  type PaginationState,
  type VisibilityState,
  useReactTable,
  getCoreRowModel,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { HistoryTable } from "../../../components/history/history-table";
import { Filter } from "../../../components/history/history-filters";
import { HistoryChat } from "../../../components/history/history-chat";
import { getColumns } from "../../../components/history/columns";
import type { HistoryQueryResultItem } from "@/lib/db/queries";
import { cn } from "@/lib/utils";
import { RefreshCw, RotateCcw } from "lucide-react";
import { env } from "@/env";

const API_BASE_URL = env.NEXT_PUBLIC_API_URL!;

interface ApiHistoryResponse {
  rows: HistoryQueryResultItem[];
  totalRowCount: number;
}

interface ApiFilterOptionsResponse {
  ocrEngines: string[];
  vehicleTypes: string[];
  sources: string[];
}

const defaultPagination: PaginationState = { pageIndex: 0, pageSize: 10 };
const defaultSorting: SortingState = [{ id: "date", desc: true }];
const defaultFilters: ColumnFiltersState = [];

export default function HistoryPage(): React.JSX.Element {
  const [queryState, setQueryState] = useQueryStates({
    filters: parseAsJson<ColumnFiltersState>(
      (v) => v as ColumnFiltersState
    ).withDefault(defaultFilters),
    sorting: parseAsJson<SortingState>((v) => v as SortingState).withDefault(
      defaultSorting
    ),
    pagination: parseAsJson<PaginationState>(
      (v) => v as PaginationState
    ).withDefault(defaultPagination),
  });

  const filters = queryState.filters ?? defaultFilters;
  const sorting = queryState.sorting ?? defaultSorting;
  const pagination = queryState.pagination ?? defaultPagination;

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [debouncedFilters] = useDebounce(filters, 300);

  const { data: filterOptions, isLoading: isLoadingOptions } =
    useQuery<ApiFilterOptionsResponse>({
      queryKey: ["historyFilterOptions"],
      queryFn: async () => {
        const response = await fetch(`${API_BASE_URL}/history/options`);
        if (!response.ok) {
          throw new Error(
            `Không thể tải tùy chọn bộ lọc: ${response.statusText}`
          );
        }
        return response.json();
      },
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    });

  const { data, isLoading, isError, error, refetch, isFetching } =
    useQuery<ApiHistoryResponse>({
      queryKey: ["historyData", debouncedFilters, sorting, pagination],
      queryFn: async () => {
        const params = new URLSearchParams();
        params.set("pageIndex", pagination.pageIndex.toString());
        params.set("pageSize", pagination.pageSize.toString());

        if (sorting.length > 0) {
          params.set("sortId", sorting[0].id);
          params.set("sortDesc", sorting[0].desc.toString());
        }

        debouncedFilters.forEach((filter) => {
          const filterValue = filter.value;
          const filterId = filter.id;

          if (
            filterId === "date" &&
            typeof filterValue === "object" &&
            filterValue !== null
          ) {
            const range = filterValue as { from?: Date; to?: Date };
            if (range.from instanceof Date)
              params.set("dateFrom", range.from.toISOString().split("T")[0]);
            if (range.to instanceof Date)
              params.set("dateTo", range.to.toISOString().split("T")[0]);
          } else if (
            filterId === "confidenceDetection" &&
            Array.isArray(filterValue)
          ) {
            if (filterValue[0] !== undefined)
              params.set("confidenceMin", filterValue[0].toString());
            if (filterValue[1] !== undefined)
              params.set("confidenceMax", filterValue[1].toString());
          } else if (filterId === "processTime" && Array.isArray(filterValue)) {
            if (filterValue[0] !== undefined)
              params.set("processTimeMin", filterValue[0].toString());
            if (filterValue[1] !== undefined)
              params.set("processTimeMax", filterValue[1].toString());
          } else if (filterValue !== undefined && filterValue !== null) {
            params.set(filterId, String(filterValue));
          }
        });

        const response = await fetch(
          `${API_BASE_URL}/history?${params.toString()}`
        );
        if (!response.ok) {
          throw new Error(
            `Không thể tải dữ liệu lịch sử: ${response.statusText}`
          );
        }
        return response.json();
      },
      placeholderData: (previousData) => previousData,
      refetchOnWindowFocus: true,
    });

  const columns = useMemo(() => getColumns(filterOptions), [filterOptions]);

  const table = useReactTable({
    data: data?.rows ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      sorting,
      columnFilters: filters,
      pagination,
      columnVisibility,
    },
    onSortingChange: (updater) =>
      setQueryState({
        sorting: typeof updater === "function" ? updater(sorting) : updater,
      }),
    onColumnFiltersChange: (updater) =>
      setQueryState({
        filters: typeof updater === "function" ? updater(filters) : updater,
      }),
    onPaginationChange: (updater) =>
      setQueryState({
        pagination:
          typeof updater === "function" ? updater(pagination) : updater,
      }),
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  const resetFiltersAndSorting = () => {
    setQueryState({
      filters: defaultFilters,
      sorting: defaultSorting,
    });
  };

  return (
    <div className="container mx-auto py-4 md:px-4 lg:px-6 relative">
      <div className="flex items-center space-x-4 h-8 mb-4">
        <SidebarToggle />
        <Separator orientation="vertical" className="h-full" />
        <h1 className="text-2xl font-bold whitespace-nowrap">
          Lịch sử nhận dạng
        </h1>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <div className="flex flex-wrap gap-2">
          {" "}
          {table.getAllColumns().map((column) => {
            const meta = column.columnDef.meta as { filterVariant?: string };
            if (!meta?.filterVariant) return null;

            return (
              <div
                key={column.id}
                className="flex-shrink-0 w-full md:min-w-[120px] md:w-auto"
              >
                <Filter column={column} table={table} />
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFiltersAndSorting}
            disabled={
              JSON.stringify(filters) === JSON.stringify(defaultFilters) &&
              JSON.stringify(sorting) === JSON.stringify(defaultSorting)
            }
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Đặt lại bộ lọc
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            Làm mới
          </Button>
        </div>
      </div>

      <HistoryTable
        data={data?.rows ?? []}
        columns={columns}
        isLoading={isLoading}
        isError={isError}
        error={error as Error}
        isFetching={isFetching}
        onRefetch={refetch}
        pagination={pagination}
        sorting={sorting}
        filters={filters}
        onPaginationChange={(updater) =>
          setQueryState({
            pagination:
              typeof updater === "function" ? updater(pagination) : updater,
          })
        }
        onSortingChange={(updater) =>
          setQueryState({
            sorting: typeof updater === "function" ? updater(sorting) : updater,
          })
        }
        onColumnFiltersChange={(updater) =>
          setQueryState({
            filters: typeof updater === "function" ? updater(filters) : updater,
          })
        }
      />

      <HistoryChat />
    </div>
  );
}
