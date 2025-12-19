/**
 * Reward Program Assignment Service
 * Automatically assigns the best matching reward program for a patient based on age.
 */

import { db, users, reward_programs, patient_reward_programs, store_item_templates, clinic_store_items, reward_program_items } from '../db'
import { and, desc, eq } from 'drizzle-orm'

function calcAge(birthDate?: string | null): number | null {
  if (!birthDate) return null
  const d = new Date(birthDate)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

export class RewardProgramAssignmentService {
  private static async bootstrapClinicRewards(clinicId: string, createdByUserId: string) {
    const hasPrograms = await db
      .select()
      .from(reward_programs)
      .where(eq(reward_programs.clinicId, clinicId))
      .limit(1)
    if (hasPrograms.length > 0) return

    const templates = await db.select().from(store_item_templates).where(eq(store_item_templates.isActive, true))
    if (templates.length === 0) return

    // Create clinic items from templates (best-effort)
    const clinicItems = templates.map((t: any, idx: number) => ({
      id: `citem-auto-${Date.now()}-${idx}`,
      clinicId,
      sourceType: 'global_template',
      sourceTemplateId: t.id,
      createdByUserId,
      name: t.name,
      description: t.description,
      type: t.type,
      category: t.category,
      priceCoins: t.defaultPriceCoins,
      requiredLevel: t.defaultRequiredLevel || 1,
      imageUrl: t.defaultImageUrl || null,
      metadata: t.metadata || {},
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))

    await db.insert(clinic_store_items).values(clinicItems as any)

    // Create a default program without age range (acts as fallback for all)
    const prog = await db.insert(reward_programs).values({
      id: `rprog-auto-${Date.now()}`,
      clinicId,
      name: 'Padrão (Auto)',
      description: 'Programa padrão criado automaticamente a partir dos templates universais.',
      ageMin: null,
      ageMax: null,
      createdByUserId,
      isActive: true,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning()

    const programId = prog[0].id
    const programItems = clinicItems.map((ci: any, idx: number) => ({
      id: `rpi-auto-${Date.now()}-${idx}`,
      programId,
      clinicStoreItemId: ci.id,
      sortOrder: idx,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
    await db.insert(reward_program_items).values(programItems as any)
  }

  static async recomputeForPatient(patientId: string, assignedByUserId?: string | null) {
    const u = await db.select().from(users).where(eq(users.id, patientId))
    if (u.length === 0) throw new Error('Paciente não encontrado')
    const clinicId = u[0].clinicId
    if (!clinicId) return { changed: false, programId: null }

    const age = calcAge(u[0].birthDate || null)

    // Bootstrap clinic rewards if empty (so store won't be empty)
    const creator = assignedByUserId || patientId
    await this.bootstrapClinicRewards(clinicId, creator)

    const programs = await db
      .select()
      .from(reward_programs)
      .where(and(eq(reward_programs.clinicId, clinicId), eq(reward_programs.isActive, true)))
      .orderBy(desc(reward_programs.isDefault), desc(reward_programs.createdAt))

    if (programs.length === 0) return { changed: false, programId: null }

    // pick best match
    let best: any | null = null
    for (const p of programs as any[]) {
      if (!p.isDefault) continue
      if (age === null) {
        // when no age, accept programs without range only
        if (p.ageMin == null && p.ageMax == null) {
          best = p
          break
        }
        continue
      }
      const minOk = p.ageMin == null || age >= p.ageMin
      const maxOk = p.ageMax == null || age <= p.ageMax
      if (minOk && maxOk) {
        if (!best) {
          best = p
        } else {
          const bestSpan =
            (best.ageMin == null || best.ageMax == null) ? Number.POSITIVE_INFINITY : best.ageMax - best.ageMin
          const span =
            (p.ageMin == null || p.ageMax == null) ? Number.POSITIVE_INFINITY : p.ageMax - p.ageMin
          if (span < bestSpan) best = p
        }
      }
    }

    // fallback to any default, then any program
    if (!best) best = (programs as any[]).find((p) => p.isDefault) || (programs as any[])[0]

    const current = await db
      .select()
      .from(patient_reward_programs)
      .where(and(eq(patient_reward_programs.patientId, patientId), eq(patient_reward_programs.isActive, true)))
      .orderBy(desc(patient_reward_programs.assignedAt))
      .limit(1)

    const currentProgramId = current[0]?.programId || null
    if (currentProgramId === best.id) return { changed: false, programId: best.id }

    // deactivate previous
    await db
      .update(patient_reward_programs)
      .set({ isActive: false })
      .where(eq(patient_reward_programs.patientId, patientId))

    const inserted = await db
      .insert(patient_reward_programs)
      .values({
        id: `prp-${Date.now()}`,
        patientId,
        programId: best.id,
        assignedByUserId: assignedByUserId || null,
        assignedAt: new Date(),
        isActive: true,
      })
      .returning()

    return { changed: true, programId: inserted[0].programId }
  }
}


