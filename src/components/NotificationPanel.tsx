import { Bell } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const notifications = [
  {
    id: 1,
    type: 'chat',
    sender: 'Dr. Ana',
    message: 'Sua nova foto foi analisada. Tudo certo!',
    time: '2 min atrás',
    read: false,
  },
  {
    id: 2,
    type: 'reminder',
    message: 'Lembrete: Próxima troca de alinhador amanhã!',
    time: '1 hora atrás',
    read: false,
  },
  {
    id: 3,
    type: 'badge',
    message: 'Parabéns! Você ganhou o selo "Mês de Ouro".',
    time: '1 dia atrás',
    read: true,
  },
  {
    id: 4,
    type: 'alert',
    message: 'Atenção: Detectamos uma possível inflamação.',
    time: '2 dias atrás',
    read: true,
  },
]

export const NotificationPanel = () => {
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Notificações</SheetTitle>
        </SheetHeader>
        <div className="mt-4 flex flex-col gap-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-3 rounded-lg p-3 transition-colors ${
                !notification.read ? 'bg-primary/10' : 'hover:bg-muted'
              }`}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={`https://img.usecurling.com/ppl/thumbnail?seed=${notification.sender}`}
                />
                <AvatarFallback>
                  {notification.sender ? notification.sender.charAt(0) : 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm">{notification.message}</p>
                <p className="text-xs text-muted-foreground">
                  {notification.time}
                </p>
              </div>
              {!notification.read && (
                <div className="h-2 w-2 rounded-full bg-primary self-center" />
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
