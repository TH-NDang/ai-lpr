import type { InferSelectModel } from "drizzle-orm";
import {
  pgTable,
  timestamp,
  json,
  text,
  foreignKey,
  boolean,
  serial,
  integer,
  pgEnum,
  real,
  uniqueIndex,
  date,
  jsonb,
} from "drizzle-orm/pg-core";

// Enums
export const plateTypeEnum = pgEnum("plate_type", [
  "civilian",
  "military",
  "police",
  "diplomatic",
  "temporary",
  "special",
]);

export const vehicleCategoryEnum = pgEnum("vehicle_category", [
  "car",
  "truck",
  "motorcycle",
  "bus",
  "special",
  "other",
]);

export const detectionSourceEnum = pgEnum("detection_source", [
  "upload",
  "camera",
  "import",
  "api",
]);

export const entryTypeEnum = pgEnum("entry_type", ["entry", "exit", "unknown"]);

export const licensePlates = pgTable("license_plates", {
  id: serial("id").primaryKey(),
  plateNumber: text("plate_number").notNull(),
  confidence: integer("confidence").notNull(),
  confidence_ocr: integer("confidence_ocr"),
  imageUrl: text("image_url").notNull(),
  processedImageUrl: text("processed_image_url"),

  // Thông tin phân vùng
  provinceCode: text("province_code"),
  provinceName: text("province_name"),

  // Thông tin phân loại
  vehicleType: text("vehicle_type"),
  plateType: text("plate_type"),
  plateFormat: text("plate_format"),

  // Thông tin chi tiết
  plateSerial: text("plate_serial"),
  registrationNumber: text("registration_number"),

  // Thêm các trường mới từ kết quả phân tích
  boundingBox: json("bounding_box"), // [x, y, width, height]
  normalizedPlate: text("normalized_plate"), // Biển số chuẩn hóa (không dấu, không khoảng cách)
  originalPlate: text("original_plate"), // Biển số gốc như được phát hiện
  detectedColor: text("detected_color"), // Màu biển số được phát hiện
  ocrEngine: text("ocr_engine"), // Engine OCR được sử dụng
  isValidFormat: boolean("is_valid_format"), // Cờ đánh dấu định dạng hợp lệ
  formatDescription: text("format_description"), // Mô tả định dạng biển số

  // Thông tin phân loại xe
  vehicleCategory: text("vehicle_category"), // Loại xe (xe con, xe tải, xe khách, xe đầu kéo, etc.)
  plateTypeInfo: json("plate_type_info"), // Thông tin loại biển số

  // Thông tin xử phạt
  hasViolation: boolean("has_violation").default(false), // Có vi phạm hay không
  violationTypes: text("violation_types").array(), // Các loại vi phạm
  violationDescription: text("violation_description"), // Mô tả vi phạm

  // Thông tin xác thực
  isVerified: boolean("is_verified").default(false), // Đã xác thực hay chưa
  verifiedBy: text("verified_by"), // Người xác thực
  verifiedAt: timestamp("verified_at"), // Thời gian xác thực

  detectionId: integer("detection_id"),
  vehicleId: integer("vehicle_id"),

  // Timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type LicensePlate = InferSelectModel<typeof licensePlates>;

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

// Bảng mới: Vehicles
export const vehicles = pgTable(
  "vehicles",
  {
    id: serial("id").primaryKey(),
    // Thông tin đăng ký
    registrationNumber: text("registration_number").notNull(),
    ownerName: text("owner_name"),
    registrationDate: date("registration_date"),
    expiryDate: date("expiry_date"),

    // Thông tin xe
    make: text("make"),
    model: text("model"),
    year: integer("year"),
    color: text("color"),
    vehicleCategory: vehicleCategoryEnum("vehicle_category"),

    // Timestamp
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("registration_idx").on(table.registrationNumber)]
);

// Bảng mới: Detections
export const detections = pgTable("detections", {
  id: serial("id").primaryKey(),
  source: detectionSourceEnum("source").notNull().default("upload"),
  imageUrl: text("image_url").notNull(),
  processedImageUrl: text("processed_image_url"),
  detectionTime: timestamp("detection_time").defaultNow().notNull(),

  // Thông số phát hiện
  confidence: integer("confidence").notNull(),
  confidenceOcr: integer("confidence_ocr"),
  boundingBox: jsonb("bounding_box"),
  ocrEngine: text("ocr_engine"),
  processTimeMs: integer("process_time_ms"),

  // Phần thông tin kết quả phân tích
  plateNumber: text("plate_number").notNull(),
  normalizedPlate: text("normalized_plate"),
  originalPlate: text("original_plate"),

  // References
  cameraId: integer("camera_id"),
  locationId: integer("location_id"),

  // Timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Bảng mới: Cameras
export const cameras = pgTable("cameras", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ipAddress: text("ip_address"),
  model: text("model"),
  resolution: text("resolution"),
  status: text("status").default("active"),

  // Vị trí
  locationId: integer("location_id"),
  position: text("position"),
  direction: text("direction"),

  // Timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Bảng mới: Locations
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  locationType: text("location_type"), // parking, intersection, highway, etc

  // Tọa độ
  latitude: real("latitude"),
  longitude: real("longitude"),

  // Timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Bảng Parking Entries - dành cho bãi đỗ xe
export const parkingEntries = pgTable(
  "parking_entries",
  {
    id: serial("id").primaryKey(),
    entryTime: timestamp("entry_time").defaultNow().notNull(),
    exitTime: timestamp("exit_time"),
    entryType: entryTypeEnum("entry_type").default("unknown"),

    // Thông tin xe và biển số
    detectionId: integer("detection_id").notNull(),
    plateNumber: text("plate_number").notNull(), // duplicate để dễ tìm kiếm
    vehicleId: integer("vehicle_id"),
    locationId: integer("location_id").notNull(),

    // Thông tin phí
    parkingFee: real("parking_fee"),
    isPaid: boolean("is_paid").default(false),
    paymentMethod: text("payment_method"),
    paymentTime: timestamp("payment_time"),

    // Timestamp
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    // Foreign keys
    foreignKey({
      columns: [table.detectionId],
      foreignColumns: [detections.id],
    }),
    foreignKey({
      columns: [table.locationId],
      foreignColumns: [locations.id],
    }),
  ]
);

// Bảng Violations
export const violations = pgTable(
  "violations",
  {
    id: serial("id").primaryKey(),
    violationTime: timestamp("violation_time").defaultNow().notNull(),
    violationType: text("violation_type").notNull(),
    description: text("description"),
    status: text("status").default("pending"), // pending, confirmed, canceled

    // References
    detectionId: integer("detection_id").notNull(),
    plateNumber: text("plate_number").notNull(), // duplicate để dễ tìm kiếm
    locationId: integer("location_id"),

    // Evidence
    evidenceImageUrl: text("evidence_image_url"),
    evidenceVideoUrl: text("evidence_video_url"),

    // Verified
    isVerified: boolean("is_verified").default(false),
    verifiedBy: text("verified_by"),
    verifiedAt: timestamp("verified_at"),

    // Timestamp
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    // Foreign keys
    foreignKey({
      columns: [table.detectionId],
      foreignColumns: [detections.id],
    }),
  ]
);

// Bổ sung hàm helper mới để làm việc với cấu trúc DB mới
export async function findOrCreateVehicleFromPlate(db, plateNumber: string) {
  // Code tạo hoặc tìm vehicle dựa trên biển số
}

// Hàm helper để tạo detection và license plate từ kết quả phân tích
export async function createDetectionAndLicensePlate(
  db,
  analysisResult,
  source = "upload"
) {
  // Code để lưu cả detection và license plate từ kết quả API
}
