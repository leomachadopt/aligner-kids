/**
 * Serviço de Text-to-Speech com OpenAI
 * Converte texto de capítulos em áudio narrado
 * Substitui ElevenLabs para reduzir custos (94% de economia)
 */

import OpenAI from 'openai'

// ============================================
// CONFIGURAÇÃO
// ============================================

// Cliente OpenAI (inicializado sob demanda)
let openai: OpenAI | null = null

// Função para obter o cliente OpenAI (lazy initialization)
function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY

    if (!apiKey) {
      throw new Error(
        'OpenAI API key não configurada. Configure VITE_OPENAI_API_KEY nas variáveis de ambiente.'
      )
    }

    openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true, // Para desenvolvimento - em produção usar backend
    })
  }

  return openai
}

// Vozes disponíveis da OpenAI (suportam PT-BR)
const VOICE_IDS = {
  'alloy': 'alloy', // Neutra, versátil
  'echo': 'echo', // Masculina, clara
  'fable': 'fable', // Feminina, expressiva
  'onyx': 'onyx', // Masculina, profunda
  'nova': 'nova', // Feminina, jovem
  'shimmer': 'shimmer', // Feminina, suave
}

// Voz padrão para histórias infantis (calorosa e amigável)
const DEFAULT_VOICE: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova'

// Modelo TTS (gpt-4o-mini-tts é o mais barato: $12/1M chars)
const DEFAULT_MODEL: 'tts-1' | 'tts-1-hd' | 'gpt-4o-mini-tts' = 'gpt-4o-mini-tts'

// ============================================
// TIPOS
// ============================================

interface TTSOptions {
  voiceId?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  modelId?: 'tts-1' | 'tts-1-hd' | 'gpt-4o-mini-tts'
}

interface TTSResult {
  audioData: Buffer
  durationSeconds?: number
  charactersUsed: number
}

// ============================================
// CLASSE PRINCIPAL
// ============================================

export class OpenAITTSService {
  /**
   * Converte texto em áudio usando OpenAI TTS
   */
  static async textToSpeech(
    text: string,
    options: TTSOptions = {},
  ): Promise<TTSResult> {
    try {
      const voice = options.voiceId || DEFAULT_VOICE
      const model = options.modelId || DEFAULT_MODEL

      console.log('🎙️ Gerando áudio com OpenAI TTS...', {
        voice,
        model,
        textLength: text.length,
      })

      const startTime = Date.now()

      // Fazer requisição para OpenAI TTS
      const client = getOpenAIClient()
      const response = await client.audio.speech.create({
        model: model,
        voice: voice,
        input: text,
        response_format: 'mp3', // Formato compatível com o sistema atual
      })

      // Converter stream para buffer
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = Buffer.from(arrayBuffer)
      const generationTime = Date.now() - startTime

      console.log('✅ Áudio gerado com sucesso!', {
        duration: `${generationTime}ms`,
        sizeKB: (audioBuffer.length / 1024).toFixed(2),
        characters: text.length,
      })

      return {
        audioData: audioBuffer,
        charactersUsed: text.length,
      }
    } catch (error) {
      console.error('❌ Erro ao gerar áudio:', error)
      throw new Error(
        `Erro ao gerar áudio: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      )
    }
  }

  /**
   * Converte capítulo completo em áudio
   */
  static async convertChapterToAudio(
    chapterTitle: string,
    chapterContent: string,
  ): Promise<TTSResult> {
    // Combinar título e conteúdo
    const fullText = `${chapterTitle}.\n\n${chapterContent}`

    return this.textToSpeech(fullText)
  }

  /**
   * Salva áudio em base64 (para localStorage temporário)
   */
  static audioToBase64(audioBuffer: Buffer): string {
    return audioBuffer.toString('base64')
  }

  /**
   * Converte base64 de volta para áudio
   */
  static base64ToAudio(base64: string): Buffer {
    return Buffer.from(base64, 'base64')
  }

  /**
   * Cria URL de blob para reprodução
   */
  static createAudioBlobUrl(audioBuffer: Buffer): string {
    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' })
    return URL.createObjectURL(blob)
  }

  /**
   * Estima duração do áudio baseado no texto
   * Aproximação: ~150 palavras por minuto de leitura
   */
  static estimateAudioDuration(text: string): number {
    const words = text.trim().split(/\s+/).length
    const estimatedMinutes = words / 150
    return Math.ceil(estimatedMinutes * 60) // segundos
  }

  /**
   * Valida se a API está configurada
   */
  static isConfigured(): boolean {
    return !!import.meta.env.VITE_OPENAI_API_KEY
  }

  /**
   * Lista vozes disponíveis (para debug/admin)
   */
  static listAvailableVoices() {
    return Object.entries(VOICE_IDS).map(([key, value]) => ({
      id: value,
      name: key,
      description: this.getVoiceDescription(value as typeof DEFAULT_VOICE),
    }))
  }

  /**
   * Retorna descrição da voz
   */
  private static getVoiceDescription(
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
  ): string {
    const descriptions = {
      alloy: 'Neutra, versátil, adequada para narrativa',
      echo: 'Masculina, clara, profissional',
      fable: 'Feminina, expressiva, dinâmica',
      onyx: 'Masculina, profunda, narrativa',
      nova: 'Feminina, jovem, calorosa (recomendada para histórias infantis)',
      shimmer: 'Feminina, suave, delicada',
    }
    return descriptions[voice]
  }

  /**
   * Calcula custo aproximado
   * GPT-4o Mini TTS: $12 por 1M caracteres = $0.012 por 1k caracteres
   */
  static calculateCost(charactersUsed: number): number {
    const costPer1MChars = 12 // $12 por 1M caracteres (gpt-4o-mini-tts)
    return (charactersUsed / 1000000) * costPer1MChars
  }
}

// ============================================
// EXPORTAÇÕES
// ============================================

export default OpenAITTSService

// Exemplo de uso:
// const audio = await OpenAITTSService.textToSpeech("Olá, mundo!")
// const blobUrl = OpenAITTSService.createAudioBlobUrl(audio.audioData)








