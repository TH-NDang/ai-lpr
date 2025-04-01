"use server";

import { db } from "@/lib/db";
import { licensePlates } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";

export async function saveLicensePlate(formData: {
  plateNumber: string;
  confidence: number;
  confidence_ocr?: number;
  imageUrl: string;
  processedImageUrl?: string | null;
  provinceCode?: string | null;
  provinceName?: string | null;
  vehicleType?: string | null;
  plateType?: string | null;
  plateFormat?: string | null;
  plateSerial?: string | null;
  registrationNumber?: string | null;
}) {
  try {
    // Validate the required fields
    if (!formData.plateNumber || !formData.confidence || !formData.imageUrl) {
      throw new Error("Missing required fields");
    }

    const result = await db
      .insert(licensePlates)
      .values({
        plateNumber: formData.plateNumber,
        confidence: formData.confidence,
        confidence_ocr: formData.confidence_ocr,
        imageUrl: formData.imageUrl,
        processedImageUrl: formData.processedImageUrl || null,
        provinceCode: formData.provinceCode || null,
        provinceName: formData.provinceName || null,
        vehicleType: formData.vehicleType || null,
        plateType: formData.plateType || null,
        plateFormat: formData.plateFormat || null,
        plateSerial: formData.plateSerial || null,
        registrationNumber: formData.registrationNumber || null,
      })
      .returning();

    // Revalidate related paths
    revalidatePath("/license-plate");

    return { success: true, plate: result[0] };
  } catch (error) {
    console.error("Error saving license plate:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
