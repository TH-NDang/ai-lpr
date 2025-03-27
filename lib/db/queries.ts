import 'server-only'

import { genSaltSync, hashSync } from 'bcrypt-ts'
import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  inArray,
  between,
  ilike,
  or,
  sql,
} from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  type Message,
  message,
  vote,
  licensePlates,
} from './schema'
import type { ArtifactKind } from '@/components/artifact'
import type { ColumnFilterSchema } from '@/lib/table/schema'
import { transformDbRecordToColumnSchema } from './schema'

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!)
const db = drizzle(client)

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email))
  } catch (error) {
    console.error('Failed to get user from database')
    throw error
  }
}

export async function createUser(email: string, password: string) {
  const salt = genSaltSync(10)
  const hash = hashSync(password, salt)

  try {
    return await db.insert(user).values({ email, password: hash })
  } catch (error) {
    console.error('Failed to create user in database')
    throw error
  }
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string
  userId: string
  title: string
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
    })
  } catch (error) {
    console.error('Failed to save chat in database')
    throw error
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id))
    await db.delete(message).where(eq(message.chatId, id))

    return await db.delete(chat).where(eq(chat.id, id))
  } catch (error) {
    console.error('Failed to delete chat by id from database')
    throw error
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt))
  } catch (error) {
    console.error('Failed to get chats by user from database')
    throw error
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id))
    return selectedChat
  } catch (error) {
    console.error('Failed to get chat by id from database')
    throw error
  }
}

export async function saveMessages({ messages }: { messages: Array<Message> }) {
  try {
    return await db.insert(message).values(messages)
  } catch (error) {
    console.error('Failed to save messages in database', error)
    throw error
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt))
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error)
    throw error
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string
  messageId: string
  type: 'up' | 'down'
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)))

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)))
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    })
  } catch (error) {
    console.error('Failed to upvote message in database', error)
    throw error
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id))
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error)
    throw error
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string
  title: string
  kind: ArtifactKind
  content: string
  userId: string
}) {
  try {
    return await db.insert(document).values({
      id,
      title,
      kind,
      content,
      userId,
      createdAt: new Date(),
    })
  } catch (error) {
    console.error('Failed to save document in database')
    throw error
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt))

    return documents
  } catch (error) {
    console.error('Failed to get document by id from database')
    throw error
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt))

    return selectedDocument
  } catch (error) {
    console.error('Failed to get document by id from database')
    throw error
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string
  timestamp: Date
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      )

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    )
    throw error
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>
}) {
  try {
    return await db.insert(suggestion).values(suggestions)
  } catch (error) {
    console.error('Failed to save suggestions in database')
    throw error
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)))
  } catch (error) {
    console.error('Failed to get suggestions by document version from database')
    throw error
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id))
  } catch (error) {
    console.error('Failed to get message by id from database')
    throw error
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string
  timestamp: Date
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)))

    const messageIds = messagesToDelete.map((message) => message.id)

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        )

      return await db
        .delete(message)
        .where(and(eq(message.chatId, chatId), inArray(message.id, messageIds)))
    }
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
    )
    throw error
  }
}

export async function updateChatVisibilityById({
  chatId,
  visibility,
}: {
  chatId: string
  visibility: 'private' | 'public'
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId))
  } catch (error) {
    console.error('Failed to update chat visibility in database')
    throw error
  }
}

// License Plate Recognition functions
export async function getLicensePlates({
  filter = {},
  sort = null,
  start = 0,
  size = 10,
}: {
  filter?: ColumnFilterSchema
  sort?: { id: string; desc: boolean } | null
  start?: number
  size?: number
}) {
  try {
    // Build base query
    let query = db.select().from(licensePlates)

    try {
      // Add date filter if provided
      if (
        filter.date &&
        Array.isArray(filter.date) &&
        filter.date.length === 2
      ) {
        query = query.where(
          between(licensePlates.createdAt, filter.date[0], filter.date[1]),
        ) as typeof query
      }

      // Add text-based filters
      if (filter.plateNumber) {
        const plateNumberValue = String(filter.plateNumber).trim()
        if (plateNumberValue !== '') {
          query = query.where(
            ilike(licensePlates.plateNumber, `%${plateNumberValue}%`),
          ) as typeof query
        }
      }

      if (filter.provinceCode) {
        const provinceCodeValue = String(filter.provinceCode).trim()
        if (provinceCodeValue !== '') {
          query = query.where(
            ilike(licensePlates.provinceCode || '', `%${provinceCodeValue}%`),
          ) as typeof query
        }
      }

      if (filter.provinceName) {
        const provinceNameValue = String(filter.provinceName).trim()
        if (provinceNameValue !== '') {
          query = query.where(
            ilike(licensePlates.provinceName || '', `%${provinceNameValue}%`),
          ) as typeof query
        }
      }

      if (filter.vehicleType) {
        if (Array.isArray(filter.vehicleType)) {
          if (filter.vehicleType.length > 0) {
            const vehicleTypeConditions = filter.vehicleType.map((type) =>
              ilike(licensePlates.vehicleType || '', `%${type.trim()}%`),
            )
            query = query.where(or(...vehicleTypeConditions)) as typeof query
          }
        } else {
          // Đối với tiếng Việt, hỗ trợ cả có dấu và không dấu
          // Vì DB không có chức năng normalize, nên cần phải kiểm tra chính xác theo cách thủ công
          const vehicleTypeValue = String(filter.vehicleType).trim()
          if (vehicleTypeValue !== '') {
            query = query.where(
              ilike(licensePlates.vehicleType || '', `%${vehicleTypeValue}%`),
            ) as typeof query
          }
        }
      }

      if (filter.plateType) {
        if (Array.isArray(filter.plateType)) {
          if (filter.plateType.length > 0) {
            const plateTypeConditions = filter.plateType.map((type) =>
              ilike(licensePlates.plateType || '', `%${type.trim()}%`),
            )
            query = query.where(or(...plateTypeConditions)) as typeof query
          }
        } else {
          // Đối với tiếng Việt, hỗ trợ cả có dấu và không dấu
          // Vì DB không có chức năng normalize, nên cần phải kiểm tra chính xác theo cách thủ công
          const plateTypeValue = String(filter.plateType).trim()
          if (plateTypeValue !== '') {
            query = query.where(
              ilike(licensePlates.plateType || '', `%${plateTypeValue}%`),
            ) as typeof query
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
        const [min, max] = filter.confidence
        query = query.where(
          between(licensePlates.confidence, min, max),
        ) as typeof query
      }

      // Handle sorting
      if (sort) {
        const { id, desc: isDesc } = sort
        switch (id) {
          case 'date':
            query = isDesc
              ? (query.orderBy(desc(licensePlates.createdAt)) as typeof query)
              : (query.orderBy(asc(licensePlates.createdAt)) as typeof query)
            break
          case 'confidence':
            query = isDesc
              ? (query.orderBy(desc(licensePlates.confidence)) as typeof query)
              : (query.orderBy(asc(licensePlates.confidence)) as typeof query)
            break
          case 'plateNumber':
            query = isDesc
              ? (query.orderBy(desc(licensePlates.plateNumber)) as typeof query)
              : (query.orderBy(asc(licensePlates.plateNumber)) as typeof query)
            break
          default:
            query = query.orderBy(desc(licensePlates.createdAt)) as typeof query // Default sort by newest
        }
      } else {
        query = query.orderBy(desc(licensePlates.createdAt)) as typeof query // Default sort by newest
      }
    } catch (filterError) {
      console.error('Error applying filters:', filterError)
    }

    // Apply pagination
    query = query.limit(size).offset(start) as typeof query

    // Execute query
    const records = await query

    // Get total count
    const countQuery = db.select({ count: count() }).from(licensePlates)
    const [{ count: totalCount }] = await countQuery

    return {
      data: records.map(transformDbRecordToColumnSchema),
      totalCount: Number(totalCount),
      filteredCount: records.length,
    }
  } catch (error) {
    console.error('Failed to get license plates:', error)
    throw error
  }
}

// Helper to count rows
function count() {
  return sql`count(*)`
}
