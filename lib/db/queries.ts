import "server-only";
import { prisma } from "./prisma";
import { transformDbRecordToColumnSchema } from "./utils";
import type { ColumnFilterSchema } from "../table/schema";

// License Plate Recognition functions
export async function getLicensePlates({
  filter = {},
  sort = null,
  start = 0,
  size = 10,
}: {
  filter?: ColumnFilterSchema;
  sort?: { id: string; desc: boolean } | null;
  start?: number;
  size?: number;
}) {
  try {
    // Build the where condition for Prisma
    const where: any = {};

    try {
      // Add date filter if provided
      if (
        filter.date &&
        Array.isArray(filter.date) &&
        filter.date.length === 2
      ) {
        where.createdAt = {
          gte: filter.date[0],
          lte: filter.date[1],
        };
      }

      // Add text-based filters
      if (filter.plateNumber) {
        const plateNumberValue = String(filter.plateNumber).trim();
        if (plateNumberValue !== "") {
          where.plateNumber = {
            contains: plateNumberValue,
            mode: "insensitive",
          };
        }
      }

      if (filter.provinceCode) {
        const provinceCodeValue = String(filter.provinceCode).trim();
        if (provinceCodeValue !== "") {
          where.provinceCode = {
            contains: provinceCodeValue,
            mode: "insensitive",
          };
        }
      }

      if (filter.provinceName) {
        const provinceNameValue = String(filter.provinceName).trim();
        if (provinceNameValue !== "") {
          where.provinceName = {
            contains: provinceNameValue,
            mode: "insensitive",
          };
        }
      }

      if (filter.vehicleType) {
        if (Array.isArray(filter.vehicleType)) {
          if (filter.vehicleType.length > 0) {
            where.OR = filter.vehicleType.map((type) => ({
              vehicleType: {
                contains: type.trim(),
                mode: "insensitive",
              },
            }));
          }
        } else {
          const vehicleTypeValue = String(filter.vehicleType).trim();
          if (vehicleTypeValue !== "") {
            where.vehicleType = {
              contains: vehicleTypeValue,
              mode: "insensitive",
            };
          }
        }
      }

      if (filter.plateType) {
        if (Array.isArray(filter.plateType)) {
          if (filter.plateType.length > 0) {
            where.OR = (where.OR || []).concat(
              filter.plateType.map((type) => ({
                plateType: {
                  contains: type.trim(),
                  mode: "insensitive",
                },
              }))
            );
          }
        } else {
          const plateTypeValue = String(filter.plateType).trim();
          if (plateTypeValue !== "") {
            where.plateType = {
              contains: plateTypeValue,
              mode: "insensitive",
            };
          }
        }
      }

      // Add confidence range filter
      if (
        filter.confidence &&
        Array.isArray(filter.confidence) &&
        filter.confidence.length === 2
      ) {
        const [min, max] = filter.confidence;
        where.confidence = {
          gte: min,
          lte: max,
        };
      }
    } catch (filterError) {
      console.error("Error applying filters:", filterError);
    }

    // Determine sorting
    const orderBy: any = {};
    if (sort) {
      const { id, desc: isDesc } = sort;
      switch (id) {
        case "date":
          orderBy.createdAt = isDesc ? "desc" : "asc";
          break;
        case "confidence":
          orderBy.confidence = isDesc ? "desc" : "asc";
          break;
        case "plateNumber":
          orderBy.plateNumber = isDesc ? "desc" : "asc";
          break;
        default:
          orderBy.createdAt = "desc"; // Default sort by newest
      }
    } else {
      orderBy.createdAt = "desc"; // Default sort by newest
    }

    // Execute queries
    const [records, totalCount] = await Promise.all([
      prisma.licensePlate.findMany({
        where,
        orderBy,
        skip: start,
        take: size,
      }),
      prisma.licensePlate.count({ where }),
    ]);

    return {
      data: records.map(transformDbRecordToColumnSchema),
      totalCount: Number(totalCount),
      filteredCount: records.length,
    };
  } catch (error) {
    console.error("Failed to get license plates:", error);
    throw error;
  }
}
