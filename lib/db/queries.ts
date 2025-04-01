import "server-only";
import { db } from ".";
import { licensePlates, transformDbRecordToColumnSchema } from "./schema/schema";
import type { ColumnFilterSchema } from "../table/schema";
import { between, ilike, or, desc, asc } from "drizzle-orm/expressions";
import { sql } from "drizzle-orm";

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
    // Build base query
    let query = db.select().from(licensePlates);

    try {
      // Add date filter if provided
      if (
        filter.date &&
        Array.isArray(filter.date) &&
        filter.date.length === 2
      ) {
        query = query.where(
          between(licensePlates.createdAt, filter.date[0], filter.date[1])
        ) as typeof query;
      }

      // Add text-based filters
      if (filter.plateNumber) {
        const plateNumberValue = String(filter.plateNumber).trim();
        if (plateNumberValue !== "") {
          query = query.where(
            ilike(licensePlates.plateNumber, `%${plateNumberValue}%`)
          ) as typeof query;
        }
      }

      if (filter.provinceCode) {
        const provinceCodeValue = String(filter.provinceCode).trim();
        if (provinceCodeValue !== "") {
          query = query.where(
            ilike(licensePlates.provinceCode || "", `%${provinceCodeValue}%`)
          ) as typeof query;
        }
      }

      if (filter.provinceName) {
        const provinceNameValue = String(filter.provinceName).trim();
        if (provinceNameValue !== "") {
          query = query.where(
            ilike(licensePlates.provinceName || "", `%${provinceNameValue}%`)
          ) as typeof query;
        }
      }

      if (filter.vehicleType) {
        if (Array.isArray(filter.vehicleType)) {
          if (filter.vehicleType.length > 0) {
            const vehicleTypeConditions = filter.vehicleType.map((type) =>
              ilike(licensePlates.vehicleType || "", `%${type.trim()}%`)
            );
            query = query.where(or(...vehicleTypeConditions)) as typeof query;
          }
        } else {
          // Đối với tiếng Việt, hỗ trợ cả có dấu và không dấu
          // Vì DB không có chức năng normalize, nên cần phải kiểm tra chính xác theo cách thủ công
          const vehicleTypeValue = String(filter.vehicleType).trim();
          if (vehicleTypeValue !== "") {
            query = query.where(
              ilike(licensePlates.vehicleType || "", `%${vehicleTypeValue}%`)
            ) as typeof query;
          }
        }
      }

      if (filter.plateType) {
        if (Array.isArray(filter.plateType)) {
          if (filter.plateType.length > 0) {
            const plateTypeConditions = filter.plateType.map((type) =>
              ilike(licensePlates.plateType || "", `%${type.trim()}%`)
            );
            query = query.where(or(...plateTypeConditions)) as typeof query;
          }
        } else {
          // Đối với tiếng Việt, hỗ trợ cả có dấu và không dấu
          // Vì DB không có chức năng normalize, nên cần phải kiểm tra chính xác theo cách thủ công
          const plateTypeValue = String(filter.plateType).trim();
          if (plateTypeValue !== "") {
            query = query.where(
              ilike(licensePlates.plateType || "", `%${plateTypeValue}%`)
            ) as typeof query;
          }
        }
      }

      // Đã loại bỏ xử lý plateFormat và imageSource vì không cần thiết

      // Add confidence range filter
      if (
        filter.confidence &&
        Array.isArray(filter.confidence) &&
        filter.confidence.length === 2
      ) {
        const [min, max] = filter.confidence;
        query = query.where(
          between(licensePlates.confidence, min, max)
        ) as typeof query;
      }

      // Handle sorting
      if (sort) {
        const { id, desc: isDesc } = sort;
        switch (id) {
          case "date":
            query = isDesc
              ? (query.orderBy(desc(licensePlates.createdAt)) as typeof query)
              : (query.orderBy(asc(licensePlates.createdAt)) as typeof query);
            break;
          case "confidence":
            query = isDesc
              ? (query.orderBy(desc(licensePlates.confidence)) as typeof query)
              : (query.orderBy(asc(licensePlates.confidence)) as typeof query);
            break;
          case "plateNumber":
            query = isDesc
              ? (query.orderBy(desc(licensePlates.plateNumber)) as typeof query)
              : (query.orderBy(asc(licensePlates.plateNumber)) as typeof query);
            break;
          default:
            query = query.orderBy(desc(licensePlates.createdAt)) as typeof query; // Default sort by newest
        }
      } else {
        query = query.orderBy(desc(licensePlates.createdAt)) as typeof query; // Default sort by newest
      }
    } catch (filterError) {
      console.error("Error applying filters:", filterError);
    }

    // Apply pagination
    query = query.limit(size).offset(start) as typeof query;

    // Execute query
    const records = await query;

    // Get total count
    const countQuery = db.select({ count: count() }).from(licensePlates);
    const [{ count: totalCount }] = await countQuery;

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

// Helper to count rows
function count() {
  return sql`count(*)`;
}
