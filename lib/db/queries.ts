"server-only";

import { db } from "./index";
import * as schema from "./schema";
import { eq, desc, inArray } from "drizzle-orm";
import type { ApiResponse } from "@/lib/store/license-plate-store";

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

/**
 * Fetches detection history, ordered by detection time descending.
 * Includes related detection and license plate data.
 */
export async function fetchDetectionHistory(): Promise<
  HistoryQueryResultItem[]
> {
  try {
    const records = await db.query.detectedPlateResults.findMany({
      orderBy: [desc(schema.detections.detectionTime)],
      with: {
        detection: true,
        licensePlate: true,
      },
    });
    return records;
  } catch (error) {
    console.error("Error fetching detection history:", error);
    throw new Error("Failed to fetch history data via query function.");
  }
}
