"use client"
import React from "react";

import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useUserProfile } from "@/hooks/useUserProfile"

interface UserProfileButtonProps {
  userName?: string // Made optional since we'll get from hook
  onClick?: () => void
}

export default function UserProfileButton({ userName: propUserName, onClick }: UserProfileButtonProps) {
  // Get user data from hook
  const { profile, loading } = useUserProfile()
  
  // Use real data from hook, fallback to prop for backwards compatibility
  const userName = profile?.name || propUserName || "Usuario"
  const avatarUrl = profile?.avatar_url || "/soccer-player-portrait.png"
  
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
        <AvatarImage ref={imageRef} src={avatarUrl} alt={userName} className="object-cover" />
        <AvatarFallback className="bg-blue-700 text-white text-lg font-medium">
          {loading ? "..." : userName.charAt(0)}
        </AvatarFallback>
      </Avatar>
    </Button>
  )
}
