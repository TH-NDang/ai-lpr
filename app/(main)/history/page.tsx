"use client";

import React, { useState, useMemo, useId, useEffect, Suspense } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type PaginationState,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type Column,
  type Table as ReactTable,
  type RowData,
  type VisibilityState,
  type Row,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  AlertCircle,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Columns3Icon,
  ZoomInIcon as ZoomInIconTrigger,
  RotateCcw,
  XIcon,
  Filter as FilterIcon,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { CalendarIcon } from "lucide-react";
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  subYears,
} from "date-fns";
import { type DateRange } from "react-day-picker";
import type { HistoryQueryResultItem } from "@/lib/db/queries";
import { useQueryStates, parseAsJson } from "nuqs";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDebounce } from "use-debounce";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Skeleton } from "@/components/ui/skeleton";

type HistoryGridRow = HistoryQueryResultItem;

interface FilterOptions {
  ocrEngines: string[];
  vehicleTypes: string[];
  sources: string[];
}

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?:
      | "text"
      | "range"
      | "selectBoolean"
      | "selectString"
      | "dateRange";
    selectOptions?: string[];
  }
}

function DayPickerDateRangeFilter({ column }: { column: Column<any, unknown> }) {
  const id = useId();
  const filterValue = column.getFilterValue() as {
    from?: Date;
    to?: Date;
  } | null;

  const [month, setMonth] = useState<Date>(
    filterValue?.from ?? filterValue?.to ?? new Date()
  );

  const today = new Date();
  const presets = {
    today: { from: today, to: today },
    yesterday: { from: subDays(today, 1), to: subDays(today, 1) },
    last7Days: { from: subDays(today, 6), to: today },
    last30Days: { from: subDays(today, 29), to: today },
    monthToDate: { from: startOfMonth(today), to: today },
    lastMonth: {
      from: startOfMonth(subMonths(today, 1)),
      to: endOfMonth(subMonths(today, 1)),
    },
    yearToDate: { from: startOfYear(today), to: today },
    lastYear: {
      from: startOfYear(subYears(today, 1)),
      to: endOfYear(subYears(today, 1)),
    },
  };

  const handleSelect = (range: DateRange | undefined) => {
    if (!range) {
      column.setFilterValue(undefined);
      return;
    }
    const newFilterValue = {
      from: range.from,
      to: range.to ?? range.from,
    };
    column.setFilterValue(newFilterValue);
  };

  const handlePresetClick = (presetRange: { from: Date; to: Date }) => {
    column.setFilterValue(presetRange);
    setMonth(presetRange.to);
  };

  return (
    <div className="*:not-first:mt-1 space-y-1">
      <Label htmlFor={`${id}-trigger`} className="text-xs font-normal">
        {String(column.columnDef.header ?? column.id)}
      </Label>
      <Popover>
        <PopoverTrigger asChild id={`${id}-trigger`}>
          <Button
            variant={"outline"}
            size="sm"
            className={cn(
              "h-8 w-full justify-start text-left font-normal text-xs px-2 pe-8",
              !filterValue?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="me-1.5 h-3.5 w-3.5 text-muted-foreground/80" />
            {filterValue?.from ? (
              filterValue.to ? (
                <>
                  {format(filterValue.from, "LLL dd, y")}-
                  {format(filterValue.to, "LLL dd, y")}
                </>
              ) : (
                format(filterValue.from, "LLL dd, y")
              )
            ) : (
              <span>Chọn ngày...</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 flex max-sm:flex-col"
          align="start"
        >
          <div className="relative py-2 max-sm:order-1 max-sm:border-t sm:w-36 sm:border-e">
            <div className="flex flex-col px-2 space-y-1">
              {(Object.keys(presets) as Array<keyof typeof presets>).map(
                (key) => (
                  <Button
                    key={key}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs h-7 px-1.5 font-normal"
                    onClick={() => handlePresetClick(presets[key])}
                  >
                    {key === "today" && "Hôm nay"}
                    {key === "yesterday" && "Hôm qua"}
                    {key === "last7Days" && "7 ngày qua"}
                    {key === "last30Days" && "30 ngày qua"}
                    {key === "monthToDate" && "Tháng này"}
                    {key === "lastMonth" && "Tháng trước"}
                    {key === "yearToDate" && "Năm nay"}
                    {key === "lastYear" && "Năm trước"}
                  </Button>
                )
              )}
              {/* Date Reset Button */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs h-7 px-1.5 font-normal text-destructive hover:text-destructive"
                onClick={() => {
                  column.setFilterValue(undefined);
                  setMonth(new Date()); // Reset calendar view to current month
                }}
                disabled={!filterValue}
              >
                <XIcon className="mr-1.5 h-3.5 w-3.5" />
                Xóa bộ lọc ngày
              </Button>
            </div>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={filterValue?.from}
            selected={filterValue as DateRange | undefined}
            onSelect={handleSelect}
            month={month}
            onMonthChange={setMonth}
            numberOfMonths={1}
            disabled={[{ after: today }]}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function Filter({
  column,
  table,
}: {
  column: Column<HistoryGridRow, unknown>;
  table: ReactTable<HistoryGridRow>;
}) {
  const id = useId();
  const firstValue = table
    .getPreFilteredRowModel()
    .flatRows[0]?.getValue(column.id);
  const filterVariant = column.columnDef.meta?.filterVariant;

  const columnFilterValue = column.getFilterValue();

  const sortedUniqueValues = React.useMemo(() => {
    if (filterVariant === "range" || typeof firstValue === "number") {
      return [];
    }
    const rows = table.getPreFilteredRowModel().flatRows;
    if (!Array.isArray(rows)) {
      return [];
    }
    const uniqueValues = Array.from(
      rows
        .map((row: Row<HistoryGridRow>) => row.getValue(column.id))
        .reduce(
          (acc: Set<unknown>, value: unknown) => acc.add(value),
          new Set<unknown>()
        )
    );
    return uniqueValues.filter((v) => v !== null && v !== undefined).sort();
  }, [
    table.getPreFilteredRowModel().flatRows,
    column.id,
    filterVariant,
    firstValue,
  ]);

  if (filterVariant === "range") {
    const [min, max] = (columnFilterValue ?? ["", ""]) as [string, string];
    return (
      <div className="*:not-first:mt-1">
        <Label htmlFor={id} className="text-xs font-normal">
          {String(column.columnDef.header ?? column.id)}
        </Label>
        <div className="flex items-center space-x-1">
          <Input
            id={id}
            type="number"
            min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
            max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
            value={min}
            onChange={(e) =>
              column.setFilterValue((old: [string, string]) => [
                e.target.value,
                old?.[1],
              ])
            }
            placeholder={`Min`}
            className="h-8 px-1.5 text-xs border-r-0 rounded-r-none focus-visible:ring-offset-0 focus-visible:ring-0"
          />
          <Input
            type="number"
            min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
            max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
            value={max}
            onChange={(e) =>
              column.setFilterValue((old: [string, string]) => [
                old?.[0],
                e.target.value,
              ])
            }
            placeholder={`Max`}
            className="h-8 px-1.5 text-xs rounded-l-none focus-visible:ring-offset-0 focus-visible:ring-0"
          />
        </div>
      </div>
    );
  }

  if (filterVariant === "selectBoolean") {
    return (
      <div className="*:not-first:mt-1">
        <Label htmlFor={id} className="text-xs font-normal">
          {String(column.columnDef.header ?? column.id)}
        </Label>
        <Select
          value={(columnFilterValue ?? "").toString()}
          onValueChange={(value) =>
            column.setFilterValue(value === "" ? undefined : value === "true")
          }
        >
          <SelectTrigger className="h-8 text-xs px-2">
            <SelectValue placeholder="Tất cả" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">True</SelectItem>
            <SelectItem value="false">False</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (filterVariant === "selectString") {
    const validOptions = (
      column.columnDef.meta?.selectOptions ?? sortedUniqueValues
    ).filter((opt) => opt !== "");

    return (
      <div className="*:not-first:mt-1">
        <Label htmlFor={id} className="text-xs font-normal">
          {String(column.columnDef.header ?? column.id)}
        </Label>
        <Select
          value={(columnFilterValue ?? "").toString()}
          onValueChange={(value) =>
            column.setFilterValue(value === "" ? undefined : value)
          }
        >
          <SelectTrigger className="h-8 text-xs px-2">
            <SelectValue placeholder="Tất cả" />
          </SelectTrigger>
          <SelectContent>
            {validOptions.map((value: any, index: number) => (
              <SelectItem key={`${value}-${index}`} value={value.toString()}>
                {String(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (filterVariant === "dateRange") {
    return <DayPickerDateRangeFilter column={column} />;
  }

  // Default: text filter
  return (
    <div className="*:not-first:mt-1">
      <Label htmlFor={id} className="text-xs font-normal">
        {String(column.columnDef.header ?? column.id)}
      </Label>
      <Input
        id={id}
        type="text"
        value={(columnFilterValue ?? "") as string}
        onChange={(e) => column.setFilterValue(e.target.value)}
        placeholder={`Tìm kiếm...`}
        className="h-8 px-2 text-xs"
      />
    </div>
  );
}

const booleanCellRenderer = (value: boolean | null | undefined) => {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground text-xs">N/A</span>;
  }
  return value ? (
    <CheckCircle2 className="h-4 w-4 text-green-500 inline-block" />
  ) : (
    <AlertCircle className="h-4 w-4 text-destructive inline-block" />
  );
};

const imageCellRenderer = (value?: string | null) => {
  if (!value) return <span className="text-muted-foreground text-xs">N/A</span>;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-transparent"
        >
          <ZoomInIconTrigger className="h-4 w-4 text-muted-foreground hover:text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-[90vw] h-[85vh] flex items-center justify-center p-0 overflow-hidden">
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={10}
          limitToBounds={true}
          doubleClick={{ mode: "reset" }}
        >
          {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
            <React.Fragment>
              <div className="absolute top-2 right-2 z-10 flex flex-col items-end space-y-1">
                <SheetClose asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-background/70 hover:bg-background/90"
                    aria-label="Đóng"
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </SheetClose>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => zoomIn()}
                  className="h-8 w-8 bg-background/70 hover:bg-background/90"
                  aria-label="Phóng to"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => zoomOut()}
                  className="h-8 w-8 bg-background/70 hover:bg-background/90"
                  aria-label="Thu nhỏ"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => resetTransform()}
                  className="h-8 w-8 bg-background/70 hover:bg-background/90"
                  aria-label="Reset"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              <TransformComponent
                wrapperStyle={{ width: "100%", height: "100%" }}
                contentStyle={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={value}
                  alt="Detection"
                  className="max-w-full max-h-full object-contain mx-auto cursor-grab active:cursor-grabbing"
                />
              </TransformComponent>
            </React.Fragment>
          )}
        </TransformWrapper>
      </DialogContent>
    </Dialog>
  );
};

const dateFormatter = (value: Date | null): string => {
  if (!value) return "-";
  try {
    return format(new Date(value), "HH:mm:ss dd/MM/yyyy");
  } catch {
    return "Invalid Date";
  }
};

const getColumns = (
  filterOptions?: FilterOptions
): ColumnDef<HistoryGridRow>[] => [
  {
    accessorKey: "date",
    header: "Thời gian",
    accessorFn: (originalRow) => originalRow.detection?.detectionTime,
    meta: { filterVariant: "dateRange" },
    cell: ({ row }) =>
      dateFormatter(row.original.detection?.detectionTime ?? null),
  },
  {
    accessorKey: "plateNumber",
    header: "Biển số nhận dạng",
    meta: { filterVariant: "text" },
    cell: ({ row }) => row.original.plateNumber,
    enableHiding: false,
    size: 120,
  },
  {
    accessorKey: "provinceName",
    header: "Tỉnh/TP",
    meta: { filterVariant: "text" },
    cell: ({ row }) => row.original.provinceName ?? "-",
    size: 110,
  },
  {
    accessorKey: "isValidFormat",
    header: "Trạng thái nhận dạng",
    meta: { filterVariant: "selectBoolean" },
    cell: ({ row }) => booleanCellRenderer(row.original.isValidFormat),
    size: 90,
    enableResizing: true,
  },
  {
    accessorKey: "ocrEngine",
    header: "OCR được dùng",
    accessorFn: (originalRow) => originalRow.ocrEngineUsed,
    meta: {
      filterVariant: "selectString",
      selectOptions: filterOptions?.ocrEngines,
    },
    enableResizing: true,
  },
  {
    accessorKey: "typeVehicle",
    header: "Loại xe",
    accessorFn: (originalRow) => originalRow.typeVehicle,
    meta: {
      filterVariant: "selectString",
      selectOptions: filterOptions?.vehicleTypes,
    },
    cell: ({ row }) => row.original.typeVehicle ?? "-",
    size: 90,
    enableHiding: true,
  },
  {
    accessorKey: "source",
    header: "Nguồn",
    accessorFn: (originalRow) => originalRow.detection?.source,
    meta: {
      filterVariant: "selectString",
      selectOptions: filterOptions?.sources,
    },
    cell: ({ row }) => row.original.detection?.source ?? "-",
    size: 80,
    enableHiding: true,
  },
  {
    accessorKey: "imageUrl",
    header: "Ảnh",
    accessorFn: (originalRow) => originalRow.detection?.processedImageUrl,
    cell: ({ row }) =>
      imageCellRenderer(row.original.detection?.processedImageUrl ?? null),
    enableSorting: false,
    enableColumnFilter: false,
    size: 80,
    enableResizing: false,
    enableHiding: false,
  },
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

interface ApiHistoryResponse {
  rows: HistoryQueryResultItem[];
  totalRowCount: number;
}

interface ApiFilterOptionsResponse {
  ocrEngines: string[];
  vehicleTypes: string[];
  sources: string[];
}

const HistoryPageContent: React.FC = () => {
  const defaultPagination: PaginationState = { pageIndex: 0, pageSize: 10 };
  const defaultSorting: SortingState = [{ id: "date", desc: true }];
  const defaultFilters: ColumnFiltersState = [];

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
          const errorText = await response.text();
          console.error("Filter Options API Error:", response.status, errorText);
          throw new Error(
            `Failed to fetch filter options: ${response.statusText}`
          );
        }
        return response.json();
      },
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    });

  const columns = useMemo(() => getColumns(filterOptions), [filterOptions]);

  const { data, isLoading, isError, error, refetch, isFetching } =
    useQuery<ApiHistoryResponse>({
      queryKey: ["historyData", debouncedFilters, sorting, pagination],
      queryFn: async () => {
        console.log("Fetching history data from API with params:", {
          pagination,
          sorting,
          filters: debouncedFilters,
        });

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
            if (range.from instanceof Date && !isNaN(range.from.getTime()))
              params.set("dateFrom", range.from.toISOString().split("T")[0]);
            if (range.to instanceof Date && !isNaN(range.to.getTime()))
              params.set("dateTo", range.to.toISOString().split("T")[0]);
          } else if (
            filterId === "confidenceDetection" &&
            Array.isArray(filterValue)
          ) {
            if (filterValue[0] !== undefined && filterValue[0] !== null)
              params.set("confidenceMin", filterValue[0].toString());
            if (filterValue[1] !== undefined && filterValue[1] !== null)
              params.set("confidenceMax", filterValue[1].toString());
          } else if (filterId === "processTime" && Array.isArray(filterValue)) {
            if (filterValue[0] !== undefined && filterValue[0] !== null)
              params.set("processTimeMin", filterValue[0].toString());
            if (filterValue[1] !== undefined && filterValue[1] !== null)
              params.set("processTimeMax", filterValue[1].toString());
          } else if (filterValue !== undefined && filterValue !== null) {
            params.set(filterId, String(filterValue));
          }
        });

        const response = await fetch(
          `${API_BASE_URL}/history?${params.toString()}`
        );

        if (!response.ok) {
          let errorDetails = "Unknown API error";
          try {
            const errData = await response.json();
            errorDetails =
              errData?.error || errData?.details || response.statusText;
          } catch (e) {
            /* ignore */
          }
          console.error("API Error Details:", errorDetails);
          throw new Error(`Failed to fetch history data: ${errorDetails}`);
        }
        return response.json();
      },
      placeholderData: (previousData) => previousData,
      refetchOnWindowFocus: true,
    });

  const table = useReactTable({
    data: data?.rows ?? [],
    columns,
    pageCount: data ? Math.ceil(data.totalRowCount / pagination.pageSize) : -1,
    state: {
      columnFilters: filters,
      sorting: sorting,
      pagination: pagination,
      columnVisibility,
    },
    onColumnFiltersChange: (updater) =>
      setQueryState({
        filters: typeof updater === "function" ? updater(filters) : updater,
      }),
    onSortingChange: (updater) =>
      setQueryState({
        sorting: typeof updater === "function" ? updater(sorting) : updater,
      }),
    onPaginationChange: (updater) =>
      setQueryState({
        pagination:
          typeof updater === "function" ? updater(pagination) : updater,
      }),
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    debugTable: process.env.NODE_ENV === "development",
  });

  const pageCount = table.getPageCount();
  const currentPage = pagination.pageIndex + 1;

  const renderPaginationControls = () => {
    const pageNumbers: (number | string)[] = [];
    const maxPagesToShow = 5;
    const ellipsis = "...";

    if (pageCount <= maxPagesToShow + 2) {
      for (let i = 1; i <= pageCount; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      const startPage = Math.max(
        2,
        currentPage - Math.floor((maxPagesToShow - 2) / 2)
      );
      const endPage = Math.min(pageCount - 1, startPage + maxPagesToShow - 3);

      if (startPage > 2) {
        pageNumbers.push(ellipsis);
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      if (endPage < pageCount - 1) {
        pageNumbers.push(ellipsis);
      }

      pageNumbers.push(pageCount);
    }

    return (
      <div className="flex items-center justify-between gap-2 flex-wrap mt-4 px-1">
        <div className="flex items-center gap-2">
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[75px] text-xs">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size} / trang
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm font-medium text-muted-foreground">
            {`${table.getRowModel().rows.length} / ${
              data?.totalRowCount ?? 0
            } dòng (Trang ${currentPage} / ${pageCount})`}
          </p>
        </div>
        <Pagination className="w-auto mx-0">
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Trang trước"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
            </PaginationItem>
            {pageNumbers.map((pageNumber, index) => (
              <PaginationItem key={`${pageNumber}-${index}`}>
                {pageNumber === ellipsis ? (
                  <PaginationEllipsis />
                ) : (
                  <Button
                    variant={currentPage === pageNumber ? "outline" : "ghost"}
                    className="h-8 w-8 p-0"
                    onClick={() =>
                      table.setPageIndex((pageNumber as number) - 1)
                    }
                    disabled={isFetching}
                  >
                    {pageNumber}
                  </Button>
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Trang sau"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  useEffect(() => {
    const filtersChanged =
      JSON.stringify(filters) !== JSON.stringify(defaultFilters);
    const sortingChanged =
      JSON.stringify(sorting) !== JSON.stringify(defaultSorting);

    if ((filtersChanged || sortingChanged) && pagination.pageIndex !== 0) {
      console.log("Resetting page index due to filter/sort change");
      setQueryState({ pagination: { ...pagination, pageIndex: 0 } });
    }
  }, [JSON.stringify(filters), JSON.stringify(sorting)]);

  // Function to render filters, either inline or inside the sheet
  const renderFilters = () => (
    <div className="flex flex-col gap-3 p-4 md:p-0 md:flex-row md:flex-wrap md:items-center md:gap-2">
      {table
        .getHeaderGroups()[0]
        .headers.filter(
          (header) =>
            header.column.getCanFilter() && header.column.getIsVisible()
        )
        .map((header) => (
          <div
            key={header.id}
            className="flex-shrink-0 w-full md:min-w-[120px] md:w-auto"
          >
            <Filter column={header.column} table={table} />
          </div>
        ))}
    </div>
  );

  // Function to reset filters
  const resetFiltersAndSorting = () => {
    setQueryState({
      filters: defaultFilters,
      sorting: defaultSorting,
      // Keep pagination or reset it?
      // pagination: defaultPagination, // Uncomment to reset pagination too
    });
  };

  return (
    <div className="container mx-auto py-4 md:px-4 lg:px-6">
      <div className="flex items-center space-x-4 h-8 mb-4">
        <SidebarToggle />
        <Separator orientation="vertical" className="h-full" />
        <h1 className="text-2xl font-bold whitespace-nowrap">
          Lịch sử nhận dạng
        </h1>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="md:hidden flex items-center gap-2 w-full"
            >
              <FilterIcon className="h-4 w-4" />
              <span>Bộ lọc ({filters.length > 0 ? filters.length : 0})</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full max-w-xs overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Bộ lọc</SheetTitle>
            </SheetHeader>
            {renderFilters()}
            <SheetFooter className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFiltersAndSorting}
                disabled={
                  JSON.stringify(filters) === JSON.stringify(defaultFilters)
                }
              >
                Reset bộ lọc
              </Button>
              <SheetClose asChild>
                <Button size="sm">Đóng</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <div className="hidden md:flex md:flex-wrap md:items-center md:gap-2">
          {renderFilters()}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Columns3Icon className="mr-2 h-4 w-4" />
                Xem cột
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ẩn/Hiện cột</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {typeof column.columnDef.header === "function"
                        ? column.id
                        : String(column.columnDef.header ?? column.id)}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFiltersAndSorting}
            disabled={
              JSON.stringify(filters) === JSON.stringify(defaultFilters) &&
              JSON.stringify(sorting) === JSON.stringify(defaultSorting)
            }
            className="h-8 hidden md:flex"
          >
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8"
          >
            <RotateCcw
              className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")}
            />
            Tải lại
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <div
          className={cn(
            "relative",
            isFetching && "opacity-60 pointer-events-none"
          )}
        >
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        style={{
                          width:
                            header.getSize() !== 150
                              ? `${header.getSize()}px`
                              : undefined,
                        }}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              "flex items-center gap-1 h-8",
                              header.column.getCanSort() &&
                                "cursor-pointer select-none"
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                            title={
                              header.column.getCanSort()
                                ? header.column.getIsSorted() === "asc"
                                  ? "Sắp xếp giảm dần"
                                  : header.column.getIsSorted() === "desc"
                                  ? "Sắp xếp tăng dần"
                                  : "Sắp xếp"
                                : undefined
                            }
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {{
                              asc: <ChevronUpIcon className="h-4 w-4" />,
                              desc: <ChevronDownIcon className="h-4 w-4" />,
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Đang tải dữ liệu lần đầu...
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-destructive"
                  >
                    Lỗi khi tải dữ liệu: {error?.message}
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{
                          width:
                            cell.column.getSize() !== 150
                              ? `${cell.column.getSize()}px`
                              : undefined,
                        }}
                        className="p-2 text-xs truncate"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Không tìm thấy kết quả nào khớp với bộ lọc.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      {data && data.totalRowCount > 0 && renderPaginationControls()}
    </div>
  );
};

const HistoryPageSkeleton: React.FC = () => {
  return (
    <div className="container mx-auto py-4 md:px-4 lg:px-6 space-y-4">
      {/* Header Skeleton */}
      <div className="flex items-center space-x-4 h-8 mb-4">
        <Skeleton className="h-8 w-8" /> {/* Sidebar Toggle */}
        <Skeleton className="h-full w-px" /> {/* Separator */}
        <Skeleton className="h-7 w-48" /> {/* Title */}
      </div>

      {/* Controls Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        {/* Filters Skeleton (Desktop) */}
        <div className="hidden md:flex md:flex-wrap md:items-center md:gap-2">
          <Skeleton className="h-16 w-36" />
          <Skeleton className="h-16 w-36" />
          <Skeleton className="h-16 w-36" />
        </div>
        {/* Filter Button Skeleton (Mobile) */}
        <Skeleton className="h-9 w-full md:hidden" />

        {/* Action Buttons Skeleton */}
        <div className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto justify-end">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-20 hidden md:flex" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="rounded-md border">
        <Skeleton className="h-12 w-full" /> {/* Table Header */}
        <div className="space-y-2 p-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" /> /* Table Rows */
          ))}
        </div>
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between gap-2 flex-wrap mt-4 px-1">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-[75px]" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
};

const HistoryPage: React.FC = () => {
  return (
    <Suspense fallback={<HistoryPageSkeleton />}>
      <HistoryPageContent />
    </Suspense>
  );
};

export default HistoryPage;
