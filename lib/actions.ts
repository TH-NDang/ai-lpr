"use server";

import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

// Mở rộng interface để hỗ trợ các trường mới
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
