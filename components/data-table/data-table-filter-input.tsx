"use client";

import type { DataTableInputFilterField } from "./types";
import { InputWithAddons } from "@/components/data-table/custom/input-with-addons";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useDataTable } from "@/components/data-table/data-table";

function getFilter(filterValue: unknown) {
  return typeof filterValue === "string" ? filterValue : null;
}

export function DataTableFilterInput<TData>({
  value: _value,
}: DataTableInputFilterField<TData>) {
  const value = _value as string;
  const { table, columnFilters } = useDataTable();
  const column = table.getColumn(value);
  const filterValue = columnFilters.find((i) => i.id === value)?.value;
  const filters = getFilter(filterValue);
  const [input, setInput] = useState<string | null>(filters);

  const debouncedInput = useDebounce(input, 500);

  useEffect(() => {
    const newValue = debouncedInput?.trim() === "" ? null : debouncedInput;
    if (debouncedInput === null) return;
    column?.setFilterValue(newValue);
  }, [debouncedInput, column]);

  useEffect(() => {
    if (debouncedInput?.trim() !== filters) {
      setInput(filters);
    }
  }, [filters, debouncedInput]);

  // Xác định placeholder tùy theo loại trường
  const getPlaceholder = () => {
    switch (value) {
      case "plateNumber":
        return "Nhập biển số...";
      case "provinceCode":
        return "Nhập mã tỉnh...";
      case "provinceName":
        return "Nhập tên tỉnh/thành...";
      default:
        return "Tìm kiếm...";
    }
  };

  return (
    <div className="grid w-full gap-1.5">
      <Label htmlFor={value} className="sr-only px-2 text-muted-foreground">
        {value}
      </Label>
      <InputWithAddons
        placeholder={getPlaceholder()}
        leading={<Search className="mt-0.5 h-4 w-4" />}
        containerClassName="h-9 rounded-lg"
        name={value}
        id={value}
        value={input || ""}
        onChange={(e) => setInput(e.target.value)}
      />
    </div>
  );
}
