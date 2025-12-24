import { apiClient } from '@/utils/apiClient'

export type EducationLesson = {
  id: string
  title: string
  description?: string | null
  videoUrl: string
  phaseId?: string | null
  quiz: Array<{ id: string; prompt: string; options: string[]; correctIndex: number }>
  passPercent: number
  rewardCoins: number
  rewardXp: number
  isActive: boolean
  progress?: any | null
}

export class EducationService {
  static async listLessons(patientId: string): Promise<{ lessons: EducationLesson[]; activeAligner: any | null }> {
    return apiClient.get(`/education/lessons?patientId=${encodeURIComponent(patientId)}`)
  }

  static async submitQuiz(patientId: string, lessonId: string, answers: number[]): Promise<any> {
    return apiClient.post(`/education/lessons/${encodeURIComponent(lessonId)}/submit`, {
      patientId,
      userId: patientId,
      answers,
    })
  }
}





