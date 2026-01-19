/**
 * Contexto de Autenticação
 * Gerencia o estado global de autenticação do usuário
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react'
import type {
  User,
  AuthState,
  LoginInput,
  RegisterInput,
  UpdateUserInput,
  ChangePasswordInput,
} from '@/types/user'
import { AuthService } from '@/services/authService'

interface AuthContextType extends AuthState {
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (updates: UpdateUserInput) => Promise<void>
  updateUser: (updates: Partial<User>) => void
  changePassword: (input: ChangePasswordInput) => Promise<void>
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  })

  // Carregar sessão persistida ao iniciar
  useEffect(() => {
    loadSession()
  }, [])

  const loadSession = () => {
    const session = AuthService.getCurrentSession()
    if (session) {
      setState({
        user: session.user,
        token: session.token,
        isAuthenticated: true,
        isLoading: false,
      })
    } else {
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  }

  const login = useCallback(async (input: LoginInput) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }))
      const session = await AuthService.login(input)
      setState({
        user: session.user,
        token: session.token,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }))
      throw error
    }
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }))
      const session = await AuthService.register(input)
      setState({
        user: session.user,
        token: session.token,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }))
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await AuthService.logout()
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      })
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Mesmo com erro, limpar estado local
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  }, [])

  const updateProfile = useCallback(
    async (updates: UpdateUserInput) => {
      if (!state.user) {
        throw new Error('Usuário não autenticado')
      }

      try {
        const updatedUser = await AuthService.updateProfile(
          state.user.id,
          updates,
        )
        setState((prev) => ({
          ...prev,
          user: updatedUser,
        }))
      } catch (error) {
        throw error
      }
    },
    [state.user],
  )

  const updateUser = useCallback(
    (updates: Partial<User>) => {
      console.log('🔄 [AuthContext] updateUser called with updates:', updates)
      setState((prev) => {
        const updatedUser = prev.user ? { ...prev.user, ...updates } : null

        // Persist to localStorage if user exists
        if (updatedUser && prev.token) {
          try {
            const session = {
              user: updatedUser,
              token: prev.token,
              expiresAt: AuthService.getCurrentSession()?.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            }
            localStorage.setItem('auth_session', JSON.stringify(session))
            console.log('🔄 [AuthContext] ✅ Session persisted to localStorage. User preferredLanguage:', updatedUser.preferredLanguage)
          } catch (error) {
            console.warn('🔄 [AuthContext] ❌ Failed to persist user update to localStorage:', error)
          }
        }

        return {
          ...prev,
          user: updatedUser,
        }
      })
    },
    []
  )

  const changePassword = useCallback(
    async (input: ChangePasswordInput) => {
      if (!state.user) {
        throw new Error('Usuário não autenticado')
      }

      try {
        await AuthService.changePassword(state.user.id, input)
      } catch (error) {
        throw error
      }
    },
    [state.user],
  )

  const refreshUser = useCallback(() => {
    loadSession()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        updateProfile,
        updateUser,
        changePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Helper hooks
export const useCurrentUser = () => {
  const { user } = useAuth()
  return user
}

export const useIsAuthenticated = () => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated
}

export const useUserRole = () => {
  const { user } = useAuth()
  return user?.role || null
}
