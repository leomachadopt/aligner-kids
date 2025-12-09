/**
 * Configuração de Opções para o Story Director
 * Todas as opções disponíveis para personalização de histórias
 */

import type {
  StoryOptions,
  StoryOption,
  StoryEnvironment,
  StoryCharacter,
  StoryTheme,
} from '@/types/story'

// ============================================
// AMBIENTES
// ============================================

export const STORY_ENVIRONMENTS: StoryOption<StoryEnvironment>[] = [
  {
    id: 'floresta',
    name: 'Floresta Mágica',
    icon: '🌳',
    color: 'bg-green-500',
    description: 'Uma floresta encantada cheia de árvores gigantes e criaturas místicas',
  },
  {
    id: 'espaco',
    name: 'Espaço Sideral',
    icon: '🚀',
    color: 'bg-blue-600',
    description: 'Aventuras entre planetas, estrelas e galáxias distantes',
  },
  {
    id: 'castelo',
    name: 'Reino Encantado',
    icon: '🏰',
    color: 'bg-purple-500',
    description: 'Um reino medieval com castelos, dragões e muita magia',
  },
  {
    id: 'oceano',
    name: 'Fundo do Mar',
    icon: '🌊',
    color: 'bg-cyan-500',
    description: 'Explore as profundezas do oceano com sereias e tesouros',
  },
  {
    id: 'selva',
    name: 'Selva Aventureira',
    icon: '🦁',
    color: 'bg-orange-500',
    description: 'Uma selva tropical cheia de animais exóticos e mistérios',
  },
  {
    id: 'montanha',
    name: 'Montanhas Geladas',
    icon: '⛰️',
    color: 'bg-slate-400',
    description: 'Montanhas cobertas de neve com cavernas secretas',
  },
  {
    id: 'deserto',
    name: 'Deserto Misterioso',
    icon: '🏜️',
    color: 'bg-yellow-600',
    description: 'Um deserto com oásis escondidos e antigos segredos',
  },
  {
    id: 'cidade-magica',
    name: 'Cidade Mágica',
    icon: '✨',
    color: 'bg-pink-500',
    description: 'Uma cidade moderna onde a magia e tecnologia se encontram',
  },
]

// ============================================
// PERSONAGENS
// ============================================

export const STORY_CHARACTERS: StoryOption<StoryCharacter>[] = [
  {
    id: 'dragao',
    name: 'Dragão Amigável',
    icon: '🐉',
    color: 'bg-red-500',
    description: 'Um dragão gentil que adora fazer novos amigos',
  },
  {
    id: 'unicornio',
    name: 'Unicórnio Mágico',
    icon: '🦄',
    color: 'bg-pink-400',
    description: 'Um unicórnio com poderes mágicos especiais',
  },
  {
    id: 'robot',
    name: 'Robô Esperto',
    icon: '🤖',
    color: 'bg-gray-500',
    description: 'Um robô inteligente com muitas invenções legais',
  },
  {
    id: 'fada',
    name: 'Fada Aventureira',
    icon: '🧚',
    color: 'bg-purple-400',
    description: 'Uma fada corajosa que adora explorar',
  },
  {
    id: 'super-heroi',
    name: 'Super-Herói',
    icon: '🦸',
    color: 'bg-blue-500',
    description: 'Um herói com super poderes incríveis',
  },
  {
    id: 'princesa',
    name: 'Princesa Guerreira',
    icon: '👸',
    color: 'bg-pink-500',
    description: 'Uma princesa forte que sabe lutar e liderar',
  },
  {
    id: 'cavaleiro',
    name: 'Cavaleiro Valente',
    icon: '⚔️',
    color: 'bg-slate-600',
    description: 'Um cavaleiro nobre e corajoso',
  },
  {
    id: 'astronauta',
    name: 'Astronauta Explorador',
    icon: '👨‍🚀',
    color: 'bg-indigo-500',
    description: 'Um astronauta que explora novos planetas',
  },
  {
    id: 'pirata',
    name: 'Pirata Aventureiro',
    icon: '🏴‍☠️',
    color: 'bg-amber-700',
    description: 'Um pirata do bem que busca tesouros perdidos',
  },
  {
    id: 'mago',
    name: 'Mago Sábio',
    icon: '🧙',
    color: 'bg-violet-600',
    description: 'Um mago com poderes mágicos extraordinários',
  },
]

// ============================================
// TEMAS
// ============================================

export const STORY_THEMES: StoryOption<StoryTheme>[] = [
  {
    id: 'aventura',
    name: 'Grande Aventura',
    icon: '⚔️',
    color: 'bg-orange-500',
    description: 'Uma jornada emocionante cheia de desafios',
  },
  {
    id: 'misterio',
    name: 'Mistério Emocionante',
    icon: '🔍',
    color: 'bg-slate-600',
    description: 'Um mistério intrigante para ser resolvido',
  },
  {
    id: 'amizade',
    name: 'Poder da Amizade',
    icon: '❤️',
    color: 'bg-red-400',
    description: 'Uma história sobre fazer amigos e trabalhar em equipe',
  },
  {
    id: 'coragem',
    name: 'Jornada Corajosa',
    icon: '💪',
    color: 'bg-amber-600',
    description: 'Uma história sobre enfrentar medos e ser corajoso',
  },
  {
    id: 'descoberta',
    name: 'Grande Descoberta',
    icon: '🔬',
    color: 'bg-green-500',
    description: 'Descubra novos lugares e coisas incríveis',
  },
  {
    id: 'magia',
    name: 'Mundo Mágico',
    icon: '✨',
    color: 'bg-purple-500',
    description: 'Uma aventura repleta de magia e encantamento',
  },
  {
    id: 'resgate',
    name: 'Missão de Resgate',
    icon: '🚨',
    color: 'bg-blue-600',
    description: 'Uma missão heroica para salvar alguém especial',
  },
]

// ============================================
// EXPORTAÇÃO CONSOLIDADA
// ============================================

export const STORY_OPTIONS: StoryOptions = {
  environments: STORY_ENVIRONMENTS,
  characters: STORY_CHARACTERS,
  themes: STORY_THEMES,
}

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

/**
 * Busca uma opção de ambiente por ID
 */
export function getEnvironmentOption(id: StoryEnvironment) {
  return STORY_ENVIRONMENTS.find((env) => env.id === id)
}

/**
 * Busca uma opção de personagem por ID
 */
export function getCharacterOption(id: StoryCharacter) {
  return STORY_CHARACTERS.find((char) => char.id === id)
}

/**
 * Busca uma opção de tema por ID
 */
export function getThemeOption(id: StoryTheme) {
  return STORY_THEMES.find((theme) => theme.id === id)
}

/**
 * Retorna todas as opções disponíveis
 */
export function getAllOptions() {
  return {
    environments: STORY_ENVIRONMENTS,
    characters: STORY_CHARACTERS,
    themes: STORY_THEMES,
  }
}

/**
 * Valida se uma combinação de opções é válida
 */
export function validateStoryOptions(
  environment?: StoryEnvironment,
  character?: StoryCharacter,
  theme?: StoryTheme,
): boolean {
  if (!environment || !character || !theme) return false

  const hasEnvironment = STORY_ENVIRONMENTS.some((e) => e.id === environment)
  const hasCharacter = STORY_CHARACTERS.some((c) => c.id === character)
  const hasTheme = STORY_THEMES.some((t) => t.id === theme)

  return hasEnvironment && hasCharacter && hasTheme
}

// ============================================
// MENSAGENS DE LOADING
// ============================================

export const GENERATION_MESSAGES = [
  '✨ Preparando a magia...',
  '🎨 Criando personagens incríveis...',
  '🌟 Construindo seu mundo de aventuras...',
  '📖 Escrevendo sua história especial...',
  '🎭 Adicionando emoção e diversão...',
  '🚀 Quase lá! Só mais um pouquinho...',
  '🎪 Finalizando os últimos detalhes...',
]

/**
 * Retorna uma mensagem aleatória de loading
 */
export function getRandomGenerationMessage(): string {
  return GENERATION_MESSAGES[Math.floor(Math.random() * GENERATION_MESSAGES.length)]
}
