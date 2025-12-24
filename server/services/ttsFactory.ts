/**
 * TTS Factory - Escolhe o serviço de TTS adequado baseado no idioma
 */

import { OpenAITTSService } from './openaiTTS'
import { AzureTTSService } from './azureTTS'

interface TTSResult {
  audioPath: string
  audioUrl: string
  sizeBytes: number
  durationSeconds: number
}

export class TTSFactory {
  /**
   * Gera áudio usando o serviço apropriado para o idioma
   */
  static async generateChapterAudio(
    chapterTitle: string,
    chapterContent: string,
    language: string = 'pt-BR',
  ): Promise<TTSResult> {
    console.log(`🎯 TTSFactory: Selecionando serviço para idioma ${language}`)

    // Estratégia de seleção de serviço:
    // - pt-PT → Azure TTS (sotaque europeu correto)
    // - pt-BR → OpenAI TTS (custo menor, qualidade ótima)
    // - en-US → OpenAI TTS (qualidade excelente)
    // - es-ES → Azure TTS (vozes nativas)
    // - outros → OpenAI TTS (fallback)

    if (language === 'pt-PT') {
      // Usar Azure para português europeu
      if (AzureTTSService.isConfigured()) {
        console.log('✅ Usando Azure TTS para pt-PT (sotaque europeu)')
        return AzureTTSService.generateChapterAudio(
          chapterTitle,
          chapterContent,
          language
        )
      } else {
        console.warn('⚠️  Azure TTS não configurado. Usando OpenAI como fallback.')
        console.warn('   ATENÇÃO: Áudio terá sotaque brasileiro!')
        return OpenAITTSService.generateChapterAudio(
          chapterTitle,
          chapterContent,
          language
        )
      }
    } else if (language === 'es-ES') {
      // Usar Azure para espanhol europeu (se disponível)
      if (AzureTTSService.isConfigured()) {
        console.log('✅ Usando Azure TTS para es-ES (sotaque europeu)')
        return AzureTTSService.generateChapterAudio(
          chapterTitle,
          chapterContent,
          language
        )
      } else {
        console.log('ℹ️  Azure não configurado. Usando OpenAI para es-ES.')
        return OpenAITTSService.generateChapterAudio(
          chapterTitle,
          chapterContent,
          language
        )
      }
    } else {
      // Usar OpenAI para todos os outros idiomas (pt-BR, en-US, etc.)
      console.log(`✅ Usando OpenAI TTS para ${language}`)
      return OpenAITTSService.generateChapterAudio(
        chapterTitle,
        chapterContent,
        language
      )
    }
  }

  /**
   * Calcula custo estimado baseado no idioma e comprimento
   */
  static estimateCost(text: string, language: string): number {
    const charactersUsed = text.length

    if (language === 'pt-PT' || language === 'es-ES') {
      // Azure TTS: $16 por 1M caracteres
      return AzureTTSService.calculateCost(charactersUsed)
    } else {
      // OpenAI TTS: $15 por 1M caracteres
      return OpenAITTSService.calculateCost(charactersUsed)
    }
  }

  /**
   * Retorna informações sobre qual serviço será usado para um idioma
   */
  static getServiceInfo(language: string): {
    service: 'Azure TTS' | 'OpenAI TTS'
    reason: string
    costPer1MChars: number
  } {
    if (language === 'pt-PT') {
      if (AzureTTSService.isConfigured()) {
        return {
          service: 'Azure TTS',
          reason: 'Sotaque português europeu nativo',
          costPer1MChars: 16,
        }
      } else {
        return {
          service: 'OpenAI TTS',
          reason: 'Azure não configurado (fallback)',
          costPer1MChars: 15,
        }
      }
    } else if (language === 'es-ES') {
      if (AzureTTSService.isConfigured()) {
        return {
          service: 'Azure TTS',
          reason: 'Sotaque espanhol europeu nativo',
          costPer1MChars: 16,
        }
      } else {
        return {
          service: 'OpenAI TTS',
          reason: 'Azure não configurado (fallback)',
          costPer1MChars: 15,
        }
      }
    } else {
      return {
        service: 'OpenAI TTS',
        reason: 'Melhor custo-benefício para este idioma',
        costPer1MChars: 15,
      }
    }
  }
}
