/**
 * Message Service
 * Handles chat/messaging operations between patients and orthodontists
 */

import { db } from '../db'
import { messages, users } from '../db/schema'
import { eq, and, or, desc, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'

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

export class MessageService {
  /**
   * Send a new message
   */
  static async sendMessage(
    senderId: string,
    receiverId: string,
    content: string
  ): Promise<Message> {
    const now = new Date()
    const newMessage = {
      id: nanoid(),
      senderId,
      receiverId,
      content,
      isRead: false,
      readAt: null,
      createdAt: now,
      updatedAt: now,
    }

    await db.insert(messages).values(newMessage)

    return {
      ...newMessage,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
  }

  /**
   * Get messages between two users
   */
  static async getMessagesBetweenUsers(
    userId1: string,
    userId2: string
  ): Promise<MessageWithSender[]> {
    const result = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        content: messages.content,
        isRead: messages.isRead,
        readAt: messages.readAt,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
        senderName: users.fullName,
        senderRole: users.role,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
        )
      )
      .orderBy(messages.createdAt)

    return result.map((row) => ({
      id: row.id,
      senderId: row.senderId,
      receiverId: row.receiverId,
      content: row.content,
      isRead: row.isRead,
      readAt: row.readAt ? new Date(row.readAt).toISOString() : null,
      createdAt: new Date(row.createdAt).toISOString(),
      updatedAt: new Date(row.updatedAt).toISOString(),
      senderName: row.senderName || 'Unknown',
      senderRole: row.senderRole || 'unknown',
    }))
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(userId: string, otherUserId: string): Promise<void> {
    await db
      .update(messages)
      .set({
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(messages.senderId, otherUserId),
          eq(messages.receiverId, userId),
          eq(messages.isRead, false)
        )
      )
  }

  /**
   * Get conversations for a user
   */
  static async getConversations(userId: string): Promise<Conversation[]> {
    // Get all messages where user is sender or receiver
    const userMessages = await db
      .select()
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt))

    // Group messages by conversation partner
    const conversationMap = new Map<string, Message[]>()

    for (const message of userMessages) {
      const partnerId = message.senderId === userId ? message.receiverId : message.senderId

      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, [])
      }

      conversationMap.get(partnerId)!.push({
        id: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        isRead: message.isRead,
        readAt: message.readAt ? new Date(message.readAt).toISOString() : null,
        createdAt: new Date(message.createdAt).toISOString(),
        updatedAt: new Date(message.updatedAt).toISOString(),
      })
    }

    // Build conversations with user info
    const conversations: Conversation[] = []

    for (const [partnerId, msgs] of conversationMap.entries()) {
      const partnerUser = await db
        .select()
        .from(users)
        .where(eq(users.id, partnerId))
        .limit(1)

      if (partnerUser.length === 0) continue

      const partner = partnerUser[0]
      const lastMessage = msgs[0]

      // Count unread messages from partner
      const unreadCount = msgs.filter(
        (m) => m.senderId === partnerId && !m.isRead
      ).length

      conversations.push({
        userId: partnerId,
        userName: partner.fullName,
        userRole: partner.role,
        lastMessage,
        unreadCount,
      })
    }

    // Sort by last message date (most recent first)
    conversations.sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0
      const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0
      return bTime - aTime
    })

    return conversations
  }

  /**
   * Get unread message count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(and(eq(messages.receiverId, userId), eq(messages.isRead, false)))

    return Number(result[0]?.count || 0)
  }

  /**
   * Delete a message (soft delete by marking as deleted)
   * For now we'll just delete it completely
   */
  static async deleteMessage(messageId: string, userId: string): Promise<void> {
    // Only allow sender to delete
    await db
      .delete(messages)
      .where(and(eq(messages.id, messageId), eq(messages.senderId, userId)))
  }
}
