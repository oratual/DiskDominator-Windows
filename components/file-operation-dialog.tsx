import React from "react";
import React from "react";
"use client"

import React from "react"
import { X } from "lucide-react"

interface FileOperationDialogProps {
  isOpen: boolean
  title: string
  onClose: () => void
  onConfirm: (value?: string) => void
  type: "confirm" | "input" | "select"
  message?: string
  inputLabel?: string
  inputValue?: string
  selectOptions?: { value: string; label: string }[]
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

export function FileOperationDialog({
  isOpen,
  title,
  onClose,
  onConfirm,
  type,
  message,
  inputLabel,
  inputValue = "",
  selectOptions = [],
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
}: FileOperationDialogProps) {
  const [value, setValue] = React.useState(inputValue)
  const [selectedOption, setSelectedOption] = React.useState<string>(selectOptions[0]?.value || "")
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isOpen])

  React.useEffect(() => {
    setValue(inputValue)
  }, [inputValue])

  React.useEffect(() => {
    if (selectOptions.length > 0) {
      setSelectedOption(selectOptions[0].value)
    }
  }, [selectOptions])

  if (!isOpen) return null

  const handleConfirm = () => {
    if (type === "input") {
      onConfirm(value)
    } else if (type === "select") {
      onConfirm(selectedOption)
    } else {
      onConfirm()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm()
    } else if (e.key === "Escape") {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md"
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {message && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{message}</p>}

          {type === "input" && (
            <div className="mb-4">
              {inputLabel && <label className="block text-sm font-medium mb-1">{inputLabel}</label>}
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}

          {type === "select" && (
            <div className="mb-4">
              <select
                value={selectedOption}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {selectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              {cancelLabel}
            </button>
            <button
              onClick={handleConfirm}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                danger
                  ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                  : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
