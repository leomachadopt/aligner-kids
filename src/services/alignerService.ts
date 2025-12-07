import type {
  Aligner,
  Treatment,
  AlignerService as IAlignerService,
} from '@/types/aligner'

const STORAGE_KEYS = {
  ALIGNERS: 'aligners',
  TREATMENTS: 'treatments',
}

// Mock implementation using localStorage
// This can be easily replaced with API calls in the future
class AlignerServiceMock implements IAlignerService {
  private getAligners(): Aligner[] {
    const stored = localStorage.getItem(STORAGE_KEYS.ALIGNERS)
    return stored ? JSON.parse(stored) : []
  }

  private saveAligners(aligners: Aligner[]): void {
    localStorage.setItem(STORAGE_KEYS.ALIGNERS, JSON.stringify(aligners))
  }

  private getTreatments(): Treatment[] {
    const stored = localStorage.getItem(STORAGE_KEYS.TREATMENTS)
    return stored ? JSON.parse(stored) : []
  }

  private saveTreatments(treatments: Treatment[]): void {
    localStorage.setItem(STORAGE_KEYS.TREATMENTS, JSON.stringify(treatments))
  }

  async getAlignersByPatient(patientId: string): Promise<Aligner[]> {
    const aligners = this.getAligners()
    return aligners.filter((a) => a.patientId === patientId)
  }

  async getAlignerById(id: string): Promise<Aligner | null> {
    const aligners = this.getAligners()
    return aligners.find((a) => a.id === id) || null
  }

  async createAligner(
    alignerData: Omit<Aligner, 'id' | 'usageDays' | 'usageHours'>,
  ): Promise<Aligner> {
    const aligners = this.getAligners()
    const newAligner: Aligner = {
      ...alignerData,
      id: `aligner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      usageDays: 0,
      usageHours: 0,
    }
    aligners.push(newAligner)
    this.saveAligners(aligners)
    return newAligner
  }

  async updateAligner(
    id: string,
    updates: Partial<Aligner>,
  ): Promise<Aligner> {
    const aligners = this.getAligners()
    const index = aligners.findIndex((a) => a.id === id)
    if (index === -1) {
      throw new Error(`Aligner with id ${id} not found`)
    }
    aligners[index] = { ...aligners[index], ...updates }
    this.saveAligners(aligners)
    return aligners[index]
  }

  async deleteAligner(id: string): Promise<void> {
    const aligners = this.getAligners()
    const filtered = aligners.filter((a) => a.id !== id)
    this.saveAligners(filtered)
  }

  async getTreatmentByPatient(patientId: string): Promise<Treatment | null> {
    const treatments = this.getTreatments()
    return treatments.find((t) => t.patientId === patientId) || null
  }

  async createTreatment(
    treatmentData: Omit<Treatment, 'id'>,
  ): Promise<Treatment> {
    const treatments = this.getTreatments()
    const newTreatment: Treatment = {
      ...treatmentData,
      id: `treatment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }
    treatments.push(newTreatment)
    this.saveTreatments(treatments)
    return newTreatment
  }

  async updateTreatment(
    id: string,
    updates: Partial<Treatment>,
  ): Promise<Treatment> {
    const treatments = this.getTreatments()
    const index = treatments.findIndex((t) => t.id === id)
    if (index === -1) {
      throw new Error(`Treatment with id ${id} not found`)
    }
    treatments[index] = { ...treatments[index], ...updates }
    this.saveTreatments(treatments)
    return treatments[index]
  }

  async getCurrentAligner(patientId: string): Promise<Aligner | null> {
    const aligners = await this.getAlignersByPatient(patientId)
    return (
      aligners.find((a) => a.status === 'active') ||
      aligners
        .filter((a) => a.status === 'pending')
        .sort((a, b) => a.number - b.number)[0] ||
      null
    )
  }

  async confirmAlignerChange(
    patientId: string,
    alignerId: string,
  ): Promise<Aligner> {
    // Mark current aligner as completed
    const currentAligner = await this.getCurrentAligner(patientId)
    if (currentAligner && currentAligner.id !== alignerId) {
      await this.updateAligner(currentAligner.id, {
        status: 'completed',
        actualEndDate: new Date().toISOString(),
      })
    }

    // Activate new aligner
    const newAligner = await this.getAlignerById(alignerId)
    if (!newAligner) {
      throw new Error(`Aligner with id ${alignerId} not found`)
    }

    const updatedAligner = await this.updateAligner(alignerId, {
      status: 'active',
      startDate: new Date().toISOString(),
      expectedEndDate: new Date(
        Date.now() + newAligner.changeInterval * 24 * 60 * 60 * 1000,
      ).toISOString(),
    })

    // Update treatment current aligner number
    const treatment = await this.getTreatmentByPatient(patientId)
    if (treatment) {
      await this.updateTreatment(treatment.id, {
        currentAlignerNumber: newAligner.number,
      })
    }

    return updatedAligner
  }
}

// Export singleton instance
// In the future, this can be replaced with an API-based implementation
export const alignerService: IAlignerService = new AlignerServiceMock()

// Future API implementation example:
// export const alignerService: IAlignerService = new AlignerServiceAPI(baseURL)

