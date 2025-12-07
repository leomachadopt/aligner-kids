import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTreatment, useCurrentAligner } from '@/context/AlignerContext'
import {
  isChapterUnlocked,
  getNextChapterToUnlock,
  calculateChapterProgress,
  getDefaultChapterMapping,
} from '@/utils/storyUnlock'
import type { StoryChapter } from '@/types/aligner'
import { Lock, Unlock, BookOpen, Sparkles } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface StoryUnlockProps {
  chapters?: StoryChapter[]
  showProgress?: boolean
}

export const StoryUnlock = ({
  chapters: providedChapters,
  showProgress = true,
}: StoryUnlockProps) => {
  const treatment = useTreatment()
  const currentAligner = useCurrentAligner()

  // Use provided chapters or generate default mapping
  const chapters =
    providedChapters ||
    (treatment
      ? getDefaultChapterMapping(treatment.totalAligners)
      : getDefaultChapterMapping(24))

  const currentAlignerNumber = currentAligner?.number || 0
  const progress = calculateChapterProgress(chapters, currentAlignerNumber)
  const nextChapter = getNextChapterToUnlock(chapters, currentAlignerNumber)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Histórias e Capítulos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showProgress && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progresso de Desbloqueio</span>
              <span className="text-sm font-bold">
                {progress.unlocked}/{progress.total} capítulos
              </span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
          </div>
        )}

        <div className="grid gap-3">
          {chapters.map((chapter) => {
            const unlocked = isChapterUnlocked(chapter, currentAlignerNumber)
            const isNext = nextChapter?.id === chapter.id

            return (
              <div
                key={chapter.id}
                className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                  unlocked
                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                    : isNext
                      ? 'border-primary bg-primary/5'
                      : 'border-muted bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  {unlocked ? (
                    <Unlock className="h-5 w-5 text-green-500" />
                  ) : (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p
                      className={`font-semibold ${
                        unlocked ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {chapter.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Capítulo {chapter.chapterNumber}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {unlocked ? (
                    <Badge variant="default" className="bg-green-500">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Desbloqueado
                    </Badge>
                  ) : isNext ? (
                    <Badge variant="outline" className="border-primary">
                      Próximo: Alinhador #{chapter.requiredAlignerNumber}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      Alinhador #{chapter.requiredAlignerNumber}
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {nextChapter && !isChapterUnlocked(nextChapter, currentAlignerNumber) && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary">
            <p className="text-sm font-medium text-primary">
              Próximo capítulo desbloqueado em:
            </p>
            <p className="text-lg font-bold text-primary mt-1">
              Alinhador #{nextChapter.requiredAlignerNumber}
            </p>
            {currentAligner && (
              <p className="text-xs text-muted-foreground mt-1">
                {nextChapter.requiredAlignerNumber - currentAlignerNumber > 0
                  ? `Faltam ${
                      nextChapter.requiredAlignerNumber - currentAlignerNumber
                    } alinhador(es)`
                  : 'Você está próximo!'}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

