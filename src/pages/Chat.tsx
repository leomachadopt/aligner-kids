/**
 * Chat Page - Real implementation
 * Shows conversations for both patients and orthodontists
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageService } from '@/services/messageService'
import { AuthService } from '@/services/authService'
import { ChatBox } from '@/components/ChatBox'
import { MessageSquare, Search, Loader2, Users } from 'lucide-react'
import type { Conversation } from '@/types/message'
import type { User } from '@/types/user'
import { toast } from 'sonner'

const Chat = () => {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<{
    id: string
    name: string
    role: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadConversations()
    loadAvailableUsers()
  }, [user])

  const loadConversations = async () => {
    try {
      const convs = await MessageService.getConversations()
      setConversations(convs)
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableUsers = async () => {
    try {
      if (!user?.clinicId) return

      const clinicUsers = await AuthService.getUsersByClinicAsync(user.clinicId)

      // For patients: show orthodontists
      // For orthodontists: show patients
      const filtered = clinicUsers.filter((u) => {
        if (u.id === user.id) return false // Don't show self

        if (user.role === 'patient' || user.role === 'child-patient') {
          return u.role === 'orthodontist'
        } else if (user.role === 'orthodontist' || user.role === 'super-admin') {
          return u.role === 'patient' || u.role === 'child-patient'
        }
        return false
      })

      setAvailableUsers(filtered)
    } catch (error) {
      console.error('Error loading available users:', error)
      toast.error('Erro ao carregar usuários disponíveis')
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'orthodontist':
        return 'Ortodontista'
      case 'patient':
        return 'Paciente'
      case 'child-patient':
        return 'Paciente Infantil'
      default:
        return role
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Combine conversations with available users
  const allUsers = [
    ...(conversations || []).map((c) => ({
      id: c.userId,
      fullName: c.userName,
      role: c.userRole,
      hasMessages: true,
      unreadCount: c.unreadCount,
      lastMessage: c.lastMessage,
    })),
    ...(availableUsers || [])
      .filter((u) => !(conversations || []).some((c) => c.userId === u.id))
      .map((u) => ({
        id: u.id,
        fullName: u.fullName,
        role: u.role,
        hasMessages: false,
        unreadCount: 0,
        lastMessage: null,
      })),
  ]

  // Filter by search term
  const filteredUsers = allUsers.filter((u) =>
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] gap-4 animate-fade-in-up">
      {/* Sidebar - User List */}
      <Card className="w-80 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversas
          </CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-2">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhum usuário encontrado
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() =>
                    setSelectedUser({
                      id: u.id,
                      name: u.fullName,
                      role: u.role,
                    })
                  }
                  className={`w-full p-3 rounded-lg hover:bg-muted transition-colors text-left ${
                    selectedUser?.id === u.id ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar>
                        <AvatarFallback>{getInitials(u.fullName)}</AvatarFallback>
                      </Avatar>
                      {u.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {u.unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm truncate">
                          {u.fullName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getRoleLabel(u.role)}
                        </Badge>
                      </div>
                      {u.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {u.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat Area */}
      <div className="flex-1">
        {selectedUser ? (
          <ChatBox
            otherUserId={selectedUser.id}
            otherUserName={selectedUser.name}
            otherUserRole={selectedUser.role}
          />
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Selecione uma conversa
              </h3>
              <p className="text-muted-foreground">
                {user?.role === 'patient' || user?.role === 'child-patient'
                  ? 'Escolha um ortodontista para conversar'
                  : 'Escolha um paciente para conversar'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default Chat
