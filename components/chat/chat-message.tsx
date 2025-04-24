import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  content: string;
  sender: "user" | "ai";
}

export function ChatMessage({ content, sender }: ChatMessageProps) {
  // Xử lý các emoji và định dạng markdown
  const processContent = (content: string) => {
    // Giữ nguyên emoji Unicode
    return content.replace(/\*(.*?)\*/g, "**$1**");
  };

  return (
    <div
      className={cn(
        "group relative mb-4 flex items-start md:mb-6",
        sender === "ai" ? "flex-row" : "flex-row-reverse"
      )}
    >
      <div className={cn("flex-1 px-4", sender === "ai" ? "ml-4" : "mr-4")}>
        <div className={cn(
          "prose prose-sm dark:prose-invert flex max-w-none flex-col gap-2 overflow-hidden break-words",
          sender === "ai"
            ? "bg-muted/50 rounded-lg p-4"
            : "bg-primary/10 rounded-lg p-4"
        )}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>,
              ul: ({ children }) => <ul className="ml-2 list-none space-y-2">{children}</ul>,
              li: ({ children }) => (
                <li className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>{children}</span>
                </li>
              ),
              strong: ({ children }) => <span className="font-semibold">{children}</span>,
              a: ({ children, href }) => (
                <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              )
            }}
          >
            {processContent(content)}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
