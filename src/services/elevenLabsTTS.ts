/**
 * Serviço de Text-to-Speech com ElevenLabs
 * Converte texto de capítulos em áudio narrado
 */

import { ElevenLabsClient } from 'elevenlabs'

// ============================================
// CONFIGURAÇÃO
// ============================================

const elevenLabs = new ElevenLabsClient({
  apiKey: import.meta.env.VITE_ELEVENLABS_API_KEY,
})

// Vozes disponíveis (IDs podem mudar - verificar no dashboard)
const VOICE_IDS = {
  // Vozes em português brasileiro
  'pt-BR-female-1': 'Bella', // Feminina, calorosa
  'pt-BR-female-2': 'Rachel', // Feminina, jovem
  'pt-BR-male-1': 'Adam', // Masculina, narrativa
}

// Voz padrão para histórias infantis
const DEFAULT_VOICE = 'Bella' // Calorosa e amigável

// Configurações de voz
const DEFAULT_VOICE_SETTINGS = {
  stability: 0.75, // 0-1, quanto mais alto mais estável
  similarity_boost: 0.85, // 0-1, quanto mais alto mais similar à voz original
  style: 0.5, // 0-1, exagero de estilo
  use_speaker_boost: true, // Melhora clareza
}

// ============================================
// TIPOS
// ============================================

interface TTSOptions {
  voiceId?: string
  modelId?: string
  voiceSettings?: typeof DEFAULT_VOICE_SETTINGS
}

interface TTSResult {
  audioData: Buffer
  durationSeconds?: number
  charactersUsed: number
}

// ============================================
// CLASSE PRINCIPAL
// ============================================

export class ElevenLabsTTSService {
  /**
   * Converte texto em áudio
   */
  static async textToSpeech(
    text: string,
    options: TTSOptions = {},
  ): Promise<TTSResult> {
    try {
      const voiceId = options.voiceId || DEFAULT_VOICE
      const modelId = options.modelId || 'eleven_multilingual_v2' // Suporte a PT-BR
      const voiceSettings = options.voiceSettings || DEFAULT_VOICE_SETTINGS

      console.log('🎙️ Gerando áudio com ElevenLabs...', {
        voice: voiceId,
        model: modelId,
        textLength: text.length,
      })

      const startTime = Date.now()

      // Fazer requisição para ElevenLabs
      const audio = await elevenLabs.textToSpeech.convert(voiceId, {
        text: text,
        model_id: modelId,
        voice_settings: voiceSettings,
      })

      // Converter stream para buffer
      const chunks: Uint8Array[] = []
      for await (const chunk of audio) {
        chunks.push(chunk)
      }

      const audioBuffer = Buffer.concat(chunks)
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
    return !!import.meta.env.VITE_ELEVENLABS_API_KEY
  }

  /**
   * Lista vozes disponíveis (para debug/admin)
   */
  static async listAvailableVoices() {
    try {
      const voices = await elevenLabs.voices.getAll()
      return voices.voices.map((voice) => ({
        id: voice.voice_id,
        name: voice.name,
        category: voice.category,
        labels: voice.labels,
      }))
    } catch (error) {
      console.error('Erro ao listar vozes:', error)
      return []
    }
  }

  /**
   * Calcula custo aproximado
   * ElevenLabs Creator+: $22/mês para 100k caracteres
   */
  static calculateCost(charactersUsed: number): number {
    const costPer100kChars = 22
    return (charactersUsed / 100000) * costPer100kChars
  }
}

// ============================================
// EXPORTAÇÕES
// ============================================

export default ElevenLabsTTSService

// Exemplo de uso:
// const audio = await ElevenLabsTTSService.textToSpeech("Olá, mundo!")
// const blobUrl = ElevenLabsTTSService.createAudioBlobUrl(audio.audioData)
