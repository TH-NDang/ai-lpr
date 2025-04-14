"use client";

import React, { useState, useEffect, useMemo, useId } from "react";
import { parseAsString, useQueryState } from "nuqs";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  PaginationState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  useReactTable,
  Column,
  Table as ReactTable,
  RowData,
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
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import { usePagination } from "@/hooks/use-pagination";
import { cn } from "@/lib/utils";
import { getHistoryAction } from "../actions";
import { DateRangeFilter } from "@/components/date-range-filter";
import { isWithinInterval, parseISO } from "date-fns";
import { DateRange } from "react-day-picker";

interface HistoryGridRow {
  id: number;
  plateNumber: string;
  normalizedPlate?: string | null;
  confidence: number;
  date: Date | null;
  provinceName: string | null;
  imageUrl: string | null;
  isValidFormat?: boolean | null;
  ocrEngine?: string | null;
  detectionId?: number;
}

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?:
      | "text"
      | "range"
      | "selectBoolean"
      | "selectString"
      | "dateRange";
  }
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
  const { filterVariant } = column.columnDef.meta ?? {};
  const columnHeader = React.isValidElement(column.columnDef.header)
    ? column.id
    : String(column.columnDef.header ?? "");

  const sortedUniqueValues = useMemo(() => {
    if (filterVariant === "selectBoolean") return ["true", "false"];
    if (filterVariant === "selectString") {
      const uniqueValues = Array.from(
        column.getFacetedUniqueValues().keys()
      ).filter(
        (value): value is string => value !== null && value !== undefined
      );
      return uniqueValues.sort();
    }
    return [];
  }, [column.getFacetedUniqueValues, filterVariant]);

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
    return (
      <div className="*:not-first:mt-1 space-y-1">
        <Label htmlFor={`${id}-date-range`} className="text-xs font-normal">
          {String(column.columnDef.header ?? column.id)}
        </Label>
        <DateRangeFilter column={column} />
      </div>
    );
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
          value={(columnFilterValue ?? "") as string}
          onChange={(e) => column.setFilterValue(e.target.value)}
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
  return value ? (
    <img
      src={value}
      alt="Processed plate"
      style={{ height: "30px", objectFit: "contain", margin: "auto" }}
      loading="lazy"
      onError={(e) => (e.currentTarget.style.display = "none")} // Hide on error
    />
  ) : null;
};

const dateFormatter = (value: Date | null): string => {
  return value ? new Date(value).toLocaleString("vi-VN") : "";
};

const columns: ColumnDef<HistoryGridRow>[] = [
  {
    accessorKey: "date",
    header: "Thời gian",
    meta: { filterVariant: "dateRange" },
    cell: ({ row }) => dateFormatter(row.original.date),
    size: 160,
    filterFn: (row, columnId, filterValue) => {
      const date = row.getValue(columnId);
      if (!(date instanceof Date)) {
        return false;
      }

      if (
        typeof filterValue !== "object" ||
        filterValue === null ||
        !("from" in filterValue) ||
        !("to" in filterValue) ||
        !(filterValue.from instanceof Date) ||
        !(filterValue.to instanceof Date)
      ) {
        return true;
      }

      const { from, to } = filterValue as DateRange;

      const effectiveTo = to
        ? new Date(to.setHours(23, 59, 59, 999))
        : undefined;

      if (!from || !effectiveTo) return true;

      return isWithinInterval(date, { start: from, end: effectiveTo });
    },
  },
  {
    accessorKey: "plateNumber",
    header: "Biển số nhận dạng",
    meta: { filterVariant: "text" },
    cell: ({ row }) => row.original.plateNumber,
  },
  {
    accessorKey: "isValidFormat",
    header: "Trạng thái nhận dạng",
    meta: { filterVariant: "selectBoolean" },
    cell: ({ row }) => booleanCellRenderer(row.original.isValidFormat),
    size: 130,
    filterFn: (row, id, filterValue) => {
      if (filterValue === undefined) return true;
      return row.getValue(id) === filterValue;
    },
    enableResizing: false,
  },
  {
    accessorKey: "ocrEngine",
    header: "OCR được dùng",
    meta: { filterVariant: "selectString" },
  },
  {
    accessorKey: "imageUrl",
    header: "Ảnh",
    cell: ({ row }) => imageCellRenderer(row.original.imageUrl),
    enableSorting: false,
    enableColumnFilter: false,
    size: 80,
    enableResizing: false,
  },
];

const HistoryPage: React.FC = () => {
  const [data, setData] = useState<HistoryGridRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // nuqs state for filters and sorting
  const [filtersNuqs, setFiltersNuqs] = useQueryState(
    "filters",
    parseAsString.withDefault("[]").withOptions({ shallow: false })
  );
  const [sortingNuqs, setSortingNuqs] = useQueryState(
    "sort",
    parseAsString.withDefault("[]").withOptions({ shallow: false })
  );

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() => {
    try {
      const parsed = JSON.parse(filtersNuqs);
      // Ensure it's an array, otherwise default to empty array
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error(
        "Failed to parse columnFilters from URL, defaulting to empty.",
        e
      );
      return [];
    }
  });
  const [sorting, setSorting] = useState<SortingState>(() => {
    try {
      const parsed = JSON.parse(sortingNuqs);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to parse sorting from URL, defaulting to empty.", e);
      return [];
    }
  });
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await getHistoryAction();
        if (result.success) {
          setData(result.rows);
        } else {
          console.error("Failed to fetch history:", result.error);
          setData([]);
          // TODO: Show toast error
        }
      } catch (error) {
        console.error("Error fetching history:", error);
        setData([]);
        // TODO: Show toast error
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Sync table state back to nuqs
  useEffect(() => {
    setFiltersNuqs(JSON.stringify(columnFilters));
  }, [columnFilters, setFiltersNuqs]);

  useEffect(() => {
    setSortingNuqs(JSON.stringify(sorting));
  }, [sorting, setSortingNuqs]);

  const table = useReactTable({
    data,
    columns,
    columnResizeMode: "onChange",
    state: {
      sorting,
      columnFilters,
      pagination,
    },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    // Pipeline
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    // defaultColumn: { // Optionally set default size if needed
    //   size: 150,
    //   minSize: 50,
    //   maxSize: 500,
    // },
  });

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: table.getState().pagination.pageIndex + 1,
    totalPages: table.getPageCount(),
    paginationItemsToDisplay: 5,
  });

  return (
    <div className="space-y-4 p-4 lg:p-6">
      {/* Filters Row */}
      <div className="flex flex-wrap gap-3 items-end">
        {table
          .getHeaderGroups()[0]
          .headers.filter((header) => header.column.getCanFilter())
          .map((header) => (
            <div
              key={header.id}
              className="flex-grow lg:flex-grow-0 lg:w-auto"
              style={{ minWidth: `${header.column.columnDef.size ?? 100}px` }}
            >
              <Filter column={header.column} table={table} />
            </div>
          ))}
      </div>

      {/* Table Wrapper for Sticky Header */}
      <div className="rounded-md border overflow-auto relative max-h-[calc(100vh-280px)]">
        {" "}
        {/* Adjust max-h as needed */}
        <Table className="border-collapse border-spacing-0 w-full">
          <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
            {" "}
            {/* Sticky Header */}
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
                          {/* ... Sort icon ... */}
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
                      {/* Resize Handle */}
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
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Đang tải...
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
                        width: cell.column.columnDef.size
                          ? cell.column.getSize()
                          : undefined,
                      }}
                      className={cn(
                        "text-xs px-2 py-1.5 border-b border-border truncate", // Add truncate
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
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Không tìm thấy kết quả.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-muted-foreground text-xs flex-shrink-0">
          Trang {table.getState().pagination.pageIndex + 1} /{" "}
          {table.getPageCount()}({data.length} dòng)
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

              {pages.map((page) => {
                const isActive =
                  page === table.getState().pagination.pageIndex + 1;
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
            value={table.getState().pagination.pageSize.toString()}
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
