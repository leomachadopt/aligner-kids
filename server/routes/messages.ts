/**
 * Messages Routes
 * API endpoints for chat/messaging functionality
 */

import { Router, Request, Response } from 'express'
import { MessageService } from '../services/messageService'
import { db, users } from '../db/index'
import { eq } from 'drizzle-orm'

const router = Router()

/**
 * Verify token and get user
 */
async function verifyToken(token: string) {
  if (!token || !token.startsWith('token-')) {
    return null
  }

  const userId = token.replace('token-', '')
  const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1)

  if (userResult.length === 0) {
    return null
  }

  const { password_hash, ...userWithoutPassword } = userResult[0]
  return userWithoutPassword
}

/**
 * Send a new message
 * POST /api/messages
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { receiverId, content } = req.body
    const token = req.headers.authorization?.replace('Bearer ', '')

    console.log('📨 POST /api/messages - Sending message:', { receiverId, content })

    if (!token) {
      return res.status(401).json({ error: 'Não autorizado' })
    }

    const currentUser = await verifyToken(token)
    if (!currentUser) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    console.log('👤 Current user:', currentUser.id, currentUser.fullName)

    if (!receiverId || !content) {
      return res.status(400).json({ error: 'receiverId e content são obrigatórios' })
    }

    const message = await MessageService.sendMessage(currentUser.id, receiverId, content)

    console.log('✅ Message sent successfully:', message.id)

    res.status(201).json(message)
  } catch (error) {
    console.error('Error sending message:', error)
    res.status(500).json({ error: 'Erro ao enviar mensagem' })
  }
})

/**
 * Get messages between current user and another user
 * GET /api/messages/:userId
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const token = req.headers.authorization?.replace('Bearer ', '')

    console.log('📥 GET /api/messages/:userId - Fetching messages with:', userId)

    if (!token) {
      return res.status(401).json({ error: 'Não autorizado' })
    }

    const currentUser = await verifyToken(token)
    if (!currentUser) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    const messages = await MessageService.getMessagesBetweenUsers(currentUser.id, userId)

    console.log(`✅ Found ${messages.length} messages between ${currentUser.id} and ${userId}`)

    res.json(messages)
  } catch (error) {
    console.error('Error getting messages:', error)
    res.status(500).json({ error: 'Erro ao buscar mensagens' })
  }
})

/**
 * Mark messages as read
 * PUT /api/messages/:userId/read
 */
router.put('/:userId/read', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ error: 'Não autorizado' })
    }

    const currentUser = await verifyToken(token)
    if (!currentUser) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    await MessageService.markMessagesAsRead(currentUser.id, userId)

    res.json({ success: true })
  } catch (error) {
    console.error('Error marking messages as read:', error)
    res.status(500).json({ error: 'Erro ao marcar mensagens como lidas' })
  }
})

/**
 * Get all conversations for current user
 * GET /api/messages/conversations
 */
router.get('/conversations/list', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ error: 'Não autorizado' })
    }

    const currentUser = await verifyToken(token)
    if (!currentUser) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    const conversations = await MessageService.getConversations(currentUser.id)

    res.json(conversations)
  } catch (error) {
    console.error('Error getting conversations:', error)
    res.status(500).json({ error: 'Erro ao buscar conversas' })
  }
})

/**
 * Get unread message count
 * GET /api/messages/unread/count
 */
router.get('/unread/count', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ error: 'Não autorizado' })
    }

    const currentUser = await verifyToken(token)
    if (!currentUser) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    const count = await MessageService.getUnreadCount(currentUser.id)

    res.json({ count })
  } catch (error) {
    console.error('Error getting unread count:', error)
    res.status(500).json({ error: 'Erro ao contar mensagens não lidas' })
  }
})

/**
 * Delete a message
 * DELETE /api/messages/:messageId
 */
router.delete('/:messageId', async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ error: 'Não autorizado' })
    }

    const currentUser = await verifyToken(token)
    if (!currentUser) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    await MessageService.deleteMessage(messageId, currentUser.id)

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting message:', error)
    res.status(500).json({ error: 'Erro ao excluir mensagem' })
  }
})

export default router
