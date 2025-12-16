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
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Mensagens</DialogTitle>
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
