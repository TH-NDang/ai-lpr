import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { licensePlates } from "@/lib/db/schema";
import { put } from "@vercel/blob";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Upload the original image to Vercel Blob
    const { url: imageUrl } = await put(file.name, file, {
      access: "public",
    });

    // TODO: Call your Python backend API here
    // This is a placeholder response
    const response = await fetch("http://localhost:5000/process-image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to process image");
    }

    const result = await response.json();

    // Store the result in the database
    const [record] = await db
      .insert(licensePlates)
      .values({
        plateNumber: result.plateNumber,
        confidence: Math.round(result.confidence * 100),
        imageUrl,
        processedImageUrl: result.processedImageUrl,
      })
      .returning();

    return NextResponse.json(record);
  } catch (error) {
    console.error("Error processing license plate:", error);
    return NextResponse.json(
      { error: "Failed to process license plate" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const records = await db.select().from(licensePlates);
    return NextResponse.json(records);
  } catch (error) {
    console.error("Error fetching license plates:", error);
    return NextResponse.json(
      { error: "Failed to fetch license plates" },
      { status: 500 }
    );
  }
}
