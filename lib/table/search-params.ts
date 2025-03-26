import { LEVELS } from "@/components/data-table/constants/levels";
// Note: import from 'nuqs/server' to avoid the "use client" directive
import {
  createParser,
  createSearchParamsCache,
  createSerializer,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  parseAsTimestamp,
  type inferParserType,
} from "nuqs/server";

import {
  ARRAY_DELIMITER,
  RANGE_DELIMITER,
  SLIDER_DELIMITER,
} from "@/lib/table/delimiters";

// https://logs.run/i?sort=latency.desc

export const parseAsSort = createParser({
  parse(queryValue) {
    try {
      return JSON.parse(queryValue);
    } catch {
      return null;
    }
  },
  serialize(value) {
    return JSON.stringify(value);
  },
});

export const searchParamsParser = {
  // REQUIRED FOR SORTING & PAGINATION
  sort: parseAsSort,
  size: parseAsInteger.withDefault(30),
  start: parseAsInteger.withDefault(0),

  // Basic filters
  level: parseAsArrayOf(parseAsStringLiteral(LEVELS), ARRAY_DELIMITER),
  date: parseAsArrayOf(parseAsTimestamp, RANGE_DELIMITER),
  uuid: parseAsString,

  // License plate recognition fields
  plateNumber: parseAsString,
  confidence: parseAsArrayOf(parseAsInteger, SLIDER_DELIMITER),
  provinceCode: parseAsString,
  provinceName: parseAsString,
  vehicleType: parseAsString,
  plateType: parseAsString,
  plateFormat: parseAsString,
  imageSource: parseAsString,
  processingTime: parseAsArrayOf(parseAsInteger, SLIDER_DELIMITER),
};

export const searchParamsCache = createSearchParamsCache(searchParamsParser);

export type SearchParamsType = inferParserType<typeof searchParamsParser>;

export const searchParamsSerializer = createSerializer(searchParamsParser);
