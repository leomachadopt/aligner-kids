/**
 * Story Director - Página onde a criança cria sua história personalizada
 * Wizard multi-step para selecionar ambiente, personagens e tema
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Wand2,
  Loader2,
  Lock,
} from 'lucide-react'
import type {
  StoryPreferencesInput,
  StoryEnvironment,
  StoryCharacter,
  StoryTheme,
} from '@/types/story'
import {
  STORY_ENVIRONMENTS,
  STORY_CHARACTERS,
  STORY_THEMES,
  getRandomGenerationMessage,
} from '@/config/storyOptions'
import { StorySeriesService as StorySeriesApiService } from '@/services/storyService.v2'
import { useTreatment } from '@/context/AlignerContext'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { StoryOptionsService } from '@/services/storyOptionsService'

const StoryDirector = () => {
  const navigate = useNavigate()
  const treatment = useTreatment()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationMessage, setGenerationMessage] = useState('')
  const [generationProgress, setGenerationProgress] = useState(0)
  const [dbOptions, setDbOptions] = useState<{
    environments: any[]
    characters: any[]
    themes: any[]
  } | null>(null)

  // Estado das preferências
  const [preferences, setPreferences] = useState<Partial<StoryPreferencesInput>>({
    ageGroup: 8, // Padrão
  })

  const totalAligners = treatment?.totalAligners || treatment?.totalAlignersOverall || 0

  // Debug log para verificar o tratamento
  useEffect(() => {
    console.log('📊 Treatment data:', {
      treatment,
      totalAligners: treatment?.totalAligners,
      totalAlignersOverall: treatment?.totalAlignersOverall,
      computed: totalAligners,
    })
  }, [treatment, totalAligners])

  useEffect(() => {
    const loadOptions = async () => {
      if (!user?.id) return
      try {
        const res = await StoryOptionsService.getOptions(user.id)
        setDbOptions(res as any)
      } catch (e) {
        // ignore
      }
    }
    loadOptions()
  }, [user?.id])

  const environmentsForUI = useMemo(() => dbOptions?.environments || STORY_ENVIRONMENTS, [dbOptions])
  const themesForUI = useMemo(() => dbOptions?.themes || STORY_THEMES, [dbOptions])
  const charactersForUI = useMemo(() => dbOptions?.characters || STORY_CHARACTERS, [dbOptions])


  const totalSteps = 5
  const progress = (currentStep / totalSteps) * 100

  // ============================================
  // NAVEGAÇÃO
  // ============================================

  const goToNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goToPrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!preferences.environment
      case 2:
        return !!preferences.mainCharacter
      case 3:
        return true // Sidekick é opcional
      case 4:
        return !!preferences.theme
      case 5:
        return true // Nome é opcional
      default:
        return false
    }
  }

  // ============================================
  // GERAÇÃO DE HISTÓRIA
  // ============================================

  const handleGenerateStory = async () => {
    if (!user?.id) {
      toast.error('É necessário estar autenticado para gerar uma história.')
      navigate('/login')
      return
    }
    const patientId = user.id

    if (!preferences.environment || !preferences.mainCharacter || !preferences.theme) {
      toast.error('Por favor, complete todas as etapas obrigatórias!')
      return
    }

    if (!totalAligners || totalAligners < 1) {
      toast.error('Defina o número de alinhadores do tratamento para gerar a história.')
      return
    }

    // Verificar se já tem história
    const alreadyHasStory = await StorySeriesApiService.hasStory(patientId)
    if (alreadyHasStory) {
      toast.error('Você já tem uma história! Veja em "Minha História"')
      navigate('/my-story')
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)

    try {
      const fullPreferences: StoryPreferencesInput = {
        environment: preferences.environment,
        mainCharacter: preferences.mainCharacter,
        sidekick: preferences.sidekick,
        theme: preferences.theme,
        ageGroup: preferences.ageGroup || 8,
        mainCharacterName: preferences.mainCharacterName,
      }

      console.log('Gerando história completa com preferências:', fullPreferences)
      console.log('Total de capítulos (alinhadores):', totalAligners)

      // Criar história completa com capítulos e áudio
      await StorySeriesApiService.createStorySeries(
        patientId,
        {
          preferences: fullPreferences,
          totalAligners: totalAligners,
        },
        (message, progress) => {
          setGenerationMessage(message)
          setGenerationProgress(progress)
        },
        treatment?.id,
      )

      toast.success('✨ Sua história foi criada com sucesso!')

      // Navegar para "Minha História"
      navigate('/my-story')
    } catch (error) {
      console.error('Erro ao gerar história:', error)
      toast.error(
        error instanceof Error ? error.message : 'Erro ao gerar história. Tente novamente!',
      )
    } finally {
      setIsGenerating(false)
      setGenerationMessage('')
      setGenerationProgress(0)
    }
  }

  // ============================================
  // RENDER DOS STEPS
  // ============================================

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepEnvironment
            selected={preferences.environment}
            onSelect={(env) => setPreferences({ ...preferences, environment: env })}
            options={environmentsForUI as any}
          />
        )
      case 2:
        return (
          <StepCharacter
            selected={preferences.mainCharacter}
            onSelect={(char) =>
              setPreferences({ ...preferences, mainCharacter: char })
            }
            options={charactersForUI as any}
          />
        )
      case 3:
        return (
          <StepSidekick
            selected={preferences.sidekick}
            onSelect={(sidekick) =>
              setPreferences({ ...preferences, sidekick })
            }
            onSkip={() => {
              setPreferences({ ...preferences, sidekick: undefined })
              goToNext()
            }}
            options={charactersForUI as any}
          />
        )
      case 4:
        return (
          <StepTheme
            selected={preferences.theme}
            onSelect={(theme) => setPreferences({ ...preferences, theme })}
            options={themesForUI as any}
          />
        )
      case 5:
        return (
          <StepPersonalize
            characterName={preferences.mainCharacterName}
            ageGroup={preferences.ageGroup || 8}
            onChangeName={(name) =>
              setPreferences({ ...preferences, mainCharacterName: name })
            }
            onChangeAge={(age) =>
              setPreferences({ ...preferences, ageGroup: age })
            }
          />
        )
      default:
        return null
    }
  }

  // ============================================
  // RENDER PRINCIPAL
  // ============================================

  if (isGenerating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <Loader2 className="mx-auto h-20 w-20 animate-spin text-primary-child mb-6" />
            <h2 className="font-display text-3xl font-bold text-primary-child mb-4">
              Criando Sua História Mágica!
            </h2>
            <p className="text-xl text-muted-foreground animate-pulse mb-6">
              {generationMessage || 'Iniciando...'}
            </p>
            <div className="space-y-2">
              <Progress value={generationProgress} className="h-3" />
              <p className="text-sm text-muted-foreground font-semibold">
                {Math.round(generationProgress)}% concluído
              </p>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              Isso pode levar 1-2 minutos. Estamos criando {totalAligners} capítulos com narração!
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 p-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-5xl font-extrabold text-white drop-shadow-lg mb-4 flex items-center justify-center gap-3">
            <Wand2 className="h-12 w-12 animate-bounce" />
            Diretor de Histórias
          </h1>
          <p className="text-xl text-white/90">
            Você é o diretor! Escolha como será sua aventura mágica
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-white">
            <span className="font-semibold">Passo {currentStep} de {totalSteps}</span>
            <span className="font-semibold">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3 bg-white/30" />
        </div>

        {/* Card Principal */}
        <Card className="shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-primary-child to-purple-500 text-white">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 animate-pulse" />
              {getStepTitle(currentStep)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8">{renderStep()}</CardContent>
        </Card>

        {/* Botões de Navegação */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            size="lg"
            onClick={goToPrevious}
            disabled={currentStep === 1}
            className="min-w-[120px]"
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            Voltar
          </Button>

          {currentStep < totalSteps ? (
            <Button
              size="lg"
              onClick={goToNext}
              disabled={!canProceed()}
              className="min-w-[120px] bg-primary-child hover:bg-primary-child/90"
            >
              Próximo
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleGenerateStory}
              disabled={!canProceed()}
              className="min-w-[180px] bg-gradient-to-r from-green-500 to-blue-500 text-lg font-bold hover:scale-105 transition-transform"
            >
              <Sparkles className="mr-2 h-6 w-6" />
              Criar Minha História!
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getStepTitle(step: number): string {
  const titles = [
    '',
    'Escolha o Ambiente',
    'Escolha Seu Personagem Principal',
    'Escolha um Ajudante (Opcional)',
    'Escolha o Tema da Aventura',
    'Personalize Sua História',
  ]
  return titles[step] || ''
}

// ============================================
// STEP COMPONENTS
// ============================================

interface StepEnvironmentProps {
  selected?: StoryEnvironment
  onSelect: (env: StoryEnvironment) => void
  options?: any[]
}

function StepEnvironment({ selected, onSelect, options }: StepEnvironmentProps) {
  const list = options || STORY_ENVIRONMENTS
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((env: any) => (
        <button
          key={env.id}
          onClick={() => !env.isLocked && onSelect(env.id)}
          disabled={Boolean(env.isLocked)}
          className={cn(
            'group flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all hover:scale-105',
            selected === env.id
              ? 'border-primary-child bg-primary-child/10 shadow-lg'
              : 'border-gray-300 hover:border-primary-child/50',
            env.isLocked && 'opacity-60 cursor-not-allowed hover:scale-100',
          )}
        >
          {env.isLocked && (
            <div className="absolute -mt-4 -ml-4 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-white text-xs">
              <Lock className="h-3 w-3" />
              Bloqueado
            </div>
          )}
          <div
            className={cn(
              'transition-transform group-hover:scale-110',
              selected === env.id && 'animate-bounce',
              env.isLocked && 'group-hover:scale-100',
            )}
          >
            {env.imageUrl ? (
              <img
                src={env.imageUrl}
                alt={env.name}
                className="h-24 w-24 object-contain"
              />
            ) : (
              <span className="text-6xl">{env.icon}</span>
            )}
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">{env.name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {env.description}
            </p>
            {env.isUnlockedByReward && (
              <p className="mt-2 text-xs font-semibold text-primary-child">
                Desbloqueado por prêmio
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

interface StepCharacterProps {
  selected?: StoryCharacter
  onSelect: (char: StoryCharacter) => void
  options?: any[]
}

function StepCharacter({ selected, onSelect, options }: StepCharacterProps) {
  const list = options || STORY_CHARACTERS
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((char: any) => (
        <button
          key={char.id}
          onClick={() => !char.isLocked && onSelect(char.id)}
          disabled={Boolean(char.isLocked)}
          className={cn(
            'group flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all hover:scale-105',
            selected === char.id
              ? 'border-primary-child bg-primary-child/10 shadow-lg'
              : 'border-gray-300 hover:border-primary-child/50',
            char.isLocked && 'opacity-60 cursor-not-allowed hover:scale-100',
          )}
        >
          {char.isLocked && (
            <div className="absolute -mt-4 -ml-4 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-white text-xs">
              <Lock className="h-3 w-3" />
              Bloqueado
            </div>
          )}
          <div
            className={cn(
              'transition-transform group-hover:scale-110',
              selected === char.id && 'animate-bounce',
              char.isLocked && 'group-hover:scale-100',
            )}
          >
            {char.imageUrl ? (
              <img
                src={char.imageUrl}
                alt={char.name}
                className="h-24 w-24 object-contain"
              />
            ) : (
              <span className="text-6xl">{char.icon}</span>
            )}
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">{char.name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {char.description}
            </p>
            {char.isUnlockedByReward && (
              <p className="mt-2 text-xs font-semibold text-primary-child">
                Desbloqueado por prêmio
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

interface StepSidekickProps {
  selected?: StoryCharacter
  onSelect: (char?: StoryCharacter) => void
  onSkip: () => void
  options?: any[]
}

function StepSidekick({ selected, onSelect, onSkip, options }: StepSidekickProps) {
  const list = options || STORY_CHARACTERS
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <p className="text-muted-foreground">
          Escolha um companheiro para ajudar na aventura, ou pule esta etapa
        </p>
        <Button variant="outline" onClick={onSkip} className="mt-4">
          Pular esta etapa
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((char: any) => (
          <button
            key={char.id}
            onClick={() => !char.isLocked && onSelect(char.id)}
            disabled={Boolean(char.isLocked)}
            className={cn(
              'group flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all hover:scale-105',
              selected === char.id
                ? 'border-primary-child bg-primary-child/10 shadow-lg'
                : 'border-gray-300 hover:border-primary-child/50',
              char.isLocked && 'opacity-60 cursor-not-allowed hover:scale-100',
            )}
          >
            {char.isLocked && (
              <div className="absolute -mt-4 -ml-4 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-white text-xs">
                <Lock className="h-3 w-3" />
                Bloqueado
              </div>
            )}
            <div
              className={cn(
                'transition-transform group-hover:scale-110',
                selected === char.id && 'animate-bounce',
                char.isLocked && 'group-hover:scale-100',
              )}
            >
              {char.imageUrl ? (
                <img
                  src={char.imageUrl}
                  alt={char.name}
                  className="h-24 w-24 object-contain"
                />
              ) : (
                <span className="text-6xl">{char.icon}</span>
              )}
            </div>
            <div className="text-center">
              <p className="font-bold text-lg">{char.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {char.description}
              </p>
              {char.isUnlockedByReward && (
                <p className="mt-2 text-xs font-semibold text-primary-child">
                  Desbloqueado por prêmio
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

interface StepThemeProps {
  selected?: StoryTheme
  onSelect: (theme: StoryTheme) => void
  options?: any[]
}

function StepTheme({ selected, onSelect, options }: StepThemeProps) {
  const list = options || STORY_THEMES
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {list.map((theme: any) => (
        <button
          key={theme.id}
          onClick={() => !theme.isLocked && onSelect(theme.id)}
          disabled={Boolean(theme.isLocked)}
          className={cn(
            'group flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all hover:scale-105',
            selected === theme.id
              ? 'border-primary-child bg-primary-child/10 shadow-lg'
              : 'border-gray-300 hover:border-primary-child/50',
            theme.isLocked && 'opacity-60 cursor-not-allowed hover:scale-100',
          )}
        >
          {theme.isLocked && (
            <div className="absolute -mt-4 -ml-4 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-white text-xs">
              <Lock className="h-3 w-3" />
              Bloqueado
            </div>
          )}
          <div
            className={cn(
              'transition-transform group-hover:scale-110',
              selected === theme.id && 'animate-bounce',
              theme.isLocked && 'group-hover:scale-100',
            )}
          >
            {theme.imageUrl ? (
              <img
                src={theme.imageUrl}
                alt={theme.name}
                className="h-24 w-24 object-contain"
              />
            ) : (
              <span className="text-6xl">{theme.icon}</span>
            )}
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">{theme.name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {theme.description}
            </p>
            {theme.isUnlockedByReward && (
              <p className="mt-2 text-xs font-semibold text-primary-child">
                Desbloqueado por prêmio
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

interface StepPersonalizeProps {
  characterName?: string
  ageGroup: number
  onChangeName: (name: string) => void
  onChangeAge: (age: number) => void
}

function StepPersonalize({
  characterName,
  ageGroup,
  onChangeName,
  onChangeAge,
}: StepPersonalizeProps) {
  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="space-y-2">
        <Label htmlFor="characterName" className="text-lg">
          Como se chama seu personagem? (Opcional)
        </Label>
        <Input
          id="characterName"
          placeholder="Ex: Luna, Max, Sofia..."
          value={characterName || ''}
          onChange={(e) => onChangeName(e.target.value)}
          className="text-lg p-6"
        />
        <p className="text-sm text-muted-foreground">
          Deixe em branco para usar o nome padrão
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ageGroup" className="text-lg">
          Qual é a sua idade?
        </Label>
        <Input
          id="ageGroup"
          type="number"
          min={3}
          max={12}
          value={ageGroup}
          onChange={(e) => onChangeAge(parseInt(e.target.value) || 8)}
          className="text-lg p-6"
        />
        <p className="text-sm text-muted-foreground">
          Isso ajuda a criar uma história perfeita para você!
        </p>
      </div>

      <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border-2 border-green-200">
        <p className="text-center text-lg font-semibold text-green-800">
          ✨ Tudo pronto! Clique em "Criar Minha História" para começar a magia!
        </p>
      </div>
    </div>
  )
}

export default StoryDirector
