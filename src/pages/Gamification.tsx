import { Award, ShieldCheck, Star, Trophy, Sparkles, Wand2, BookOpen, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AdventureJourney } from '@/components/AdventureJourney'
import { StoryUnlock } from '@/components/StoryUnlock'
import { useTreatment, useCurrentAligner } from '@/context/AlignerContext'
import { StorySeriesService as StorySeriesApiService } from '@/services/storyService.v2'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useEffect, useState } from 'react'
import type { StorySeries, StoryChapterV3 } from '@/types/story'

const badges = [
  { id: '1', name: 'Mês de Ouro', icon: '🏆', earned: true, description: 'Um mês completo de uso', earnedDate: '2024-01-15' },
  { id: '2', name: 'Paciente Assíduo', icon: '🛡️', earned: true, description: 'Alta aderência', earnedDate: '2024-01-20' },
  { id: '3', name: 'Super Sorriso', icon: '⭐', earned: true, description: 'Progresso excelente', earnedDate: '2024-02-01' },
  { id: '4', name: 'Fotógrafo Pro', icon: '📸', earned: false, description: 'Envie 10 fotos', earnedDate: null },
]

const Gamification = () => {
  const treatment = useTreatment()
  const currentAligner = useCurrentAligner()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [series, setSeries] = useState<StorySeries | null>(null)
  const [chapters, setChapters] = useState<StoryChapterV3[]>([])
  const [isLoadingStory, setIsLoadingStory] = useState(true)

  const patientId = user?.id
  const currentAlignerNumber = currentAligner?.number || 1

  // Calcular progresso da história
  let storyProgress = 0
  let unlockedCount = 0
  let totalChapters = treatment?.totalAligners || 0

  useEffect(() => {
    const loadStory = async () => {
      if (!patientId) {
        setIsLoadingStory(false)
        return
      }
      try {
        const patientSeries = await StorySeriesApiService.getPatientSeries(
          patientId,
          treatment?.id,
        )
        if (patientSeries) {
          setSeries(patientSeries)
          const fetchedChapters = await StorySeriesApiService.getSeriesChapters(
            patientSeries.id,
          )
          setChapters(fetchedChapters)
        } else {
          setSeries(null)
          setChapters([])
        }
      } catch (error) {
        console.error('Erro ao carregar história:', error)
        setSeries(null)
        setChapters([])
      } finally {
        setIsLoadingStory(false)
      }
    }

    loadStory()
  }, [patientId, treatment?.id])

  if (series) {
    const effectiveTotal = treatment?.totalAligners || chapters.length
    totalChapters = effectiveTotal

    unlockedCount = Math.min(
      effectiveTotal,
      chapters.filter((ch) => ch.requiredAlignerNumber <= currentAlignerNumber).length,
    )

    storyProgress = effectiveTotal > 0 ? (unlockedCount / effectiveTotal) * 100 : 0
  } else if (totalChapters > 0) {
    unlockedCount = Math.min(currentAlignerNumber, totalChapters)
    storyProgress = (unlockedCount / totalChapters) * 100
  }

  if (isLoadingStory) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando sua história...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-extrabold text-primary">
            Central de Aventuras
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Acompanhe sua jornada e colecione selos incríveis!
          </p>
        </div>
        <img
          src="https://img.usecurling.com/p/120/120?q=happy%20robot%20mascot"
          alt="Mascote"
          className="animate-float hover-wiggle"
        />
      </div>

      {/* Card de História - Criar ou Ver */}
      {!series ? (
        // Card "Criar História" (quando ainda não tem história)
        <Card className="border-2 border-primary-child shadow-xl bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 hover:shadow-2xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-primary-child to-purple-500 p-4 rounded-full shadow-lg animate-bounce-slow">
                  <Wand2 className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold text-primary-child mb-1">
                    Diretor de Histórias
                  </h3>
                  <p className="text-muted-foreground">
                    Crie sua própria história mágica personalizada! Você escolhe o ambiente, personagens e tema.
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                onClick={() => navigate('/story-director')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg px-8 py-6 rounded-full shadow-lg hover:scale-105 transition-transform min-w-[200px]"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Criar História
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Card "Minha História" (quando já tem história)
        <Card className="border-2 border-green-500 shadow-xl bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 hover:shadow-2xl transition-shadow cursor-pointer" onClick={() => navigate('/my-story')}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="bg-gradient-to-br from-green-500 to-blue-500 p-4 rounded-full shadow-lg">
                  <BookOpen className="h-10 w-10 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display text-2xl font-bold text-green-700">
                      {series?.title || 'Minha História'}
                    </h3>
                    <Badge variant="default" className="bg-green-600">
                      Ativa
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-3">
                    Continue sua aventura mágica! {unlockedCount} de {totalChapters} capítulos disponíveis.
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">Progresso</span>
                      <span className="text-green-700 font-bold">{Math.round(storyProgress)}%</span>
                    </div>
                    <Progress value={storyProgress} className="h-2" />
                  </div>
                </div>
              </div>
              <Button
                size="lg"
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold text-lg px-8 py-6 rounded-full shadow-lg hover:scale-105 transition-transform min-w-[200px]"
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Ver Capítulos
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AdventureJourney />
        </div>
        <div>
          <StoryUnlock />
        </div>
      </div>

      {/* Coleção de Badges */}
      <Card className="border-2 border-purple-400 shadow-lg hover-scale">
        <CardHeader className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
          <CardTitle className="flex items-center gap-2 font-display text-2xl text-white drop-shadow-lg">
            <Sparkles className="h-6 w-6 animate-wiggle-slow" />
            Coleção de Selos
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 p-6 text-center md:grid-cols-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={cn(
                'group flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all duration-300 hover-scale',
                badge.earned
                  ? 'border-green-400 bg-gradient-to-br from-green-50 to-green-100 shadow-md hover:shadow-lg'
                  : 'border-gray-300 bg-gray-50',
              )}
            >
              <div
                className={cn(
                  'text-6xl transition-transform duration-300',
                  badge.earned && 'group-hover:scale-110 animate-bounce-slow',
                  !badge.earned && 'grayscale opacity-40',
                )}
              >
                {badge.icon}
              </div>
              <div>
                <p
                  className={cn(
                    'font-semibold',
                    badge.earned ? 'text-green-700' : 'text-gray-500',
                  )}
                >
                  {badge.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {badge.description}
                </p>
                {badge.earned && badge.earnedDate && (
                  <p className="mt-2 text-xs font-medium text-green-600">
                    ✓ Conquistado
                  </p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default Gamification
