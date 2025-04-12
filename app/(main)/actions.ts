"use server";

import { prisma, transformDbRecordToColumnSchema } from "@/lib/db";
import type { Detection, ApiResponse } from "@/store/license-plate-store";
import { LicensePlate, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function saveLicensePlateToDatabase(
  detection: Detection,
  processedImageUrl: string | null
): Promise<LicensePlate> {
  try {
    const plateAnalysis = detection.plate_analysis;

    // Convert confidence from 0-1 to 0-100
    const confidence = Math.round(detection.confidence_detection * 100);

    // Optional OCR confidence (if available)
    const confidenceOcr = detection.ocr_engine_used ? confidence : undefined;

    // Insert into database
    const result = await prisma.licensePlate.create({
      data: {
        plateNumber: detection.plate_number,
        confidence,
        confidence_ocr: confidenceOcr,
        imageUrl: processedImageUrl || "",
        processedImageUrl,

        // Optional fields from plate analysis
        provinceCode: plateAnalysis?.province_code || null,
        provinceName: plateAnalysis?.province_name || null,
        vehicleType: plateAnalysis?.plate_type_info?.name || null,
        plateType: plateAnalysis?.plate_type || null,
        plateFormat: plateAnalysis?.is_valid_format ? "valid" : "invalid",

        // Additional plate details
        plateSerial: plateAnalysis?.serial || null,
        registrationNumber: plateAnalysis?.number || null,

        // Add other fields from the schema as needed, with defaults or null
        boundingBox: detection.bounding_box || undefined,
        normalizedPlate: plateAnalysis?.normalized || undefined,
        originalPlate: plateAnalysis?.original || undefined,
        detectedColor: plateAnalysis?.detected_color || undefined,
        ocrEngine: detection.ocr_engine_used || undefined,
        isValidFormat: plateAnalysis?.is_valid_format || false,
        formatDescription: plateAnalysis?.format_description || undefined,
        vehicleCategory: plateAnalysis?.plate_type_info?.name || null,
        plateTypeInfo: plateAnalysis?.plate_type_info || undefined,
        hasViolation: false,
        violationTypes: [],
        violationDescription: null,
        isVerified: false,
        // Timestamps are handled by @default(now()) and @updatedAt in schema
      },
    });

    return result;
  } catch (error) {
    console.error("Error saving license plate to database:", error);
    throw error;
  }
}

export async function processLicensePlateImage(
  file: File
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    // Configure request with timeout
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
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    // Get API response from image processing
    const data: ApiResponse = await response.json();

    // If detection was successful, save to database
    if (data.detections && data.detections.length > 0) {
      try {
        // Save to database via API route (client-side safe)
        await saveLicensePlateViaApi(
          data.detections[0],
          data.processed_image_url
        );
      } catch (error) {
        console.error("Error saving to database:", error);
        // Continue with processing even if saving fails
      }
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);

    let errorMessage = "An unknown error occurred";

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        errorMessage = "Request timed out. Please try again later.";
      } else if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("Network Error")
      ) {
        errorMessage =
          "Could not connect to API server. Please check your network connection.";
      } else {
        errorMessage = error.message;
      }
    }

    return {
      detections: [],
      processed_image_url: null,
      error: errorMessage,
    };
  }
}

export async function processLicensePlateFromUrl(
  url: string
): Promise<ApiResponse> {
  try {
    // Configure request with timeout
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
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    // Get API response
    const data: ApiResponse = await response.json();

    // If detection was successful, save to database
    if (data.detections && data.detections.length > 0) {
      try {
        // Save to database via API route (client-side safe)
        await saveLicensePlateViaApi(
          data.detections[0],
          data.processed_image_url
        );
      } catch (error) {
        console.error("Error saving to database:", error);
        // Continue with processing even if saving fails
      }
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);

    let errorMessage = "An unknown error occurred";

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        errorMessage = "Request timed out. Please try again later.";
      } else if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("Network Error")
      ) {
        errorMessage =
          "Could not connect to API server. Please check your network connection.";
      } else {
        errorMessage = error.message;
      }
    }

    return {
      detections: [],
      processed_image_url: null,
      error: errorMessage,
    };
  }
}

export async function saveLicensePlateViaApi(
  detection: Detection,
  processedImageUrl: string | null
) {
  const plateAnalysis = detection.plate_analysis;

  // Convert confidence from 0-1 to 0-100 if not already converted
  const confidence =
    "confidence_percent" in detection
      ? Math.round((detection as any).confidence_percent)
      : Math.round(detection.confidence_detection * 100);

  // Create the request body with all extended fields
  const requestBody = {
    plateNumber: detection.plate_number,
    confidence,
    confidence_ocr: detection.ocr_engine_used ? confidence : undefined,
    imageUrl: processedImageUrl || "",
    processedImageUrl,

    // Thông tin phân tích biển số
    provinceCode: plateAnalysis?.province_code || null,
    provinceName: plateAnalysis?.province_name || null,
    vehicleType: plateAnalysis?.plate_type_info?.name || null,
    plateType: plateAnalysis?.plate_type || null,
    plateFormat: plateAnalysis?.is_valid_format ? "valid" : "invalid",

    // Thông tin chi tiết biển số
    plateSerial: plateAnalysis?.serial || null,
    registrationNumber: plateAnalysis?.number || null,

    // Thông tin phân tích mở rộng
    boundingBox: detection.bounding_box || null,
    normalizedPlate: plateAnalysis?.normalized || null,
    originalPlate: plateAnalysis?.original || null,
    detectedColor: plateAnalysis?.detected_color || null,
    ocrEngine: detection.ocr_engine_used || null,
    isValidFormat: plateAnalysis?.is_valid_format || false,
    formatDescription: plateAnalysis?.format_description || null,

    // Thông tin phân loại xe
    plateTypeInfo: plateAnalysis?.plate_type_info || null,

    // Các trường khác
    hasViolation: false,
    violationTypes: [],
    violationDescription: null,
    isVerified: false,
  };

  try {
    try {
      return await saveLicensePlate(requestBody);
    } catch (serverActionError) {
      console.warn(
        "Server action failed, falling back to API route:",
        serverActionError
      );

      // Fallback to API route if server action fails
      const response = await fetch("/api/license-plates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        // Kiểm tra nếu phản hồi là HTML thay vì JSON
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("text/html")) {
          const htmlError = await response.text();
          console.error(
            "Server returned HTML instead of JSON:",
            `${htmlError.substring(0, 200)}...`
          );
          throw new Error(
            `Server error: ${response.status} ${response.statusText}`
          );
        }

        const errorData = await response
          .json()
          .catch(() => ({ error: response.statusText }));
        throw new Error(
          `Failed to save license plate: ${
            errorData.error || response.statusText
          }`
        );
      }

      // Parse JSON response
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error("API request failed:", error);
    // Re-throw the error so it can be caught by the caller
    throw error;
  }
}

export interface LicensePlateFormData {
  plateNumber: string;
  confidence: number;
  confidence_ocr?: number;
  imageUrl: string;
  processedImageUrl?: string | null;

  // Thông tin phân vùng
  provinceCode?: string | null;
  provinceName?: string | null;

  // Thông tin phân loại
  vehicleType?: string | null;
  plateType?: string | null;
  plateFormat?: string | null;

  // Thông tin chi tiết
  plateSerial?: string | null;
  registrationNumber?: string | null;

  // Thông tin phân tích mở rộng
  boundingBox?: any | null;
  normalizedPlate?: string | null;
  originalPlate?: string | null;
  detectedColor?: string | null;
  ocrEngine?: string | null;
  isValidFormat?: boolean;
  formatDescription?: string | null;

  // Thông tin phân loại xe
  plateTypeInfo?: any | null;

  // Thông tin xử phạt và xác thực
  hasViolation?: boolean;
  violationTypes?: string[];
  violationDescription?: string | null;
  isVerified?: boolean;
  verifiedBy?: string | null;
}

export async function saveLicensePlate(formData: LicensePlateFormData) {
  try {
    // Validate the required fields
    if (!formData.plateNumber || !formData.confidence || !formData.imageUrl) {
      throw new Error("Missing required fields");
    }

    const result = await prisma.licensePlate.create({
      data: {
        plateNumber: formData.plateNumber,
        confidence: formData.confidence,
        confidence_ocr: formData.confidence_ocr,
        imageUrl: formData.imageUrl,
        processedImageUrl: formData.processedImageUrl || null,

        // Thông tin phân vùng
        provinceCode: formData.provinceCode || null,
        provinceName: formData.provinceName || null,

        // Thông tin phân loại
        vehicleType: formData.vehicleType || null,
        plateType: formData.plateType || null,
        plateFormat: formData.plateFormat || null,

        // Thông tin chi tiết
        plateSerial: formData.plateSerial || null,
        registrationNumber: formData.registrationNumber || null,

        // Thông tin phân tích mở rộng
        boundingBox: formData.boundingBox || null,
        normalizedPlate: formData.normalizedPlate || null,
        originalPlate: formData.originalPlate || null,
        detectedColor: formData.detectedColor || null,
        ocrEngine: formData.ocrEngine || null,
        isValidFormat: formData.isValidFormat || false,
        formatDescription: formData.formatDescription || null,

        // Thông tin phân loại xe
        plateTypeInfo: formData.plateTypeInfo || null,
        vehicleCategory:
          formData.plateTypeInfo?.name || formData.vehicleType || null,

        // Thông tin xử phạt và xác thực
        hasViolation: formData.hasViolation || false,
        violationTypes: formData.violationTypes || [],
        violationDescription: formData.violationDescription || null,
        isVerified: formData.isVerified || false,
        verifiedBy: formData.verifiedBy || null,
      },
    });

    // Revalidate related paths
    revalidatePath("/license-plate");

    return { success: true, plate: result };
  } catch (error) {
    console.error("Error saving license plate:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

interface GetRowsParams {
  filterModel: Record<string, any>;
  sortModel: { colId: string; sort: "asc" | "desc" }[];
}

function parseSortModel(
  sortModel: GetRowsParams["sortModel"]
): Prisma.LicensePlateOrderByWithRelationInput[] {
  if (!sortModel || sortModel.length === 0) return [{ createdAt: "desc" }];
  try {
    return sortModel.map((sort) => ({
      [sort.colId]: sort.sort,
    }));
  } catch (e) {
    console.error("Failed to parse sortModel:", e);
    return [{ createdAt: "desc" }];
  }
}

function parseFilterModel(
  filterModel: GetRowsParams["filterModel"]
): Prisma.LicensePlateWhereInput {
  if (!filterModel) return {};
  try {
    const where: Prisma.LicensePlateWhereInput = {};
    // Example: Handle a simple text filter for plateNumber from AG Grid
    if (filterModel.plateNumber?.filterType === "text") {
      where.plateNumber = {
        contains: filterModel.plateNumber.filter,
        mode: "insensitive",
      };
    }
    // Add more filter conditions based on AG Grid filter model structure
    // (e.g., date ranges, number ranges, set filters)
    return where;
  } catch (e) {
    console.error("Failed to parse filterModel:", e);
    return {};
  }
}

export async function getLicensePlatesAction(params: GetRowsParams) {
  try {
    const { filterModel, sortModel } = params;

    const where = parseFilterModel(filterModel);
    const orderBy = parseSortModel(sortModel);

    // Fetch all records matching the filter
    const records = await prisma.licensePlate.findMany({
      where,
      orderBy,
      // No skip or take for client-side model
    });

    return {
      success: true,
      rows: records.map(transformDbRecordToColumnSchema),
      // No totalRowCount needed for client-side model in this basic setup
    };
  } catch (error) {
    console.error("Server Action Error - Failed to get license plates:", error);
    return {
      success: false,
      error: "Failed to fetch data",
      rows: [],
    };
  }
}
