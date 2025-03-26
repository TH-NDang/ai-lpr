import {
  ARRAY_DELIMITER,
  RANGE_DELIMITER,
  SLIDER_DELIMITER,
} from "@/lib/table/delimiters";
import { LEVELS } from "../../components/data-table/constants/levels";
import { z } from "zod";

export const ColumnSchema = z
  .object({
    uuid: z.string(),
    level: z.enum(["success", "warning", "error"]),
    date: z.date(),

    // License Plate Fields
    plateNumber: z.string().optional(),
    confidence: z.number().optional(),
    provinceCode: z.string().optional(),
    provinceName: z.string().optional(),
    vehicleType: z.string().optional(),
    plateType: z.string().optional(),
    plateFormat: z.string().optional(),
    plateSerial: z.string().optional(),
    registrationNumber: z.string().optional(),
    imageUrl: z.string().optional(),
    processedImageUrl: z.string().optional(),
    imageSource: z.string().optional(),
    processingTime: z.number().optional(),
  })
  .strict();

export type ColumnSchema = z.infer<typeof ColumnSchema>;

// TODO: can we get rid of this in favor of nuqs search-params?
export const columnFilterSchema = z.object({
  level: z
    .string()
    .transform((val) => val.split(ARRAY_DELIMITER))
    .pipe(z.enum(LEVELS).array())
    .optional(),
  date: z
    .string()
    .transform((val) => val.split(RANGE_DELIMITER).map(Number))
    .pipe(z.coerce.date().array())
    .optional(),

  // License plate recognition fields
  plateNumber: z.string().optional(),
  confidence: z
    .string()
    .transform((val) => val.split(SLIDER_DELIMITER))
    .pipe(z.coerce.number().array().max(2))
    .optional(),
  provinceCode: z.string().optional(),
  provinceName: z.string().optional(),
  vehicleType: z.string().optional(),
  plateType: z.string().optional(),
  imageSource: z.string().optional(),
  processingTime: z
    .string()
    .transform((val) => val.split(SLIDER_DELIMITER))
    .pipe(z.coerce.number().array().max(2))
    .optional(),
});

export type ColumnFilterSchema = z.infer<typeof columnFilterSchema>;

export const FacetMetadataRowSchema = z.object({
  value: z.string(),
  total: z.number(),
});

export const FacetMetadataSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  rows: z.array(FacetMetadataRowSchema),
});

export type FacetMetadataSchema = z.infer<typeof FacetMetadataSchema>;
