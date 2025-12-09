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
   * Cria história completa para um paciente
   */
  static async createStorySeries(
    patientId: string,
    input: StorySeriesInput,
    onProgress?: (message: string, progress: number) => void,
  ): Promise<StorySeries> {
    try {
      // Verificar se já tem história
      if (this.hasStory(patientId)) {
        throw new Error('Paciente já possui uma história')
      }

      const startTime = Date.now()

      // Criar série
      const seriesId = `series-${Date.now()}`
      const series: StorySeries = {
        id: seriesId,
        patientId,
        title: '', // Será preenchido após geração
        totalChapters: input.totalAligners,
        totalAligners: input.totalAligners,
        preferences: input.preferences,
        isComplete: false,
        generationStartedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Salvar série
      this.saveSeries(series)

      // PASSO 1: Gerar história completa com OpenAI
      onProgress?.('Criando sua história mágica...', 10)
      console.log('📖 Gerando história completa...')

      const storyData = await StorySeriesAIService.generateFullStory(
        input.preferences,
        input.totalAligners,
      )

      // Atualizar título da série
      series.title = storyData.storyTitle
      this.saveSeries(series)

      onProgress?.('História criada! Gerando narrações...', 30)

      // PASSO 2: Gerar áudio para cada capítulo
      const chapters: StoryChapterV3[] = []
      const totalChapters = storyData.chapters.length

      for (let i = 0; i < storyData.chapters.length; i++) {
        const chapterData = storyData.chapters[i]
        const progress = 30 + ((i + 1) / totalChapters) * 60

        onProgress?.(
          `Narrando capítulo ${i + 1} de ${totalChapters}...`,
          progress,
        )

        console.log(`🎙️ Gerando áudio do capítulo ${i + 1}/${totalChapters}...`)

        try {
          // Gerar áudio
          const audio = await OpenAITTSService.convertChapterToAudio(
            chapterData.title,
            chapterData.content,
          )

          // Criar blob URL
          const audioBlob = OpenAITTSService.createAudioBlobUrl(
            audio.audioData,
          )

          // Estimar duração
          const audioDuration = OpenAITTSService.estimateAudioDuration(
            chapterData.content,
          )

          // Criar capítulo
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
            tokensUsed: Math.floor(storyData.totalTokens / totalChapters),
            audioUrl: audioBlob,
            audioDurationSeconds: audioDuration,
            isRead: false,
            readCount: 0,
            liked: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }

          chapters.push(chapter)
        } catch (audioError) {
          console.warn(
            `⚠️ Erro ao gerar áudio do capítulo ${i + 1}, continuando sem áudio...`,
            audioError,
          )

          // Criar capítulo sem áudio
          const chapter: StoryChapterV3 = {
            id: `chapter-${seriesId}-${chapterData.chapterNumber}`,
            storySeriesId: seriesId,
            patientId,
            chapterNumber: chapterData.chapterNumber,
            requiredAlignerNumber: chapterData.chapterNumber,
            title: chapterData.title,
            content: chapterData.content,
            wordCount: chapterData.wordCount,
            estimatedReadingTime: Math.ceil(chapterData.wordCount / 150),
            modelUsed: 'gpt-4o-mini',
            isRead: false,
            readCount: 0,
            liked: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }

          chapters.push(chapter)
        }
      }

      // Salvar capítulos
      this.saveChapters(chapters)

      // Finalizar série
      series.isComplete = true
      series.generationCompletedAt = new Date().toISOString()
      this.saveSeries(series)

      const totalTime = Date.now() - startTime

      console.log('✅ História completa gerada!', {
        seriesId,
        chapters: chapters.length,
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
