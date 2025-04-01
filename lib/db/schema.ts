import type { InferSelectModel } from 'drizzle-orm'
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
  serial,
  integer,
} from 'drizzle-orm/pg-core'

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
})

export type User = InferSelectModel<typeof user>

export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
})

export type Chat = InferSelectModel<typeof chat>

export const message = pgTable('Message', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  content: json('content').notNull(),
  createdAt: timestamp('createdAt').notNull(),
})

export type Message = InferSelectModel<typeof message>

export const vote = pgTable(
  'Vote',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return [primaryKey({ columns: [table.chatId, table.messageId] })]
  },
)

export type Vote = InferSelectModel<typeof vote>

export const document = pgTable(
  'Document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('text', { enum: ['text', /* 'code', 'image',*/ 'sheet'] })
      .notNull()
      .default('text'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
  },
  (table) => [primaryKey({ columns: [table.id, table.createdAt] })],
)

export type Document = InferSelectModel<typeof document>

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id] }),
    foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  ],
)

export type Suggestion = InferSelectModel<typeof suggestion>

export const licensePlates = pgTable('license_plates', {
  id: serial('id').primaryKey(),
  plateNumber: text('plate_number').notNull(),
  confidence: integer('confidence').notNull(),
  confidence_ocr: integer('confidence_ocr'),
  imageUrl: text('image_url').notNull(),
  processedImageUrl: text('processed_image_url'),

  provinceCode: text('province_code'),
  provinceName: text('province_name'),
  vehicleType: text('vehicle_type'),
  plateType: text('plate_type'),
  plateFormat: text('plate_format'),

  plateSerial: text('plate_serial'),
  registrationNumber: text('registration_number'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type LicensePlate = InferSelectModel<typeof licensePlates>

export function transformDbRecordToColumnSchema(record: LicensePlate) {
  // Determine level based on confidence value
  let level: 'success' | 'warning' | 'error' = 'error'
  if (record.confidence >= 90) {
    level = 'success'
  } else if (record.confidence >= 75) {
    level = 'warning'
  }

  // Calculate a processing time (mock it since we don't have it in DB)
  const processingTime = Math.floor(Math.random() * 1000) + 100

  // Đảm bảo rằng chuỗi trả về là chuỗi hợp lệ với Unicode chuẩn
  const sanitizeString = (str: string | null): string => {
    if (!str) return ''
    return String(str).normalize('NFC')
  }

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
    imageSource: 'Ảnh tải lên', // Default value since we don't have this in DB
    processingTime,
  }
}
