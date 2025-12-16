/**
 * Message Service - Frontend
 * API client for messaging functionality
 */

import { apiClient } from '@/utils/apiClient'
import type { Message, MessageWithSender, Conversation } from '@/types/message'

export class MessageService {
  /**
   * Send a new message
   */
  static async sendMessage(receiverId: string, content: string): Promise<Message> {
    return await apiClient.post<Message>('/messages', { receiverId, content })
  }

  /**
   * Get messages between current user and another user
   */
  static async getMessages(userId: string): Promise<MessageWithSender[]> {
    return await apiClient.get<MessageWithSender[]>(`/messages/${userId}`)
  }

  /**
   * Mark messages as read
   */
  static async markAsRead(userId: string): Promise<void> {
    await apiClient.put(`/messages/${userId}/read`)
  }

  /**
   * Get all conversations for current user
   */
  static async getConversations(): Promise<Conversation[]> {
    return await apiClient.get<Conversation[]>('/messages/conversations/list')
  }

  /**
   * Get unread message count
   */
  static async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<{ count: number }>('/messages/unread/count')
    return response.count
  }

  /**
   * Delete a message
   */
  static async deleteMessage(messageId: string): Promise<void> {
    await apiClient.delete(`/messages/${messageId}`)
  }
}
