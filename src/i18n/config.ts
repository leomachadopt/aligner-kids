import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import ptBR from '../locales/pt-BR.json'
import ptPT from '../locales/pt-PT.json'
import enUS from '../locales/en-US.json'
import esES from '../locales/es-ES.json'

export const resources = {
  'pt-BR': { translation: ptBR },
  'pt-PT': { translation: ptPT },
  'en-US': { translation: enUS },
  'es-ES': { translation: esES },
} as const

// Supported languages
export const supportedLanguages = ['pt-BR', 'pt-PT', 'en-US', 'es-ES'] as const
export type SupportedLanguage = typeof supportedLanguages[number]

// Get initial language from localStorage (from user session)
function getInitialLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') {
    return 'pt-BR'
  }

  try {
    const session = localStorage.getItem('auth_session_v1')
    if (session) {
      const parsed = JSON.parse(session)
      const userLang = parsed?.user?.preferredLanguage

      if (userLang && supportedLanguages.includes(userLang)) {
        return userLang as SupportedLanguage
      }
    }
  } catch (error) {
    console.warn('Error loading language from localStorage:', error)
  }

  return 'pt-BR' // Default fallback
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(), // Load language from user session
    fallbackLng: 'pt-BR',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Disable suspense to prevent loading issues
    },
  })

export default i18n
