import type {
  Aligner,
  Treatment,
  AlignerService as IAlignerService,
} from '@/types/aligner'
import { apiClient } from '@/utils/apiClient'

function mapAligner(apiAligner: any): Aligner {
  return {
    id: apiAligner.id,
    patientId: apiAligner.patientId,
    number: apiAligner.alignerNumber ?? apiAligner.number ?? apiAligner.number ?? 0,
    startDate: apiAligner.startDate || '',
    expectedEndDate: apiAligner.endDate || apiAligner.expectedEndDate || '',
    actualEndDate: apiAligner.actualEndDate || null,
    usageDays: apiAligner.usageDays ?? 0,
    usageHours: apiAligner.usageHours ?? 0,
    status: apiAligner.status || 'pending',
    wearTime: apiAligner.targetHoursPerDay ?? apiAligner.wearTime ?? 22,
    changeInterval: apiAligner.changeInterval ?? 14,
    notes: apiAligner.notes,
  }
}

function mapTreatment(apiTreatment: any): Treatment {
  return {
    id: apiTreatment.id,
    patientId: apiTreatment.patientId,
    orthodontistId: apiTreatment.orthodontistId || '',
    name: apiTreatment.name || undefined,
    startDate: apiTreatment.startDate,
    expectedEndDate: apiTreatment.expectedEndDate || apiTreatment.estimatedEndDate || '',

    // Novos campos do modelo atualizado
    overallStatus: apiTreatment.overallStatus || apiTreatment.status || 'active',
    totalPhasesPlanned: apiTreatment.totalPhasesPlanned || 1,
    currentPhaseNumber: apiTreatment.currentPhaseNumber || 1,
    totalAlignersOverall: apiTreatment.totalAlignersOverall || apiTreatment.totalAligners || 0,
    currentAlignerOverall: apiTreatment.currentAlignerOverall || apiTreatment.currentAlignerNumber || 1,

    // Campos legados (para compatibilidade)
    totalAligners: apiTreatment.totalAligners || apiTreatment.totalAlignersOverall,
    currentAlignerNumber: apiTreatment.currentAlignerNumber ?? 1,
    status: apiTreatment.status || apiTreatment.overallStatus || 'active',

    notes: apiTreatment.notes,
    aligners: [],
    phases: [],
  }
}

class AlignerServiceAPI implements IAlignerService {
  async getAlignersByPatient(patientId: string, treatmentId?: string): Promise<Aligner[]> {
    try {
      const res = await apiClient.get<{ aligners: any[] }>(
        `/aligners/patient/${patientId}${treatmentId ? `?treatmentId=${treatmentId}` : ''}`,
      )
      return (res.aligners || []).map(mapAligner)
    } catch (error) {
      console.error('Erro ao buscar alinhadores:', error)
      return []
    }
  }

  async getAlignerById(id: string): Promise<Aligner | null> {
    try {
      const res = await apiClient.get<{ aligner: any }>(`/aligners/${id}`)
      return res?.aligner ? mapAligner(res.aligner) : null
    } catch (error) {
      console.error('Erro ao buscar alinhador:', error)
      return null
    }
  }

  async createAligner(
    alignerData: Omit<Aligner, 'id' | 'usageDays' | 'usageHours'> & { treatmentId?: string },
  ): Promise<Aligner> {
    if (!alignerData.patientId) {
      throw new Error('patientId é obrigatório para criar alinhador')
    }
    const payload = {
      treatmentId: (alignerData as any).treatmentId,
      patientId: alignerData.patientId,
      number: alignerData.number,
      alignerNumber: alignerData.number,
      startDate: alignerData.startDate?.slice(0, 10),
      endDate: alignerData.expectedEndDate?.slice(0, 10),
      status:
        alignerData.status ??
        (alignerData.number === 1 ? 'active' : 'pending'),
      notes: alignerData.notes,
      targetHoursPerDay: alignerData.wearTime ?? 22,
    }
    const res = await apiClient.post<{ aligner: any }>(`/aligners`, payload)
    return mapAligner(res.aligner)
  }

  async updateAligner(id: string, updates: Partial<Aligner>): Promise<Aligner> {
    const payload = {
      ...updates,
      alignerNumber: updates.number,
      endDate: updates.expectedEndDate,
      targetHoursPerDay: updates.wearTime,
    }
    const res = await apiClient.put<{ aligner: any }>(`/aligners/${id}`, payload)
    return mapAligner(res.aligner)
  }

  async deleteAligner(id: string): Promise<void> {
    await apiClient.delete(`/aligners/${id}`)
  }

  async getTreatmentByPatient(patientId: string): Promise<Treatment | null> {
    try {
      const res = await apiClient.get<{ treatment: any }>(
        `/treatments/patient/${patientId}`,
      )
      return res?.treatment ? mapTreatment(res.treatment) : null
    } catch (error) {
      console.warn('Tratamento não encontrado ou erro ao buscar tratamento', error)
      return null
    }
  }

  async getTreatmentsByPatient(patientId: string): Promise<Treatment[]> {
    try {
      const res = await apiClient.get<{ treatments: any[] }>(
        `/treatments/patient/${patientId}/all`,
      )
      return (res?.treatments || []).map(mapTreatment)
    } catch (error) {
      console.error('Erro ao buscar tratamentos:', error)
      return []
    }
  }

  async createTreatment(
    treatmentData: Omit<Treatment, 'id'> & { changeInterval?: number; targetHoursPerDay?: number },
  ): Promise<Treatment> {
    const today = new Date().toISOString().slice(0, 10)
    const payload = {
      patientId: treatmentData.patientId,
      name: treatmentData.name,
      startDate: treatmentData.startDate?.slice(0, 10) || today,
      estimatedEndDate: treatmentData.expectedEndDate?.slice(0, 10),
      totalAligners: treatmentData.totalAligners ?? 1,
      currentAlignerNumber: treatmentData.currentAlignerNumber ?? 1,
      status: treatmentData.status ?? 'active',
      notes: '',
      daysPerAligner: (treatmentData as any).changeInterval ?? 14,
      targetHoursPerDay: (treatmentData as any).targetHoursPerDay ?? 22,
    }
    const res = await apiClient.post<{ treatment: any }>(`/treatments`, payload)
    return mapTreatment(res.treatment)
  }

  async updateTreatment(
    id: string,
    updates: Partial<Treatment>,
  ): Promise<Treatment> {
    const payload = {
      ...updates,
      estimatedEndDate: updates.expectedEndDate,
    }
    const res = await apiClient.put<{ treatment: any }>(`/treatments/${id}`, payload)
    return mapTreatment(res.treatment)
  }

  async deleteTreatment(id: string): Promise<void> {
    await apiClient.delete(`/treatments/${id}`)
  }

  async getCurrentAligner(patientId: string, treatmentId?: string): Promise<Aligner | null> {
    const treatment = await this.getTreatmentByPatient(patientId)
    const aligners = await this.getAlignersByPatient(patientId, treatmentId || treatment?.id)

    if (treatment) {
      const current = aligners.find(
        (a) => a.number === treatment.currentAlignerNumber && a.status !== 'completed',
      )
      if (current) return current
    }

    return (
      aligners.find((a) => a.status === 'active') ||
      aligners
        .filter((a) => a.status === 'pending' || a.status === 'upcoming')
        .sort((a, b) => a.number - b.number)[0] ||
      null
    )
  }

  async confirmAlignerChange(
    _patientId: string,
    alignerId: string,
  ): Promise<Aligner> {
    const res = await apiClient.post<{
      success: boolean
      confirmedAligner: any
      nextAligner?: any
      phaseCompleted?: boolean
      treatmentCompleted?: boolean
      error?: string
      daysRemaining?: number
    }>(
      `/aligners/${alignerId}/confirm`,
      {},
    )

    if (res?.error) {
      throw new Error(res.error)
    }

    if (!res?.confirmedAligner) {
      throw new Error('Não foi possível confirmar a troca de alinhador')
    }
    return mapAligner(res.confirmedAligner)
  }

  /**
   * Inicia o tratamento, ativando o primeiro alinhador da primeira fase
   */
  async startTreatment(treatmentId: string): Promise<{
    success: boolean
    message: string
    treatment: any
    currentPhase: any
    currentAligner: any
  }> {
    const res = await apiClient.post<{
      success: boolean
      message: string
      treatment: any
      currentPhase: any
      currentAligner: any
    }>(`/treatments/${treatmentId}/start`, {})

    return res
  }

  /**
   * Verifica se um alinhador pode ser ativado (se a data já passou)
   */
  async canActivateAligner(alignerId: string): Promise<{
    canActivate: boolean
    daysRemaining: number
    nextActivationDate: string
    currentStatus: string
  }> {
    const res = await apiClient.get<{
      canActivate: boolean
      daysRemaining: number
      nextActivationDate: string
      currentStatus: string
    }>(`/aligners/${alignerId}/can-activate`)

    return res
  }
}

export const alignerService: IAlignerService = new AlignerServiceAPI()



