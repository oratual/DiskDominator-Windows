import React from "react";
"use client"

import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface UserProfileButtonProps {
  userName: string
  onClick?: () => void
}

export default function UserProfileButton({ userName, onClick }: UserProfileButtonProps) {
  // Create a reference to the profile image
  const imageRef = useRef<HTMLImageElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Handle image load events
  useEffect(() => {
    const image = imageRef.current

    if (image) {
      const handleLoad = () => setImageLoaded(true)
      const handleError = () => setImageError(true)

      image.addEventListener("load", handleLoad)
      image.addEventListener("error", handleError)

      return () => {
        image.removeEventListener("load", handleLoad)
        image.removeEventListener("error", handleError)
      }
    }
  }, [])

  return (
    <Button
      variant="ghost"
      className="relative h-10 w-10 rounded-full p-0 overflow-hidden focus:ring-2 focus:ring-blue-400"
      onClick={onClick}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage ref={imageRef} src="/soccer-player-portrait.png" alt={userName} className="object-cover" />
        <AvatarFallback className="bg-blue-700 text-white text-lg font-medium">{userName.charAt(0)}</AvatarFallback>
      </Avatar>
    </Button>
  )
}
