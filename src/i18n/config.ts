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

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'pt-BR', // Set initial language to pt-BR
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
