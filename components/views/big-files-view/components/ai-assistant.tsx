"use client"

import { useRef, useEffect, useState } from "react"
import { ChevronRight, ChevronLeft, Send } from "lucide-react"
import type { ChatMessage } from "../types"

interface AIAssistantProps {
  chatWidth: number
  chatCollapsed: boolean
  setChatCollapsed: (collapsed: boolean) => void
  isResizingChat: boolean
  startResizingChat: () => void
}

export function AIAssistant({
  chatWidth,
  chatCollapsed,
  setChatCollapsed,
  isResizingChat,
  startResizingChat,
}: AIAssistantProps) {
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "He encontrado varios archivos grandes que podrían estar ocupando espacio innecesario.",
    },
    { role: "assistant", content: "¿Te gustaría que te ayude a analizar estos archivos?" },
  ])
  const [userInput, setUserInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  // Function to scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [aiMessages])

  // Function to handle sending a message
  const handleSendMessage = () => {
    if (!userInput.trim()) return

    // Add user message
    setAiMessages([...aiMessages, { role: "user", content: userInput }])

    // Clear input
    setUserInput("")

    // Simulate AI response after a delay
    setTimeout(() => {
      let response = ""

      if (userInput.toLowerCase().includes("eliminar") || userInput.toLowerCase().includes("borrar")) {
        response =
          "Te recomendaría revisar cada archivo antes de eliminarlo. Algunos archivos grandes pueden ser importantes para el sistema o tus aplicaciones."
      } else if (userInput.toLowerCase().includes("mover") || userInput.toLowerCase().includes("trasladar")) {
        response = "Puedo ayudarte a mover estos archivos a otra ubicación. ¿Dónde te gustaría almacenarlos?"
      } else if (userInput.toLowerCase().includes("analizar") || userInput.toLowerCase().includes("revisar")) {
        response =
          "Analizando los archivos... Veo que algunos son archivos multimedia que podrías comprimir o mover a almacenamiento externo para liberar espacio."
      } else {
        response =
          "Puedo ayudarte a gestionar estos archivos grandes. ¿Quieres que te sugiera cuáles podrías mover o eliminar de forma segura?"
      }

      setAiMessages((prev) => [...prev, { role: "assistant", content: response }])
    }, 1000)
  }

  return (
    <div
      className="flex flex-col border-r border-gray-200 bg-white relative dark:bg-gray-800 dark:border-gray-700"
      style={{
        width: chatCollapsed ? "40px" : `${chatWidth}px`,
        minWidth: chatCollapsed ? "40px" : "200px",
        maxWidth: chatCollapsed ? "40px" : "70%",
      }}
    >
      {chatCollapsed ? (
        <div
          className="flex flex-col h-full w-10 bg-gray-800 dark:bg-gray-900 border-r border-gray-300 dark:border-gray-700 cursor-pointer"
          onClick={() => setChatCollapsed(false)}
        >
          {/* Top arrow */}
          <div className="h-10 flex items-center justify-center border-b border-gray-300 dark:border-gray-700">
            <ChevronRight size={16} className="text-gray-500" />
          </div>

          {/* Vertical title */}
          <div className="flex-1 flex items-center justify-center">
            <span
              className="text-sm font-medium text-gray-500 dark:text-gray-400 transform -rotate-90 whitespace-nowrap"
              style={{ transformOrigin: "center center" }}
            >
              AI Assistant
            </span>
          </div>

          {/* Bottom line to match other sections */}
          <div className="h-px bg-gray-300 dark:bg-gray-700 w-full"></div>
        </div>
      ) : (
        // Keep the expanded state as is
        <div
          ref={chatRef}
          className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out"
          style={{ width: chatWidth }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium">AI Assistant</h3>
            <button
              onClick={() => setChatCollapsed(true)}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronLeft size={16} className="text-gray-500" />
            </button>
          </div>

          {/* Rest of the component remains unchanged */}
          <div className="flex-1 overflow-auto p-4">
            {/* Chat messages would go here */}
            <div className="space-y-4">
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg max-w-[80%]">
                <p className="text-sm">Hola, soy tu asistente de IA. ¿En qué puedo ayudarte hoy?</p>
              </div>
            </div>
          </div>

          {/* Input area */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <button className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
