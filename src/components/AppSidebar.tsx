import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Home,
  BarChart2,
  MessageSquare,
  Camera,
  BookOpen,
  Award,
  ShoppingBag,
  Gift,
  Users,
  Smile,
  Settings,
  Shield,
  Trophy,
  Database,
  Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/user'
import { useUserRole } from '@/context/UserRoleContext'

const getPatientMenu = (t: any) => [
  { href: '/dashboard', label: t('navigation.patient.dashboard'), icon: Home },
  { href: '/my-treatment', label: t('navigation.patient.myTreatment'), icon: Smile },
  { href: '/photos', label: t('navigation.patient.photos'), icon: Camera },
  { href: '/chat', label: t('navigation.patient.chat'), icon: MessageSquare },
  { href: '/education', label: t('navigation.patient.education'), icon: BookOpen },
  { href: '/gamification', label: t('navigation.patient.gamification'), icon: Award },
  { href: '/store', label: t('navigation.patient.store'), icon: ShoppingBag },
  { href: '/my-rewards', label: t('navigation.patient.myRewards'), icon: Gift },
  { href: '/parent/items', label: t('navigation.patient.parentItems'), icon: Gift },
]

const getChildPatientMenu = (t: any) => [
  { href: '/dashboard', label: t('navigation.childPatient.dashboard'), icon: Home },
  { href: '/my-treatment', label: t('navigation.childPatient.myTreatment'), icon: Smile },
  { href: '/photos', label: t('navigation.childPatient.photos'), icon: Camera },
  { href: '/chat', label: t('navigation.childPatient.chat'), icon: MessageSquare },
  { href: '/education', label: t('navigation.childPatient.education'), icon: BookOpen },
  { href: '/gamification', label: t('navigation.childPatient.gamification'), icon: Award },
  { href: '/store', label: t('navigation.childPatient.store'), icon: ShoppingBag },
  { href: '/my-rewards', label: t('navigation.childPatient.myRewards'), icon: Gift },
  { href: '/parent/items', label: t('navigation.childPatient.parentItems'), icon: Gift },
]

const getOrthodontistMenu = (t: any) => [
  { href: '/dashboard', label: t('navigation.orthodontist.dashboard'), icon: Home },
  { href: '/patient-management', label: t('navigation.orthodontist.patientManagement'), icon: Users },
  { href: '/chat', label: t('navigation.orthodontist.chat'), icon: MessageSquare },
  { href: '/reports', label: t('navigation.orthodontist.reports'), icon: BarChart2 },
  { href: '/mission-config', label: t('navigation.orthodontist.missionConfig'), icon: Trophy },
  { href: '/mission-programs', label: t('navigation.orthodontist.missionPrograms'), icon: Layers },
  { href: '/clinic/rewards/catalog', label: t('navigation.orthodontist.rewardsCatalog'), icon: ShoppingBag },
  { href: '/clinic/rewards/programs', label: t('navigation.orthodontist.rewardsPrograms'), icon: Gift },
  { href: '/clinic/story-options', label: t('navigation.orthodontist.storyOptions'), icon: BookOpen },
]

const getSuperAdminMenu = (t: any) => [
  { href: '/dashboard', label: t('navigation.superAdmin.dashboard'), icon: Home },
  { href: '/admin/clinics', label: t('navigation.superAdmin.clinics'), icon: Shield },
  { href: '/admin/orthodontists', label: t('navigation.superAdmin.orthodontists'), icon: Users },
  { href: '/admin/prompts', label: t('navigation.superAdmin.prompts'), icon: Settings },
  { href: '/admin/missions', label: t('navigation.superAdmin.missions'), icon: Trophy },
  { href: '/admin/store-templates', label: t('navigation.superAdmin.storeTemplates'), icon: Gift },
  { href: '/admin/story-options', label: t('navigation.superAdmin.storyOptions'), icon: BookOpen },
  { href: '/mission-programs', label: t('navigation.superAdmin.missionPrograms'), icon: Layers },
  { href: '/admin/data', label: t('navigation.superAdmin.data'), icon: Database },
  { href: '/storage-status', label: t('navigation.superAdmin.storageStatus'), icon: Database },
]

export const AppSidebar = ({ userRole }: { userRole: UserRole | null }) => {
  const location = useLocation()
  const { isChild } = useUserRole()
  const { t } = useTranslation()

  // Get menu based on user role
  const getCurrentMenu = () => {
    switch (userRole) {
      case 'patient':
        return getPatientMenu(t)
      case 'child-patient':
        return getChildPatientMenu(t)
      case 'orthodontist':
        return getOrthodontistMenu(t)
      case 'super-admin':
        return getSuperAdminMenu(t)
      default:
        return getPatientMenu(t)
    }
  }

  const currentMenu = getCurrentMenu()

  return (
    <aside className="hidden h-screen w-72 flex-col border-r border-border/60 bg-background/80 backdrop-blur-md shadow-[0_15px_50px_-25px_rgba(0,0,0,0.35)] md:flex">
      <div className="flex h-20 items-center justify-center border-b border-border/60 px-6">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img
            src="/kidsaligner.png"
            alt="Kids Aligner Logo"
            className="h-12 w-auto"
          />
        </Link>
      </div>
      <nav className="flex-1 space-y-2 p-5">
        {currentMenu.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
              location.pathname === item.href
                ? 'bg-primary/10 text-foreground border border-primary/20 shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent',
              isChild && 'rounded-xl py-3 text-base font-bold hover:scale-105',
              isChild &&
                location.pathname === item.href &&
                'shadow-lg shadow-primary/30',
            )}
          >
            <item.icon className="h-5 w-5 text-primary" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}
