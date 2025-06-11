import React from "react";
import React from "react";
import React from "react";
import React from "react";
"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type Message = {
  role: "user" | "assistant"
  content: string
}

interface AIAssistantContextType {
  messages: Message[]
  userInput: string
  setUserInput: (input: string) => void
  sendMessage: (content: string) => void
  addMessage: (message: Message) => void
  openAIAssistant: () => void
  focusAIInput: () => void
}

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined)

export function AIAssistantProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [userInput, setUserInput] = useState("")
  const [isOpen, setIsOpen] = useState(true)

  const sendMessage = (content: string) => {
    // Add user message
    const userMessage: Message = { role: "user", content }
    setMessages((prev) => [...prev, userMessage])

    // Simulate AI response after a delay
    setTimeout(() => {
      let response = ""

      if (content.toLowerCase().includes("analizar") || content.toLowerCase().includes("escanear")) {
        response =
          "Puedo ayudarte a analizar tus discos. Ve a la pestaña 'Analizar Discos' para comenzar un escaneo completo."
      } else if (content.toLowerCase().includes("duplicados")) {
        response =
          "Para encontrar archivos duplicados, primero necesitas escanear tus discos. Luego podrás ver todos los duplicados en la pestaña 'Duplicados'."
      } else if (content.toLowerCase().includes("espacio") || content.toLowerCase().includes("liberar")) {
        response =
          "Para liberar espacio, te recomiendo revisar la pestaña 'Archivos Gigantes' donde podrás identificar los archivos que más espacio ocupan."
      } else {
        response =
          "Estoy aquí para ayudarte a gestionar tu almacenamiento. ¿Quieres analizar tus discos, encontrar duplicados o liberar espacio?"
      }

      const assistantMessage: Message = { role: "assistant", content: response }
      setMessages((prev) => [...prev, assistantMessage])
    }, 1000)
  }

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message])
  }

  const openAIAssistant = () => {
    setIsOpen(true)
  }

  const focusAIInput = () => {
    // This would be implemented in the AI Assistant component
  }

  return (
    <AIAssistantContext.Provider
      value={{
        messages,
        userInput,
        setUserInput,
        sendMessage,
        addMessage,
        openAIAssistant,
        focusAIInput,
      }}
    >
      {children}
    </AIAssistantContext.Provider>
  )
}

export function useAIAssistant() {
  const context = useContext(AIAssistantContext)
  if (context === undefined) {
    throw new Error("useAIAssistant must be used within an AIAssistantProvider")
  }
  return context
}

export function useAIAssistantProvider() {
  return AIAssistantContext
}
