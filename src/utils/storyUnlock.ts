import type { StoryChapter } from '@/types/aligner'

/**
 * Verifica quais capítulos devem ser desbloqueados baseado no número do alinhador atual
 */
export function getUnlockedChapters(
  chapters: StoryChapter[],
  currentAlignerNumber: number,
): StoryChapter[] {
  return chapters
    .map((chapter) => ({
      ...chapter,
      unlocked: currentAlignerNumber >= chapter.requiredAlignerNumber,
    }))
    .filter((chapter) => chapter.unlocked)
}

/**
 * Verifica se um capítulo específico está desbloqueado
 */
export function isChapterUnlocked(
  chapter: StoryChapter,
  currentAlignerNumber: number,
): boolean {
  return currentAlignerNumber >= chapter.requiredAlignerNumber
}

/**
 * Obtém o próximo capítulo a ser desbloqueado
 */
export function getNextChapterToUnlock(
  chapters: StoryChapter[],
  currentAlignerNumber: number,
): StoryChapter | null {
  const lockedChapters = chapters
    .filter((chapter) => !isChapterUnlocked(chapter, currentAlignerNumber))
    .sort((a, b) => a.requiredAlignerNumber - b.requiredAlignerNumber)

  return lockedChapters[0] || null
}

/**
 * Calcula o progresso de desbloqueio de capítulos
 */
export function calculateChapterProgress(
  chapters: StoryChapter[],
  currentAlignerNumber: number,
): {
  unlocked: number
  total: number
  percentage: number
} {
  const unlocked = chapters.filter((chapter) =>
    isChapterUnlocked(chapter, currentAlignerNumber),
  ).length

  return {
    unlocked,
    total: chapters.length,
    percentage: chapters.length > 0 ? (unlocked / chapters.length) * 100 : 0,
  }
}

/**
 * Mapeamento padrão de alinhadores para capítulos
 * Pode ser customizado conforme necessário
 */
export function getDefaultChapterMapping(
  totalAligners: number,
): StoryChapter[] {
  const chapters: StoryChapter[] = []
  const chaptersPerAligner = Math.ceil(totalAligners / 10) // ~10 capítulos para todo o tratamento

  for (let i = 1; i <= 10; i++) {
    const requiredAligner = Math.ceil((i / 10) * totalAligners)
    chapters.push({
      id: `chapter-${i}`,
      chapterNumber: i,
      requiredAlignerNumber: requiredAligner,
      title: `Capítulo ${i}`,
      content: `Conteúdo do capítulo ${i}`,
      unlocked: false,
    })
  }

  return chapters
}


