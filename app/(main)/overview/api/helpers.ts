import {
  addDays,
  addMilliseconds,
  differenceInMinutes,
  isSameDay,
  startOfDay,
} from "date-fns";
import type {
  FacetMetadataSchema,
  ColumnSchema,
  ColumnFilterSchema,
} from "../../../../lib/table/schema";
import type { SearchParamsType } from "../../../../lib/table/search-params";
import { isArrayOfDates, isArrayOfNumbers } from "@/lib/table/is-array";
import {
  calculatePercentile,
  calculateSpecificPercentile,
} from "@/lib/request/percentile";
import type { LEVELS } from "@/components/data-table/constants/levels";
import type { SortingState } from "@tanstack/react-table";

/**
 * Loại bỏ dấu tiếng Việt từ chuỗi và chuẩn hóa khoảng trắng
 */
function normalizeText(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " "); // Chuẩn hóa khoảng trắng, thay nhiều khoảng trắng bằng 1 khoảng trắng
}

// Define the known field keys for ColumnSchema for type safety
type LicensePlateFields =
  | "plateNumber"
  | "confidence"
  | "provinceCode"
  | "provinceName"
  | "vehicleType"
  | "plateType"
  | "processingTime";

// Only include actual fields from the schema
export const sliderFilterValues = [
  "confidence",
  "processingTime",
] as const satisfies (keyof ColumnSchema)[];

export const filterValues = [
  "level",
  ...sliderFilterValues,
  "plateNumber",
  "provinceCode",
  "provinceName",
  "vehicleType",
  "plateType",
  "plateFormat",
  "plateSerial",
  "registrationNumber",
  "imageSource",
] as const satisfies (keyof ColumnSchema)[];

export function filterData(
  data: ColumnSchema[],
  filter: ColumnFilterSchema
): ColumnSchema[] {
  return data.filter((item) => {
    return Object.entries(filter).every(([key, value]) => {
      if (value === null || value === undefined) return true;

      // Date filter with date range
      if (key === "date" && Array.isArray(value) && value.length === 2) {
        const [start, end] = value as [Date, Date];
        const date = item.date;
        return date >= start && date <= end;
      }

      // Confidence/Processing Time filter with range
      if (key === "confidence" && Array.isArray(value) && value.length === 2) {
        const [min, max] = value as [number, number];
        const confidence = item.confidence || 0;
        return confidence >= min && confidence <= max;
      }

      if (
        key === "processingTime" &&
        Array.isArray(value) &&
        value.length === 2
      ) {
        const [min, max] = value as [number, number];
        const processingTime = item.processingTime || 0;
        return processingTime >= min && processingTime <= max;
      }

      // Level filter (single or multiple values)
      if (key === "level") {
        if (Array.isArray(value)) {
          // Type assertion to make the compiler happy
          const levelValues = value as unknown as string[];
          return levelValues.includes(item.level);
        }
        return item.level === value;
      }

      // Text field filters (string comparison)
      if (
        [
          "plateNumber",
          "provinceCode",
          "provinceName",
          "vehicleType",
          "plateType",
        ].includes(key)
      ) {
        const fieldKey = key as LicensePlateFields;

        if (Array.isArray(value)) {
          // Type assertion for the array values
          const stringValues = value as unknown as string[];
          return stringValues.includes(String(item[fieldKey] || ""));
        }

        if (typeof value === "string" && value.trim() !== "") {
          const itemValue = String(item[fieldKey] || "")
            .toLowerCase()
            .trim();
          const searchValue = value.toLowerCase().trim();

          // Trường hợp tìm kiếm chuỗi rỗng
          if (searchValue === "") return true;

          // Tìm kiếm chuỗi chính xác (có dấu)
          if (itemValue.includes(searchValue)) {
            return true;
          }

          // Tìm kiếm không dấu (khi người dùng nhập không dấu nhưng muốn tìm kết quả có dấu)
          const normalizedItem = normalizeText(String(item[fieldKey] || ""));
          const normalizedSearch = normalizeText(value);

          return normalizedItem.includes(normalizedSearch);
        }

        return true;
      }

      return true;
    });
  });
}

export function sortData(
  data: ColumnSchema[],
  sort?: SortingState[number]
): ColumnSchema[] {
  if (!sort) return data;

  const { id, desc } = sort;

  const sortedData = [...data].sort((a, b) => {
    if (id === "date") {
      const aDate = a.date.getTime();
      const bDate = b.date.getTime();
      return desc ? bDate - aDate : aDate - bDate;
    }

    if (id === "confidence" || id === "processingTime") {
      const aValue = (a[id as keyof ColumnSchema] as number) || 0;
      const bValue = (b[id as keyof ColumnSchema] as number) || 0;
      return desc ? bValue - aValue : aValue - bValue;
    }

    if (
      [
        "plateNumber",
        "provinceCode",
        "provinceName",
        "vehicleType",
        "plateType",
      ].includes(id)
    ) {
      const aValue = String(a[id as keyof ColumnSchema] || "").toLowerCase();
      const bValue = String(b[id as keyof ColumnSchema] || "").toLowerCase();
      return desc ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
    }

    return 0;
  });

  return sortedData;
}

export function percentileData(data: ColumnSchema[]): ColumnSchema[] {
  // Use confidence instead of latency for percentile
  const confidenceValues = data
    .map((row) => row.confidence)
    .filter((c): c is number => c !== undefined);

  return data.map((row) => ({
    ...row,
    percentile: row.confidence
      ? calculatePercentile(confidenceValues, row.confidence)
      : undefined,
  }));
}

export function getFacetsFromData(data: ColumnSchema[]) {
  // Get unique values and their counts for categorical fields
  const facets: Record<string, any> = {};

  // Process categorical fields
  const categoricalFields = [
    "level",
    "provinceCode",
    "provinceName",
    "vehicleType",
    "plateType",
    "plateFormat",
    "imageSource",
  ];

  categoricalFields.forEach((field) => {
    const valueMap = new Map<string, number>();
    data.forEach((item) => {
      const value = String(item[field as keyof ColumnSchema] || "");
      if (value) {
        valueMap.set(value, (valueMap.get(value) || 0) + 1);
      }
    });

    facets[field] = {
      rows: Array.from(valueMap.entries()).map(([value, total]) => ({
        value,
        total,
      })),
    };
  });

  // Process numeric fields (confidence, processingTime)
  const numericFields = ["confidence", "processingTime"];

  numericFields.forEach((field) => {
    const values = data
      .map((item) => item[field as keyof ColumnSchema] as number | undefined)
      .filter((value): value is number => value !== undefined && value !== null);

    if (values.length > 0) {
      const min = Math.min(...values);
      const max = Math.max(...values);

      // Group values into buckets
      const bucketSize = Math.max(1, Math.ceil((max - min) / 10));
      const bucketMap = new Map<string, number>();

      values.forEach((value) => {
        const bucketValue = Math.floor(value / bucketSize) * bucketSize;
        const bucketKey = `${bucketValue}-${bucketValue + bucketSize - 1}`;
        bucketMap.set(bucketKey, (bucketMap.get(bucketKey) || 0) + 1);
      });

      facets[field] = {
        min,
        max,
        rows: Array.from(bucketMap.entries()).map(([value, total]) => ({
          value,
          total,
        })),
      };
    } else {
      facets[field] = {
        min: 0,
        max: 100,
        rows: [],
      };
    }
  });

  return facets;
}

export function getPercentileFromData(data: ColumnSchema[]) {
  // Use confidence values for percentile calculation
  const confidenceValues = data
    .map((row) => row.confidence)
    .filter((c): c is number => c !== undefined);

  const p50 = calculateSpecificPercentile(confidenceValues, 50);
  const p75 = calculateSpecificPercentile(confidenceValues, 75);
  const p90 = calculateSpecificPercentile(confidenceValues, 90);
  const p95 = calculateSpecificPercentile(confidenceValues, 95);
  const p99 = calculateSpecificPercentile(confidenceValues, 99);

  return { p50, p75, p90, p95, p99 };
}

export function groupChartData(
  data: ColumnSchema[],
  dateRange?: [Date, Date]
): {
  timestamp: number;
  count: number;
  success: number;
  warning: number;
  error: number;
  avg_confidence: number;
  avg_processing_time: number;
}[] {
  if (data.length === 0) return [];

  // Create date range if not provided
  const [start, end] = dateRange || [
    data.reduce(
      (acc, item) => (item.date < acc ? item.date : acc),
      data[0].date
    ),
    data.reduce(
      (acc, item) => (item.date > acc ? item.date : acc),
      data[0].date
    ),
  ];

  // Group data by day
  const dateMap = new Map<number, ColumnSchema[]>();
  const dayDiff = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Create empty buckets for each day
  for (let i = 0; i <= dayDiff; i++) {
    const date = addDays(start, i);
    const timestamp = startOfDay(date).getTime();
    dateMap.set(timestamp, []);
  }

  // Fill buckets with data
  data.forEach((item) => {
    const timestamp = startOfDay(item.date).getTime();
    if (dateMap.has(timestamp)) {
      dateMap.get(timestamp)?.push(item);
    }
  });

  // Transform to chart data
  return Array.from(dateMap.entries())
    .map(([timestamp, items]) => {
      const totalConfidence = items.reduce(
        (sum, item) => sum + (item.confidence || 0),
        0
      );
      const totalProcessingTime = items.reduce(
        (sum, item) => sum + (item.processingTime || 0),
        0
      );

      return {
        timestamp,
        count: items.length,
        success: items.filter((item) => item.level === "success").length,
        warning: items.filter((item) => item.level === "warning").length,
        error: items.filter((item) => item.level === "error").length,
        avg_confidence:
          items.length > 0 ? Math.round(totalConfidence / items.length) : 0,
        avg_processing_time:
          items.length > 0 ? Math.round(totalProcessingTime / items.length) : 0,
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp);
}

function evaluateInterval(dates: Date[] | null): number {
  if (!dates) return 0;
  if (dates.length < 1 || dates.length > 3) return 0;

  // Calculate the time difference in minutes
  const timeDiffInMinutes = Math.abs(differenceInMinutes(dates[0], dates[1]));

  // Define thresholds and their respective intervals in milliseconds
  const intervals = [
    { threshold: 1, interval: 1000 }, // 1 second
    { threshold: 5, interval: 5000 }, // 5 seconds
    { threshold: 10, interval: 10000 }, // 10 seconds
    { threshold: 30, interval: 30000 }, // 30 seconds
    { threshold: 60, interval: 60000 }, // 1 minute
    { threshold: 120, interval: 120000 }, // 2 minutes
    { threshold: 240, interval: 240000 }, // 4 minutes
    { threshold: 480, interval: 480000 }, // 8 minutes
    { threshold: 1440, interval: 1440000 }, // 24 minutes
    { threshold: 2880, interval: 2880000 }, // 48 minutes
    { threshold: 5760, interval: 5760000 }, // 96 minutes
    { threshold: 11520, interval: 11520000 }, // 192 minutes
    { threshold: 23040, interval: 23040000 }, // 384 minutes
  ];

  // Iterate over the intervals and return the matching one
  for (const { threshold, interval } of intervals) {
    if (timeDiffInMinutes < threshold) {
      return interval;
    }
  }

  // Default to the largest interval if no match found
  return 46080000; // 768 minutes
}
