import { Link, useLocation } from 'react-router-dom'
import { Menu, User, Settings, HelpCircle, LogOut, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AppSidebar } from '@/components/AppSidebar'
import { NotificationPanel } from '@/components/NotificationPanel'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

const pageTitles: { [key: string]: string } = {
  '/dashboard': 'Dashboard',
  '/my-treatment': 'Meu Tratamento',
  '/photos': 'Fotos',
  '/chat': 'Chat',
  '/education': 'Educação',
  '/gamification': 'Gamificação',
  '/reports': 'Relatórios',
  '/patient-management': 'Gerenciamento de Pacientes',
  '/profile': 'Meu Perfil',
  '/settings': 'Configurações',
  '/help': 'Ajuda',
}

export const Header = () => {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)

  const handleScroll = () => {
    setScrolled(window.scrollY > 10)
  }

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const pageTitle = pageTitles[location.pathname] || 'App Alinhadores'

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-lg transition-all duration-300',
        scrolled ? 'shadow-subtle' : 'border-transparent',
      )}
    >
      <div className="container flex h-16 items-center justify-between px-4 md:h-20">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img
              src="https://img.usecurling.com/i?q=angel-aligners&color=azure"
              alt="Logo"
              className="h-8 w-auto"
            />
          </Link>
          <h1 className="hidden text-xl font-semibold md:block">{pageTitle}</h1>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <NotificationPanel />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
              >
                <Avatar>
                  <AvatarImage
                    src="https://img.usecurling.com/ppl/thumbnail?gender=female"
                    alt="User Avatar"
                  />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">
                  <User className="mr-2 h-4 w-4" />
                  Meu Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/help">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Ajuda
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-3/4 p-0">
                <AppSidebar />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
