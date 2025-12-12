/**
 * Story Service - Gerenciamento de Histórias
 * v2.0 - Migrado para API backend com Neon PostgreSQL
 */

import type {
  StorySeries,
  StoryChapterV3,
  StoryPreferencesInput,
  StorySeriesInput,
} from '@/types/story'
import { apiClient } from '@/utils/apiClient'
import { StorySeriesAIService } from './storySeriesAI'
import { OpenAITTSService } from './openaiTTS'

export class StorySeriesService {
  /**
   * Verifica se paciente já tem história
   */
  static async hasStory(patientId: string): Promise<boolean> {
    try {
      const response = await apiClient.get<{ story: StorySeries }>(`/stories/patient/${patientId}`)
      return !!response.story
    } catch (error) {
      return false
    }
  }

  /**
   * Busca história do paciente
   */
  static async getPatientSeries(patientId: string, treatmentId?: string): Promise<StorySeries | null> {
    try {
      const response = await apiClient.get<{ story: StorySeries }>(
        `/stories/patient/${patientId}${treatmentId ? `?treatmentId=${treatmentId}` : ''}`,
      )
      return response.story || null
    } catch (error) {
      console.error('Erro ao buscar história:', error)
      return null
    }
  }

  /**
   * Busca capítulos de uma série
   */
  static async getSeriesChapters(seriesId: string): Promise<StoryChapterV3[]> {
    try {
      const response = await apiClient.get<{ chapters: StoryChapterV3[] }>(`/stories/${seriesId}/chapters`)
      return response.chapters.sort((a, b) => a.chapterNumber - b.chapterNumber)
    } catch (error) {
      console.error('Erro ao buscar capítulos:', error)
      return []
    }
  }

  /**
   * Busca capítulo específico
   */
  static async getChapter(chapterId: string): Promise<StoryChapterV3 | null> {
    try {
      const response = await apiClient.get<{ chapter: StoryChapterV3 }>(`/chapters/${chapterId}`)
      return response.chapter
    } catch (error) {
      console.error('Erro ao buscar capítulo:', error)
      return null
    }
  }

  /**
   * Busca capítulos desbloqueados
   */
  static async getUnlockedChapters(
    seriesId: string,
    currentAlignerNumber: number,
  ): Promise<StoryChapterV3[]> {
    const chapters = await this.getSeriesChapters(seriesId)
    return chapters.filter(
      (chapter) => chapter.requiredAlignerNumber <= currentAlignerNumber,
    )
  }

  /**
   * Salvar ou atualizar preferências de história
   */
  static async savePreferences(
    patientId: string,
    preferences: StoryPreferencesInput,
    treatmentId?: string,
  ): Promise<void> {
    try {
      await apiClient.post('/stories/preferences', {
        patientId,
        treatmentId,
        ...preferences,
      })
      console.log('✅ Preferências salvas')
    } catch (error) {
      console.error('Erro ao salvar preferências:', error)
      throw error
    }
  }

  /**
   * Buscar preferências de história
   */
  static async getPreferences(patientId: string): Promise<StoryPreferencesInput | null> {
    try {
      const response = await apiClient.get<{ preferences: StoryPreferencesInput }>(
        `/stories/preferences/patient/${patientId}`
      )
      return response.preferences
    } catch (error) {
      return null
    }
  }

  /**
   * Cria história completa para um paciente
   */
  static async createStorySeries(
    patientId: string,
    input: StorySeriesInput,
    onProgress?: (message: string, progress: number) => void,
    treatmentId?: string,
  ): Promise<StorySeries> {
    try {
      // Verificar se já tem história
      const hasExisting = await this.hasStory(patientId)
      if (hasExisting) {
        throw new Error('Paciente já possui uma história')
      }

      const startTime = Date.now()

      onProgress?.('🎬 Iniciando geração da história...', 0)

      // Salvar preferências
      await this.savePreferences(patientId, input.preferences, treatmentId)

      // Criar série com título provisório
      const seriesResponse = await apiClient.post<{ story: StorySeries }>('/stories', {
        patientId,
        treatmentId,
        title: 'História Mágica',
        description: '',
        totalChapters: input.totalAligners,
      })

      let series = seriesResponse.story
      const allChapters: Array<{
        chapterNumber: number
        title: string
        content: string
      }> = []

      const BATCH_SIZE = 5
      const totalChapters = input.totalAligners
      const totalBatches = Math.ceil(totalChapters / BATCH_SIZE)
      let storyTitle = ''

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startChapter = batchIndex * BATCH_SIZE + 1
        const endChapter = Math.min(startChapter + BATCH_SIZE - 1, totalChapters)

        onProgress?.(
          `✨ Gerando capítulos ${startChapter}-${endChapter}...`,
          5 + (allChapters.length / totalChapters) * 85,
        )

        const batch = await StorySeriesAIService.generateChapterBatch(
          input.preferences,
          totalChapters,
          startChapter,
          endChapter,
          allChapters.map((ch) => ({
            chapterNumber: ch.chapterNumber,
            title: ch.title,
            content: ch.content,
          })),
          storyTitle || undefined,
        )

        if (!storyTitle && batch.storyTitle) {
          storyTitle = batch.storyTitle
          // Atualizar título da série
          const updatedSeries = await apiClient.put<{ story: StorySeries }>(
            `/stories/${series.id}`,
            { title: storyTitle },
          )
          series = updatedSeries.story
        }

        // Salvar capítulos do lote
        for (const chapterData of batch.chapters) {
          await apiClient.post('/chapters', {
            storyId: series.id,
            chapterNumber: chapterData.chapterNumber,
            title: chapterData.title,
            content: chapterData.content,
            requiredAlignerNumber: chapterData.requiredAlignerNumber,
            isUnlocked: chapterData.requiredAlignerNumber === 1,
            isRead: false,
          })
          allChapters.push({
            chapterNumber: chapterData.chapterNumber,
            title: chapterData.title,
            content: chapterData.content,
          })

          const progress = 5 + (allChapters.length / totalChapters) * 85
          onProgress?.(
            `📖 Capítulo ${chapterData.chapterNumber}/${totalChapters} salvo...`,
            progress,
          )
        }
      }

      // Finalizar série
      await apiClient.put(`/stories/${series.id}`, {
        isComplete: true,
        generationCompletedAt: new Date().toISOString(),
        title: storyTitle || series.title,
      })

      onProgress?.('✅ História criada com sucesso!', 100)

      const endTime = Date.now()
      console.log(`⏱️  Geração em lotes concluída em ${Math.round((endTime - startTime) / 1000)}s`)

      return series
    } catch (error) {
      console.error('❌ Erro ao criar história:', error)
      throw error
    }
  }

  /**
   * Marcar capítulo como lido
   */
  static async markChapterAsRead(chapterId: string): Promise<void> {
    try {
      await apiClient.post(`/chapters/${chapterId}/read`, {})
      console.log('✅ Capítulo marcado como lido')
    } catch (error) {
      console.error('Erro ao marcar capítulo como lido:', error)
      throw error
    }
  }

  /**
   * Gerar áudio para capítulo (se ainda não existe)
   */
  static async generateChapterAudio(chapterId: string): Promise<string | null> {
    try {
      const chapter = await this.getChapter(chapterId)
      if (!chapter) {
        throw new Error('Capítulo não encontrado')
      }

      // Se já tem áudio, retornar
      if (chapter.audioUrl) {
        return chapter.audioUrl
      }

      // Gerar áudio
      console.log('🎵 Gerando áudio para capítulo...')
      const audioUrl = await OpenAITTSService.generateSpeech(chapter.content)

      // Atualizar capítulo com URL do áudio
      await apiClient.put(`/chapters/${chapterId}`, {
        audioUrl,
      })

      console.log('✅ Áudio gerado e salvo')
      return audioUrl
    } catch (error) {
      console.error('Erro ao gerar áudio:', error)
      return null
    }
  }
}
