/**
 * ChatModal Component
 * Modal dialog for chat interface
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChatBox } from './ChatBox'

interface ChatModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  otherUserId: string
  otherUserName: string
  otherUserRole: string
}

export function ChatModal({
  open,
  onOpenChange,
  otherUserId,
  otherUserName,
  otherUserRole,
}: ChatModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 border-2 border-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-3 border-b-2 border-purple-100">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                💬 Mensagens
              </DialogTitle>
              <p className="text-sm text-gray-600 font-medium mt-1">
                Conversa com {otherUserName}
              </p>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 px-6 pb-6 overflow-hidden">
          <ChatBox
            otherUserId={otherUserId}
            otherUserName={otherUserName}
            otherUserRole={otherUserRole}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
