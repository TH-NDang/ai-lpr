import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// GET /api/license-plates - Get all license plates
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = Number.parseInt(url.searchParams.get("limit") || "10");
    const offset = Number.parseInt(url.searchParams.get("offset") || "0");

    const plates = await prisma.licensePlate.findMany({
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ plates });
  } catch (error) {
    console.error("Error fetching license plates:", error);
    return NextResponse.json(
      { error: "Error fetching license plates" },
      { status: 500 }
    );
  }
}

// POST /api/license-plates - Create a new license plate
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate the required fields
    if (!body.plateNumber || !body.confidence || !body.imageUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await prisma.licensePlate.create({
      data: {
        plateNumber: body.plateNumber,
        confidence: body.confidence,
        confidence_ocr: body.confidence_ocr,
        imageUrl: body.imageUrl,
        processedImageUrl: body.processedImageUrl,
        provinceCode: body.provinceCode,
        provinceName: body.provinceName,
        vehicleType: body.vehicleType,
        plateType: body.plateType,
        plateFormat: body.plateFormat,
        plateSerial: body.plateSerial,
        registrationNumber: body.registrationNumber,
        // Add other fields from the schema as needed, with defaults or null
        boundingBox: body.boundingBox || undefined,
        normalizedPlate: body.normalizedPlate || undefined,
        originalPlate: body.originalPlate || undefined,
        detectedColor: body.detectedColor || undefined,
        ocrEngine: body.ocrEngine || undefined,
        isValidFormat: body.isValidFormat || undefined,
        formatDescription: body.formatDescription || undefined,
        vehicleCategory: body.vehicleCategory || undefined,
        plateTypeInfo: body.plateTypeInfo || undefined,
        hasViolation: body.hasViolation || false,
        violationTypes: body.violationTypes || [],
        violationDescription: body.violationDescription || undefined,
        isVerified: body.isVerified || false,
        verifiedBy: body.verifiedBy || undefined,
        verifiedAt: body.verifiedAt ? new Date(body.verifiedAt) : undefined,
        detectionId: body.detectionId || undefined,
        vehicleId: body.vehicleId || undefined,
      },
    });

    return NextResponse.json({ plate: result });
  } catch (error) {
    console.error("Error creating license plate:", error);
    return NextResponse.json(
      { error: "Error creating license plate" },
      { status: 500 }
    );
  }
}

// DELETE /api/license-plates/:id - Delete a license plate
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing license plate ID" },
        { status: 400 }
      );
    }

    const plateId = Number.parseInt(id);

    if (Number.isNaN(plateId)) {
      return NextResponse.json(
        { error: "Invalid license plate ID" },
        { status: 400 }
      );
    }

    await prisma.licensePlate.delete({
      where: { id: plateId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting license plate:", error);
    return NextResponse.json(
      { error: "Error deleting license plate" },
      { status: 500 }
    );
  }
}
