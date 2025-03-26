import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { licensePlates } from "@/lib/db/schema";
import { put } from "@vercel/blob";
import { desc } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    try {
      // Upload the original image to Vercel Blob
      const { url: imageUrl } = await put(file.name, file, {
        access: "public",
      });

      // Call your Python backend API
      const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
      const response = await fetch(`${backendUrl}/process-image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend response error:", errorText);
        throw new Error(`Failed to process image: ${response.statusText}`);
      }

      const result = await response.json();

      // Xử lý trường hợp không nhận dạng được biển số
      if (
        result.plateNumber === "Không đọc được biển số" ||
        result.plateNumber === "Không phát hiện được biển số" ||
        result.plateNumber === "Không tìm thấy biển số hợp lệ"
      ) {
        return NextResponse.json({
          success: false,
          plateNumber: result.plateNumber,
          confidence: 0,
          imageUrl,
          processedImageUrl: result.processedImageUrl,
          plateAnalysis: null,
        });
      }

      // Chuẩn bị dữ liệu để lưu vào database
      const plateAnalysis = result.plateAnalysis;
      const provinceCode = plateAnalysis?.province_code || "";
      const provinceName = plateAnalysis?.province_name || "";
      const vehicleType = plateAnalysis?.vehicle_type || "";
      const plateType = plateAnalysis?.plate_type || "personal";
      const plateFormat = plateAnalysis?.format || "";
      const plateSerial = plateAnalysis?.serial || "";
      const plateNumber = plateAnalysis?.number || "";

      // Store the result in the database
      const [record] = await db
        .insert(licensePlates)
        .values({
          plateNumber: result.plateNumber,
          confidence: Math.round(result.confidence * 100),
          imageUrl,
          processedImageUrl: result.processedImageUrl,
          provinceCode,
          provinceName,
          vehicleType,
          plateType,
          plateFormat,
          plateSerial,
          registrationNumber: plateNumber, // Số đăng ký (phần cuối của biển số)
        })
        .returning();

      return NextResponse.json({
        success: true,
        ...record,
        plateAnalysis: result.plateAnalysis,
      });
    } catch (error) {
      console.error("Error processing license plate:", error);

      // Trả về lỗi với thông tin chi tiết nhưng vẫn giữ định dạng phản hồi
      return NextResponse.json(
        {
          success: false,
          plateNumber: "Lỗi xử lý hình ảnh",
          confidence: 0,
          imageUrl: null,
          processedImageUrl: null,
          plateAnalysis: null,
          error: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in form handling:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Lỗi xử lý form upload",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const records = await db
      .select()
      .from(licensePlates)
      .orderBy(desc(licensePlates.createdAt));
    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error("Error fetching license plates:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch license plates" },
      { status: 500 }
    );
  }
}
