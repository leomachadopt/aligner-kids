/**
 * Serviço de Gerenciamento de Séries de Histórias (V3)
 * Coordena geração, áudio e armazenamento
 */

import type {
  StorySeries,
  StorySeriesInput,
  StoryChapterV3,
  StoryPreferencesInput,
} from '@/types/story'
import { StorySeriesAIService } from './storySeriesAI'
import { OpenAITTSService } from './openaiTTS'

// ============================================
// CONSTANTES
// ============================================

const STORAGE_KEY_SERIES = 'story_series'
const STORAGE_KEY_CHAPTERS = 'story_chapters'

// ============================================
// CLASSE PRINCIPAL
// ============================================

export class StorySeriesService {
  /**
   * Verifica se paciente já tem história
   */
  static hasStory(patientId: string): boolean {
    const allSeries = this.getAllSeries()
    return allSeries.some((series) => series.patientId === patientId)
  }

  /**
   * Busca história do paciente
   */
  static getPatientSeries(patientId: string): StorySeries | null {
    const allSeries = this.getAllSeries()
    return allSeries.find((series) => series.patientId === patientId) || null
  }

  /**
   * Busca capítulos de uma série
   */
  static getSeriesChapters(seriesId: string): StoryChapterV3[] {
    const allChapters = this.getAllChapters()
    return allChapters
      .filter((chapter) => chapter.storySeriesId === seriesId)
      .sort((a, b) => a.chapterNumber - b.chapterNumber)
  }

  /**
   * Busca capítulo específico
   */
  static getChapter(chapterId: string): StoryChapterV3 | null {
    const allChapters = this.getAllChapters()
    return allChapters.find((chapter) => chapter.id === chapterId) || null
  }

  /**
   * Busca capítulos desbloqueados
   */
  static getUnlockedChapters(
    seriesId: string,
    currentAlignerNumber: number,
  ): StoryChapterV3[] {
    const chapters = this.getSeriesChapters(seriesId)
    return chapters.filter(
      (chapter) => chapter.requiredAlignerNumber <= currentAlignerNumber,
    )
  }

  /**
   * Cria história completa para um paciente, gerando capítulos em lotes (5 em 5)
   */
  static async createStorySeries(
    patientId: string,
    input: StorySeriesInput,
    onProgress?: (message: string, progress: number) => void,
  ): Promise<StorySeries> {
    try {
      if (this.hasStory(patientId)) {
        throw new Error('Paciente já possui uma história')
      }

      if (!input.totalAligners || input.totalAligners < 1) {
        throw new Error('Tratamento sem alinhadores não permite gerar história')
      }

      const startTime = Date.now()
      const seriesId = `series-${Date.now()}`
      const totalChapters = input.totalAligners
      const BATCH_SIZE = 5

      const series: StorySeries = {
        id: seriesId,
        patientId,
        title: '', // definido ao gerar o primeiro lote
        totalChapters,
        totalAligners: totalChapters,
        preferences: input.preferences,
        isComplete: false,
        generationStartedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      this.saveSeries(series)
      onProgress?.('Criando sua história mágica em lotes...', 5)

      const generatedChapters: StoryChapterV3[] = []
      let storyTitle = ''
      let generatedCount = 0

      const totalBatches = Math.ceil(totalChapters / BATCH_SIZE)

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startChapter = batchIndex * BATCH_SIZE + 1
        const endChapter = Math.min(startChapter + BATCH_SIZE - 1, totalChapters)

        onProgress?.(
          `Gerando capítulos ${startChapter}-${endChapter}...`,
          5 + (generatedCount / totalChapters) * 35,
        )

        const batch = await StorySeriesAIService.generateChapterBatch(
          input.preferences,
          totalChapters,
          startChapter,
          endChapter,
          generatedChapters.map((ch) => ({
            chapterNumber: ch.chapterNumber,
            title: ch.title,
            content: ch.content,
          })),
          storyTitle || undefined,
        )

        if (!storyTitle) {
          storyTitle = batch.storyTitle
          series.title = storyTitle
          this.saveSeries(series)
        }

        const tokensPerChapter =
          batch.chapters.length > 0
            ? Math.floor((batch.totalTokens || 0) / batch.chapters.length)
            : 0

        for (let i = 0; i < batch.chapters.length; i++) {
          const chapterData = batch.chapters[i]
          const progressTextGen = 5 + ((generatedCount + i) / totalChapters) * 35
          onProgress?.(
            `Capítulo ${chapterData.chapterNumber} pronto! Gerando narração...`,
            progressTextGen,
          )

          let audioBlob: string | undefined
          let audioDuration: number | undefined

          try {
            const audio = await OpenAITTSService.convertChapterToAudio(
              chapterData.title,
              chapterData.content,
            )
            audioBlob = OpenAITTSService.createAudioBlobUrl(audio.audioData)
            audioDuration = OpenAITTSService.estimateAudioDuration(chapterData.content)
          } catch (audioError) {
            console.warn(
              `⚠️ Erro ao gerar áudio do capítulo ${chapterData.chapterNumber}, continuando sem áudio...`,
              audioError,
            )
          }

          const chapter: StoryChapterV3 = {
            id: `chapter-${seriesId}-${chapterData.chapterNumber}`,
            storySeriesId: seriesId,
            patientId,
            chapterNumber: chapterData.chapterNumber,
            requiredAlignerNumber: chapterData.chapterNumber, // 1:1
            title: chapterData.title,
            content: chapterData.content,
            wordCount: chapterData.wordCount,
            estimatedReadingTime: Math.ceil(chapterData.wordCount / 150),
            modelUsed: 'gpt-4o-mini',
            tokensUsed: tokensPerChapter,
            audioUrl: audioBlob,
            audioDurationSeconds: audioDuration,
            isRead: false,
            readCount: 0,
            liked: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }

          generatedChapters.push(chapter)
          generatedCount++

          onProgress?.(
            `Capítulo ${chapterData.chapterNumber} gerado`,
            40 + (generatedCount / totalChapters) * 55,
          )
        }
      }

      // Salvar capítulos (preservando outros pacientes, se houver)
      const allChapters = this.getAllChapters()
      const remaining = allChapters.filter((c) => c.storySeriesId !== seriesId)
      this.saveChapters([...remaining, ...generatedChapters])

      // Finalizar série
      series.isComplete = true
      series.generationCompletedAt = new Date().toISOString()
      series.updatedAt = new Date().toISOString()
      this.saveSeries(series)

      const totalTime = Date.now() - startTime
      console.log('✅ História gerada em lotes!', {
        seriesId,
        chapters: generatedChapters.length,
        totalTimeMs: totalTime,
      })

      onProgress?.('Concluído! Sua história está pronta!', 100)

      return series
    } catch (error) {
      console.error('❌ Erro ao criar história:', error)
      throw error
    }
  }

  /**
   * Marcar capítulo como lido
   */
  static markChapterAsRead(chapterId: string): void {
    const chapters = this.getAllChapters()
    const chapter = chapters.find((c) => c.id === chapterId)

    if (chapter) {
      chapter.isRead = true
      chapter.readCount++
      chapter.lastReadAt = new Date().toISOString()
      chapter.updatedAt = new Date().toISOString()
      this.saveChapters(chapters)
    }
  }

  /**
   * Curtir/descurtir capítulo
   */
  static toggleChapterLike(chapterId: string): boolean {
    const chapters = this.getAllChapters()
    const chapter = chapters.find((c) => c.id === chapterId)

    if (chapter) {
      chapter.liked = !chapter.liked
      chapter.updatedAt = new Date().toISOString()
      this.saveChapters(chapters)
      return chapter.liked
    }

    return false
  }

  /**
   * Deletar história (apenas para testes)
   */
  static deletePatientStory(patientId: string): void {
    // Buscar série
    const series = this.getPatientSeries(patientId)
    if (!series) return

    // Remover capítulos
    const allChapters = this.getAllChapters()
    const remainingChapters = allChapters.filter(
      (c) => c.storySeriesId !== series.id,
    )
    this.saveChapters(remainingChapters)

    // Remover série
    const allSeries = this.getAllSeries()
    const remainingSeries = allSeries.filter((s) => s.id !== series.id)
    this.saveSeries(remainingSeries)

    console.log('🗑️ História deletada:', series.id)
  }

  // ============================================
  // STORAGE HELPERS (LocalStorage)
  // TODO: Substituir por chamadas de API quando backend estiver pronto
  // ============================================

  private static getAllSeries(): StorySeries[] {
    const data = localStorage.getItem(STORAGE_KEY_SERIES)
    return data ? JSON.parse(data) : []
  }

  private static saveSeries(series: StorySeries | StorySeries[]): void {
    const allSeries = this.getAllSeries()

    if (Array.isArray(series)) {
      localStorage.setItem(STORAGE_KEY_SERIES, JSON.stringify(series))
    } else {
      const index = allSeries.findIndex((s) => s.id === series.id)
      if (index >= 0) {
        allSeries[index] = series
      } else {
        allSeries.push(series)
      }
      localStorage.setItem(STORAGE_KEY_SERIES, JSON.stringify(allSeries))
    }
  }

  private static getAllChapters(): StoryChapterV3[] {
    const data = localStorage.getItem(STORAGE_KEY_CHAPTERS)
    return data ? JSON.parse(data) : []
  }

  private static saveChapters(chapters: StoryChapterV3[]): void {
    localStorage.setItem(STORAGE_KEY_CHAPTERS, JSON.stringify(chapters))
  }
}

export default StorySeriesService
