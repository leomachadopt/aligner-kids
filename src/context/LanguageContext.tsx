/**
 * Language Context
 * Manages multi-language support based on user preferences
 */

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from './AuthContext'
import type { SupportedLanguage } from '@/i18n/config'
import { apiClient } from '@/utils/apiClient'

interface LanguageContextType {
  currentLanguage: SupportedLanguage
  changeLanguage: (lang: SupportedLanguage) => Promise<void>
  isChanging: boolean
}

const LanguageContext = React.createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation()
  const { user, updateUser } = useAuth()
  const [isChanging, setIsChanging] = React.useState(false)

  // Sync language with user preference on mount and when user changes
  React.useEffect(() => {
    if (user?.preferredLanguage) {
      const lang = user.preferredLanguage as SupportedLanguage
      if (i18n.language !== lang) {
        i18n.changeLanguage(lang)
      }
    }
  }, [user?.preferredLanguage, i18n])

  const changeLanguage = React.useCallback(
    async (lang: SupportedLanguage) => {
      setIsChanging(true)
      try {
        // Change i18n language immediately for better UX
        await i18n.changeLanguage(lang)

        // If user is logged in, update backend
        if (user) {
          await apiClient.put(`/auth/users/${user.id}`, {
            preferredLanguage: lang,
          })

          // Update user in AuthContext
          updateUser({ preferredLanguage: lang })
        }
      } catch (error) {
        console.error('Error changing language:', error)
        // Revert to previous language on error
        if (user?.preferredLanguage) {
          await i18n.changeLanguage(user.preferredLanguage as SupportedLanguage)
        }
      } finally {
        setIsChanging(false)
      }
    },
    [user, i18n, updateUser]
  )

  const value: LanguageContextType = {
    currentLanguage: i18n.language as SupportedLanguage,
    changeLanguage,
    isChanging,
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = React.useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
