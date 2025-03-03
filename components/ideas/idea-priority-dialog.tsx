import React from 'react'
import { LightBulbIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'

interface IdeaPriorityDialogProps {
  isOpen: boolean
  ideaText: string
  onClose: () => void
  onSendToIdeasBank: () => void
  onConvertToTask: () => void
}

export default function IdeaPriorityDialog({
  isOpen,
  ideaText,
  onClose,
  onSendToIdeasBank,
  onConvertToTask
}: IdeaPriorityDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>This looks like a priority-related idea</DialogTitle>
        <DialogDescription>
          We detected that this idea might be related to your current priorities:
        </DialogDescription>
        <div className="mt-2">
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium">{ideaText}</p>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            Would you like to convert it to a task or store it in your Ideas Bank?
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <button
            type="button"
            className="inline-flex justify-center items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={onSendToIdeasBank}
          >
            <LightBulbIcon className="h-5 w-5 mr-2" />
            Send to Ideas Bank
          </button>
          <button
            type="button"
            className="inline-flex justify-center items-center rounded-md border border-transparent bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-900 hover:bg-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            onClick={onConvertToTask}
          >
            <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2" />
            Convert to Task
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
