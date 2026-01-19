/**
 * ChatBox Component
 * Chat interface for messaging between patients and orthodontists
 */

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { MessageService } from '@/services/messageService'
import { useAuth } from '@/context/AuthContext'
import type { MessageWithSender } from '@/types/message'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ptBR, enUS, es } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'

interface ChatBoxProps {
  otherUserId: string
  otherUserName: string
  otherUserRole: string
}

export function ChatBox({ otherUserId, otherUserName, otherUserRole }: ChatBoxProps) {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const getDateLocale = () => {
    const localeMap: Record<string, Locale> = {
      'pt-BR': ptBR,
      'pt-PT': ptBR,
      'en-US': enUS,
      'es-ES': es,
    }
    return localeMap[i18n.language] || enUS
  }

  // Load messages
  useEffect(() => {
    loadMessages()
    // Poll for new messages every 5 seconds
    const interval = setInterval(loadMessages, 5000)
    return () => clearInterval(interval)
  }, [otherUserId])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const loadMessages = async () => {
    try {
      console.log('📥 Loading messages with user:', otherUserId)
      const data = await MessageService.getMessages(otherUserId)
      console.log('📨 Received messages:', data?.length || 0, data)
      setMessages(data || [])

      // Mark messages as read
      await MessageService.markAsRead(otherUserId)
    } catch (error) {
      console.error('Error loading messages:', error)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || sending) return

    try {
      setSending(true)
      console.log('📤 Sending message to:', otherUserId, 'content:', newMessage.trim())
      const result = await MessageService.sendMessage(otherUserId, newMessage.trim())
      console.log('✅ Message sent:', result)
      setNewMessage('')
      console.log('🔄 Reloading messages...')
      await loadMessages()
      console.log('✅ Messages reloaded')
    } catch (error) {
      console.error('❌ Error sending message:', error)
      toast.error(t('patient.chat.errorSending'))
    } finally {
      setSending(false)
    }
  }

  const getRoleLabel = (role: string) => {
    return t(`patient.chat.roles.${role}`, role)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('patient.chat.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col h-[calc(100vh-14rem)] md:h-[600px]">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{otherUserName}</CardTitle>
            <Badge variant="outline" className="mt-1">
              {getRoleLabel(otherUserRole)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {!messages || messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('patient.chat.noMessages')}
              </div>
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.senderId === user?.id
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm break-words">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}
                      >
                        {formatDistanceToNow(new Date(message.createdAt), {
                          addSuffix: true,
                          locale: getDateLocale(),
                        })}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </CardContent>

      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('patient.chat.placeholder')}
            disabled={sending}
          />
          <Button type="submit" disabled={!newMessage.trim() || sending}>
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </Card>
  )
}
