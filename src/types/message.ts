/**
 * Message Types
 */

export interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  isRead: boolean
  readAt: string | null
  createdAt: string
  updatedAt: string
}

export interface MessageWithSender extends Message {
  senderName: string
  senderRole: string
}

export interface Conversation {
  userId: string
  userName: string
  userRole: string
  lastMessage: Message | null
  unreadCount: number
}
