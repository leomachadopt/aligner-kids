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
import { useTranslation } from 'react-i18next'

const Chat = () => {
  const { t } = useTranslation()
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
      toast.error(t('errors.loadingConversations'))
    }
  }

  const getRoleLabel = (role: string) => {
    return t(`patient.chat.roles.${role}`, role)
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
    <div className="flex h-[calc(100vh-10rem)] gap-6 animate-fade-in-up">
      {/* Sidebar - User List */}
      <Card className="w-96 flex flex-col rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-teal-50 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl font-bold">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center shadow-md">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            {t('patient.chat.title')}
          </CardTitle>
          <div className="relative mt-3">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            <Input
              placeholder={t('patient.chat.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 rounded-xl border-2 border-green-200 focus:border-green-400 bg-white font-medium"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-3">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-600 font-medium">
                {t('patient.chat.noUsers')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
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
                  className={`w-full p-4 rounded-xl border-2 transition-all hover-scale text-left ${
                    selectedUser?.id === u.id
                      ? 'bg-gradient-to-r from-green-500 to-teal-500 border-green-500 text-white shadow-lg'
                      : 'bg-white border-green-200 hover:border-green-400 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-400 text-white font-bold">
                          {getInitials(u.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      {u.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-md">
                          {u.unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-base truncate">
                          {u.fullName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs font-bold px-2 py-0.5 ${
                          selectedUser?.id === u.id
                            ? 'bg-white/20 text-white border-white/30'
                            : 'bg-gradient-to-r from-blue-400 to-purple-400 text-white border-0'
                        }`}>
                          {getRoleLabel(u.role)}
                        </Badge>
                      </div>
                      {u.lastMessage && (
                        <p className={`text-xs truncate mt-1 ${
                          selectedUser?.id === u.id ? 'text-white/90' : 'text-gray-500'
                        }`}>
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
          <Card className="h-full flex items-center justify-center rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 shadow-xl">
            <CardContent className="text-center py-16">
              <div className="h-24 w-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center shadow-lg">
                <MessageSquare className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                {t('patient.chat.selectConversation')}
              </h3>
              <p className="text-gray-600 font-medium text-lg">
                {user?.role === 'patient' || user?.role === 'child-patient'
                  ? t('patient.chat.selectOrthodontist')
                  : t('patient.chat.selectPatient')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default Chat
