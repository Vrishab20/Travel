"use client";

import ReactMarkdown from "react-markdown";
import type { ChatMessage as ChatMessageType } from "@/types/trip";

type ChatMessageProps = {
  message: ChatMessageType;
};

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  if (!message.content.trim()) return null;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-[#c9a66b] text-[#12100c]"
            : "border border-white/10 bg-[#121a22] text-[#f3efe6]"
        }`}
      >
        {!isUser && (
          <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-[#8f9aa3]">
            Atlas
          </p>
        )}
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-0">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
