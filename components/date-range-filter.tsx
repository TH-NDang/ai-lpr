"use client";

import * as React from "react";
import {
  addDays,
  format,
  startOfDay,
  endOfMonth,
  endOfYear,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Column } from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangeFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
  className?: string;
}

function getDateRangeFilterValue(
  column: Column<any, any>
): DateRange | undefined {
  const value = column.getFilterValue();
  if (
    typeof value === "object" &&
    value !== null &&
    "from" in value &&
    "to" in value &&
    value.from instanceof Date &&
    value.to instanceof Date
  ) {
    return value as DateRange;
  }
  return undefined;
}

export function DateRangeFilter<TData, TValue>({
  column,
  className,
}: DateRangeFilterProps<TData, TValue>) {
  const initialDate = getDateRangeFilterValue(column);
  const [date, setDate] = React.useState<DateRange | undefined>(initialDate);
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentDisplayMonth, setCurrentDisplayMonth] = React.useState(
    initialDate?.from ?? new Date()
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

  React.useEffect(() => {
    setDate(getDateRangeFilterValue(column));
    setCurrentDisplayMonth(getDateRangeFilterValue(column)?.from ?? new Date());
  }, [column.getFilterValue()]);

  const handleSelect = (selectedDateRange: DateRange | undefined) => {
    setDate(selectedDateRange);
    if (selectedDateRange?.from && selectedDateRange?.to) {
      const filterValue = {
        from: startOfDay(selectedDateRange.from),
        to: selectedDateRange.to
          ? new Date(selectedDateRange.to.setHours(23, 59, 59, 999))
          : undefined,
      };
      column.setFilterValue(filterValue);
    } else {
      column.setFilterValue(undefined);
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setDate(undefined);
    column.setFilterValue(undefined);
    setIsOpen(false);
  };

  const handlePresetClick = (presetRange: DateRange) => {
    handleSelect(presetRange);
    setCurrentDisplayMonth(presetRange.from ?? new Date());
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal h-8 text-xs px-2",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd/MM/yy", { locale: vi })} -{" "}
                  {format(date.to, "dd/MM/yy", { locale: vi })}
                </>
              ) : (
                format(date.from, "dd/MM/yy", { locale: vi })
              )
            ) : (
              <span>Chọn ngày...</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 flex" align="start">
          <div className="relative py-4 max-sm:order-1 max-sm:border-t sm:w-40 border-r">
            <div className="flex flex-col px-2 space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-7 text-xs"
                onClick={() => handlePresetClick(presets.today)}
              >
                Hôm nay
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-7 text-xs"
                onClick={() => handlePresetClick(presets.yesterday)}
              >
                Hôm qua
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-7 text-xs"
                onClick={() => handlePresetClick(presets.last7Days)}
              >
                7 ngày qua
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-7 text-xs"
                onClick={() => handlePresetClick(presets.last30Days)}
              >
                30 ngày qua
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-7 text-xs"
                onClick={() => handlePresetClick(presets.monthToDate)}
              >
                Tháng này
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-7 text-xs"
                onClick={() => handlePresetClick(presets.lastMonth)}
              >
                Tháng trước
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-7 text-xs"
                onClick={() => handlePresetClick(presets.yearToDate)}
              >
                Năm nay
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-7 text-xs"
                onClick={() => handlePresetClick(presets.lastYear)}
              >
                Năm ngoái
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-7 text-xs mt-2 border-t pt-2"
                onClick={handleClear}
              >
                Xóa bộ lọc
              </Button>
            </div>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={currentDisplayMonth}
            selected={date}
            onSelect={handleSelect}
            month={currentDisplayMonth}
            onMonthChange={setCurrentDisplayMonth}
            numberOfMonths={1}
            locale={vi}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
