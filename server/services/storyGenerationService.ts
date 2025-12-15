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
  language?: string // ISO language code (pt-BR, en-US, es-ES, etc.)
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
    const ageInstructions = this.getAgeInstructions(ageRange, preferences.language)
    const lang = preferences.language || 'pt-BR'

    const prompts: Record<string, string> = {
      'pt-BR': `Você é um contador de histórias infantis especializado em criar narrativas envolventes e educativas EM PORTUGUÊS BRASILEIRO.

IMPORTANTE:
- Crie histórias apropriadas para idade ${preferences.ageGroup} anos (${ageRange})
- ${ageInstructions}
- Inclua mensagens educativas sobre saúde bucal e cuidados com alinhador/dentes
- Cada capítulo deve ter entre 300-500 palavras
- Use diálogos para tornar dinâmica
- Descrições sensoriais (cores, sons, sensações)
- Tom: Aventureiro, divertido, educativo e inspirador
- Cada capítulo deve ter GANCHO no final (exceto o último)`,

      'pt-PT': `És um contador de histórias infantis especializado em criar narrativas envolventes e educativas EM PORTUGUÊS EUROPEU.

IMPORTANTE:
- Cria histórias apropriadas para idade ${preferences.ageGroup} anos (${ageRange})
- ${ageInstructions}
- Inclui mensagens educativas sobre saúde oral e cuidados com alinhador/dentes
- Cada capítulo deve ter entre 300-500 palavras
- Usa diálogos para tornar dinâmica
- Descrições sensoriais (cores, sons, sensações)
- Tom: Aventureiro, divertido, educativo e inspirador
- Cada capítulo deve ter GANCHO no final (excepto o último)`,

      'en-US': `You are a children's storyteller specialized in creating engaging and educational narratives IN ENGLISH.

IMPORTANT:
- Create stories appropriate for age ${preferences.ageGroup} years (${ageRange})
- ${ageInstructions}
- Include educational messages about oral health and aligner/teeth care
- Each chapter should be 300-500 words
- Use dialogues to make it dynamic
- Sensory descriptions (colors, sounds, sensations)
- Tone: Adventurous, fun, educational and inspiring
- Each chapter must end with a cliffhanger (except the last one)`,

      'es-ES': `Eres un narrador de historias infantiles especializado en crear narrativas atractivas y educativas EN ESPAÑOL.

IMPORTANTE:
- Crea historias apropiadas para edad ${preferences.ageGroup} años (${ageRange})
- ${ageInstructions}
- Incluye mensajes educativos sobre salud bucal y cuidado de alineadores/dientes
- Cada capítulo debe tener entre 300-500 palabras
- Usa diálogos para hacerlo dinámico
- Descripciones sensoriales (colores, sonidos, sensaciones)
- Tono: Aventurero, divertido, educativo e inspirador
- Cada capítulo debe terminar con suspenso (excepto el último)`,
    }

    return prompts[lang] || prompts['pt-BR']
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
    const lang = preferences.language || 'pt-BR'

    const prompts: Record<string, (prev: string, title: string) => string> = {
      'pt-BR': (previousSummary, titleInstruction) => `Você está ${previousChapters.length > 0 ? 'continuando' : 'iniciando'} uma história infantil de ${totalChapters} capítulos.

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

Gere os capítulos ${startChapter} até ${endChapter}.`,

      'pt-PT': (previousSummary, titleInstruction) => `Estás ${previousChapters.length > 0 ? 'a continuar' : 'a iniciar'} uma história infantil de ${totalChapters} capítulos.

${titleInstruction}

Capítulos anteriores:
${previousSummary}

Agora escreve os capítulos ${startChapter} até ${endChapter}.

CONFIGURAÇÕES:
- Ambiente: ${preferences.environment}
- Personagem: ${preferences.mainCharacterName || preferences.mainCharacter}
- Ajudante: ${preferences.sidekick || 'amigo especial'}
- Tema: ${preferences.theme}

Regras:
- Cada capítulo: 300-500 palavras
- Tom: aventureiro, divertido, educativo
- Mensagens subtis de saúde oral
- Cada capítulo termina com gancho, excepto o capítulo ${totalChapters}
- Usa diálogos e descrições sensoriais

FORMATO DE SAÍDA (OBRIGATÓRIO):
=== CAPÍTULO X: [Título] ===
[Conteúdo 300-500 palavras]

Gera os capítulos ${startChapter} até ${endChapter}.`,

      'en-US': (previousSummary, titleInstruction) => `You are ${previousChapters.length > 0 ? 'continuing' : 'starting'} a children's story with ${totalChapters} chapters.

${titleInstruction}

Previous chapters:
${previousSummary}

Now write chapters ${startChapter} through ${endChapter}.

SETTINGS:
- Environment: ${preferences.environment}
- Character: ${preferences.mainCharacterName || preferences.mainCharacter}
- Helper: ${preferences.sidekick || 'special friend'}
- Theme: ${preferences.theme}

Rules:
- Each chapter: 300-500 words
- Tone: adventurous, fun, educational
- Subtle oral health messages
- Each chapter ends with cliffhanger, except chapter ${totalChapters}
- Use dialogues and sensory descriptions

OUTPUT FORMAT (REQUIRED):
=== CHAPTER X: [Title] ===
[Content 300-500 words]

Generate chapters ${startChapter} through ${endChapter}.`,

      'es-ES': (previousSummary, titleInstruction) => `Estás ${previousChapters.length > 0 ? 'continuando' : 'iniciando'} una historia infantil de ${totalChapters} capítulos.

${titleInstruction}

Capítulos anteriores:
${previousSummary}

Ahora escribe los capítulos ${startChapter} hasta ${endChapter}.

CONFIGURACIÓN:
- Ambiente: ${preferences.environment}
- Personaje: ${preferences.mainCharacterName || preferences.mainCharacter}
- Ayudante: ${preferences.sidekick || 'amigo especial'}
- Tema: ${preferences.theme}

Reglas:
- Cada capítulo: 300-500 palabras
- Tono: aventurero, divertido, educativo
- Mensajes sutiles de salud bucal
- Cada capítulo termina con suspenso, excepto el capítulo ${totalChapters}
- Usa diálogos y descripciones sensoriales

FORMATO DE SALIDA (OBLIGATORIO):
=== CAPÍTULO X: [Título] ===
[Contenido 300-500 palabras]

Genera los capítulos ${startChapter} hasta ${endChapter}.`,
    }

    const chapterWord = lang === 'en-US' ? 'Chapter' : 'Capítulo'
    const previousSummary = previousChapters.length > 0
      ? previousChapters
          .slice(-3)
          .map((ch) => `${chapterWord} ${ch.chapterNumber} - ${ch.title}: ${this.truncate(ch.content, 60)}`)
          .join('\n')
      : (lang === 'en-US' ? 'No previous chapters; this is the beginning of the story.' :
         lang === 'pt-PT' ? 'Nenhum capítulo anterior; este é o início da história.' :
         lang === 'es-ES' ? 'No hay capítulos anteriores; este es el inicio de la historia.' :
         'Nenhum capítulo anterior; este é o início da história.')

    const titleInstruction = existingTitle
      ? (lang === 'en-US' ? `Story title (keep exactly): ${existingTitle}` :
         lang === 'pt-PT' ? `Título da história (mantém exatamente): ${existingTitle}` :
         lang === 'es-ES' ? `Título de la historia (mantener exactamente): ${existingTitle}` :
         `Título da história (mantenha exatamente): ${existingTitle}`)
      : (lang === 'en-US' ? 'Define a unique title for the story and keep it the same in the next batches.' :
         lang === 'pt-PT' ? 'Define um título único para a história e mantém o mesmo nos próximos lotes.' :
         lang === 'es-ES' ? 'Define un título único para la historia y mantén el mismo en los próximos lotes.' :
         'Defina um título único para a história e mantenha o mesmo nos próximos lotes.')

    const promptBuilder = prompts[lang] || prompts['pt-BR']
    return promptBuilder(previousSummary, titleInstruction)
  }

  /**
   * Parse da resposta da OpenAI
   */
  private static parseStoryResponse(content: string, expectedChapters: number): GenerationResult {
    console.log('🔍 Parsing resposta da IA...')
    console.log('📄 Primeiros 500 chars:', content.substring(0, 500))

    // Extrair título (opcional) - suporta múltiplos idiomas
    const titleMatch = content.match(/===\s*(TÍTULO DA HISTÓRIA|STORY TITLE|TÍTULO DE LA HISTORIA):\s*(.+?)\s*===/i)
    const storyTitle = titleMatch ? titleMatch[2].trim() : 'História Mágica'

    // Extrair capítulos com regex mais tolerante - suporta múltiplos idiomas
    const chapters: ChapterData[] = []

    // Tentar com delimitadores === (suporta CAPÍTULO, CHAPTER, CAPÍTULO em espanhol)
    const regexStrict = /===\s*(CAPÍTULO|CHAPTER)\s+(\d+):\s*(.+?)\s*===\s*\n([\s\S]+?)(?====\s*(CAPÍTULO|CHAPTER)|$)/gi
    let match

    while ((match = regexStrict.exec(content)) !== null) {
      const chapterNumber = parseInt(match[2])
      const title = match[3].trim()
      const chapterContent = match[4].trim()
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
      const regexFallback = /(CAPÍTULO|CHAPTER)\s+(\d+):\s*(.+?)\n([\s\S]+?)(?=(CAPÍTULO|CHAPTER)\s+\d+:|$)/gi

      while ((match = regexFallback.exec(content)) !== null) {
        const chapterNumber = parseInt(match[2])
        const title = match[3].trim()
        const chapterContent = match[4].trim()
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

  private static getAgeInstructions(ageRange: string, language?: string): string {
    const lang = language || 'pt-BR'

    const instructions: Record<string, Record<string, string>> = {
      'pt-BR': {
        '3-5': 'Use linguagem MUITO SIMPLES, frases curtas (5-8 palavras)',
        '6-8': 'Use linguagem CLARA, frases médias (8-12 palavras)',
        '9-12': 'Use linguagem mais RICA, frases complexas quando apropriado',
      },
      'pt-PT': {
        '3-5': 'Usa linguagem MUITO SIMPLES, frases curtas (5-8 palavras)',
        '6-8': 'Usa linguagem CLARA, frases médias (8-12 palavras)',
        '9-12': 'Usa linguagem mais RICA, frases complexas quando apropriado',
      },
      'en-US': {
        '3-5': 'Use VERY SIMPLE language, short sentences (5-8 words)',
        '6-8': 'Use CLEAR language, medium sentences (8-12 words)',
        '9-12': 'Use more RICH language, complex sentences when appropriate',
      },
      'es-ES': {
        '3-5': 'Usa lenguaje MUY SIMPLE, frases cortas (5-8 palabras)',
        '6-8': 'Usa lenguaje CLARO, frases medianas (8-12 palabras)',
        '9-12': 'Usa lenguaje más RICO, frases complejas cuando sea apropiado',
      },
    }

    const langMap = instructions[lang] || instructions['pt-BR']
    return langMap[ageRange] || langMap['6-8']
  }

  private static truncate(text: string, maxWords: number): string {
    const words = text.trim().split(/\s+/)
    return words.length <= maxWords ? text : `${words.slice(0, maxWords).join(' ')}...`
  }
}
