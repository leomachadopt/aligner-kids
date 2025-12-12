/**
 * Story Generation Service (Backend)
 * Usa OpenAI API de forma segura no servidor
 */

import OpenAI from 'openai'

const MODEL = 'gpt-4o-mini'
const MAX_TOKENS = 12000
const TEMPERATURE = 0.8

// Inicializar OpenAI Client
let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY não configurada nas variáveis de ambiente do servidor')
    }

    openaiClient = new OpenAI({ apiKey })
  }

  return openaiClient
}

interface StoryPreferences {
  environment: string
  mainCharacter: string
  mainCharacterName?: string
  sidekick?: string
  theme: string
  ageGroup: number
}

interface ChapterData {
  chapterNumber: number
  requiredAlignerNumber: number
  title: string
  content: string
  wordCount: number
}

interface GenerationResult {
  storyTitle: string
  chapters: ChapterData[]
}

export class StoryGenerationService {
  /**
   * Gera um lote de capítulos
   */
  static async generateChapterBatch(
    preferences: StoryPreferences,
    totalChapters: number,
    startChapter: number,
    endChapter: number,
    previousChapters: Array<Pick<ChapterData, 'chapterNumber' | 'title' | 'content'>> = [],
    existingTitle?: string
  ): Promise<GenerationResult> {
    const client = getOpenAIClient()

    const systemPrompt = this.buildSystemPrompt(preferences)
    const userPrompt = this.buildBatchUserPrompt(
      preferences,
      totalChapters,
      startChapter,
      endChapter,
      previousChapters,
      existingTitle
    )

    console.log(`📝 Gerando capítulos ${startChapter}-${endChapter} de ${totalChapters}`)

    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      presence_penalty: 0.6,
      frequency_penalty: 0.3,
    })

    const content = response.choices[0]?.message?.content || ''

    if (!content) {
      throw new Error('OpenAI retornou conteúdo vazio')
    }

    const parsed = this.parseStoryResponse(content, endChapter - startChapter + 1)

    // Filtrar apenas o intervalo solicitado
    const filteredChapters = parsed.chapters.filter(
      (ch) => ch.chapterNumber >= startChapter && ch.chapterNumber <= endChapter
    )

    return {
      storyTitle: parsed.storyTitle,
      chapters: filteredChapters,
    }
  }

  /**
   * Constrói o system prompt
   */
  private static buildSystemPrompt(preferences: StoryPreferences): string {
    const ageRange = this.getAgeRange(preferences.ageGroup)
    const ageInstructions = this.getAgeInstructions(ageRange)

    return `Você é um contador de histórias infantis especializado em criar narrativas envolventes e educativas.

IMPORTANTE:
- Crie histórias apropriadas para idade ${preferences.ageGroup} anos (${ageRange})
- ${ageInstructions}
- Inclua mensagens educativas sobre saúde bucal e cuidados com alinhador/dentes
- Cada capítulo deve ter entre 300-500 palavras
- Use diálogos para tornar dinâmica
- Descrições sensoriais (cores, sons, sensações)
- Tom: Aventureiro, divertido, educativo e inspirador
- Cada capítulo deve ter GANCHO no final (exceto o último)`
  }

  /**
   * Constrói o user prompt para lote
   */
  private static buildBatchUserPrompt(
    preferences: StoryPreferences,
    totalChapters: number,
    startChapter: number,
    endChapter: number,
    previousChapters: Array<Pick<ChapterData, 'chapterNumber' | 'title' | 'content'>>,
    existingTitle?: string
  ): string {
    const previousSummary = previousChapters.length > 0
      ? previousChapters
          .slice(-3)
          .map((ch) => `Capítulo ${ch.chapterNumber} - ${ch.title}: ${this.truncate(ch.content, 60)}`)
          .join('\n')
      : 'Nenhum capítulo anterior; este é o início da história.'

    const titleInstruction = existingTitle
      ? `Título da história (mantenha exatamente): ${existingTitle}`
      : 'Defina um título único para a história e mantenha o mesmo nos próximos lotes.'

    return `Você está ${previousChapters.length > 0 ? 'continuando' : 'iniciando'} uma história infantil de ${totalChapters} capítulos.

${titleInstruction}

Capítulos anteriores:
${previousSummary}

Agora escreva os capítulos ${startChapter} até ${endChapter}.

CONFIGURAÇÕES:
- Ambiente: ${preferences.environment}
- Personagem: ${preferences.mainCharacterName || preferences.mainCharacter}
- Ajudante: ${preferences.sidekick || 'amigo especial'}
- Tema: ${preferences.theme}

Regras:
- Cada capítulo: 300-500 palavras
- Tom: aventureiro, divertido, educativo
- Mensagens sutis de saúde bucal
- Cada capítulo termina com gancho, exceto o capítulo ${totalChapters}
- Use diálogos e descrições sensoriais

FORMATO DE SAÍDA (OBRIGATÓRIO):
=== CAPÍTULO X: [Título] ===
[Conteúdo 300-500 palavras]

Gere os capítulos ${startChapter} até ${endChapter}.`
  }

  /**
   * Parse da resposta da OpenAI
   */
  private static parseStoryResponse(content: string, expectedChapters: number): GenerationResult {
    console.log('🔍 Parsing resposta da IA...')
    console.log('📄 Primeiros 500 chars:', content.substring(0, 500))

    // Extrair título (opcional)
    const titleMatch = content.match(/===\s*TÍTULO DA HISTÓRIA:\s*(.+?)\s*===/i)
    const storyTitle = titleMatch ? titleMatch[1].trim() : 'História Mágica'

    // Extrair capítulos com regex mais tolerante
    const chapters: ChapterData[] = []

    // Tentar com delimitadores ===
    const regexStrict = /===\s*CAPÍTULO\s+(\d+):\s*(.+?)\s*===\s*\n([\s\S]+?)(?====\s*CAPÍTULO|$)/gi
    let match

    while ((match = regexStrict.exec(content)) !== null) {
      const chapterNumber = parseInt(match[1])
      const title = match[2].trim()
      const chapterContent = match[3].trim()
      const wordCount = chapterContent.split(/\s+/).length

      chapters.push({
        chapterNumber,
        requiredAlignerNumber: chapterNumber,
        title,
        content: chapterContent,
        wordCount,
      })
    }

    // Fallback: tentar sem os ===
    if (chapters.length === 0) {
      console.log('⚠️  Primeira regex falhou, tentando fallback...')
      const regexFallback = /CAPÍTULO\s+(\d+):\s*(.+?)\n([\s\S]+?)(?=CAPÍTULO\s+\d+:|$)/gi

      while ((match = regexFallback.exec(content)) !== null) {
        const chapterNumber = parseInt(match[1])
        const title = match[2].trim()
        const chapterContent = match[3].trim()
        const wordCount = chapterContent.split(/\s+/).length

        chapters.push({
          chapterNumber,
          requiredAlignerNumber: chapterNumber,
          title,
          content: chapterContent,
          wordCount,
        })
      }
    }

    if (chapters.length === 0) {
      console.error('❌ Nenhum capítulo encontrado!')
      console.error('📄 Conteúdo completo:', content)
      throw new Error('Nenhum capítulo encontrado na resposta da IA')
    }

    console.log(`✅ ${chapters.length} capítulos parseados`)
    chapters.sort((a, b) => a.chapterNumber - b.chapterNumber)

    return { storyTitle, chapters }
  }

  /**
   * Utilitários
   */
  private static getAgeRange(age: number): string {
    if (age >= 3 && age <= 5) return '3-5'
    if (age >= 6 && age <= 8) return '6-8'
    return '9-12'
  }

  private static getAgeInstructions(ageRange: string): string {
    const map: Record<string, string> = {
      '3-5': 'Use linguagem MUITO SIMPLES, frases curtas (5-8 palavras)',
      '6-8': 'Use linguagem CLARA, frases médias (8-12 palavras)',
      '9-12': 'Use linguagem mais RICA, frases complexas quando apropriado',
    }
    return map[ageRange] || map['6-8']
  }

  private static truncate(text: string, maxWords: number): string {
    const words = text.trim().split(/\s+/)
    return words.length <= maxWords ? text : `${words.slice(0, maxWords).join(' ')}...`
  }
}
