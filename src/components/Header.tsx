import { Link, useLocation } from 'react-router-dom'
import { Menu, User, Settings, HelpCircle, LogOut } from 'lucide-react'
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
import { GamificationStats } from '@/components/GamificationStats'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { useUserRole } from '@/context/UserRoleContext'

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

const childPageTitles: { [key: string]: string } = {
  '/dashboard': 'Minha Base Secreta',
  '/my-treatment': 'Jornada do Sorriso',
  '/photos': 'Fotos Mágicas',
  '/chat': 'Falar com Doutor(a)',
  '/education': 'Escola de Heróis',
  '/gamification': 'Central de Aventuras',
  '/reports': 'Relatórios do Detetive',
  '/profile': 'Meu Perfil de Herói',
  '/settings': 'Ajustes',
  '/help': 'Ajuda',
}

export const Header = () => {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const { role, isChild } = useUserRole()

  const handleScroll = () => {
    setScrolled(window.scrollY > 10)
  }

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const titles = isChild ? childPageTitles : pageTitles
  const pageTitle = titles[location.pathname] || 'App Alinhadores'

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-lg transition-all duration-300',
        scrolled ? 'shadow-subtle' : 'border-transparent',
        isChild && 'bg-background/95',
      )}
    >
      <div className="container flex h-16 items-center justify-between px-4 md:h-20">
        <div className="flex items-center gap-4">
          <h1
            className={cn(
              'hidden text-xl font-semibold md:block',
              isChild && 'font-display text-3xl font-extrabold text-primary',
            )}
          >
            {pageTitle}
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {isChild && (
            <div className="hidden md:block">
              <GamificationStats compact />
            </div>
          )}
          <NotificationPanel />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
              >
                <Avatar
                  className={cn(
                    isChild && 'h-12 w-12 border-2 border-primary-child',
                  )}
                >
                  <AvatarImage
                    src="https://img.usecurling.com/ppl/thumbnail?gender=male&seed=child"
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
                <AppSidebar userRole={role} />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
