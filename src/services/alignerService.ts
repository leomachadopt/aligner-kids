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
    totalAligners: apiTreatment.totalAligners,
    currentAlignerNumber: apiTreatment.currentAlignerNumber ?? 1,
    status: apiTreatment.status || 'active',
    aligners: [],
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

  async createTreatment(
    treatmentData: Omit<Treatment, 'id'>,
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
    const res = await apiClient.post<{ confirmedAligner: any }>(
      `/aligners/${alignerId}/confirm`,
      {},
    )
    if (!res?.confirmedAligner) {
      throw new Error('Não foi possível confirmar a troca de alinhador')
    }
    return mapAligner(res.confirmedAligner)
  }
}

export const alignerService: IAlignerService = new AlignerServiceAPI()



