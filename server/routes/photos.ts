/**
 * Progress Photos Routes
 * Gerencia upload e visualização de fotos de progresso do tratamento
 */

import { Router } from 'express'
import { db, progress_photos, treatments, patient_missions, mission_templates, patient_points, aligners } from '../db/index'
import { eq, and, desc, inArray } from 'drizzle-orm'
import { nanoid } from 'nanoid'

const router = Router()

/**
 * POST /api/photos/upload
 * Upload de foto de progresso
 * Body: { patientId, treatmentId, phaseId?, alignerNumber?, photoType, photoData, capturedAt? }
 */
router.post('/upload', async (req, res) => {
  try {
    const { patientId, treatmentId, phaseId, alignerNumber, photoType, photoData, capturedAt } = req.body

    // Validação básica
    if (!patientId || !treatmentId || !photoType || !photoData) {
      return res.status(400).json({
        error: 'Campos obrigatórios: patientId, treatmentId, photoType, photoData'
      })
    }

    // Valida tipo de foto
    const validPhotoTypes = ['frontal', 'right', 'left']
    if (!validPhotoTypes.includes(photoType)) {
      return res.status(400).json({
        error: 'photoType deve ser: frontal, right ou left'
      })
    }

    // Extrai informações do base64
    const matches = photoData.match(/^data:(.+);base64,(.+)$/)
    if (!matches) {
      return res.status(400).json({
        error: 'photoData deve estar no formato base64 válido'
      })
    }

    const mimeType = matches[1]
    const base64Data = matches[2]
    const fileSize = Buffer.from(base64Data, 'base64').length

    // Se alignerNumber não vier, tenta inferir pelo tratamento (evita missões não atualizarem)
    let effectiveAlignerNumber: number | null =
      typeof alignerNumber === 'number' ? alignerNumber : null
    if (effectiveAlignerNumber === null) {
      const t = await db
        .select()
        .from(treatments)
        .where(eq(treatments.id, treatmentId))
        .limit(1)
      if (t.length > 0 && typeof t[0].currentAlignerOverall === 'number') {
        effectiveAlignerNumber = t[0].currentAlignerOverall
      }
    }

    // Cria registro no banco
    const photoId = nanoid()
    const now = new Date()

    const newPhoto = {
      id: photoId,
      patientId,
      treatmentId,
      phaseId: phaseId || null,
      alignerNumber: effectiveAlignerNumber,
      photoType,
      photoUrl: photoData, // Em produção, isso seria uma URL do S3/Cloudinary
      thumbnailUrl: null, // Pode ser gerado posteriormente
      fileName: `${photoType}-${effectiveAlignerNumber ?? 'inicial'}-${Date.now()}.jpg`,
      fileSize,
      mimeType,
      capturedAt: capturedAt ? new Date(capturedAt) : now,
      uploadedAt: now,
      clinicianNotes: null,
      hasIssues: false,
      metadata: {},
      createdAt: now,
      updatedAt: now,
    }

    await db.insert(progress_photos).values(newPhoto)

    // Atualizar missões de fotos e gamificação
    if (typeof effectiveAlignerNumber === 'number') {
      await updatePhotoMissions(patientId, effectiveAlignerNumber, photoType)
    }

    res.status(201).json({
      success: true,
      photo: newPhoto
    })
  } catch (error) {
    console.error('❌ Erro ao fazer upload de foto:', error)
    res.status(500).json({ error: 'Erro ao fazer upload da foto' })
  }
})

/**
 * GET /api/photos/patient/:patientId
 * Lista todas as fotos de um paciente, agrupadas por período
 */
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params

    // Busca todas as fotos do paciente
    const photos = await db
      .select()
      .from(progress_photos)
      .where(eq(progress_photos.patientId, patientId))
      .orderBy(desc(progress_photos.alignerNumber), desc(progress_photos.capturedAt))

    // Agrupa por período (alignerNumber)
    const groupedPhotos = photos.reduce((acc: any, photo) => {
      const period = photo.alignerNumber || 0
      if (!acc[period]) {
        acc[period] = {
          period,
          alignerNumber: photo.alignerNumber,
          phaseId: photo.phaseId,
          photos: []
        }
      }
      acc[period].photos.push(photo)
      return acc
    }, {})

    // Converte para array e ordena
    const periods = Object.values(groupedPhotos).sort((a: any, b: any) =>
      (b.period || 0) - (a.period || 0)
    )

    res.json({
      success: true,
      periods,
      totalPhotos: photos.length
    })
  } catch (error) {
    console.error('❌ Erro ao buscar fotos:', error)
    res.status(500).json({ error: 'Erro ao buscar fotos' })
  }
})

/**
 * GET /api/photos/treatment/:treatmentId
 * Lista todas as fotos de um tratamento
 */
router.get('/treatment/:treatmentId', async (req, res) => {
  try {
    const { treatmentId } = req.params

    const photos = await db
      .select()
      .from(progress_photos)
      .where(eq(progress_photos.treatmentId, treatmentId))
      .orderBy(desc(progress_photos.alignerNumber), desc(progress_photos.capturedAt))

    res.json({
      success: true,
      photos
    })
  } catch (error) {
    console.error('❌ Erro ao buscar fotos:', error)
    res.status(500).json({ error: 'Erro ao buscar fotos' })
  }
})

/**
 * GET /api/photos/period/:patientId/:alignerNumber
 * Busca fotos de um período específico (alinhador)
 */
router.get('/period/:patientId/:alignerNumber', async (req, res) => {
  try {
    const { patientId, alignerNumber } = req.params

    const photos = await db
      .select()
      .from(progress_photos)
      .where(
        and(
          eq(progress_photos.patientId, patientId),
          eq(progress_photos.alignerNumber, parseInt(alignerNumber))
        )
      )
      .orderBy(progress_photos.photoType)

    res.json({
      success: true,
      photos
    })
  } catch (error) {
    console.error('❌ Erro ao buscar fotos do período:', error)
    res.status(500).json({ error: 'Erro ao buscar fotos' })
  }
})

/**
 * PATCH /api/photos/:photoId/notes
 * Adiciona ou atualiza notas clínicas de uma foto
 */
router.patch('/:photoId/notes', async (req, res) => {
  try {
    const { photoId } = req.params
    const { clinicianNotes, hasIssues } = req.body

    await db
      .update(progress_photos)
      .set({
        clinicianNotes,
        hasIssues: hasIssues || false,
        updatedAt: new Date(),
      })
      .where(eq(progress_photos.id, photoId))

    res.json({
      success: true,
      message: 'Notas atualizadas com sucesso'
    })
  } catch (error) {
    console.error('❌ Erro ao atualizar notas:', error)
    res.status(500).json({ error: 'Erro ao atualizar notas' })
  }
})

/**
 * DELETE /api/photos/:photoId
 * Deleta uma foto
 */
router.delete('/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params

    await db
      .delete(progress_photos)
      .where(eq(progress_photos.id, photoId))

    res.json({
      success: true,
      message: 'Foto deletada com sucesso'
    })
  } catch (error) {
    console.error('❌ Erro ao deletar foto:', error)
    res.status(500).json({ error: 'Erro ao deletar foto' })
  }
})

/**
 * GET /api/photos/required/:patientId
 * Verifica se há fotos pendentes para o alinhador atual
 */
router.get('/required/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params

    // Busca o tratamento ativo do paciente
    const treatmentResults = await db
      .select()
      .from(treatments)
      .where(
        and(
          eq(treatments.patientId, patientId),
          eq(treatments.overallStatus, 'active')
        )
      )

    if (treatmentResults.length === 0) {
      return res.json({
        success: true,
        required: false,
        message: 'Nenhum tratamento ativo'
      })
    }

    const treatment = treatmentResults[0]
    const currentAligner = treatment.currentAlignerOverall

    // Só exigir fotos quando houver missão de fotos para o alinhador atual
    const photoTemplates = await db
      .select({ id: mission_templates.id })
      .from(mission_templates)
      .where(eq(mission_templates.category, 'photos'))

    const photoTemplateIds = photoTemplates.map(t => t.id)
    if (photoTemplateIds.length === 0) {
      return res.json({
        success: true,
        required: false,
        currentAligner,
        missingTypes: [],
        existingPhotos: 0,
        message: 'Nenhuma missão de fotos configurada'
      })
    }

    const hasPhotoMissionForCurrentAligner = await db
      .select({ id: patient_missions.id })
      .from(patient_missions)
      .where(
        and(
          eq(patient_missions.patientId, patientId),
          inArray(patient_missions.missionTemplateId, photoTemplateIds),
          eq(patient_missions.triggerAlignerNumber, currentAligner)
        )
      )
      .limit(1)

    if (hasPhotoMissionForCurrentAligner.length === 0) {
      return res.json({
        success: true,
        required: false,
        currentAligner,
        missingTypes: [],
        existingPhotos: 0,
        message: 'Fotos não são necessárias neste alinhador'
      })
    }

    // Verifica se já existem fotos para o alinhador atual
    const existingPhotos = await db
      .select()
      .from(progress_photos)
      .where(
        and(
          eq(progress_photos.patientId, patientId),
          eq(progress_photos.alignerNumber, currentAligner)
        )
      )

    // Verifica quais tipos de foto estão faltando
    const photoTypes = ['frontal', 'right', 'left']
    const existingTypes = existingPhotos.map(p => p.photoType)
    const missingTypes = photoTypes.filter(type => !existingTypes.includes(type))

    const required = missingTypes.length > 0

    res.json({
      success: true,
      required,
      currentAligner,
      missingTypes,
      existingPhotos: existingPhotos.length,
      message: required
        ? `Faltam fotos: ${missingTypes.join(', ')}`
        : 'Todas as fotos foram enviadas'
    })
  } catch (error) {
    console.error('❌ Erro ao verificar fotos pendentes:', error)
    res.status(500).json({ error: 'Erro ao verificar fotos pendentes' })
  }
})

/**
 * Helper: Atualiza missões de fotos e concede pontos de gamificação
 */
async function updatePhotoMissions(patientId: string, alignerNumber: number, photoType: string) {
  try {
    console.log(`📸 Atualizando missões de fotos para paciente ${patientId}, alinhador ${alignerNumber}, tipo ${photoType}`)

    // Buscar missões de fotos ativas para este paciente e alinhador
    const photoMissionName = photoType === 'frontal'
      ? 'Foto Frontal do Sorriso'
      : photoType === 'right'
        ? 'Foto Lateral Direita'
        : 'Foto Lateral Esquerda'

    // Buscar o template da missão
    const templates = await db
      .select()
      .from(mission_templates)
      .where(eq(mission_templates.name, photoMissionName))

    if (templates.length === 0) {
      console.log(`⚠️ Template de missão não encontrado: ${photoMissionName}`)
      return
    }

    const template = templates[0]

    // Buscar missões ativas do paciente para este tipo de foto
    const missions = await db
      .select()
      .from(patient_missions)
      .where(
        and(
          eq(patient_missions.patientId, patientId),
          eq(patient_missions.missionTemplateId, template.id),
          eq(patient_missions.triggerAlignerNumber, alignerNumber)
        )
      )

    if (missions.length > 0) {
      const mission = missions[0]

      // Atualizar progresso da missão
      const newProgress = (mission.progress || 0) + 1
      const isComplete = newProgress >= (mission.targetValue || 1)

      await db
        .update(patient_missions)
        .set({
          progress: newProgress,
          status: isComplete ? 'completed' : 'in_progress',
          completedAt: isComplete ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(patient_missions.id, mission.id))

      console.log(`✅ Missão "${photoMissionName}" atualizada: ${newProgress}/${mission.targetValue}`)

      // Se completou, dar pontos
      if (isComplete) {
        const points = (mission.customPoints || template.basePoints) + (template.bonusPoints || 0)
        await awardPoints(patientId, points, `Missão completada: ${photoMissionName}`)
      }
    }

    // Verificar se todas as 3 fotos foram enviadas para completar a missão bônus
    await checkCompletePhotoSet(patientId, alignerNumber)

  } catch (error) {
    console.error('❌ Erro ao atualizar missões de fotos:', error)
  }
}

/**
 * Helper: Verifica se todas as 3 fotos foram enviadas e completa missão bônus
 */
async function checkCompletePhotoSet(patientId: string, alignerNumber: number) {
  try {
    // Contar quantas fotos existem para este alinhador
    const photos = await db
      .select()
      .from(progress_photos)
      .where(
        and(
          eq(progress_photos.patientId, patientId),
          eq(progress_photos.alignerNumber, alignerNumber)
        )
      )

    const photoTypes = new Set(photos.map(p => p.photoType))

    // Se tem as 3 fotos (frontal, right, left)
    if (photoTypes.size === 3 && photoTypes.has('frontal') && photoTypes.has('right') && photoTypes.has('left')) {
      console.log('🎯 Set completo de fotos! Procurando missão bônus...')

      // Marcar quest do alinhador como "fotoSetDone" (best-effort)
      try {
        const alignerRows = await db
          .select()
          .from(aligners)
          .where(and(eq(aligners.patientId, patientId), eq(aligners.alignerNumber, alignerNumber)))
          .limit(1)
        const a = alignerRows[0]
        if (a) {
          const { AlignerWearService } = await import('../services/alignerWearService')
          await AlignerWearService.markPhotoSetDone({ patientId, alignerId: String(a.id) })
        }
      } catch {
        // ignore
      }

      // Buscar template da missão bônus
      const templates = await db
        .select()
        .from(mission_templates)
        .where(eq(mission_templates.name, 'Registro Fotográfico Completo'))

      if (templates.length === 0) {
        console.log('⚠️ Template de missão bônus não encontrado')
        return
      }

      const template = templates[0]

      // Buscar missão bônus ativa
      const missions = await db
        .select()
        .from(patient_missions)
        .where(
          and(
            eq(patient_missions.patientId, patientId),
            eq(patient_missions.missionTemplateId, template.id),
            eq(patient_missions.triggerAlignerNumber, alignerNumber)
          )
        )

      if (missions.length > 0) {
        const mission = missions[0]

        if (mission.status !== 'completed') {
          // Completar missão bônus
          await db
            .update(patient_missions)
            .set({
              progress: 3,
              status: 'completed',
              completedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(patient_missions.id, mission.id))

          console.log('🎉 Missão bônus "Registro Fotográfico Completo" concluída!')

          // Dar pontos bônus
          const points = (mission.customPoints || template.basePoints) + (template.bonusPoints || 0)
          await awardPoints(patientId, points, 'Missão bônus: Registro Fotográfico Completo')
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro ao verificar set completo de fotos:', error)
  }
}

/**
 * Helper: Concede pontos de gamificação ao paciente
 */
async function awardPoints(patientId: string, points: number, reason: string) {
  try {
    console.log(`💎 Concedendo ${points} pontos para ${patientId}: ${reason}`)

    // Buscar ou criar registro de pontos do paciente
    const pointsRecords = await db
      .select()
      .from(patient_points)
      .where(eq(patient_points.patientId, patientId))

    if (pointsRecords.length === 0) {
      // Criar novo registro
      await db.insert(patient_points).values({
        id: nanoid(),
        patientId,
        coins: points,
        xp: Math.floor(points / 2),
        level: Math.floor((Math.floor(points / 2)) / 100) + 1,
        totalPoints: points,
        currentLevel: Math.floor((Math.floor(points / 2)) / 100) + 1,
        badges: [],
        streak: 0,
        lastActivityAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    } else {
      // Atualizar pontos existentes
      const currentPoints = pointsRecords[0]
      const newCoins = (currentPoints.coins || 0) + points
      const newXp = (currentPoints.xp || 0) + Math.floor(points / 2)
      const newLevel = Math.floor(newXp / 100) + 1

      await db
        .update(patient_points)
        .set({
          coins: newCoins,
          xp: newXp,
          level: newLevel,
          totalPoints: newCoins,
          currentLevel: newLevel,
          lastActivityAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(patient_points.patientId, patientId))
    }

    console.log(`✅ Pontos concedidos com sucesso!`)
  } catch (error) {
    console.error('❌ Erro ao conceder pontos:', error)
  }
}

export default router
