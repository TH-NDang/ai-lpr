import type { FilterFn } from "@tanstack/react-table";
import { isAfter, isBefore, isSameDay } from "date-fns";
import { isArrayOfDates } from "./is-array";

export const inDateRange: FilterFn<any> = (row, columnId, value) => {
  const date = new Date(row.getValue(columnId));
  const [start, end] = value as Date[];

  if (Number.isNaN(date.getTime())) return false;

  // if no end date, check if it's the same day
  if (!end) return isSameDay(date, start);

  return isAfter(date, start) && isBefore(date, end);
};

inDateRange.autoRemove = (val: any) =>
  !Array.isArray(val) || !val.length || !isArrayOfDates(val);

export const arrSome: FilterFn<any> = (row, columnId, filterValue) => {
  if (!Array.isArray(filterValue)) return false;
  return filterValue.some((val) => row.getValue<unknown[]>(columnId) === val);
};

arrSome.autoRemove = (val: any) => !Array.isArray(val) || !val?.length;

function testFalsey(val: any) {
  return val === undefined || val === null || val === "";
}

/**
 * Loại bỏ dấu tiếng Việt từ chuỗi và chuẩn hóa khoảng trắng
 */
export function normalizeText(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " "); // Chuẩn hóa khoảng trắng, thay nhiều khoảng trắng bằng 1 khoảng trắng
}

/**
 * Tìm kiếm theo text có phân biệt hoa thường, hỗ trợ tìm kiếm một phần
 * Có hỗ trợ tìm kiếm tiếng Việt với cả có dấu và không dấu
 */
export const textContains: FilterFn<any> = (row, columnId, filterValue) => {
  const value = row.getValue(columnId);
  if (testFalsey(value)) return false;

  const itemValue = String(value).toLowerCase().trim();
  const searchValue = String(filterValue).toLowerCase().trim();

  // Trường hợp tìm kiếm chuỗi rỗng
  if (searchValue === "") return true;

  // Tìm kiếm chuỗi chính xác (có dấu)
  if (itemValue.includes(searchValue)) {
    return true;
  }

  // Tìm kiếm không dấu (khi người dùng nhập không dấu nhưng muốn tìm kết quả có dấu)
  const normalizedItem = normalizeText(String(value));
  const normalizedSearch = normalizeText(String(filterValue));

  return normalizedItem.includes(normalizedSearch);
};

textContains.autoRemove = testFalsey;
