/**
 * Story Reader - Página para ler histórias geradas
 * Experiência imersiva de leitura com opções de interação
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  Heart,
  Home,
  Clock,
  Sparkles,
  Share2,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import type { StoryChapterV3 } from '@/types/story'
import { StorySeriesService } from '@/services/storySeriesService'
import { AudioPlayer } from '@/components/AudioPlayer'
import { toast } from 'sonner'
import { Celebration } from '@/components/Confetti'

const StoryReader = () => {
  const { storyId } = useParams<{ storyId: string }>()
  const navigate = useNavigate()

  const [chapter, setChapter] = useState<StoryChapterV3 | null>(null)
  const [allChapters, setAllChapters] = useState<StoryChapterV3[]>([])
  const [liked, setLiked] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  // ============================================
  // CARREGAR CAPÍTULO
  // ============================================

  useEffect(() => {
    loadChapter()
  }, [storyId])

  const loadChapter = () => {
    if (!storyId) {
      toast.error('Capítulo não especificado!')
      navigate('/my-story')
      return
    }

    // Buscar capítulo do serviço
    const loadedChapter = StorySeriesService.getChapter(storyId)

    if (!loadedChapter) {
      toast.error('Capítulo não encontrado!')
      navigate('/my-story')
      return
    }

    // Buscar todos os capítulos da série para navegação
    const series = StorySeriesService.getPatientSeries(loadedChapter.patientId)
    if (series) {
      const seriesChapters = StorySeriesService.getSeriesChapters(series.id)
      setAllChapters(seriesChapters)
    }

    setChapter(loadedChapter)
    setLiked(loadedChapter.liked)

    // Marcar como lido
    StorySeriesService.markChapterAsRead(storyId)
  }

  // ============================================
  // AÇÕES
  // ============================================

  const handleLike = () => {
    if (!chapter) return

    const newLiked = StorySeriesService.toggleChapterLike(chapter.id)
    setLiked(newLiked)

    if (newLiked) {
      setShowCelebration(true)
      toast.success('❤️ Adoramos saber que você gostou!')
    }
  }

  const handleGoToMyStory = () => {
    navigate('/my-story')
  }

  const handleShare = () => {
    // TODO: Implementar compartilhamento
    toast.info('Em breve você poderá compartilhar suas histórias!')
  }

  const handleDownload = () => {
    // TODO: Implementar download em PDF
    toast.info('Em breve você poderá baixar suas histórias em PDF!')
  }

  // Navegação entre capítulos
  const currentChapterIndex = allChapters.findIndex((ch) => ch.id === chapter?.id)
  const prevChapter = currentChapterIndex > 0 ? allChapters[currentChapterIndex - 1] : null
  const nextChapter =
    currentChapterIndex >= 0 && currentChapterIndex < allChapters.length - 1
      ? allChapters[currentChapterIndex + 1]
      : null

  const goToPrevChapter = () => {
    if (prevChapter) {
      navigate(`/story-reader/${prevChapter.id}`)
    }
  }

  const goToNextChapter = () => {
    if (nextChapter) {
      navigate(`/story-reader/${nextChapter.id}`)
    }
  }

  // ============================================
  // LOADING STATE
  // ============================================

  if (!chapter) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <BookOpen className="mx-auto h-16 w-16 animate-pulse text-primary-child" />
          <p className="mt-4 text-lg text-muted-foreground">Carregando capítulo...</p>
        </div>
      </div>
    )
  }

  // ============================================
  // RENDER PRINCIPAL
  // ============================================

  return (
    <>
      <Celebration
        show={showCelebration}
        message="❤️ Você amou esse capítulo! ❤️"
        icon={<Heart className="h-16 w-16 fill-red-500 text-red-500" />}
        onComplete={() => setShowCelebration(false)}
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 py-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <Button variant="outline" onClick={handleGoToMyStory}>
              <Home className="mr-2 h-4 w-4" />
              Minha História
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Navegação entre capítulos */}
          <div className="mb-6 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={goToPrevChapter}
              disabled={!prevChapter}
              className="min-w-[140px]"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Capítulo Anterior
            </Button>

            <Badge variant="default" className="bg-primary-child text-lg px-4 py-2">
              Capítulo {chapter.chapterNumber} de {allChapters.length}
            </Badge>

            <Button
              variant="outline"
              onClick={goToNextChapter}
              disabled={!nextChapter}
              className="min-w-[140px]"
            >
              Próximo Capítulo
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Card Principal do Capítulo */}
          <Card className="mb-6 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-primary-child via-purple-500 to-pink-500 text-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="font-display text-3xl md:text-4xl mb-4">
                    {chapter.title}
                  </CardTitle>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-white/20">
                      <Clock className="mr-1 h-3 w-3" />
                      {chapter.estimatedReadingTime} min de leitura
                    </Badge>
                    <Badge variant="secondary" className="bg-white/20">
                      <Sparkles className="mr-1 h-3 w-3" />
                      {chapter.wordCount} palavras
                    </Badge>
                    {chapter.readCount > 0 && (
                      <Badge variant="secondary" className="bg-white/20">
                        <BookOpen className="mr-1 h-3 w-3" />
                        Lido {chapter.readCount}x
                      </Badge>
                    )}
                    {chapter.isRead && (
                      <Badge variant="secondary" className="bg-green-500/30">
                        ✓ Lido
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Botão de Like */}
                <Button
                  size="lg"
                  variant={liked ? 'default' : 'outline'}
                  onClick={handleLike}
                  className={cn(
                    'ml-4 transition-all',
                    liked
                      ? 'bg-red-500 hover:bg-red-600 scale-110'
                      : 'bg-white/20 hover:bg-white/30',
                  )}
                >
                  <Heart
                    className={cn(
                      'h-6 w-6',
                      liked && 'fill-white animate-pulse',
                    )}
                  />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-8 md:p-12">
              {/* Player de Áudio */}
              {chapter.audioUrl && (
                <div className="mb-8">
                  <AudioPlayer
                    audioUrl={chapter.audioUrl}
                    audioDurationSeconds={chapter.audioDurationSeconds}
                  />
                </div>
              )}

              {/* Conteúdo do Capítulo */}
              <div className="prose prose-lg max-w-none">
                <div className="story-content whitespace-pre-wrap text-lg leading-relaxed">
                  {chapter.content.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="mb-6 text-justify">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              {/* Final do Capítulo */}
              {chapter.chapterNumber === allChapters.length ? (
                <div className="mt-12 rounded-xl bg-gradient-to-r from-green-100 via-blue-100 to-purple-100 p-8 text-center border-2 border-purple-300">
                  <Sparkles className="mx-auto h-12 w-12 text-purple-600 mb-4 animate-bounce" />
                  <p className="font-display text-2xl font-bold text-purple-800 mb-2">
                    Fim da Aventura!
                  </p>
                  <p className="text-lg text-purple-700">
                    Esperamos que você tenha gostado desta história mágica!
                  </p>
                </div>
              ) : (
                <div className="mt-12 text-center">
                  <p className="text-lg text-purple-700 mb-4">
                    Continue lendo para descobrir o que acontece a seguir...
                  </p>
                  {nextChapter && (
                    <Button
                      size="lg"
                      onClick={goToNextChapter}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg px-8 py-6 rounded-full shadow-lg hover:scale-105 transition-transform"
                    >
                      Próximo Capítulo
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações Técnicas (apenas para debug) */}
          {import.meta.env.DEV && (
            <Card className="mt-6 border-2 border-dashed border-gray-300">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Debug Info
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                <div className="grid gap-2">
                  <div>
                    <strong>Chapter ID:</strong> {chapter.id}
                  </div>
                  <div>
                    <strong>Chapter Number:</strong> {chapter.chapterNumber} / {allChapters.length}
                  </div>
                  <div>
                    <strong>Required Aligner:</strong> {chapter.requiredAlignerNumber}
                  </div>
                  <div>
                    <strong>Model:</strong> {chapter.modelUsed}
                  </div>
                  {chapter.tokensUsed && (
                    <div>
                      <strong>Tokens:</strong> {chapter.tokensUsed}
                    </div>
                  )}
                  <div>
                    <strong>Has Audio:</strong> {chapter.audioUrl ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <strong>Created:</strong>{' '}
                    {new Date(chapter.createdAt).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        .story-content p {
          text-indent: 2em;
          font-family: 'Georgia', serif;
        }

        .story-content p:first-child::first-letter {
          font-size: 3em;
          font-weight: bold;
          float: left;
          line-height: 0.8;
          margin-right: 0.1em;
          color: var(--primary-child);
        }
      `}</style>
    </>
  )
}

export default StoryReader
