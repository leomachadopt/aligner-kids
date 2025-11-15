import { createContext, useState, useContext, ReactNode, useMemo } from 'react'

export type UserRole = 'patient' | 'child-patient' | 'guardian' | 'orthodontist'

interface UserRoleContextType {
  role: UserRole
  setRole: (role: UserRole) => void
  isChild: boolean
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(
  undefined,
)

export const UserRoleProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<UserRole>('child-patient') // Default to child for the story

  const contextValue = useMemo(() => {
    const isChild = role === 'child-patient'
    return { role, setRole, isChild }
  }, [role])

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
