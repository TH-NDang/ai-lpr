import React, { useState, FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Send,
  Bot,
  Paperclip,
  Mic,
  CornerDownLeft,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter,
} from "@/components/ui/expandable-chat";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/chat/chat-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import { Button } from "@/components/ui/button";
import { useHistoryChat } from "../../hooks/use-history-chat";
import { ChatMessage } from "@/components/chat/chat-message";

export const HistoryChat: React.FC = () => {
  const {
    chatMessages,
    chatInput,
    setChatInput,
    sessionStatus,
    handleChatSubmit,
    chatMutation,
  } = useHistoryChat();

  const handleAttachFile = () => {
    console.log("Attach file clicked (no-op)");
  };

  const handleMicrophoneClick = () => {
    console.log("Microphone clicked (no-op)");
  };

  return (
    <ExpandableChat
      size="lg"
      position="bottom-right"
      icon={<Bot className="h-6 w-6" />}
    >
      <ExpandableChatHeader className="flex text-center justify-center pt-2 pb-2">
        <div className="flex-col items-center gap-3">
          <h3 className="font-semibold">AI Assistant</h3>
          <p className="text-xs text-muted-foreground">
            Hỗ trợ phân tích biển số xe
          </p>
        </div>
      </ExpandableChatHeader>

      <ExpandableChatBody>
        <ChatMessageList>
          {chatMessages.map((message) => (
            <ChatBubble
              key={message.id}
              variant={message.sender === "user" ? "sent" : "received"}
            >
              <ChatBubbleAvatar
                className="h-8 w-8 shrink-0"
                src={
                  message.sender === "user"
                    ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&q=80&crop=faces&fit=crop"
                    : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&q=80&crop=faces&fit=crop"
                }
                fallback={message.sender === "user" ? "US" : "AI"}
              />
              <ChatBubbleMessage
                variant={message.sender === "user" ? "sent" : "received"}
                className={
                  message.content.startsWith("Error:") ? "text-destructive" : ""
                }
              >
                {/* {message.content} */}
                <ChatMessage content={message.content} sender={message.sender} />
              </ChatBubbleMessage>
            </ChatBubble>
          ))}

          {chatMutation.isPending && (
            <ChatBubble variant="received">
              <ChatBubbleAvatar
                className="h-8 w-8 shrink-0"
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&q=80&crop=faces&fit=crop"
                fallback="AI"
              />
              <ChatBubbleMessage isLoading />
            </ChatBubble>
          )}
        </ChatMessageList>
      </ExpandableChatBody>

      <ExpandableChatFooter>
        <form
          onSubmit={handleChatSubmit}
          className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-1"
        >
          <ChatInput
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={
              sessionStatus !== "created"
                ? "Initializing session..."
                : "Type your message..."
            }
            disabled={sessionStatus !== "created" || chatMutation.isPending}
            className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleChatSubmit(e as any);
              }
            }}
          />
          <div className="flex items-center p-3 pt-0 justify-between">
            <div className="flex">
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={handleAttachFile}
                title="Attach file (not implemented)"
              >
                <Paperclip className="size-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={handleMicrophoneClick}
                title="Use microphone (not implemented)"
              >
                <Mic className="size-4" />
              </Button>
            </div>
            <Button
              type="submit"
              size="sm"
              className="ml-auto gap-1.5"
              disabled={
                sessionStatus !== "created" ||
                chatMutation.isPending ||
                !chatInput.trim()
              }
            >
              Send Message
              <CornerDownLeft className="size-3.5" />
            </Button>
          </div>
        </form>
      </ExpandableChatFooter>
    </ExpandableChat>
  );
};
