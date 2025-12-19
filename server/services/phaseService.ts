/**
 * Phase Service
 * Manages treatment phases operations
 */

import { db, treatment_phases, treatments, aligners } from '../db/index'
import { eq, and, desc } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export interface CreatePhaseInput {
  treatmentId: string
  phaseName: string
  description?: string
  totalAligners: number
  startDate?: string
  expectedEndDate?: string
}

export interface UpdatePhaseInput {
  phaseName?: string
  description?: string
  totalAligners?: number
  status?: 'pending' | 'active' | 'completed' | 'paused' | 'cancelled'
  expectedEndDate?: string
  actualEndDate?: string
  notes?: string
}

export class PhaseService {
  /**
   * Get all phases for a treatment
   */
  static async getPhasesByTreatment(treatmentId: string) {
    return await db
      .select()
      .from(treatment_phases)
      .where(eq(treatment_phases.treatmentId, treatmentId))
      .orderBy(treatment_phases.phaseNumber)
  }

  /**
   * Get active phase for a treatment
   */
  static async getActivePhase(treatmentId: string) {
    const phases = await db
      .select()
      .from(treatment_phases)
      .where(
        and(
          eq(treatment_phases.treatmentId, treatmentId),
          eq(treatment_phases.status, 'active')
        )
      )
      .limit(1)

    return phases[0] || null
  }

  /**
   * Get phase by ID
   */
  static async getPhaseById(phaseId: string) {
    const phases = await db
      .select()
      .from(treatment_phases)
      .where(eq(treatment_phases.id, phaseId))
      .limit(1)

    return phases[0] || null
  }

  /**
   * Get last phase of a treatment
   */
  static async getLastPhase(treatmentId: string) {
    const phases = await db
      .select()
      .from(treatment_phases)
      .where(eq(treatment_phases.treatmentId, treatmentId))
      .orderBy(desc(treatment_phases.phaseNumber))
      .limit(1)

    return phases[0] || null
  }

  /**
   * Create a new phase
   */
  static async createPhase(data: CreatePhaseInput) {
    const { treatmentId, phaseName, description, totalAligners, startDate, expectedEndDate } = data

    // Get last phase to determine next phase number and starting aligner number
    const lastPhase = await this.getLastPhase(treatmentId)
    const nextPhaseNumber = lastPhase ? lastPhase.phaseNumber + 1 : 1
    const startAlignerNumber = lastPhase ? lastPhase.endAlignerNumber + 1 : 1
    const endAlignerNumber = startAlignerNumber + totalAligners - 1

    // Create phase
    const phase = {
      id: nanoid(),
      treatmentId,
      phaseNumber: nextPhaseNumber,
      phaseName,
      description,
      startAlignerNumber,
      endAlignerNumber,
      totalAligners,
      currentAlignerNumber: 0,
      status: 'pending' as const,
      startDate,
      expectedEndDate,
    }

    await db.insert(treatment_phases).values(phase)

    // Update treatment
    const treatment = await db
      .select()
      .from(treatments)
      .where(eq(treatments.id, treatmentId))
      .limit(1)

    if (treatment[0]) {
      await db
        .update(treatments)
        .set({
          totalPhasesPlanned: nextPhaseNumber,
          totalAlignersOverall: endAlignerNumber,
        })
        .where(eq(treatments.id, treatmentId))
    }

    return phase
  }

  /**
   * Update phase
   */
  static async updatePhase(phaseId: string, updates: UpdatePhaseInput) {
    await db
      .update(treatment_phases)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(treatment_phases.id, phaseId))

    return await this.getPhaseById(phaseId)
  }

  /**
   * Start a phase (mark as active)
   */
  static async startPhase(phaseId: string, startDate?: string) {
    const phase = await this.getPhaseById(phaseId)
    if (!phase) {
      throw new Error('Phase not found')
    }

    // Check if there's another active phase
    const activePhase = await this.getActivePhase(phase.treatmentId)
    if (activePhase && activePhase.id !== phaseId) {
      throw new Error('Another phase is already active. Complete it before starting a new phase.')
    }

    // Update phase status
    await db
      .update(treatment_phases)
      .set({
        status: 'active',
        startDate: startDate || new Date().toISOString().split('T')[0],
        updatedAt: new Date(),
      })
      .where(eq(treatment_phases.id, phaseId))

    // Update treatment
    await db
      .update(treatments)
      .set({
        currentPhaseNumber: phase.phaseNumber,
        overallStatus: 'active',
      })
      .where(eq(treatments.id, phase.treatmentId))

    return await this.getPhaseById(phaseId)
  }

  /**
   * Complete a phase
   */
  static async completePhase(phaseId: string, actualEndDate?: string) {
    const phase = await this.getPhaseById(phaseId)
    if (!phase) {
      throw new Error('Phase not found')
    }

    await db
      .update(treatment_phases)
      .set({
        status: 'completed',
        actualEndDate: actualEndDate || new Date().toISOString().split('T')[0],
        updatedAt: new Date(),
      })
      .where(eq(treatment_phases.id, phaseId))

    // Check if all phases are completed
    const allPhases = await this.getPhasesByTreatment(phase.treatmentId)
    const allCompleted = allPhases.every(p => p.status === 'completed')

    if (allCompleted) {
      await db
        .update(treatments)
        .set({
          overallStatus: 'completed',
        })
        .where(eq(treatments.id, phase.treatmentId))
    }

    return await this.getPhaseById(phaseId)
  }

  /**
   * Pause a phase
   */
  static async pausePhase(phaseId: string) {
    const phase = await this.getPhaseById(phaseId)
    if (!phase) {
      throw new Error('Phase not found')
    }

    await db
      .update(treatment_phases)
      .set({
        status: 'paused',
        updatedAt: new Date(),
      })
      .where(eq(treatment_phases.id, phaseId))

    return await this.getPhaseById(phaseId)
  }

  /**
   * Resume a paused phase
   */
  static async resumePhase(phaseId: string) {
    const phase = await this.getPhaseById(phaseId)
    if (!phase) {
      throw new Error('Phase not found')
    }

    // Check if there's another active phase
    const activePhase = await this.getActivePhase(phase.treatmentId)
    if (activePhase && activePhase.id !== phaseId) {
      throw new Error('Another phase is already active')
    }

    await db
      .update(treatment_phases)
      .set({
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(treatment_phases.id, phaseId))

    return await this.getPhaseById(phaseId)
  }

  /**
   * Get next aligner number for a treatment (global number)
   */
  static async getNextAlignerNumber(treatmentId: string): Promise<number> {
    const allAligners = await db
      .select()
      .from(aligners)
      .where(eq(aligners.treatmentId, treatmentId))

    if (allAligners.length === 0) return 1

    const maxNumber = Math.max(...allAligners.map(a => a.alignerNumber))
    return maxNumber + 1
  }

  /**
   * Calculate overall progress of treatment
   */
  static async calculateOverallProgress(treatmentId: string): Promise<number> {
    const treatment = await db
      .select()
      .from(treatments)
      .where(eq(treatments.id, treatmentId))
      .limit(1)

    if (!treatment[0]) return 0

    const { currentAlignerOverall, totalAlignersOverall } = treatment[0]
    return (currentAlignerOverall / totalAlignersOverall) * 100
  }

  /**
   * Calculate progress of a specific phase
   */
  static async calculatePhaseProgress(phaseId: string): Promise<number> {
    const phase = await this.getPhaseById(phaseId)
    if (!phase) return 0

    return (phase.currentAlignerNumber / phase.totalAligners) * 100
  }
}
