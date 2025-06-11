import React from "react";
"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { MessageSquare, ChevronRight, ChevronLeft, ArrowRight } from "lucide-react"
import { useAIAssistant } from "../providers/ai-assistant-provider"

export function AIAssistant() {
  const [chatWidth, setChatWidth] = useState(300)
  const [isResizingChat, setIsResizingChat] = useState(false)
  const [chatCollapsed, setChatCollapsed] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const chatResizeRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { messages, sendMessage, userInput, setUserInput } = useAIAssistant()

  // Function to scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Function to handle sending a message
  const handleSendMessage = () => {
    if (!userInput.trim()) return
    sendMessage(userInput)
    setUserInput("")
  }

  // AI Assistant resize handling
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingChat || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = e.clientX - containerRect.left
      const maxWidth = containerRect.width * 0.7 // Máximo 70% del ancho total

      if (newWidth >= 200 && newWidth <= maxWidth) {
        setChatWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizingChat(false)
      document.body.style.cursor = "default"
      document.body.style.userSelect = "auto"
    }

    if (isResizingChat) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizingChat])

  const startResizingChat = () => {
    if (chatCollapsed) return
    setIsResizingChat(true)
    document.body.style.cursor = "ew-resize"
    document.body.style.userSelect = "none"
  }

  const focusAIInput = () => {
    if (!chatCollapsed && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }

  return (
    <>
      {/* Left Panel - Chat with AI */}
      <div
        ref={chatRef}
        className="flex flex-col border-r border-gray-200 bg-white relative dark:bg-gray-800 dark:border-gray-700"
        style={{
          width: chatCollapsed ? "40px" : `${chatWidth}px`,
          minWidth: chatCollapsed ? "40px" : "200px",
          maxWidth: chatCollapsed ? "40px" : "70%",
        }}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {!chatCollapsed ? (
            <>
              <div className="flex items-center">
                <MessageSquare size={18} className="mr-2" />
                <h2 className="font-medium">AI Assistant</h2>
              </div>
              <button
                onClick={() => setChatCollapsed(true)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                <ChevronLeft size={20} className="text-gray-500 hover:text-gray-700 dark:text-gray-400" />
              </button>
            </>
          ) : (
            <div className="flex items-center justify-center w-full">
              <button
                onClick={() => setChatCollapsed(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                <ChevronRight size={16} className="text-gray-500 hover:text-gray-700 dark:text-gray-400" />
              </button>
            </div>
          )}
        </div>

        {chatCollapsed ? (
          <div className="flex-1 flex flex-col">
            <div className="absolute top-1/2 left-0 w-full">
              <span
                className="font-medium text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap"
                style={{
                  position: "absolute",
                  transform: "rotate(90deg)",
                  transformOrigin: "left center",
                  left: "20px",
                }}
              >
                AI Assistant
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`rounded-lg p-3 max-w-xs ${
                      message.role === "user"
                        ? "bg-blue-100 dark:bg-blue-900/50 chat-message-user"
                        : "bg-gray-100 dark:bg-gray-700 chat-message-ai"
                    }`}
                  >
                    <p className={`text-sm ${message.role === "user" ? "dark:text-white" : "dark:text-gray-100"}`}>
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-2 chat-input">
                <Input
                  type="text"
                  placeholder="Escribe tu instrucción aquí..."
                  className="flex-1 bg-transparent outline-none text-sm border-none dark:text-gray-100 dark:placeholder-gray-400"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  ref={inputRef}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSendMessage()
                    }
                  }}
                />
                <button className="ml-2 text-blue-600 dark:text-blue-400" onClick={handleSendMessage}>
                  <ArrowRight size={20} />
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Sugerencia: Pregúntame sobre cómo optimizar tu almacenamiento
              </div>
            </div>
          </>
        )}
      </div>

      {/* Divisor redimensionable para el chat */}
      <div
        ref={chatResizeRef}
        className={`relative w-px bg-gray-200 ${chatCollapsed ? "cursor-default" : "cursor-ew-resize"} flex-shrink-0 transition-colors dark:bg-gray-700`}
        onMouseDown={startResizingChat}
      >
        <div className="absolute inset-0 w-px bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"></div>
        {/* Área ampliada para mouseOver, invisible pero interactiva */}
        <div className="absolute inset-y-0 -left-2 -right-2"></div>
      </div>
    </>
  )
}
