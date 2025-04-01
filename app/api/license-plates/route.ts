import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { licensePlates } from "@/lib/db/schema/schema";
import { eq } from "drizzle-orm";

// GET /api/license-plates - Get all license plates
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = Number.parseInt(url.searchParams.get("limit") || "10");
    const offset = Number.parseInt(url.searchParams.get("offset") || "0");

    const plates = await db.query.licensePlates.findMany({
      limit,
      offset,
      orderBy: (licensePlates, { desc }) => [desc(licensePlates.createdAt)],
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

    const result = await db
      .insert(licensePlates)
      .values({
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
      })
      .returning();

    return NextResponse.json({ plate: result[0] });
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

    await db.delete(licensePlates).where(eq(licensePlates.id, plateId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting license plate:", error);
    return NextResponse.json(
      { error: "Error deleting license plate" },
      { status: 500 }
    );
  }
}
