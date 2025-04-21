"use client";

import React, { useState, useMemo, useId, useEffect } from "react";
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
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Columns3Icon,
  ZoomInIcon,
  RotateCcw,
  XIcon,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import { usePagination } from "@/hooks/use-pagination";
import { cn } from "@/lib/utils";
import { getHistoryAction, getHistoryFilterOptions } from "../actions";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useQueryStates, parseAsInteger, parseAsJson } from "nuqs";
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
  const columnFilterValue = column.getFilterValue();

  const isTextFilter =
    column.columnDef.meta?.filterVariant === "text" ||
    !column.columnDef.meta?.filterVariant;
  const [inputValue, setInputValue] = useState<string>(() =>
    isTextFilter ? (columnFilterValue as string) ?? "" : ""
  );
  const [debouncedInputValue] = useDebounce(inputValue, 300);

  // Effect to apply the debounced value to the column filter
  useEffect(() => {
    if (isTextFilter && debouncedInputValue !== (columnFilterValue ?? "")) {
      column.setFilterValue(debouncedInputValue);
    }
  }, [debouncedInputValue, columnFilterValue, column, isTextFilter]);

  useEffect(() => {
    if (
      isTextFilter &&
      (columnFilterValue === undefined ||
        columnFilterValue === null ||
        columnFilterValue === "")
    ) {
      if (inputValue !== "") {
        setInputValue("");
      }
    }
  }, [columnFilterValue, isTextFilter, inputValue]);

  const { filterVariant, selectOptions } = column.columnDef.meta ?? {};
  const columnHeader = React.isValidElement(column.columnDef.header)
    ? column.id
    : String(column.columnDef.header ?? "");

  const sortedUniqueValues = useMemo(() => {
    if (filterVariant === "selectBoolean") return ["true", "false"];
    if (filterVariant === "selectString") {
      if (selectOptions) return [...selectOptions].sort();

      const uniqueValues = Array.from(
        column.getFacetedUniqueValues().keys()
      ).filter(
        (value): value is string => value !== null && value !== undefined
      );
      return uniqueValues.sort();
    }
    return [];
  }, [column.getFacetedUniqueValues, filterVariant, selectOptions]);

  if (filterVariant === "range") {
    const [min, max] = column.getFacetedMinMaxValues() ?? ["", ""];
    return (
      <div className="*:not-first:mt-1 space-y-1">
        <Label htmlFor={`${id}-range-1`}>{columnHeader}</Label>
        <div className="flex gap-1">
          <Input
            id={`${id}-range-1`}
            className="flex-1 rounded-e-none h-8 text-xs [-moz-appearance:_textfield] focus:z-10 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
            value={(columnFilterValue as [number, number])?.[0] ?? ""}
            onChange={(e) =>
              column.setFilterValue((old: [number, number]) => [
                e.target.value ? Number(e.target.value) : undefined,
                old?.[1],
              ])
            }
            placeholder={`Min ${min ? `(${min})` : ""}`}
            type="number"
            aria-label={`${columnHeader} min`}
          />
          <Input
            id={`${id}-range-2`}
            className="-ms-px flex-1 rounded-s-none h-8 text-xs [-moz-appearance:_textfield] focus:z-10 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
            value={(columnFilterValue as [number, number])?.[1] ?? ""}
            onChange={(e) =>
              column.setFilterValue((old: [number, number]) => [
                old?.[0],
                e.target.value ? Number(e.target.value) : undefined,
              ])
            }
            placeholder={`Max ${max ? `(${max})` : ""}`}
            type="number"
            aria-label={`${columnHeader} max`}
          />
        </div>
      </div>
    );
  }

  if (filterVariant === "selectBoolean") {
    return (
      <div className="*:not-first:mt-1 space-y-1">
        <Label htmlFor={`${id}-select`}>{columnHeader}</Label>
        <Select
          value={columnFilterValue?.toString() ?? "all"}
          onValueChange={(value) => {
            column.setFilterValue(
              value === "all" ? undefined : value === "true"
            );
          }}
        >
          <SelectTrigger id={`${id}-select`} className="h-8 text-xs">
            <SelectValue placeholder="Chọn..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="true">Hợp lệ</SelectItem>
            <SelectItem value="false">Không hợp lệ</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (filterVariant === "selectString") {
    return (
      <div className="*:not-first:mt-1 space-y-1">
        <Label htmlFor={`${id}-select-str`}>{columnHeader}</Label>
        <Select
          value={(columnFilterValue ?? "all") as string}
          onValueChange={(value) =>
            column.setFilterValue(value === "all" ? undefined : value)
          }
        >
          <SelectTrigger id={`${id}-select-str`} className="h-8 text-xs">
            <SelectValue placeholder="Chọn..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {sortedUniqueValues.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
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

  const isDateFilter = column.id === "date";
  return (
    <div className="*:not-first:mt-1 space-y-1">
      <Label htmlFor={`${id}-input`} className="text-xs font-normal">
        {columnHeader}
      </Label>
      <div className="relative">
        <Input
          id={`${id}-input`}
          className="peer ps-8 h-8 text-xs"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={
            isDateFilter ? "Tìm ngày/giờ..." : `Tìm ${columnHeader}...`
          }
          type="text"
        />
        <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-2.5 peer-disabled:opacity-50">
          <SearchIcon size={14} />
        </div>
      </div>
    </div>
  );
}

const booleanCellRenderer = (value: boolean | null | undefined) => {
  if (value === true) {
    return <CheckCircle2 className="text-green-500 mx-auto" size={16} />;
  } else if (value === false) {
    return <AlertCircle className="text-red-500 mx-auto" size={16} />;
  }
  return null;
};

const imageCellRenderer = (value?: string | null) => {
  if (!value) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="relative group mx-auto w-fit h-[30px] cursor-pointer rounded-sm overflow-hidden">
          <img
            src={value}
            alt="Processed plate thumbnail"
            className="h-full object-contain transition-opacity"
            loading="lazy"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <ZoomInIcon className="h-4 w-4 text-white" />
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-xl p-2 sm:max-w-2xl md:max-w-3xl lg:max-w-4xl">
        <DialogTitle className="sr-only">Ảnh biển số phóng to</DialogTitle>
        <img
          src={value}
          alt="Ảnh biển số phóng to"
          className="w-full h-auto object-contain rounded-md max-h-[85vh]"
        />
      </DialogContent>
    </Dialog>
  );
};

const dateFormatter = (value: Date | null): string => {
  return value ? new Date(value).toLocaleString("vi-VN") : "";
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
    accessorKey: "processTime",
    header: "Thời gian xử lý",
    accessorFn: (originalRow) => originalRow.detection?.processTimeMs,
    cell: ({ row }) => row.original.detection?.processTimeMs ?? "-",
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

const HistoryPage: React.FC = () => {
  const [queryStates, setQueryStates] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    size: parseAsInteger.withDefault(15),
    sort: parseAsJson((v) => v as SortingState).withDefault([]),
    filters: parseAsJson((v) => v as ColumnFiltersState).withDefault([]),
    visibility: parseAsJson((v) => v as VisibilityState).withDefault({}),
  });

  const pagination: PaginationState = useMemo(
    () => ({
      pageIndex: queryStates.page - 1,
      pageSize: queryStates.size,
    }),
    [queryStates.page, queryStates.size]
  );
  const sorting = queryStates.sort;
  const columnFilters = queryStates.filters;
  const columnVisibility = queryStates.visibility;

  const historyQuery = useQuery({
    queryKey: ["history", pagination, sorting, columnFilters],
    queryFn: () =>
      getHistoryAction({
        pagination: {
          pageIndex: queryStates.page - 1,
          pageSize: queryStates.size,
        },
        sorting: queryStates.sort,
        filters: queryStates.filters,
      }),
  });

  const filterOptionsQuery = useQuery<FilterOptions>({
    queryKey: ["historyFilterOptions"],
    queryFn: getHistoryFilterOptions,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const {
    data: historyData,
    isLoading: isLoadingHistory,
    isError: isErrorHistory,
    error: historyError,
    isFetching,
  } = historyQuery;
  const { data: filterOptions } = filterOptionsQuery;

  const memoizedData = useMemo(() => historyData?.rows ?? [], [historyData]);
  const totalRowCount = historyData?.totalRowCount ?? 0;

  const pageCount = Math.ceil(totalRowCount / pagination.pageSize);

  const columns = useMemo(() => getColumns(filterOptions), [filterOptions]);

  const table = useReactTable({
    data: memoizedData,
    columns,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: pageCount,
    state: {
      sorting,
      columnFilters,
      pagination,
      columnVisibility,
    },
    onColumnFiltersChange: (updater) => {
      const newState =
        typeof updater === "function" ? updater(queryStates.filters) : updater;
      setQueryStates({ filters: newState, page: 1 });
    },
    onSortingChange: (updater) => {
      const newState =
        typeof updater === "function" ? updater(queryStates.sort) : updater;
      setQueryStates({ sort: newState });
    },
    onPaginationChange: (updater) => {
      const newState =
        typeof updater === "function"
          ? updater({
              pageIndex: queryStates.page - 1,
              pageSize: queryStates.size,
            })
          : updater;
      setQueryStates({ page: newState.pageIndex + 1, size: newState.pageSize });
    },
    onColumnVisibilityChange: (updater) => {
      const newState =
        typeof updater === "function"
          ? updater(queryStates.visibility)
          : updater;
      setQueryStates({ visibility: newState });
    },
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onChange",
    meta: {},
  });

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: queryStates.page,
    totalPages: pageCount,
    paginationItemsToDisplay: 5,
  });

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div className="flex flex-wrap gap-3 items-end">
          {table
            .getHeaderGroups()[0]
            .headers.filter((header) => header.column.getCanFilter())
            .map((header) => (
              <div
                key={header.id}
                className="flex-shrink-0"
                style={{ width: `${header.column.columnDef.size ?? 120}px` }}
              >
                <Filter column={header.column} table={table} />
              </div>
            ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => {
              setQueryStates({
                filters: [],
                sort: [],
                page: 1,
              });
            }}
            disabled={
              queryStates.filters.length === 0 && queryStates.sort.length === 0
            }
          >
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Reset
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto h-8">
                <Columns3Icon className="mr-1.5 h-4 w-4" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ẩn/hiện cột</DropdownMenuLabel>
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
                      onSelect={(event) => event.preventDefault()}
                    >
                      {typeof column.columnDef.header === "string"
                        ? column.columnDef.header
                        : column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border overflow-auto relative max-h-[calc(100vh-280px)]">
        <Table className="border-collapse border-spacing-0 w-full">
          <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-background">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{
                        width: header.column.columnDef.size
                          ? header.getSize()
                          : undefined,
                      }}
                      className={cn(
                        "relative h-10 whitespace-nowrap px-2 border-b border-border",
                        (header.column.id === "isValidFormat" ||
                          header.column.id === "imageUrl") &&
                          "text-center",
                        header.column.getCanResize() &&
                          "cursor-col-resize select-none"
                      )}
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <Button
                          variant="ghost"
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn(
                            "px-1 py-1 h-auto w-full flex items-center text-xs font-medium",
                            header.column.id === "isValidFormat" ||
                              header.column.id === "imageUrl"
                              ? "justify-center"
                              : "justify-between"
                          )}
                        >
                          <span className="truncate">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </span>
                          {{
                            asc: <ChevronUpIcon className="ms-1 h-3 w-3" />,
                            desc: <ChevronDownIcon className="ms-1 h-3 w-3" />,
                          }[header.column.getIsSorted() as string] ?? null}
                        </Button>
                      ) : (
                        <span
                          className={cn(
                            "text-xs font-medium px-1 truncate",
                            (header.column.id === "isValidFormat" ||
                              header.column.id === "imageUrl") &&
                              "block text-center"
                          )}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </span>
                      )}
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          onDoubleClick={() => header.column.resetSize()}
                          className={cn(
                            "absolute top-0 right-0 h-full w-1 cursor-col-resize select-none touch-none",
                            table.options.columnResizeDirection === "ltr"
                              ? "right-0"
                              : "left-0",
                            header.column.getIsResizing()
                              ? "bg-primary opacity-50"
                              : ""
                          )}
                        />
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody
            className={cn(
              isFetching &&
                !isLoadingHistory &&
                "opacity-50 pointer-events-none transition-opacity duration-300"
            )}
          >
            {isLoadingHistory ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : isErrorHistory ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-destructive"
                >
                  Lỗi tải dữ liệu: {historyError?.message ?? "Unknown error"}
                </TableCell>
              </TableRow>
            ) : historyData && historyData.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Không tìm thấy kết quả.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.original.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        width: cell.column.columnDef.size
                          ? cell.column.getSize()
                          : undefined,
                      }}
                      className={cn(
                        "text-xs px-2 py-1.5 border-b border-border truncate",
                        (cell.column.id === "isValidFormat" ||
                          cell.column.id === "imageUrl") &&
                          "text-center"
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-muted-foreground text-xs flex-shrink-0">
          Trang {queryStates.page} / {pageCount} ({totalRowCount} dòng)
        </p>

        <div className="flex-grow flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to previous page"
                >
                  <ChevronLeftIcon size={16} />
                </Button>
              </PaginationItem>

              {showLeftEllipsis && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {pages
                .filter((p) => p <= pageCount)
                .map((page) => {
                  const isActive = page === queryStates.page;
                  return (
                    <PaginationItem key={page}>
                      <Button
                        size="icon"
                        className="h-8 w-8"
                        variant={isActive ? "outline" : "ghost"}
                        onClick={() => table.setPageIndex(page - 1)}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {page}
                      </Button>
                    </PaginationItem>
                  );
                })}

              {showRightEllipsis && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Go to next page"
                >
                  <ChevronRightIcon size={16} />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className="text-xs text-muted-foreground">Số dòng:</span>
          <Select
            value={pagination.pageSize.toString()}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="w-fit whitespace-nowrap h-8 text-xs px-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 15, 25, 50, 100].map((pageSizeOption) => (
                <SelectItem
                  key={pageSizeOption}
                  value={pageSizeOption.toString()}
                >
                  {pageSizeOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
