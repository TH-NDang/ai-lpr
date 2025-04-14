"use server";

import {
  insertDetectionAndResults,
  fetchDetectionHistory,
  HistoryQueryResultItem,
} from "@/lib/db/queries";

import type {
  BackendDetection as StoreDetection,
  ApiResponse,
} from "@/lib/store/license-plate-store";
import { revalidatePath } from "next/cache";

export async function processLicensePlateImage(
  file: File
): Promise<ApiResponse> {
  let apiResponseData: ApiResponse | null = null;
  try {
    const formData = new FormData();
    formData.append("file", file);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/process-image`,
      {
        method: "POST",
        body: formData,
        signal: controller.signal,
        mode: "cors",
      }
    ).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      let errorBody = null;
      try {
        errorBody = await response.json();
      } catch (e) {}
      throw new Error(
        `API Error: ${response.status} ${
          response.statusText
        }. Details: ${JSON.stringify(errorBody)}`
      );
    }

    apiResponseData = await response.json();

    if (
      apiResponseData &&
      apiResponseData.detections &&
      apiResponseData.detections.length > 0
    ) {
      try {
        const createdDetection = await insertDetectionAndResults(
          apiResponseData,
          "upload",
          file.name
        );
        if (createdDetection) {
          revalidatePath("/history");
        }
      } catch (dbError) {
        console.error(
          "Error saving detection to database after successful API call:",
          dbError
        );
        if (apiResponseData) {
          const message =
            dbError instanceof Error ? dbError.message : String(dbError);
          apiResponseData.error = apiResponseData.error
            ? `${apiResponseData.error}. DB save failed: ${message}`
            : `DB save failed: ${message}`;
        }
      }
    }
    return (
      apiResponseData ?? {
        detections: [],
        processed_image_url: null,
        error: "No response data received.",
      }
    );
  } catch (error) {
    console.error("processLicensePlateImage Error:", error);
    let errorMessage = "An unknown error occurred during image processing.";
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        errorMessage = "Request timed out. Please try again later.";
      } else if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("Network Error")
      ) {
        errorMessage =
          "Could not connect to API server. Please check network or server status.";
      } else if (error.message.startsWith("API Error:")) {
        errorMessage = error.message;
      } else {
        errorMessage = `Processing failed: ${error.message}`;
      }
    }
    return {
      detections: apiResponseData?.detections ?? [],
      processed_image_url: apiResponseData?.processed_image_url ?? null,
      error: errorMessage,
    };
  }
}

export async function processLicensePlateFromUrl(
  url: string
): Promise<ApiResponse> {
  let apiResponseData: ApiResponse | null = null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/process-image-url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
        signal: controller.signal,
        mode: "cors",
      }
    ).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      let errorBody = null;
      try {
        errorBody = await response.json();
      } catch (e) {}
      throw new Error(
        `API Error: ${response.status} ${
          response.statusText
        }. Details: ${JSON.stringify(errorBody)}`
      );
    }

    apiResponseData = await response.json();

    if (
      apiResponseData &&
      apiResponseData.detections &&
      apiResponseData.detections.length > 0
    ) {
      try {
        const createdDetection = await insertDetectionAndResults(
          apiResponseData,
          "api",
          url
        );
        if (createdDetection) {
          revalidatePath("/history");
        }
      } catch (dbError) {
        console.error(
          "Error saving detection to database after successful API call:",
          dbError
        );
        if (apiResponseData) {
          const message =
            dbError instanceof Error ? dbError.message : String(dbError);
          apiResponseData.error = apiResponseData.error
            ? `${apiResponseData.error}. DB save failed: ${message}`
            : `DB save failed: ${message}`;
        }
      }
    }
    return (
      apiResponseData ?? {
        detections: [],
        processed_image_url: null,
        error: "No response data received.",
      }
    );
  } catch (error) {
    console.error("processLicensePlateFromUrl Error:", error);
    let errorMessage = "An unknown error occurred processing URL.";
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        errorMessage = "Request timed out. Please try again later.";
      } else if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("Network Error")
      ) {
        errorMessage =
          "Could not connect to API server. Please check network or server status.";
      } else if (error.message.startsWith("API Error:")) {
        errorMessage = error.message;
      } else {
        errorMessage = `Processing failed: ${error.message}`;
      }
    }
    return {
      detections: apiResponseData?.detections ?? [],
      processed_image_url: apiResponseData?.processed_image_url ?? null,
      error: errorMessage,
    };
  }
}

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

function transformQueryResultToGridSchema(
  record: HistoryQueryResultItem
): HistoryGridRow {
  return {
    id: record.id,
    plateNumber: record.plateNumber ?? "N/A",
    normalizedPlate: record.normalizedPlate,
    confidence: Math.round(record.confidenceDetection * 100),
    date: record.detection?.detectionTime ?? null,
    provinceName: record.provinceName,
    imageUrl: record.detection?.processedImageUrl ?? null,
    isValidFormat: record.isValidFormat,
    ocrEngine: record.ocrEngineUsed,
    detectionId: record.detectionId,
  };
}

export async function getHistoryAction() {
  try {
    const records = await fetchDetectionHistory();

    return {
      success: true,
      rows: records.map(transformQueryResultToGridSchema),
    };
  } catch (error) {
    console.error("Server Action Error - Failed to get history:", error);
    return {
      success: false,
      error: "Failed to fetch history data",
      rows: [],
    };
  }
}
