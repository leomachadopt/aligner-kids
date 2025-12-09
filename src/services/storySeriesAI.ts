/**
 * Serviço de Geração de Histórias em Série (V3)
 * Gera história completa dividida em capítulos (1 alinhador = 1 capítulo)
 */

import OpenAI from 'openai'
import type { StoryPreferencesInput, StoryChapterV3 } from '@/types/story'
import { getAgeRange } from '@/types/story'
import {
  getEnvironmentOption,
  getCharacterOption,
  getThemeOption,
} from '@/config/storyOptions'

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
      dangerouslyAllowBrowser: true, // Para desenvolvimento
    })
  }

  return openai
}

const MODEL = 'gpt-4o-mini'
const MAX_TOKENS = 12000 // Para histórias longas com múltiplos capítulos
const TEMPERATURE = 0.8

// ============================================
// TIPOS
// ============================================

interface ChapterContent {
  chapterNumber: number
  title: string
  content: string
  wordCount: number
}

interface FullStoryResponse {
  storyTitle: string
  chapters: ChapterContent[]
  totalTokens: number
  generationTimeMs: number
}

// ============================================
// CLASSE PRINCIPAL
// ============================================

export class StorySeriesAIService {
  /**
   * Gera história completa dividida em capítulos
   */
  static async generateFullStory(
    preferences: StoryPreferencesInput,
    totalChapters: number,
  ): Promise<FullStoryResponse> {
    const startTime = Date.now()

    try {
      console.log('🤖 Gerando história completa...', {
        totalChapters,
        preferences,
      })

      // Preparar variáveis
      const variables = this.preparePromptVariables(preferences, totalChapters)

      // Construir prompts
      const systemPrompt = this.buildSystemPrompt(variables)
      const userPrompt = this.buildUserPrompt(variables, totalChapters)

      console.log('📝 Enviando requisição para OpenAI...')

      // Fazer requisição
      const client = getOpenAIClient()
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

      const generationTimeMs = Date.now() - startTime
      const content = response.choices[0]?.message?.content || ''

      if (!content) {
        throw new Error('OpenAI retornou conteúdo vazio')
      }

      // Parsear a resposta
      const parsedStory = this.parseFullStory(content, totalChapters)

      console.log('✅ História completa gerada!', {
        chapters: parsedStory.chapters.length,
        totalWords: parsedStory.chapters.reduce((sum, ch) => sum + ch.wordCount, 0),
        generationTimeMs,
        tokensUsed: response.usage?.total_tokens,
      })

      return {
        ...parsedStory,
        totalTokens: response.usage?.total_tokens || 0,
        generationTimeMs,
      }
    } catch (error) {
      console.error('❌ Erro ao gerar história:', error)
      throw new Error(
        `Erro ao gerar história: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      )
    }
  }

  /**
   * Prepara variáveis para interpolação no prompt
   */
  private static preparePromptVariables(
    preferences: StoryPreferencesInput,
    totalChapters: number,
  ) {
    const envOption = getEnvironmentOption(preferences.environment)
    const charOption = getCharacterOption(preferences.mainCharacter)
    const themeOption = getThemeOption(preferences.theme)
    const sidekickOption = preferences.sidekick
      ? getCharacterOption(preferences.sidekick)
      : null
    const ageRange = getAgeRange(preferences.ageGroup)

    return {
      environment: envOption?.name || preferences.environment,
      environmentDescription: envOption?.description || '',
      mainCharacter: charOption?.name || preferences.mainCharacter,
      characterName: preferences.mainCharacterName || charOption?.name || 'Herói',
      sidekick: sidekickOption?.name || 'um amigo especial',
      theme: themeOption?.name || preferences.theme,
      themeDescription: themeOption?.description || '',
      age: preferences.ageGroup,
      ageRange,
      totalChapters,
      ageInstructions: this.getAgeInstructions(ageRange),
    }
  }

  /**
   * Instruções específicas por faixa etária
   */
  private static getAgeInstructions(ageRange: string): string {
    const instructions = {
      '3-5':
        'Use linguagem MUITO SIMPLES, frases curtas (5-8 palavras), repetições, onomatopeias. Conceitos básicos e concretos.',
      '6-8':
        'Use linguagem CLARA, frases médias (8-12 palavras), vocabulário variado mas simples. Introduza conceitos novos com explicação.',
      '9-12':
        'Use linguagem mais RICA, frases complexas quando apropriado, vocabulário expandido, conceitos mais elaborados.',
    }
    return instructions[ageRange as keyof typeof instructions] || instructions['6-8']
  }

  /**
   * Constrói o system prompt
   */
  private static buildSystemPrompt(variables: any): string {
    return `Você é um contador de histórias infantis especializado em criar narrativas envolventes e educativas.

IMPORTANTE:
- Crie histórias apropriadas para idade ${variables.age} anos (${variables.ageRange})
- ${variables.ageInstructions}
- Inclua mensagens educativas sobre saúde bucal e cuidados com alinhador/dentes
- Cada capítulo deve ter entre 300-500 palavras
- Use diálogos para tornar dinâmica
- Descrições sensoriais (cores, sons, sensações)
- Tom: Aventureiro, divertido, educativo e inspirador
- Cada capítulo deve ter GANCHO no final (exceto o último)`
  }

  /**
   * Constrói o user prompt
   */
  private static buildUserPrompt(variables: any, totalChapters: number): string {
    return `Crie uma história COMPLETA dividida em EXATAMENTE ${totalChapters} capítulos.

CONFIGURAÇÕES DA HISTÓRIA:
- **Ambiente**: ${variables.environment} - ${variables.environmentDescription}
- **Personagem Principal**: ${variables.characterName} (${variables.mainCharacter})
- **Ajudante**: ${variables.sidekick}
- **Tema**: ${variables.theme} - ${variables.themeDescription}
- **Idade**: ${variables.age} anos (${variables.ageRange})

ESTRUTURA OBRIGATÓRIA:

Capítulo 1: INÍCIO
- Apresentar mundo, personagem e vida normal
- Palavras: 300-500
- Terminar com gancho

Capítulos 2-${totalChapters - 2}: DESENVOLVIMENTO
- Cada capítulo: um evento/desafio novo
- Progressão clara da aventura
- Incluir aprendizados sobre saúde bucal
- Palavras: 300-500 cada
- Cada um termina com gancho

Capítulo ${totalChapters - 1}: CLÍMAX
- Desafio final e decisivo
- Momento de verdade
- Palavras: 300-500
- Gancho para conclusão

Capítulo ${totalChapters}: FINAL
- Resolução vitoriosa
- Celebração
- Mensagem inspiradora final
- Palavras: 300-500
- Não tem gancho (é o final)

REGRAS:
1. CADA capítulo deve ser independente mas conectado
2. Pode ser lido/ouvido em 2-3 minutos
3. Gancho no final mantém interesse
4. Mensagens sobre cuidados com dentes inseridas naturalmente
5. História coesa do início ao fim

FORMATO DE SAÍDA (USE EXATAMENTE ESTE FORMATO):
=== TÍTULO DA HISTÓRIA: [Título Geral] ===

=== CAPÍTULO 1: [Título] ===
[Conteúdo 300-500 palavras]

=== CAPÍTULO 2: [Título] ===
[Conteúdo 300-500 palavras]

[... continua até capítulo ${totalChapters}]

=== CAPÍTULO ${totalChapters}: [Título] ===
[Conteúdo 300-500 palavras]

IMPORTANTE: Use EXATAMENTE o formato com "===" para eu poder processar.`
  }

  /**
   * Parseia a resposta da IA
   */
  private static parseFullStory(
    content: string,
    expectedChapters: number,
  ): Omit<FullStoryResponse, 'totalTokens' | 'generationTimeMs'> {
    try {
      // Extrair título geral
      const titleMatch = content.match(/===\s*TÍTULO DA HISTÓRIA:\s*(.+?)\s*===/i)
      const storyTitle = titleMatch
        ? titleMatch[1].trim()
        : 'História Sem Título'

      // Extrair capítulos
      const chapterRegex = /===\s*CAPÍTULO\s+(\d+):\s*(.+?)\s*===\n([\s\S]+?)(?====\s*CAPÍTULO|\s*$)/gi
      const chapters: ChapterContent[] = []
      let match

      while ((match = chapterRegex.exec(content)) !== null) {
        const chapterNumber = parseInt(match[1])
        const title = match[2].trim()
        const chapterContent = match[3].trim()
        const wordCount = this.countWords(chapterContent)

        chapters.push({
          chapterNumber,
          title,
          content: chapterContent,
          wordCount,
        })
      }

      // Validar
      if (chapters.length === 0) {
        throw new Error('Nenhum capítulo foi encontrado na resposta')
      }

      if (chapters.length !== expectedChapters) {
        console.warn(
          `⚠️ Esperava ${expectedChapters} capítulos, mas encontrou ${chapters.length}`,
        )
      }

      // Ordenar por número do capítulo
      chapters.sort((a, b) => a.chapterNumber - b.chapterNumber)

      return {
        storyTitle,
        chapters,
      }
    } catch (error) {
      console.error('Erro ao parsear história:', error)
      throw new Error('Não foi possível processar a história gerada')
    }
  }

  /**
   * Conta palavras em um texto
   */
  private static countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
  }

  /**
   * Valida configuração
   */
  static isConfigured(): boolean {
    return !!import.meta.env.VITE_OPENAI_API_KEY
  }
}

export default StorySeriesAIService
