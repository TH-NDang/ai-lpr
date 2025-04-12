import { LicensePlate } from "@prisma/client";

export function transformDbRecordToColumnSchema(record: LicensePlate) {
  // Determine level based on confidence value
  let level: "success" | "warning" | "error" = "error";
  if (record.confidence >= 90) {
    level = "success";
  } else if (record.confidence >= 75) {
    level = "warning";
  }

  // Đảm bảo rằng chuỗi trả về là chuỗi hợp lệ với Unicode chuẩn
  const sanitizeString = (str: string | null): string => {
    if (!str) return "";
    return String(str).normalize("NFC");
  };

  return {
    uuid: record.id.toString(),
    level,
    date: new Date(record.createdAt),
    plateNumber: sanitizeString(record.plateNumber),
    confidence: record.confidence,
    confidence_ocr: record.confidence_ocr || 0,
    provinceCode: sanitizeString(record.provinceCode),
    provinceName: sanitizeString(record.provinceName),
    vehicleType: sanitizeString(record.vehicleType),
    plateType: sanitizeString(record.plateType),
    plateFormat: sanitizeString(record.plateFormat),
    imageUrl: record.imageUrl,
    processedImageUrl: sanitizeString(record.processedImageUrl),
    imageSource: "Ảnh tải lên", // Default value since we don't have this in DB
    processingTime: 0, // Không có trong DB, có thể tính toán sau

    // Thông tin mới bổ sung
    normalizedPlate: sanitizeString(record.normalizedPlate),
    originalPlate: sanitizeString(record.originalPlate),
    detectedColor: sanitizeString(record.detectedColor),
    ocrEngine: sanitizeString(record.ocrEngine),
    isValidFormat: record.isValidFormat,
    formatDescription: sanitizeString(record.formatDescription),
    hasViolation: record.hasViolation,
    violationTypes: record.violationTypes || [],
    isVerified: record.isVerified,
  };
}

export async function findOrCreateVehicleFromPlate(plateNumber: string) {
  // This function would be implemented based on business logic using Prisma
  // Example implementation would go here
}

export async function createDetectionAndLicensePlate(
  analysisResult: any,
  source = "upload"
) {
  // This function would be implemented based on business logic using Prisma
  // Example implementation would go here
}
