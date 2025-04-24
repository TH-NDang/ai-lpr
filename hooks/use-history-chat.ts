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
