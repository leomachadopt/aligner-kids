import type { Aligner, Treatment } from '@/types/aligner'

/**
 * Calcula quantos dias faltam até a próxima troca de alinhador
 */
export function calculateDaysUntilChange(aligner: Aligner | null): number {
  if (!aligner || !aligner.expectedEndDate) return 0

  const today = new Date()
  const endDate = new Date(aligner.expectedEndDate)
  const diffTime = endDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return Math.max(0, diffDays)
}

/**
 * Calcula o progresso percentual do tratamento
 */
export function calculateTreatmentProgress(treatment: Treatment | null): number {
  if (!treatment || treatment.totalAligners === 0) return 0

  const progress = (treatment.currentAlignerNumber / treatment.totalAligners) * 100
  return Math.min(100, Math.max(0, progress))
}

/**
 * Calcula a aderência percentual baseada no tempo de uso
 */
export function calculateAdherence(
  aligner: Aligner | null,
  dailyUsageHours: number,
): number {
  if (!aligner || aligner.wearTime === 0) return 0

  const adherence = (dailyUsageHours / aligner.wearTime) * 100
  return Math.min(100, Math.max(0, adherence))
}

/**
 * Verifica se um alinhador está atrasado para troca
 */
export function isAlignerOverdue(aligner: Aligner | null): boolean {
  if (!aligner || !aligner.expectedEndDate) return false

  const today = new Date()
  const endDate = new Date(aligner.expectedEndDate)
  return today > endDate && aligner.status === 'active'
}

/**
 * Calcula dias de uso do alinhador atual
 */
export function calculateUsageDays(aligner: Aligner | null): number {
  if (!aligner || !aligner.startDate) return 0

  const today = new Date()
  const startDate = new Date(aligner.startDate)
  const diffTime = today.getTime() - startDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  return Math.max(0, diffDays)
}

/**
 * Calcula horas de uso acumuladas baseado em dias e horas diárias
 */
export function calculateAccumulatedHours(
  usageDays: number,
  dailyHours: number,
): number {
  return usageDays * dailyHours
}

/**
 * Verifica se um capítulo deve ser desbloqueado baseado no número do alinhador
 */
export function shouldUnlockChapter(
  requiredAlignerNumber: number,
  currentAlignerNumber: number,
): boolean {
  return currentAlignerNumber >= requiredAlignerNumber
}

/**
 * Calcula a média de aderência semanal
 */
export function calculateWeeklyAdherence(
  dailyAdherence: number[],
): number {
  if (dailyAdherence.length === 0) return 0

  const sum = dailyAdherence.reduce((acc, val) => acc + val, 0)
  return sum / dailyAdherence.length
}

/**
 * Obtém o status do tratamento baseado em vários fatores
 */
export function getTreatmentStatus(
  treatment: Treatment | null,
  currentAligner: Aligner | null,
): {
  status: 'on-track' | 'delayed' | 'at-risk' | 'completed'
  message: string
} {
  if (!treatment || !currentAligner) {
    return { status: 'at-risk', message: 'Tratamento não encontrado' }
  }

  if (treatment.status === 'completed') {
    return { status: 'completed', message: 'Tratamento concluído' }
  }

  if (isAlignerOverdue(currentAligner)) {
    return {
      status: 'delayed',
      message: 'Alinhador atrasado para troca',
    }
  }

  const daysUntilChange = calculateDaysUntilChange(currentAligner)
  if (daysUntilChange < 0) {
    return { status: 'delayed', message: 'Troca atrasada' }
  }

  if (daysUntilChange <= 2) {
    return {
      status: 'at-risk',
      message: 'Troca próxima - atenção necessária',
    }
  }

  return { status: 'on-track', message: 'Tratamento em dia' }
}





