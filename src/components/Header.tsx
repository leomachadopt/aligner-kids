import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
import { LanguageSelector } from '@/components/LanguageSelector'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { useUserRole } from '@/context/UserRoleContext'
import { useAuth } from '@/context/AuthContext'

const getPageTitles = (t: any): { [key: string]: string } => ({
  '/dashboard': t('header.pageTitles.dashboard'),
  '/my-treatment': t('header.pageTitles.myTreatment'),
  '/photos': t('header.pageTitles.photos'),
  '/chat': t('header.pageTitles.chat'),
  '/education': t('header.pageTitles.education'),
  '/gamification': t('header.pageTitles.gamification'),
  '/store': t('header.pageTitles.store'),
  '/my-rewards': t('header.pageTitles.myRewards'),
  '/responsible': t('header.pageTitles.responsible'),
  '/reports': t('header.pageTitles.reports'),
  '/patient-management': t('header.pageTitles.patientManagement'),
  '/profile': t('header.pageTitles.profile'),
  '/settings': t('header.pageTitles.appSettings'),
  '/help': t('header.pageTitles.helpPage'),
})

const getChildPageTitles = (t: any): { [key: string]: string } => ({
  '/dashboard': t('header.childPageTitles.dashboard'),
  '/my-treatment': t('header.childPageTitles.myTreatment'),
  '/photos': t('header.childPageTitles.photos'),
  '/chat': t('header.childPageTitles.chat'),
  '/education': t('header.childPageTitles.education'),
  '/gamification': t('header.childPageTitles.gamification'),
  '/store': t('header.childPageTitles.store'),
  '/my-rewards': t('header.childPageTitles.myRewards'),
  '/responsible': t('header.childPageTitles.responsible'),
  '/reports': t('header.childPageTitles.reports'),
  '/profile': t('header.childPageTitles.profile'),
  '/settings': t('header.childPageTitles.appSettings'),
  '/help': t('header.childPageTitles.helpPage'),
})

export const Header = () => {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const { role, isChild } = useUserRole()
  const { user } = useAuth()
  const { t } = useTranslation()

  const handleScroll = () => {
    setScrolled(window.scrollY > 10)
  }

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const pageTitles = getPageTitles(t)
  const childPageTitles = getChildPageTitles(t)
  const titles = isChild ? childPageTitles : pageTitles
  const pageTitle = titles[location.pathname] || t('navigation.appName')

  // Obter iniciais do nome
  const getInitials = (name: string) => {
    if (!name) return 'U'
    const names = name.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

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
          <LanguageSelector variant="dropdown" />
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
                    src={user?.profilePhotoUrl || undefined}
                    alt={user?.fullName || 'User Avatar'}
                  />
                  <AvatarFallback>{getInitials(user?.fullName || '')}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>{t('header.myAccount')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">
                  <User className="mr-2 h-4 w-4" />
                  {t('header.myProfile')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  {t('header.settings')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/help">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  {t('header.help')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('header.logout')}
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
                <AppSidebar userRole={role} variant="mobile" />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
