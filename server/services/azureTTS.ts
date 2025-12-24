/**
 * Azure Cognitive Services TTS (Text-to-Speech)
 * Usado para idiomas que precisam de sotaque específico (ex: pt-PT)
 */

import * as sdk from 'microsoft-cognitiveservices-speech-sdk'
import fs from 'fs'
import path from 'path'

// Configuração do Azure Speech
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || 'eastus'

// Vozes disponíveis por idioma
const VOICE_MAP: Record<string, string> = {
  'pt-PT': 'pt-PT-FernandaNeural', // Feminina, jovem, calorosa (ideal para histórias infantis)
  'pt-BR': 'pt-BR-FranciscaNeural', // Feminina, calorosa (caso queira usar Azure para pt-BR também)
  'en-US': 'en-US-JennyNeural', // Feminina, amigável
  'es-ES': 'es-ES-ElviraNeural', // Feminina, calorosa
}

interface TTSOptions {
  voice?: string
  language?: string
}

interface TTSResult {
  audioPath: string
  audioUrl: string
  sizeBytes: number
  durationSeconds: number
}

export class AzureTTSService {
  /**
   * Verifica se o Azure Speech está configurado
   */
  static isConfigured(): boolean {
    return !!AZURE_SPEECH_KEY && !!AZURE_SPEECH_REGION
  }

  /**
   * Obtém a voz adequada para o idioma
   */
  private static getVoiceForLanguage(language: string): string {
    return VOICE_MAP[language] || VOICE_MAP['pt-PT']
  }

  /**
   * Gera áudio usando Azure Speech
   */
  static async generateSpeech(
    text: string,
    options: TTSOptions = {},
  ): Promise<TTSResult> {
    if (!this.isConfigured()) {
      throw new Error('Azure Speech não configurado. Verifique AZURE_SPEECH_KEY e AZURE_SPEECH_REGION.')
    }

    const language = options.language || 'pt-PT'
    const voice = options.voice || this.getVoiceForLanguage(language)

    console.log(`🎙️  Gerando áudio com Azure TTS...`)
    console.log(`   Voz: ${voice}`)
    console.log(`   Idioma: ${language}`)
    console.log(`   Região: ${AZURE_SPEECH_REGION}`)

    try {
      // Configurar Azure Speech
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        AZURE_SPEECH_KEY!,
        AZURE_SPEECH_REGION
      )
      speechConfig.speechSynthesisVoiceName = voice

      // Gerar nome do arquivo
      const audioFileName = `audio-azure-${Date.now()}.mp3`
      const audioDir = path.join(process.cwd(), 'public', 'audio')

      // Criar diretório se não existir
      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true })
      }

      const audioPath = path.join(audioDir, audioFileName)

      // Configurar output para arquivo
      const audioConfig = sdk.AudioConfig.fromAudioFileOutput(audioPath)

      // Criar synthesizer
      const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig)

      // Sintetizar áudio (usando Promise para controlar o fluxo)
      const result = await new Promise<sdk.SpeechSynthesisResult>((resolve, reject) => {
        synthesizer.speakTextAsync(
          text,
          (result) => {
            synthesizer.close()
            resolve(result)
          },
          (error) => {
            synthesizer.close()
            reject(error)
          }
        )
      })

      // Verificar resultado
      if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
        // Obter tamanho do arquivo
        const stats = fs.statSync(audioPath)
        const sizeBytes = stats.size

        // Estimar duração (aproximado: 150 palavras por minuto)
        const words = text.trim().split(/\s+/).length
        const estimatedMinutes = words / 150
        const durationSeconds = Math.ceil(estimatedMinutes * 60)

        console.log(`✅ Áudio Azure gerado: ${audioFileName} (${(sizeBytes / 1024).toFixed(2)} KB)`)

        return {
          audioPath,
          audioUrl: `/audio/${audioFileName}`,
          sizeBytes,
          durationSeconds,
        }
      } else {
        throw new Error(`Falha na síntese de áudio: ${result.errorDetails}`)
      }
    } catch (error) {
      console.error('❌ Erro ao gerar áudio com Azure:', error)
      throw new Error(
        `Erro ao gerar áudio com Azure: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      )
    }
  }

  /**
   * Gera áudio para um capítulo completo
   */
  static async generateChapterAudio(
    chapterTitle: string,
    chapterContent: string,
    language?: string,
  ): Promise<TTSResult> {
    // Combinar título e conteúdo
    const fullText = `${chapterTitle}.\n\n${chapterContent}`

    return this.generateSpeech(fullText, { language })
  }

  /**
   * Lista vozes disponíveis
   */
  static listAvailableVoices(): Array<{ language: string; voice: string }> {
    return Object.entries(VOICE_MAP).map(([language, voice]) => ({
      language,
      voice,
    }))
  }

  /**
   * Calcula custo aproximado
   * Azure Neural TTS: $16 por 1M caracteres
   */
  static calculateCost(charactersUsed: number): number {
    const costPer1MChars = 16 // $16 por 1M caracteres
    return (charactersUsed / 1000000) * costPer1MChars
  }
}
