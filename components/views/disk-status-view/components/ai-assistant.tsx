"use client"
import React from "react";

import { MessageSquare, ChevronRight, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { AIMessage } from "../types"

interface AIAssistantProps {
  chatWidth: number
  chatCollapsed: boolean
  setChatCollapsed: (collapsed: boolean) => void
  isResizingChat: boolean
  setIsResizingChat: (resizing: boolean) => void
  aiMessages: AIMessage[]
  setAiMessages: React.Dispatch<React.SetStateAction<AIMessage[]>>
  userInput: string
  setUserInput: React.Dispatch<React.SetStateAction<string>>
  inputRef: React.RefObject<HTMLInputElement>
  messagesEndRef: React.RefObject<HTMLDivElement>
  handleSendMessage: () => void
}

// Custom ChevronLeft component
const ChevronLeftIcon = ({ size, className }: { size: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
)

export function AIAssistant({
  chatWidth,
  chatCollapsed,
  setChatCollapsed,
  isResizingChat,
  setIsResizingChat,
  aiMessages,
  setAiMessages,
  userInput,
  setUserInput,
  inputRef,
  messagesEndRef,
  handleSendMessage,
}: AIAssistantProps) {
  return (
    <div
      className="flex flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--background))] relative dark:bg-[hsl(var(--card))] dark:border-[hsl(var(--border))]"
      style={{
        width: chatCollapsed ? "40px" : `${chatWidth}px`,
        minWidth: chatCollapsed ? "40px" : "200px",
        maxWidth: chatCollapsed ? "40px" : "70%",
      }}
    >
      <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))] dark:border-[hsl(var(--border))]">
        {!chatCollapsed ? (
          <>
            <div className="flex items-center">
              <MessageSquare size={18} className="mr-2" />
              <h2 className="font-medium text-[hsl(var(--foreground))]">AI Assistant</h2>
            </div>
            <button
              onClick={() => setChatCollapsed(true)}
              className="p-2 rounded-full hover:bg-[hsl(var(--muted))] dark:hover:bg-[hsl(var(--muted))]"
            >
              <ChevronLeftIcon size={20} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" />
            </button>
          </>
        ) : (
          <div className="w-full flex justify-center">
            <button
              onClick={() => setChatCollapsed(false)}
              className="p-2 rounded-full text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] dark:hover:bg-[hsl(var(--muted))]"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {chatCollapsed ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="transform -rotate-90 whitespace-nowrap text-lg font-medium text-[hsl(var(--muted-foreground))]">AI</div>
        </div>
      ) : (
        <>
          {/* Chat Messages */}
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {aiMessages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`rounded-lg p-3 max-w-xs ${
                    message.role === "user"
                      ? "bg-[hsl(var(--chat-user-bg))] dark:bg-[hsl(var(--chat-user-bg-dark))] chat-message-user"
                      : "bg-[hsl(var(--chat-ai-bg))] dark:bg-[hsl(var(--chat-ai-bg-dark))] chat-message-ai"
                  }`}
                >
                  <p className={`text-sm ${message.role === "user" ? "text-[hsl(var(--foreground))] dark:text-[hsl(var(--foreground))]" : "text-[hsl(var(--foreground))] dark:text-[hsl(var(--foreground))]"}`}>
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-[hsl(var(--border))] dark:border-[hsl(var(--border))]">
            <div className="flex items-center bg-[hsl(var(--muted))] dark:bg-[hsl(var(--muted))] rounded-lg p-2 chat-input">
              <Input
                type="text"
                placeholder="Escribe tu instrucción aquí..."
                className="flex-1 bg-transparent outline-none text-sm border-none text-[hsl(var(--foreground))] dark:text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] dark:placeholder:text-[hsl(var(--muted-foreground))]"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                ref={inputRef}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage()
                  }
                }}
              />
              <button className="ml-2 text-[hsl(var(--color-info-blue))] dark:text-[hsl(var(--color-info-blue-dark))]" onClick={handleSendMessage}>
                <ArrowRight size={20} />
              </button>
            </div>
            <div className="mt-2 text-xs text-[hsl(var(--muted-foreground))] dark:text-[hsl(var(--muted-foreground))]">
              Sugerencia: Pregúntame sobre los tipos de escaneo
            </div>
          </div>
        </>
      )}
    </div>
  )
}
