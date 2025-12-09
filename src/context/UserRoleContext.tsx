import { createContext, useContext, ReactNode, useMemo } from 'react'
import { useAuth } from './AuthContext'
import type { UserRole } from '@/types/user'

interface UserRoleContextType {
  role: UserRole | null
  isChild: boolean
  isAdmin: boolean
  isDentist: boolean
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(
  undefined,
)

export const UserRoleProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()

  const contextValue = useMemo(() => {
    const role = user?.role || null
    const isChild = role === 'child-patient'
    const isAdmin = role === 'super-admin'
    const isDentist = role === 'orthodontist'
    return { role, isChild, isAdmin, isDentist }
  }, [user])

  return (
    <UserRoleContext.Provider value={contextValue}>
      {children}
    </UserRoleContext.Provider>
  )
}

export const useUserRole = () => {
  const context = useContext(UserRoleContext)
  if (context === undefined) {
    throw new Error('useUserRole must be used within a UserRoleProvider')
  }
  return context
}
