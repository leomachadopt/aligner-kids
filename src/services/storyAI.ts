/**
 * Serviço de Geração de Histórias com OpenAI
 * Responsável por toda comunicação com a API da OpenAI
 */

import OpenAI from 'openai'
import type {
  StoryPreferencesInput,
  GeneratedStory,
  StoryPrompt,
  AgeGroup,
} from '@/types/story'
import { getAgeRange } from '@/types/story'
import {
  getEnvironmentOption,
  getCharacterOption,
  getThemeOption,
} from '@/config/storyOptions'

// ============================================
// CONFIGURAÇÃO DO CLIENTE OPENAI
// ============================================

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Para desenvolvimento - em produção usar backend
})

// ============================================
// CONSTANTES
// ============================================

const DEFAULT_MODEL = 'gpt-4o-mini' // Modelo mais econômico
const DEFAULT_MAX_TOKENS = 1500
const DEFAULT_TEMPERATURE = 0.8

// Prompt padrão do sistema (pode ser substituído por prompt do banco)
const DEFAULT_SYSTEM_PROMPT = `Você é um contador de histórias infantis especializado em criar narrativas envolventes e educativas. Suas histórias devem ser apropriadas para a idade, imaginativas e sempre incluir mensagens positivas sobre cuidados com os dentes e saúde bucal.

Use linguagem simples, vocabulário adequado e estrutura de história clara (início, desenvolvimento, clímax, resolução). Seja criativo, divertido e inspirador!

IMPORTANTE:
- Sempre inclua uma mensagem sobre cuidar dos dentes de forma natural
- Use diálogos para tornar a história dinâmica
- Inclua descrições sensoriais (cores, sons, sensações)
- Finalize com uma mensagem motivadora
- NÃO use formatação markdown além de negrito para o título`

// ============================================
// TIPOS INTERNOS
// ============================================

interface GenerationMetadata {
  tokensUsed: number
  generationTimeMs: number
  modelUsed: string
}

interface PromptVariables {
  environment: string
  environmentDescription: string
  mainCharacter: string
  characterName: string
  sidekick: string
  theme: string
  themeDescription: string
  age: number
  ageRange: AgeGroup
  ageInstructions: string
}

// ============================================
// CLASSE PRINCIPAL
// ============================================

export class StoryAIService {
  /**
   * Gera uma história personalizada baseada nas preferências
   */
  static async generateStory(
    preferences: StoryPreferencesInput,
    customPrompt?: StoryPrompt,
  ): Promise<{
    story: Omit<GeneratedStory, 'id' | 'patientId' | 'createdAt'>
    metadata: GenerationMetadata
  }> {
    const startTime = Date.now()

    try {
      // Preparar variáveis do prompt
      const variables = this.preparePromptVariables(preferences)

      // Construir prompts
      const systemPrompt = customPrompt?.systemPrompt || DEFAULT_SYSTEM_PROMPT
      const userPrompt = customPrompt
        ? this.interpolatePrompt(customPrompt.userPromptTemplate, variables)
        : this.buildDefaultUserPrompt(variables)

      console.log('🤖 Gerando história com OpenAI...', {
        model: DEFAULT_MODEL,
        preferences: preferences,
      })

      // Fazer requisição para OpenAI
      const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        max_tokens: DEFAULT_MAX_TOKENS,
        temperature: DEFAULT_TEMPERATURE,
        presence_penalty: 0.6,
        frequency_penalty: 0.3,
      })

      const generationTimeMs = Date.now() - startTime
      const content = response.choices[0]?.message?.content || ''

      if (!content) {
        throw new Error('OpenAI retornou conteúdo vazio')
      }

      // Parsear resposta
      const { title, storyContent } = this.parseStoryContent(content)
      const wordCount = this.countWords(storyContent)
      const estimatedReadingTime = Math.ceil(wordCount / 150) // ~150 palavras por minuto

      console.log('✅ História gerada com sucesso!', {
        title,
        wordCount,
        estimatedReadingTime,
        generationTimeMs,
      })

      return {
        story: {
          promptId: customPrompt?.id || 'default',
          preferencesSnapshot: preferences,
          title,
          content: storyContent,
          wordCount,
          estimatedReadingTime,
          modelUsed: DEFAULT_MODEL,
          tokensUsed: response.usage?.total_tokens,
          generationTimeMs,
          liked: false,
          readCount: 0,
        },
        metadata: {
          tokensUsed: response.usage?.total_tokens || 0,
          generationTimeMs,
          modelUsed: DEFAULT_MODEL,
        },
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
  ): PromptVariables {
    const envOption = getEnvironmentOption(preferences.environment)
    const charOption = getCharacterOption(preferences.mainCharacter)
    const themeOption = getThemeOption(preferences.theme)
    const ageRange = getAgeRange(preferences.ageGroup)

    const sidekickOption = preferences.sidekick
      ? getCharacterOption(preferences.sidekick)
      : null

    // Instruções específicas por idade
    const ageInstructions = this.getAgeInstructions(ageRange)

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
      ageInstructions,
    }
  }

  /**
   * Retorna instruções específicas por faixa etária
   */
  private static getAgeInstructions(ageRange: AgeGroup): string {
    const instructions = {
      '3-5':
        'Use linguagem MUITO SIMPLES, frases curtas (5-8 palavras), repetições, onomatopeias e conceitos básicos. Evite palavras complexas.',
      '6-8':
        'Use linguagem CLARA, frases médias (8-12 palavras), vocabulário variado mas simples, introduza conceitos novos com explicação.',
      '9-12':
        'Use linguagem mais RICA, frases complexas quando necessário, vocabulário expandido, conceitos mais elaborados e profundos.',
    }
    return instructions[ageRange]
  }

  /**
   * Constrói o prompt do usuário padrão
   */
  private static buildDefaultUserPrompt(variables: PromptVariables): string {
    return `Crie uma história infantil emocionante com as seguintes características:

**CONFIGURAÇÕES:**
- **Ambiente**: ${variables.environment} - ${variables.environmentDescription}
- **Personagem Principal**: ${variables.mainCharacter} (nome: ${variables.characterName})
- **Ajudante/Companheiro**: ${variables.sidekick}
- **Tema da Aventura**: ${variables.theme} - ${variables.themeDescription}
- **Idade da Criança**: ${variables.age} anos (${variables.ageRange})

**INSTRUÇÕES IMPORTANTES:**
1. ${variables.ageInstructions}
2. História deve ter entre 500-800 palavras
3. Inclua NATURALMENTE conceitos sobre cuidado com os dentes (escovação, uso do aparelho, visita ao dentista)
4. Estrutura: início claro → desafio emocionante → resolução → final feliz
5. Use diálogos para tornar dinâmica
6. Inclua descrições sensoriais (cores, sons, cheiros, texturas)
7. Mensagem moral positiva sobre persistência, coragem e cuidado com a saúde

**TOM**: Divertido, aventureiro, educativo e inspirador

**FORMATO**:
**[Título Criativo]**

[Conteúdo da história em parágrafos...]

NÃO use formatação markdown além do título em negrito. Comece agora:`
  }

  /**
   * Interpola variáveis em um template de prompt
   */
  private static interpolatePrompt(
    template: string,
    variables: PromptVariables,
  ): string {
    let result = template

    // Substituir todas as variáveis {{variavel}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      result = result.replace(regex, String(value))
    })

    return result
  }

  /**
   * Parseia o conteúdo retornado pela IA
   */
  private static parseStoryContent(content: string): {
    title: string
    storyContent: string
  } {
    // Limpar conteúdo
    const cleaned = content.trim()

    // Tentar extrair título (primeira linha em negrito ou primeira linha)
    const lines = cleaned.split('\n').filter((line) => line.trim())

    if (lines.length === 0) {
      return { title: 'História Sem Título', storyContent: cleaned }
    }

    // Buscar primeira linha que parece ser título
    let title = lines[0]
      .replace(/^\*\*/, '')
      .replace(/\*\*$/, '')
      .replace(/^#+ /, '')
      .trim()

    // Se o título for muito longo, pegar só a primeira parte
    if (title.length > 100) {
      const firstSentence = title.split(/[.!?]/)[0]
      title = firstSentence || title.slice(0, 100)
    }

    // Conteúdo é o resto
    const storyContent = lines.slice(1).join('\n\n').trim()

    return { title, storyContent }
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
   * Valida se a API key está configurada
   */
  static isConfigured(): boolean {
    return !!import.meta.env.VITE_OPENAI_API_KEY
  }

  /**
   * Testa a conexão com a API
   */
  static async testConnection(): Promise<boolean> {
    try {
      await openai.models.list()
      return true
    } catch {
      return false
    }
  }
}

// ============================================
// EXPORTAÇÕES
// ============================================

export default StoryAIService
