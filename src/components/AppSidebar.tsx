import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  BarChart2,
  MessageSquare,
  Camera,
  BookOpen,
  Award,
  Users,
  Smile,
  Settings,
  Shield,
  Trophy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/user'
import { useUserRole } from '@/context/UserRoleContext'

const patientMenu = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/my-treatment', label: 'Meu Tratamento', icon: Smile },
  { href: '/photos', label: 'Fotos', icon: Camera },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/education', label: 'Educação', icon: BookOpen },
  { href: '/gamification', label: 'Gamificação', icon: Award },
]

const childPatientMenu = [
  { href: '/dashboard', label: 'Minha Base', icon: Home },
  { href: '/my-treatment', label: 'Minha Jornada', icon: Smile },
  { href: '/photos', label: 'Fotos Mágicas', icon: Camera },
  { href: '/chat', label: 'Falar com Doutor(a)', icon: MessageSquare },
  { href: '/education', label: 'Escola de Heróis', icon: BookOpen },
  { href: '/gamification', label: 'Aventuras', icon: Award },
]

const orthodontistMenu = [
  { href: '/dashboard', label: 'Dashboard Clínico', icon: Home },
  { href: '/patient-management', label: 'Pacientes', icon: Users },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/reports', label: 'Relatórios', icon: BarChart2 },
  { href: '/mission-config', label: 'Configurar Missões', icon: Trophy },
]

const superAdminMenu = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/admin/clinics', label: 'Gerenciar Clínicas', icon: Shield },
  { href: '/admin/orthodontists', label: 'Aprovar Ortodontistas', icon: Users },
  { href: '/admin/prompts', label: 'Configurar IA', icon: Settings },
  { href: '/admin/missions', label: 'Gerenciar Missões', icon: Trophy },
]

const menuItems: Record<UserRole, typeof patientMenu> = {
  patient: patientMenu,
  'child-patient': childPatientMenu,
  orthodontist: orthodontistMenu,
  'super-admin': superAdminMenu,
}

export const AppSidebar = ({ userRole }: { userRole: UserRole | null }) => {
  const location = useLocation()
  const { isChild } = useUserRole()

  // Se não tem role, usar menu de paciente como fallback
  const currentMenu = userRole ? (menuItems[userRole] || patientMenu) : patientMenu

  return (
    <aside className="hidden h-screen w-64 flex-col border-r bg-card md:flex">
      <div className="flex h-20 items-center justify-center border-b px-6">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img
            src="https://img.usecurling.com/i?q=angel-aligners&color=azure"
            alt="Logo"
            className="h-8 w-auto"
          />
          <span
            className={cn(
              'text-lg font-bold',
              isChild && 'font-display text-xl',
            )}
          >
            App Alinhadores
          </span>
        </Link>
      </div>
      <nav className="flex-1 space-y-2 p-4">
        {currentMenu.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              location.pathname === item.href
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              isChild && 'rounded-xl py-3 text-base font-bold hover:scale-105',
              isChild &&
                location.pathname === item.href &&
                'shadow-lg shadow-primary/30',
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}
