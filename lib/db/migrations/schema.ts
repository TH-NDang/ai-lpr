import { pgTable, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const detectionSource = pgEnum("detection_source", ['upload', 'camera', 'import', 'api'])
export const entryType = pgEnum("entry_type", ['entry', 'exit', 'unknown'])
export const plateType = pgEnum("plate_type", ['civilian', 'military', 'police', 'diplomatic', 'temporary', 'special'])
export const vehicleCategory = pgEnum("vehicle_category", ['car', 'truck', 'motorcycle', 'bus', 'special', 'other'])



