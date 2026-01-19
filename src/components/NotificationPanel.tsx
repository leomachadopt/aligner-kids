import { Bell, BellOff } from 'lucide-react'
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

// TODO: Integrar com API de notificações real
const notifications: Array<{
  id: number
  type: string
  sender?: string
  message: string
  time: string
  read: boolean
}> = []

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
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BellOff className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <p className="text-sm font-medium text-muted-foreground">
                Nenhuma notificação
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Você está em dia com tudo!
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
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
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
