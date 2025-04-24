import React, { useState } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type Table as ReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronUpIcon, ChevronDownIcon, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HistoryQueryResultItem } from "@/lib/db/queries";

interface HistoryTableProps {
  data: HistoryQueryResultItem[];
  columns: ColumnDef<HistoryQueryResultItem>[];
  isLoading: boolean;
  isError: boolean;
  error?: Error;
  isFetching: boolean;
  onRefetch: () => void;
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
  sorting: any;
  filters: any;
  onPaginationChange: (updater: any) => void;
  onSortingChange: (updater: any) => void;
  onColumnFiltersChange: (updater: any) => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  data,
  columns,
  isLoading,
  isError,
  error,
  isFetching,
  onRefetch,
  pagination,
  sorting,
  filters,
  onPaginationChange,
  onSortingChange,
  onColumnFiltersChange,
}) => {
  const [columnVisibility, setColumnVisibility] = useState({});

  const table = useReactTable({
    data,
    columns,
    pageCount: data ? Math.ceil(data.length / pagination.pageSize) : -1,
    state: {
      columnFilters: filters,
      sorting,
      pagination,
      columnVisibility,
    },
    onColumnFiltersChange,
    onSortingChange,
    onPaginationChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  return (
    <div className="rounded-md border">
      <div className={cn("relative", isFetching && "opacity-60 pointer-events-none")}>
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
                        width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined,
                      }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={cn(
                            "flex items-center gap-1 h-8",
                            header.column.getCanSort() && "cursor-pointer select-none"
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Đang tải dữ liệu lần đầu...
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-destructive">
                  Lỗi khi tải dữ liệu: {error?.message}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        width: cell.column.getSize() !== 150 ? `${cell.column.getSize()}px` : undefined,
                      }}
                      className="p-2 text-xs truncate"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Không tìm thấy kết quả nào khớp với bộ lọc.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
