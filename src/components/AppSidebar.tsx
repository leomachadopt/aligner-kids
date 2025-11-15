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
} from 'lucide-react'
import { cn } from '@/lib/utils'

type UserRole = 'patient' | 'guardian' | 'orthodontist'

const patientMenu = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/my-treatment', label: 'Meu Tratamento', icon: Smile },
  { href: '/photos', label: 'Fotos', icon: Camera },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/education', label: 'Educação', icon: BookOpen },
  { href: '/gamification', label: 'Gamificação', icon: Award },
]

const guardianMenu = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/reports', label: 'Relatórios', icon: BarChart2 },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
]

const orthodontistMenu = [
  { href: '/dashboard', label: 'Dashboard Clínico', icon: Home },
  { href: '/patient-management', label: 'Pacientes', icon: Users },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/reports', label: 'Relatórios', icon: BarChart2 },
]

const menuItems: Record<UserRole, typeof patientMenu> = {
  patient: patientMenu,
  guardian: guardianMenu,
  orthodontist: orthodontistMenu,
}

export const AppSidebar = ({
  userRole = 'patient',
}: {
  userRole?: UserRole
}) => {
  const location = useLocation()
  const currentMenu = menuItems[userRole]

  return (
    <aside className="hidden h-screen w-64 flex-col border-r bg-card md:flex">
      <div className="flex h-20 items-center justify-center border-b px-6">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img
            src="https://img.usecurling.com/i?q=angel-aligners&color=azure"
            alt="Logo"
            className="h-8 w-auto"
          />
          <span className="text-lg font-bold">App Alinhadores</span>
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
