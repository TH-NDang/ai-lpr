"server-only";

import { db } from "./index";
import * as schema from "./schema";
import {
  eq,
  desc,
  asc,
  inArray,
  and,
  or,
  sql,
  ilike,
  gte,
  lte,
  gt,
  lt,
  count,
} from "drizzle-orm";
import type { ApiResponse } from "@/lib/store/license-plate-store";
import type {
  ColumnFiltersState,
  SortingState,
  PaginationState,
} from "@tanstack/react-table";
import type { DateRange } from "react-day-picker";
import { isWithinInterval } from "date-fns";

type DetectionInsert = typeof schema.detections.$inferInsert;
type DetectedPlateResultInsert = typeof schema.detectedPlateResults.$inferInsert;
type LicensePlateInsert = typeof schema.licensePlates.$inferInsert;
type DetectionSelect = typeof schema.detections.$inferSelect;
type DetectedPlateResultSelect = typeof schema.detectedPlateResults.$inferSelect;
type LicensePlateSelect = typeof schema.licensePlates.$inferSelect;

/**
 * Inserts a detection record and its associated detected plate results
 * within a transaction. Handles finding or creating unique license plates.
 */
export async function insertDetectionAndResults(
  apiResponse: ApiResponse,
  source: (typeof schema.detectionSourceEnum.enumValues)[number],
  originalImageUrl: string
): Promise<DetectionSelect | null> {
  if (
    !apiResponse ||
    !apiResponse.detections ||
    apiResponse.detections.length === 0
  ) {
    console.log("No detections to save.");
    return null;
  }

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Insert Detection
      const detectionInsertResult = await tx
        .insert(schema.detections)
        .values({
          source: source,
          imageUrl: originalImageUrl,
          processedImageUrl: apiResponse.processed_image_url,
          detectionTime: new Date(),
        })
        .returning({ insertedId: schema.detections.id });

      const detectionId = detectionInsertResult[0]?.insertedId;
      if (!detectionId) {
        throw new Error("Failed to insert detection record.");
      }

      // 2. Prepare and Find/Create License Plates
      const detectedPlateNumbers = apiResponse.detections
        .map((det) => det.plate_number)
        .filter((pn): pn is string => !!pn && pn.trim() !== "");
      const uniquePlateNumbers = [...new Set(detectedPlateNumbers)];

      const licensePlateRecords: Record<string, number> = {};

      if (uniquePlateNumbers.length > 0) {
        await tx
          .insert(schema.licensePlates)
          .values(uniquePlateNumbers.map((pn) => ({ plateNumber: pn })))
          .onConflictDoNothing({ target: schema.licensePlates.plateNumber });

        const fetchedPlates = await tx
          .select({
            id: schema.licensePlates.id,
            plateNumber: schema.licensePlates.plateNumber,
          })
          .from(schema.licensePlates)
          .where(inArray(schema.licensePlates.plateNumber, uniquePlateNumbers));

        fetchedPlates.forEach((p) => {
          licensePlateRecords[p.plateNumber] = p.id;
        });
      }

      // 3. Prepare DetectedPlateResult inserts
      const plateDataToInsert: DetectedPlateResultInsert[] = [];
      for (const det of apiResponse.detections) {
        const plateAnalysis = det.plate_analysis;
        const primaryPlateNumber = det.plate_number;
        const licensePlateId =
          primaryPlateNumber && licensePlateRecords[primaryPlateNumber]
            ? licensePlateRecords[primaryPlateNumber]
            : null;

        const plateTypeInfo = plateAnalysis?.plate_type_info;
        const vehicleCategoryValue = plateTypeInfo?.category;
        const vehicleCategory =
          vehicleCategoryValue &&
          schema.vehicleCategoryEnum.enumValues.includes(
            vehicleCategoryValue as (typeof schema.vehicleCategoryEnum.enumValues)[number]
          )
            ? (vehicleCategoryValue as (typeof schema.vehicleCategoryEnum.enumValues)[number])
            : null;

        const detectedPlateData: DetectedPlateResultInsert = {
          detectionId: detectionId,
          licensePlateId: licensePlateId,
          plateNumber: primaryPlateNumber,
          normalizedPlate: plateAnalysis?.normalized,
          confidenceDetection: det.confidence_detection,
          boundingBox: det.bounding_box,
          ocrEngineUsed: det.ocr_engine_used,
          provinceCode: plateAnalysis?.province_code,
          provinceName: plateAnalysis?.province_name,
          plateType: plateAnalysis?.plate_type,
          detectedColor: plateAnalysis?.detected_color,
          isValidFormat: plateAnalysis?.is_valid_format,
          formatDescription: plateAnalysis?.format_description,
          typeVehicle: vehicleCategory,
        };
        plateDataToInsert.push(detectedPlateData);
      }

      // 4. Insert Detected Plate Results
      if (plateDataToInsert.length > 0) {
        await tx.insert(schema.detectedPlateResults).values(plateDataToInsert);
      }

      return { id: detectionId };
    });

    const createdDetection = await db.query.detections.findFirst({
      where: eq(schema.detections.id, result.id),
      with: {
        detectedPlates: true,
      },
    });

    return createdDetection ?? null;
  } catch (error) {
    console.error("Error in insertDetectionAndResults:", error);
    throw new Error("Failed to save detection result via query function.");
  }
}

export type HistoryQueryResultItem = DetectedPlateResultSelect & {
  detection: DetectionSelect | null;
  licensePlate: LicensePlateSelect | null;
};

export interface FetchHistoryResult {
  rows: HistoryQueryResultItem[];
  totalRowCount: number;
}

const filterColumnMap: Record<string, any> = {
  plateNumber: schema.detectedPlateResults.plateNumber,
  normalizedPlate: schema.detectedPlateResults.normalizedPlate,
  confidence: schema.detectedPlateResults.confidenceDetection,
  date: schema.detections.detectionTime,
  provinceName: schema.detectedPlateResults.provinceName,
  isValidFormat: schema.detectedPlateResults.isValidFormat,
  ocrEngine: schema.detectedPlateResults.ocrEngineUsed,
};

const sortColumnMap: Record<string, any> = {
  plateNumber: schema.detectedPlateResults.plateNumber,
  confidence: schema.detectedPlateResults.confidenceDetection,
  date: schema.detections.detectionTime,
  provinceName: schema.detectedPlateResults.provinceName,
  isValidFormat: schema.detectedPlateResults.isValidFormat,
  ocrEngine: schema.detectedPlateResults.ocrEngineUsed,
  normalizedPlate: schema.detectedPlateResults.normalizedPlate,
};

/**
 * Parses TanStack Table column filters into Drizzle WHERE conditions.
 */
function parseFiltersToDrizzle(filters: ColumnFiltersState) {
  const conditions: any[] = [];
  for (const filter of filters) {
    const columnId = filter.id;
    const filterValue = filter.value;

    switch (columnId) {
      case "plateNumber":
      case "normalizedPlate":
      case "provinceName":
      case "ocrEngine":
        if (typeof filterValue === "string" && filterValue.length > 0) {
          const column = filterColumnMap[columnId];
          if (column) conditions.push(ilike(column, `%${filterValue}%`));
        }
        break;
      case "confidence":
        if (Array.isArray(filterValue) && filterValue.length === 2) {
          const [min, max] = filterValue;
          const column = filterColumnMap[columnId];
          if (column) {
            if (typeof min === "number") conditions.push(gte(column, min / 100));
            if (typeof max === "number") conditions.push(lte(column, max / 100));
          }
        }
        break;
      case "isValidFormat":
        if (typeof filterValue === "boolean") {
          const column = filterColumnMap[columnId];
          if (column) conditions.push(eq(column, filterValue));
        }
        break;
      case "date":
        if (
          typeof filterValue === "object" &&
          filterValue !== null &&
          "from" in filterValue &&
          "to" in filterValue &&
          filterValue.from instanceof Date &&
          filterValue.to instanceof Date
        ) {
          const { from, to } = filterValue as DateRange;
          const effectiveTo = to ? new Date(to.setHours(23, 59, 59, 999)) : null;
          const dateConditions = [];
          if (from)
            dateConditions.push(gte(schema.detections.detectionTime, from));
          if (effectiveTo)
            dateConditions.push(
              lte(schema.detections.detectionTime, effectiveTo)
            );
          if (dateConditions.length > 0) {
            conditions.push(
              sql`"detectionId" IN (SELECT id FROM ${
                schema.detections
              } WHERE ${and(...dateConditions)})`
            );
          }
        }
        break;
    }
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Parses TanStack Table sorting state into Drizzle ORDER BY clause.
 */
function parseSortingToDrizzle(sorting: SortingState) {
  if (!sorting || sorting.length === 0) {
    return [desc(schema.detectedPlateResults.createdAt)];
  }

  const orderBy: any[] = [];
  for (const sort of sorting) {
    const columnId = sort.id;
    const direction = sort.desc ? desc : asc;

    if (columnId === "date") {
      console.warn(
        "Server-side sorting by date is complex with db.query, falling back to default sort."
      );
    } else {
      const column = sortColumnMap[columnId];
      if (column) {
        orderBy.push(direction(column));
      }
    }
  }

  return orderBy.length > 0
    ? orderBy
    : [desc(schema.detectedPlateResults.createdAt)];
}

/**
 * Fetches paginated, sorted, and filtered detection history using db.query.
 */
export async function fetchDetectionHistory(
  pagination: PaginationState,
  sorting: SortingState,
  filters: ColumnFiltersState
): Promise<FetchHistoryResult> {
  try {
    const { pageIndex, pageSize } = pagination;
    const whereCondition = parseFiltersToDrizzle(filters);
    const orderByCondition = parseSortingToDrizzle(sorting);

    const countResult = await db
      .select({ value: count() })
      .from(schema.detectedPlateResults)
      .where(whereCondition)
      .execute();
    const totalRowCount = countResult[0]?.value ?? 0;

    const rows = await db.query.detectedPlateResults.findMany({
      where: whereCondition,
      orderBy: orderByCondition,
      limit: pageSize,
      offset: pageIndex * pageSize,
      with: {
        detection: true,
        licensePlate: true,
      },
    });

    return { rows: rows as HistoryQueryResultItem[], totalRowCount };
  } catch (error) {
    console.error("Error fetching detection history:", error);
    throw new Error("Failed to fetch history data via query function.");
  }
}

export async function getFilterOptions(): Promise<{
  ocrEngines: string[];
  vehicleTypes: string[];
  sources: string[];
}> {
  try {
    const ocrEnginesPromise = db
      .selectDistinct({
        ocrEngineUsed: schema.detectedPlateResults.ocrEngineUsed,
      })
      .from(schema.detectedPlateResults)
      .where(sql`${schema.detectedPlateResults.ocrEngineUsed} IS NOT NULL`);

    const vehicleTypesPromise = db
      .selectDistinct({ typeVehicle: schema.detectedPlateResults.typeVehicle })
      .from(schema.detectedPlateResults)
      .where(sql`${schema.detectedPlateResults.typeVehicle} IS NOT NULL`);

    const sourcesPromise = db
      .selectDistinct({ source: schema.detections.source })
      .from(schema.detections)
      .where(sql`${schema.detections.source} IS NOT NULL`);

    const [ocrResults, vehicleResults, sourceResults] = await Promise.all([
      ocrEnginesPromise,
      vehicleTypesPromise,
      sourcesPromise,
    ]);

    // Filter out null/undefined values and then cast to string array
    const ocrEngines = ocrResults
      .map((r) => r.ocrEngineUsed)
      .filter((v) => v != null) as string[];
    const vehicleTypes = vehicleResults
      .map((r) => r.typeVehicle)
      .filter((v) => v != null) as string[];
    const sources = sourceResults
      .map((r) => r.source)
      .filter((v) => v != null) as string[];

    return {
      ocrEngines,
      vehicleTypes,
      sources,
    };
  } catch (error) {
    console.error("Error fetching filter options:", error);
    return {
      ocrEngines: [],
      vehicleTypes: [],
      sources: [],
    };
  }
}
