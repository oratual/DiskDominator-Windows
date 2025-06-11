import React from "react";
"use client"

import { createContext } from "react"

// Update the context definition to include default implementations
export const AIAssistantContext = createContext({
  openAIAssistant: () => {},
  focusAIInput: () => {},
})
