"use client";

import { useState, useEffect, FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";

const ADK_API_URL = "/api/adk";
const AGENT_APP_NAME = "multi_tool_agent";

interface ChatMessage {
  id: number;
  content: string;
  sender: "user" | "ai";
}

async function sendChatMessageToAgent(variables: {
  text: string;
  userId: string | null;
  sessionId: string | null;
}) {
  const { text, userId, sessionId } = variables;
  if (!userId || !sessionId) {
    throw new Error("User ID or Session ID is missing");
  }

  const response = await fetch(`${ADK_API_URL}/run_sse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      app_name: AGENT_APP_NAME,
      user_id: userId,
      session_id: sessionId,
      new_message: {
        role: "user",
        parts: [
          {
            text: `Context: Đây là một hệ thống nhận diện biển số xe (ANPR - Automatic Number Plate Recognition).
Hệ thống lưu trữ các thông tin sau cho mỗi lần nhận diện:
- Thời gian xe xuất hiện
- Hình ảnh xe và biển số
- Vị trí camera ghi nhận
- Độ chính xác của việc nhận diện
- Biển số xe đã được nhận diện

Các loại truy vấn có thể thực hiện:
1. Tra cứu lịch sử xuất hiện của một biển số cụ thể
2. Thống kê số lượng xe theo khung giờ/ngày/tháng
3. Phân tích xu hướng lưu lượng xe
4. Kiểm tra tần suất xuất hiện của các xe
5. Tìm kiếm các trường hợp đặc biệt (ví dụ: xe xuất hiện nhiều lần trong ngày)

DATABASE SCHEMA KNOWLEDGE:
You have access to a License Plate Recognition (LPR) system database with the following structure:

1. CORE ENTITIES:

export const detectionSourceEnum = pgEnum("detection_source", [
  "upload",
  "camera",
  "import",
  "api",
]);
export const entryTypeEnum = pgEnum("entry_type", ["entry", "exit", "unknown"]);
export const vehicleCategoryEnum = pgEnum("vehicle_category", [
  "car",
  "truck",
  "motorcycle",
  "bus",
  "special",
  "other",
]);

// --- License Plate Tables ---

export const licensePlates = pgTable("license_plates", {
  id: serial("id").primaryKey(),
  plateNumber: varchar("plateNumber", { length: 20 }).notNull().unique(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const licensePlatesRelations = relations(licensePlates, ({ many }) => ({
  detectionResults: many(detectedPlateResults),
}));

export const detections = pgTable("detections", {
  id: serial("id").primaryKey(),
  source: detectionSourceEnum("source").default("upload"),
  imageUrl: text("imageUrl").notNull(),
  processedImageUrl: text("processedImageUrl"),
  detectionTime: timestamp("detectionTime", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  processTimeMs: integer("processTimeMs"),
  cameraId: integer("cameraId").references(() => cameras.id, {
    onDelete: "set null",
  }),
  locationId: integer("locationId").references(() => locations.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const detectionsRelations = relations(detections, ({ one, many }) => ({
  detectedPlates: many(detectedPlateResults),
  camera: one(cameras, {
    fields: [detections.cameraId],
    references: [cameras.id],
  }),
  location: one(locations, {
    fields: [detections.locationId],
    references: [locations.id],
  }),
  parkingEntries: many(parkingEntries),
}));

export const detectedPlateResults = pgTable("detected_plate_results", {
  id: serial("id").primaryKey(),
  detectionId: integer("detectionId")
    .notNull()
    .references(() => detections.id, { onDelete: "cascade" }),
  licensePlateId: integer("licensePlateId").references(() => licensePlates.id, {
    onDelete: "set null",
  }),

  plateNumber: varchar("plateNumber", { length: 20 }).notNull(),
  normalizedPlate: varchar("normalizedPlate", { length: 20 }),

  confidenceDetection: real("confidenceDetection").notNull(),
  boundingBox: jsonb("boundingBox").notNull(),
  ocrEngineUsed: varchar("ocrEngineUsed", { length: 50 }),
  typeVehicle: vehicleCategoryEnum("typeVehicle"),
  provinceCode: varchar("provinceCode", { length: 10 }),
  provinceName: varchar("provinceName", { length: 100 }),
  plateType: varchar("plateType", { length: 50 }),
  detectedColor: varchar("detectedColor", { length: 30 }),
  isValidFormat: boolean("isValidFormat"),
  formatDescription: text("formatDescription"),

  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const detectedPlateResultsRelations = relations(
  detectedPlateResults,
  ({ one, many }) => ({
    detection: one(detections, {
      fields: [detectedPlateResults.detectionId],
      references: [detections.id],
    }),
    licensePlate: one(licensePlates, {
      fields: [detectedPlateResults.licensePlateId],
      references: [licensePlates.id],
    }),
    parkingEntries: many(parkingEntries),
  })
);

export const cameras = pgTable("cameras", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).default("").notNull(),
  model: varchar("model", { length: 100 }),
  locationId: integer("locationId").references(() => locations.id, {
    onDelete: "set null",
  }),
  position: varchar("position", { length: 100 }),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const camerasRelations = relations(cameras, ({ one, many }) => ({
  detections: many(detections),
  location: one(locations, {
    fields: [cameras.locationId],
    references: [locations.id],
  }),
}));

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).default("").notNull(),
  address: text("address"),
  locationType: varchar("locationType", { length: 50 }),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const locationsRelations = relations(locations, ({ many }) => ({
  cameras: many(cameras),
  detections: many(detections),
  parkingEntries: many(parkingEntries),
}));

export const parkingEntries = pgTable("parking_entries", {
  id: serial("id").primaryKey(),
  entryTime: timestamp("entryTime", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  exitTime: timestamp("exitTime", { mode: "date", withTimezone: true }),
  entryType: entryTypeEnum("entryType").default("unknown"),
  detectedPlateResultId: integer("detectedPlateResultId").references(
    () => detectedPlateResults.id,
    { onDelete: "set null" }
  ),
  plateNumber: varchar("plateNumber", { length: 20 }).default(""),
  locationId: integer("locationId")
    .notNull()
    .references(() => locations.id, { onDelete: "cascade" }),
  detectionId: integer("detectionId").references(() => detections.id, {
    onDelete: "set null",
  }),
  parkingFee: real("parkingFee"),
  paymentStatus: varchar("paymentStatus", { length: 30 }),
  paymentTime: timestamp("paymentTime", { mode: "date", withTimezone: true }),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const parkingEntriesRelations = relations(
  parkingEntries,
  ({ one }) => ({
    detectedPlateResult: one(detectedPlateResults, {
      fields: [parkingEntries.detectedPlateResultId],
      references: [detectedPlateResults.id],
    }),
    location: one(locations, {
      fields: [parkingEntries.locationId],
      references: [locations.id],
    }),
    detection: one(detections, {
      fields: [parkingEntries.detectionId],
      references: [detections.id],
    }),
  })
);

User Query: ${text}`,
          },
        ],
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: "Unknown API error" }));
    console.error("API Error Data:", errorData);
    throw new Error(
      `API Error: ${response.status} - ${
        errorData?.message || response.statusText
      }`
    );
  }

  const responseText = await response.text();
  let aiResponseContent = "Response format unclear or no text found.";
  const lines = responseText.trim().split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].startsWith("data:")) {
      try {
        const eventData = JSON.parse(lines[i].substring(5));
        if (
          eventData?.content?.role === "model" &&
          eventData?.content?.parts?.[0]?.text
        ) {
          aiResponseContent = eventData.content.parts[0].text;
          break;
        }
      } catch (e) {
        console.warn("Could not parse SSE line:", lines[i], e);
      }
    }
  }
  return aiResponseContent;
}

export function useHistoryChat() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      content: `👋 *Xin chào! Tôi là trợ lý AI cho hệ thống nhận diện biển số xe.*

📝 *Thông tin hệ thống ANPR:*
• Sử dụng công nghệ ANPR (Automatic Number Plate Recognition)
• Theo dõi và phân tích biển số xe tự động

📊 *Dữ liệu được lưu trữ:*
• ⏰ Thời gian xuất hiện
• 📸 Hình ảnh xe và biển số
• 📍 Vị trí camera ghi nhận
• 📈 Độ chính xác nhận diện

🔍 *Các loại truy vấn có thể thực hiện:*
• 1️⃣ Tra cứu lịch sử biển số cụ thể
• 2️⃣ Thống kê xe theo thời gian
• 3️⃣ Phân tích xu hướng lưu lượng
• 4️⃣ Kiểm tra tần suất xuất hiện
• 5️⃣ Tìm kiếm trường hợp đặc biệt

💡 *Bạn muốn truy vấn thông tin gì về dữ liệu biển số xe?*`,
      sender: "ai",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<
    "idle" | "creating" | "created" | "error"
  >("idle");

  useEffect(() => {
    const generatedUserId = `user_${Math.random().toString(36).substring(2, 9)}`;
    const generatedSessionId = `session_${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    setUserId(generatedUserId);
    setSessionId(generatedSessionId);
    setSessionStatus("creating");

    const createSession = async () => {
      try {
        const response = await fetch(
          `${ADK_API_URL}/apps/${AGENT_APP_NAME}/users/${generatedUserId}/sessions/${generatedSessionId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ state: {} }),
          }
        );

        if (response.ok || response.status === 409) {
          setSessionStatus("created");
        } else {
          const errorData = await response
            .json()
            .catch(() => ({ message: "Failed to create session" }));
          throw new Error(
            `Session Creation Error: ${response.status} - ${
              errorData?.message || response.statusText
            }`
          );
        }
      } catch (error) {
        console.error("Error creating session:", error);
        setSessionStatus("error");
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            content: `Error: Could not initialize chat session. ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            sender: "ai",
          },
        ]);
      }
    };

    createSession();
  }, []);

  const chatMutation = useMutation({
    mutationFn: sendChatMessageToAgent,
    onSuccess: (aiResponseContent) => {
      const newAiMessage = {
        id: Date.now(),
        content: aiResponseContent,
        sender: "ai" as const,
      };
      setChatMessages((prev) => [...prev, newAiMessage]);
    },
    onError: (error) => {
      console.error("Error calling agent API via mutation:", error);
      const errorMessage = {
        id: Date.now(),
        content: `Error: ${
          error instanceof Error ? error.message : "Failed to get response"
        }`,
        sender: "ai" as const,
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    },
  });

  const handleChatSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (
      !chatInput.trim() ||
      !userId ||
      !sessionId ||
      chatMutation.isPending ||
      sessionStatus !== "created"
    ) {
      if (sessionStatus === "creating") {
        console.warn("Session is still being created.");
      } else if (sessionStatus === "error") {
        console.error("Cannot send message, session creation failed.");
      } else if (sessionStatus === "idle") {
        console.warn("Session not yet initialized.");
      }
      return;
    }

    const newUserMessage = {
      id: Date.now() + 1,
      content: chatInput,
      sender: "user" as const,
    };
    setChatMessages((prev) => [...prev, newUserMessage]);
    const messageToSend = chatInput;
    setChatInput("");

    chatMutation.mutate({ text: messageToSend, userId, sessionId });
  };

  return {
    chatMessages,
    chatInput,
    setChatInput,
    sessionStatus,
    handleChatSubmit,
    chatMutation,
  };
}
