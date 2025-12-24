/**
 * OpenAI TTS Service (Backend)
 * Gera áudio de capítulos usando OpenAI Text-to-Speech
 */

import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

const MODEL = 'tts-1' // ou 'tts-1-hd' para maior qualidade
const VOICE = 'nova' // Feminina, jovem, calorosa (ideal para histórias infantis)

// Cliente OpenAI
let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY não configurada')
    }

    openaiClient = new OpenAI({ apiKey })
  }

  return openaiClient
}

interface TTSOptions {
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  model?: 'tts-1' | 'tts-1-hd'
  language?: string // ISO language code (pt-BR, pt-PT, en-US, etc.)
}

interface TTSResult {
  audioPath: string
  audioUrl: string
  sizeBytes: number
  durationSeconds: number
}

export class OpenAITTSService {
  /**
   * Gera áudio a partir de texto
   */
  static async generateSpeech(
    text: string,
    options: TTSOptions = {},
  ): Promise<TTSResult> {
    const client = getOpenAIClient()
    const voice = options.voice || VOICE
    const model = options.model || MODEL
    const language = options.language || 'pt-BR'

    console.log(`🎙️  Gerando áudio com OpenAI TTS...`)
    console.log(`   Voz: ${voice}`)
    console.log(`   Modelo: ${model}`)
    console.log(`   Idioma desejado: ${language}`)

    if (language === 'pt-PT') {
      console.warn('⚠️  LIMITAÇÃO: OpenAI TTS não distingue pt-PT de pt-BR no sotaque.')
      console.warn('   O áudio pode soar como português brasileiro.')
      console.warn('   Para pt-PT nativo, considere Azure TTS ou Google Cloud TTS.')
    }

    try {
      // Gerar áudio
      const response = await client.audio.speech.create({
        model,
        voice,
        input: text,
        response_format: 'mp3',
      })

      // Converter stream para buffer
      const buffer = Buffer.from(await response.arrayBuffer())

      // Salvar em arquivo
      const audioFileName = `audio-${Date.now()}.mp3`
      const audioDir = path.join(process.cwd(), 'public', 'audio')

      // Criar diretório se não existir
      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true })
      }

      const audioPath = path.join(audioDir, audioFileName)
      fs.writeFileSync(audioPath, buffer)

      // URL pública do áudio
      const audioUrl = `/audio/${audioFileName}`

      // Estimar duração (aproximado: 150 palavras por minuto)
      const words = text.trim().split(/\s+/).length
      const estimatedMinutes = words / 150
      const durationSeconds = Math.ceil(estimatedMinutes * 60)

      console.log(`✅ Áudio gerado: ${audioFileName} (${(buffer.length / 1024).toFixed(2)} KB)`)

      return {
        audioPath,
        audioUrl,
        sizeBytes: buffer.length,
        durationSeconds,
      }
    } catch (error) {
      console.error('❌ Erro ao gerar áudio:', error)
      throw new Error(
        `Erro ao gerar áudio: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
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
   * Calcula custo aproximado
   * TTS-1: $15 por 1M caracteres
   * TTS-1-HD: $30 por 1M caracteres
   */
  static calculateCost(charactersUsed: number, model: 'tts-1' | 'tts-1-hd' = 'tts-1'): number {
    const costPer1MChars = model === 'tts-1-hd' ? 30 : 15
    return (charactersUsed / 1000000) * costPer1MChars
  }
}
