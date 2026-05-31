"use client";

import React from "react";
import { Bot, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  sender: "USER" | "ASSISTANT" | string;
  messageText: string;
  timestamp: string | Date;
  className?: string;
}

export default function ChatBubble({ sender, messageText, timestamp, className }: ChatBubbleProps) {
  const isAssistant = sender?.toUpperCase() === "ASSISTANT";

  // Parse basic Markdown strings safely into React nodes
  const parseMarkdown = (text: string) => {
    if (!text) return "";
    
    // Split text by lines to process lists
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let processed = line;
      
      // Handle bold **text**
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(processed)) !== null) {
        if (match.index > lastIndex) {
          parts.push(processed.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="text-white font-bold">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < processed.length) {
        parts.push(processed.substring(lastIndex));
      }
      
      const content = parts.length > 0 ? parts : processed;

      // Handle bullet lists starting with "- " or "* "
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        return (
          <li key={idx} className="list-disc ml-5 mb-1 text-zinc-300">
            {typeof content === "string" ? line.trim().substring(2) : content}
          </li>
        );
      }

      return (
        <p key={idx} className="mb-2 text-zinc-300 last:mb-0 leading-relaxed">
          {content}
        </p>
      );
    });
  };

  const formatTime = (time: string | Date) => {
    try {
      const d = new Date(time);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div
      className={cn(
        "flex gap-3 max-w-3xl w-full my-3.5 animate-fade-in",
        isAssistant ? "self-start" : "self-end flex-row-reverse",
        className
      )}
    >
      {/* Avatar Icon */}
      <div
        className={cn(
          "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
          isAssistant
            ? "bg-gradient-to-tr from-brand-cyan to-brand-purple text-white shadow-brand-cyan/15"
            : "bg-white/5 border border-white/10 text-brand-cyan"
        )}
      >
        {isAssistant ? <Bot className="h-5 w-5" /> : <UserIcon className="h-5 w-5" />}
      </div>

      {/* Bubble Container */}
      <div className="flex flex-col gap-1 max-w-[85%]">
        <div
          className={cn(
            "p-4 rounded-2xl shadow-md border text-sm",
            isAssistant
              ? "glass rounded-tl-none border-white/5 text-zinc-300"
              : "bg-gradient-to-r from-brand-cyan/20 to-brand-purple/20 border-brand-cyan/20 rounded-tr-none text-white shadow-inner"
          )}
        >
          {parseMarkdown(messageText)}
        </div>
        
        {/* Timestamp */}
        <span
          className={cn(
            "text-[9px] font-bold text-zinc-500 uppercase tracking-wide px-1.5",
            isAssistant ? "self-start" : "self-end"
          )}
        >
          {formatTime(timestamp)}
        </span>
      </div>
    </div>
  );
}
