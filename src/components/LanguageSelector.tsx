/**
 * Language Selector Component
 * Allows users to change the application language
 */

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/context/LanguageContext'
import { Globe } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { SupportedLanguage } from '@/i18n/config'

const languages: { code: SupportedLanguage; flag: string; label: string }[] = [
  { code: 'pt-BR', flag: '🇧🇷', label: 'Português (BR)' },
  { code: 'pt-PT', flag: '🇵🇹', label: 'Português (PT)' },
  { code: 'en-US', flag: '🇺🇸', label: 'English' },
  { code: 'es-ES', flag: '🇪🇸', label: 'Español' },
]

interface LanguageSelectorProps {
  variant?: 'select' | 'dropdown'
  showLabel?: boolean
}

export function LanguageSelector({
  variant = 'dropdown',
  showLabel = false
}: LanguageSelectorProps) {
  const { t } = useTranslation()
  const { currentLanguage, changeLanguage, isChanging } = useLanguage()

  const handleLanguageChange = (lang: string) => {
    changeLanguage(lang as SupportedLanguage)
  }

  if (variant === 'select') {
    return (
      <div className="flex items-center gap-2">
        {showLabel && (
          <span className="text-sm font-medium">{t('settings.language')}:</span>
        )}
        <Select value={currentLanguage} onValueChange={handleLanguageChange} disabled={isChanging}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                <span className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  const currentLang = languages.find(lang => lang.code === currentLanguage)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isChanging} className="text-2xl">
          {currentLang?.flag || <Globe className="h-5 w-5" />}
          <span className="sr-only">{t('settings.selectLanguage')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={currentLanguage === lang.code ? 'bg-accent' : ''}
          >
            <span className="flex items-center gap-2">
              <span className="text-xl">{lang.flag}</span>
              <span>{lang.label}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
