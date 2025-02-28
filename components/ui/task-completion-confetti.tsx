"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

// Dynamically import react-confetti to avoid SSR issues
const ReactConfetti = dynamic(() => import("react-confetti"), {
  ssr: false,
})

interface TaskCompletionConfettiProps {
  show: boolean
  onComplete: () => void
}

export function TaskCompletionConfetti({ show, onComplete }: TaskCompletionConfettiProps) {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  })
  
  // Set window size on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
      
      const handleResize = () => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        })
      }
      
      window.addEventListener("resize", handleResize)
      return () => window.removeEventListener("resize", handleResize)
    }
  }, [])
  
  // Auto-hide confetti after 2.5 seconds
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onComplete()
      }, 2500)
      
      return () => clearTimeout(timer)
    }
  }, [show, onComplete])
  
  if (!show) return null
  
  return (
    <ReactConfetti
      width={windowSize.width}
      height={windowSize.height}
      recycle={false}
      numberOfPieces={200}
      gravity={0.2}
    />
  )
}
