import React, { useEffect, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
  link?: string
  linkText?: string
}

export default function ToastNotification() {
  const [toast, setToast] = useState<ToastProps | null>(null)
  const [visible, setVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleShowToast = (event: Event) => {
      const customEvent = event as CustomEvent<ToastProps>
      setToast(customEvent.detail)
      setVisible(true)

      // Auto-hide the toast after the specified duration
      const duration = customEvent.detail.duration || 5000
      const timer = setTimeout(() => {
        setVisible(false)
      }, duration)

      return () => clearTimeout(timer)
    }

    window.addEventListener('showToast', handleShowToast as EventListener)
    return () => {
      window.removeEventListener('showToast', handleShowToast as EventListener)
    }
  }, [])

  const handleClose = () => {
    setVisible(false)
  }

  const handleNavigate = () => {
    if (toast?.link) {
      router.push(toast.link)
      setVisible(false)
    }
  }

  const getIcon = () => {
    switch (toast?.type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />
      case 'error':
        return <ExclamationCircleIcon className="h-6 w-6 text-red-500" />
      case 'info':
      default:
        return <InformationCircleIcon className="h-6 w-6 text-blue-500" />
    }
  }

  const getBackgroundColor = () => {
    switch (toast?.type) {
      case 'success':
        return 'bg-green-50'
      case 'error':
        return 'bg-red-50'
      case 'info':
      default:
        return 'bg-blue-50'
    }
  }

  if (!toast || !visible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div 
        className={`${getBackgroundColor()} p-4 rounded-lg shadow-lg flex items-start transition-all duration-300 ease-in-out transform ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}
      >
        <div className="flex-shrink-0 mr-3">
          {getIcon()}
        </div>
        <div className="flex-1 mr-2">
          <p className="text-sm font-medium text-gray-900">{toast.message}</p>
          {toast.link && toast.linkText && (
            <button
              onClick={handleNavigate}
              className="mt-1 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              {toast.linkText}
            </button>
          )}
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
