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
  static async getPatientSeries(patientId: string): Promise<StorySeries | null> {
    try {
      const response = await apiClient.get<{ story: StorySeries }>(`/stories/patient/${patientId}`)
      return response.story
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
  ): Promise<void> {
    try {
      await apiClient.post('/stories/preferences', {
        patientId,
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
      await this.savePreferences(patientId, input.preferences)

      // Gerar título e sinopse da série com IA
      onProgress?.('✨ Gerando título e sinopse...', 10)
      const seriesInfo = await StorySeriesAIService.generateSeriesInfo(
        input.preferences,
        input.totalAligners,
      )

      // Criar série no banco
      const seriesResponse = await apiClient.post<{ story: StorySeries }>('/stories', {
        patientId,
        title: seriesInfo.title,
        description: seriesInfo.synopsis,
        totalChapters: input.totalAligners,
      })

      const series = seriesResponse.story

      onProgress?.('📚 Gerando capítulos...', 20)

      // Gerar capítulos
      const chaptersInfo = await StorySeriesAIService.generateChapters(
        seriesInfo,
        input.preferences,
        input.totalAligners,
        (chapterProgress) => {
          const overallProgress = 20 + (chapterProgress / input.totalAligners) * 60
          onProgress?.(`📖 Capítulo ${chapterProgress}/${input.totalAligners}...`, overallProgress)
        },
      )

      // Salvar capítulos no banco
      onProgress?.('💾 Salvando capítulos...', 80)
      for (const chapterInfo of chaptersInfo) {
        await apiClient.post('/chapters', {
          storyId: series.id,
          chapterNumber: chapterInfo.chapterNumber,
          title: chapterInfo.title,
          content: chapterInfo.content,
          requiredAlignerNumber: chapterInfo.requiredAlignerNumber,
          isUnlocked: chapterInfo.requiredAlignerNumber === 1,
          isRead: false,
        })
      }

      // Marcar série como completa
      await apiClient.put(`/stories/${series.id}`, {
        isComplete: true,
        generationCompletedAt: new Date().toISOString(),
      })

      onProgress?.('✅ História criada com sucesso!', 100)

      const endTime = Date.now()
      console.log(`⏱️  Geração concluída em ${Math.round((endTime - startTime) / 1000)}s`)

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
