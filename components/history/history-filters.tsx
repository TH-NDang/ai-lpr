"use client";

import * as React from "react";
import type { Column, Table } from "@tanstack/react-table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CalendarIcon, RotateCcw } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import type { HistoryQueryResultItem } from "@/lib/db/queries";

export interface FilterProps {
  column: Column<HistoryQueryResultItem, unknown>;
  table: Table<HistoryQueryResultItem>;
}

const DateRangeFilter = ({
  column,
}: {
  column: Column<HistoryQueryResultItem, unknown>;
}) => {
  const id = React.useId();
  const [month, setMonth] = React.useState<Date>(new Date());

  const filterValue = column.getFilterValue() as {
    from?: Date;
    to?: Date;
  } | null;

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
    column.setFilterValue({
      from: range.from,
      to: range.to ?? range.from,
    });
  };

  const handlePresetClick = (presetRange: { from: Date; to: Date }) => {
    column.setFilterValue(presetRange);
    setMonth(presetRange.to);
  };

  const handleReset = () => {
    column.setFilterValue(undefined);
    setMonth(new Date());
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={`${id}-trigger`} className="text-xs font-normal">
          {String(column.columnDef.header ?? column.id)}
        </Label>
        {filterValue && (
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 hover:bg-destructive/10 hover:text-destructive"
            onClick={handleReset}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        )}
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={`${id}-trigger`}
            variant="outline"
            size="sm"
            className={cn(
              "w-full justify-start font-normal h-8 text-xs",
              !filterValue?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
            {filterValue?.from ? (
              filterValue.to ? (
                <>
                  {format(filterValue.from, "dd/MM/yyyy")} -{" "}
                  {format(filterValue.to, "dd/MM/yyyy")}
                </>
              ) : (
                format(filterValue.from, "dd/MM/yyyy")
              )
            ) : (
              <span>Chọn ngày...</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" side="bottom">
          <div className="p-3 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-1">Chọn phạm vi ngày</h4>
                <div className="text-xs text-muted-foreground">
                  {filterValue?.from ? (
                    filterValue.to ? (
                      <>
                        Từ {format(filterValue.from, "dd/MM/yyyy")} đến{" "}
                        {format(filterValue.to, "dd/MM/yyyy")}
                      </>
                    ) : (
                      format(filterValue.from, "dd/MM/yyyy")
                    )
                  ) : (
                    "Chưa chọn ngày"
                  )}
                </div>
              </div>
              {filterValue && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 shrink-0 hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-2" />
                  Xóa chọn
                </Button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="grid grid-cols-2 sm:flex sm:flex-col gap-1 sm:w-[140px]">
                {Object.entries(presets).map(([key, value]) => (
                  <Button
                    key={key}
                    variant={
                      JSON.stringify(filterValue) === JSON.stringify(value)
                        ? "secondary"
                        : "ghost"
                    }
                    size="sm"
                    className="h-8 justify-start text-left text-xs font-normal"
                    onClick={() => handlePresetClick(value)}
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
                ))}
              </div>
              <div className="border rounded-md p-3 flex-1">
                <Calendar
                  mode="range"
                  defaultMonth={filterValue?.from}
                  selected={filterValue as DateRange | undefined}
                  onSelect={handleSelect}
                  month={month}
                  onMonthChange={setMonth}
                  numberOfMonths={1}
                  locale={vi}
                  ISOWeek
                  showOutsideDays={false}
                  className="p-2"
                  disabled={[
                    { after: today }, // Dates before today
                  ]}
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export const Filter = ({ column, table }: FilterProps) => {
  const id = React.useId();
  const firstValue = table
    .getPreFilteredRowModel()
    .flatRows[0]?.getValue(column.id);
  const meta = column.columnDef.meta as {
    filterVariant?: string;
    selectOptions?: string[];
  };
  const filterVariant = meta?.filterVariant;
  const columnFilterValue = column.getFilterValue();

  const sortedUniqueValues = React.useMemo(() => {
    if (filterVariant === "range" || typeof firstValue === "number") {
      return [];
    }
    return Array.from(
      new Set(
        table
          .getPreFilteredRowModel()
          .flatRows.map((row) => row.getValue(column.id))
      )
    )
      .filter((v) => v !== null && v !== undefined)
      .sort();
  }, [column.id, filterVariant, firstValue, table]);

  if (filterVariant === "range") {
    const [min, max] = (columnFilterValue ?? ["", ""]) as [string, string];
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id} className="text-xs font-normal">
          {String(column.columnDef.header ?? column.id)}
        </Label>
        <div className="flex gap-1">
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
            placeholder="Min"
            className="h-8 text-xs"
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
            placeholder="Max"
            className="h-8 text-xs"
          />
        </div>
      </div>
    );
  }

  if (filterVariant === "selectBoolean") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id} className="text-xs font-normal">
          {String(column.columnDef.header ?? column.id)}
        </Label>{" "}
        <Select
          value={(columnFilterValue ?? "all").toString()}
          onValueChange={(value) =>
            column.setFilterValue(value === "all" ? undefined : value === "true")
          }
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Tất cả" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="true">Đúng</SelectItem>
            <SelectItem value="false">Sai</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (filterVariant === "selectString") {
    const validOptions = (
      meta?.selectOptions ?? (sortedUniqueValues as string[])
    ).filter((opt) => opt !== "");

    return (
      <div className="space-y-1.5">
        <Label htmlFor={id} className="text-xs font-normal">
          {String(column.columnDef.header ?? column.id)}
        </Label>
        <Select
          value={(columnFilterValue ?? "all").toString()}
          onValueChange={(value) =>
            column.setFilterValue(value === "all" ? undefined : value)
          }
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Tất cả" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {validOptions.map((value) => (
              <SelectItem key={String(value)} value={String(value)}>
                {String(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (filterVariant === "dateRange") {
    return <DateRangeFilter column={column} />;
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-normal">
        {String(column.columnDef.header ?? column.id)}
      </Label>
      <div className="flex gap-1">
        <Input
          id={id}
          type="text"
          value={(columnFilterValue ?? "") as string}
          onChange={(e) => column.setFilterValue(e.target.value)}
          placeholder={`Tìm ${String(column.columnDef.header ?? column.id)}...`}
          className="h-8 text-xs"
        />
        {columnFilterValue !== undefined && columnFilterValue !== null && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => column.setFilterValue(undefined)}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
