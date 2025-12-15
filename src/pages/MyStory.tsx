/**
 * Minha História - Lista de capítulos da história do paciente
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Lock, Play, Check, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StorySeries, StoryChapterV3 } from '@/types/story'
import { StorySeriesService as StorySeriesApiService } from '@/services/storyService.v2'
import { useCurrentAligner, useTreatment } from '@/context/AlignerContext'
import { useAuth } from '@/context/AuthContext'

const MyStory = () => {
  const navigate = useNavigate()
  const currentAligner = useCurrentAligner()
  const treatment = useTreatment()
  const { user } = useAuth()
  const [series, setSeries] = useState<StorySeries | null>(null)
  const [chapters, setChapters] = useState<StoryChapterV3[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const currentAlignerNumber = currentAligner?.number || 1
  const patientId = user?.id

  useEffect(() => {
    const loadStory = async () => {
      if (!patientId) {
        setIsLoading(false)
        navigate('/gamification')
        return
      }
      try {
        const patientSeries = await StorySeriesApiService.getPatientSeries(
          patientId,
          treatment?.id,
        )
        if (!patientSeries) {
          navigate('/gamification')
          return
        }
        setSeries(patientSeries)
        const seriesChapters = await StorySeriesApiService.getSeriesChapters(
          patientSeries.id,
        )
        setChapters(seriesChapters)
      } catch (error) {
        console.error('Erro ao carregar história:', error)
        navigate('/gamification')
      } finally {
        setIsLoading(false)
      }
    }

    loadStory()
  }, [patientId, treatment?.id, navigate])

  const handleChapterClick = (chapter: StoryChapterV3) => {
    if (chapter.requiredAlignerNumber <= currentAlignerNumber) {
      navigate(`/story-reader/${chapter.id}`)
    }
  }

  if (isLoading || !series) {
    return <div>Carregando...</div>
  }

  const env = series.preferences?.environment || 'N/A'
  const mainChar =
    series.preferences?.mainCharacterName ||
    series.preferences?.mainCharacter ||
    'Personagem'
  const theme = series.preferences?.theme || 'Tema'

  const unlockedCount = chapters.filter(
    (ch) => ch.requiredAlignerNumber <= currentAlignerNumber
  ).length
  const progress = (unlockedCount / chapters.length) * 100

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Button variant="outline" onClick={() => navigate('/gamification')}>
        <ChevronLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <Card className="border-2 border-primary-child shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <CardTitle className="font-display text-3xl">{series.title}</CardTitle>
          <div className="flex flex-wrap gap-2 mt-4 text-white/90">
            <Badge variant="secondary" className="bg-white/20">
              {env}
            </Badge>
            <Badge variant="secondary" className="bg-white/20">
              {mainChar}
            </Badge>
            <Badge variant="secondary" className="bg-white/20">
              {theme}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="font-semibold">Progresso</span>
              <span className="font-bold text-primary-child">
                {unlockedCount}/{chapters.length} capítulos
              </span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          <div className="space-y-3">
            {chapters.map((chapter) => {
              // Usar o campo isUnlocked do banco de dados em vez de recalcular
              const isUnlocked = chapter.isUnlocked
              const isRead = chapter.isRead

              return (
                <button
                  key={chapter.id}
                  onClick={() => handleChapterClick(chapter)}
                  disabled={!isUnlocked}
                  className={cn(
                    'w-full text-left rounded-xl border-2 p-4 transition-all',
                    isUnlocked
                      ? 'border-green-500 bg-green-50 hover:bg-green-100 hover:scale-102 cursor-pointer'
                      : 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-60'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'rounded-full p-2',
                        isUnlocked ? 'bg-green-500' : 'bg-gray-400'
                      )}>
                        {isUnlocked ? (
                          isRead ? (
                            <Check className="h-5 w-5 text-white" />
                          ) : (
                            <Play className="h-5 w-5 text-white" />
                          )
                        ) : (
                          <Lock className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-lg">
                          Capítulo {chapter.chapterNumber}
                        </p>
                        <p className={cn(
                          'text-sm',
                          isUnlocked ? 'text-gray-700' : 'text-gray-500'
                        )}>
                          {isUnlocked ? chapter.title : '???'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {isUnlocked ? (
                        <div className="space-y-1">
                          {isRead && (
                            <Badge variant="default" className="bg-green-600">
                              Lido
                            </Badge>
                          )}
                          {chapter.audioUrl && (
                            <p className="text-xs text-gray-600">
                              {chapter.estimatedReadingTime} min
                            </p>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline">
                          Alinhador {chapter.requiredAlignerNumber}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default MyStory
