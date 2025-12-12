/**
 * Stories Routes
 */

import { Router } from 'express'
import { db, stories, story_chapters, story_preferences } from '../db/index'
import { eq, and } from 'drizzle-orm'
import { StoryGenerationService } from '../services/storyGenerationService'

const router = Router()

// ============================================
// STORY PREFERENCES
// ============================================

// Get patient's story preferences
router.get('/stories/preferences/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params
    const { treatmentId } = req.query
    const result = await db
      .select()
      .from(story_preferences)
      .where(eq(story_preferences.patientId, patientId))
      .where(treatmentId ? eq(story_preferences.treatmentId, treatmentId as string) : undefined)

    if (result.length === 0) {
      return res.status(404).json({ error: 'Story preferences not found' })
    }

    res.json({ preferences: result[0] })
  } catch (error) {
    console.error('Error fetching story preferences:', error)
    res.status(500).json({ error: 'Failed to fetch story preferences' })
  }
})

// Create or update story preferences
router.post('/stories/preferences', async (req, res) => {
  try {
    const {
      patientId,
      treatmentId,
      environment,
      mainCharacter,
      mainCharacterName,
      sidekick,
      companion, // compat field from frontend
      companionName,
      theme,
      ageGroup,
    } = req.body

    if (!patientId || !environment || !mainCharacter || !theme || !ageGroup) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes em story preferences' })
    }

    // Check if preferences already exist
    const existing = await db
      .select()
      .from(story_preferences)
      .where(eq(story_preferences.patientId, patientId))

    if (existing.length > 0) {
      // Update
      const updated = await db
        .update(story_preferences)
        .set({
          treatmentId: treatmentId || null,
          environment,
          mainCharacter,
          mainCharacterName,
          sidekick: sidekick || companion || null,
          theme,
          ageGroup,
          updatedAt: new Date(),
        })
        .where(eq(story_preferences.patientId, patientId))
        .returning()

      res.json({ preferences: updated[0] })
    } else {
      // Create
      const created = await db
        .insert(story_preferences)
        .values({
          id: `pref-${Date.now()}`,
          patientId,
          treatmentId: treatmentId || null,
          environment,
          mainCharacter,
          mainCharacterName,
          sidekick: sidekick || companion || null,
          theme,
          ageGroup,
        })
        .returning()

      res.json({ preferences: created[0] })
    }
  } catch (error) {
    console.error('Error saving story preferences:', error)
    res.status(500).json({ error: 'Failed to save story preferences' })
  }
})

// ============================================
// STORIES (SERIES)
// ============================================

// Get patient's story series
router.get('/stories/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params
    const { treatmentId } = req.query
    const result = await db
      .select()
      .from(stories)
      .where(eq(stories.patientId, patientId))
      .where(treatmentId ? eq(stories.treatmentId, treatmentId as string) : undefined)

    if (result.length === 0) {
      // Retorna 200 com story null para evitar 404 ruidoso no front
      return res.json({ story: null })
    }

    res.json({ story: result[0] })
  } catch (error) {
    console.error('Error fetching story:', error)
    res.status(500).json({ error: 'Failed to fetch story' })
  }
})

// Create story series
router.post('/stories', async (req, res) => {
  try {
    const newStory = await db
      .insert(stories)
      .values({
        id: `story-${Date.now()}`,
        patientId: req.body.patientId,
        treatmentId: req.body.treatmentId || null,
        title: req.body.title,
        description: req.body.description,
        totalChapters: req.body.totalChapters,
        isActive: true,
      })
      .returning()

    res.json({ story: newStory[0] })
  } catch (error) {
    console.error('Error creating story:', error)
    res.status(500).json({ error: 'Failed to create story' })
  }
})

// Update story
router.put('/stories/:id', async (req, res) => {
  try {
    const updated = await db
      .update(stories)
      .set({
        ...req.body,
        updatedAt: new Date(),
      })
      .where(eq(stories.id, req.params.id))
      .returning()

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Story not found' })
    }

    res.json({ story: updated[0] })
  } catch (error) {
    console.error('Error updating story:', error)
    res.status(500).json({ error: 'Failed to update story' })
  }
})

// ============================================
// STORY CHAPTERS
// ============================================

// Get all chapters for a story
router.get('/stories/:storyId/chapters', async (req, res) => {
  try {
    const { storyId } = req.params
    const result = await db
      .select()
      .from(story_chapters)
      .where(eq(story_chapters.storyId, storyId))
      .orderBy(story_chapters.chapterNumber)

    res.json({ chapters: result })
  } catch (error) {
    console.error('Error fetching chapters:', error)
    res.status(500).json({ error: 'Failed to fetch chapters' })
  }
})

// Get single chapter
router.get('/chapters/:id', async (req, res) => {
  try {
    const result = await db
      .select()
      .from(story_chapters)
      .where(eq(story_chapters.id, req.params.id))

    if (result.length === 0) {
      return res.status(404).json({ error: 'Chapter not found' })
    }

    res.json({ chapter: result[0] })
  } catch (error) {
    console.error('Error fetching chapter:', error)
    res.status(500).json({ error: 'Failed to fetch chapter' })
  }
})

// Create chapter
router.post('/chapters', async (req, res) => {
  try {
    const newChapter = await db
      .insert(story_chapters)
      .values({
        id: `chapter-${Date.now()}`,
        storyId: req.body.storyId,
        treatmentId: req.body.treatmentId || null,
        chapterNumber: req.body.chapterNumber,
        title: req.body.title,
        content: req.body.content,
        requiredAlignerNumber: req.body.requiredAlignerNumber,
        isUnlocked: req.body.isUnlocked || false,
        isRead: false,
        audioUrl: req.body.audioUrl || null,
      })
      .returning()

    res.json({ chapter: newChapter[0] })
  } catch (error) {
    console.error('Error creating chapter:', error)
    res.status(500).json({ error: 'Failed to create chapter' })
  }
})

// Update chapter
router.put('/chapters/:id', async (req, res) => {
  try {
    const updated = await db
      .update(story_chapters)
      .set({
        ...req.body,
        updatedAt: new Date(),
      })
      .where(eq(story_chapters.id, req.params.id))
      .returning()

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Chapter not found' })
    }

    res.json({ chapter: updated[0] })
  } catch (error) {
    console.error('Error updating chapter:', error)
    res.status(500).json({ error: 'Failed to update chapter' })
  }
})

// Mark chapter as read
router.post('/chapters/:id/read', async (req, res) => {
  try {
    const updated = await db
      .update(story_chapters)
      .set({
        isRead: true,
        updatedAt: new Date(),
      })
      .where(eq(story_chapters.id, req.params.id))
      .returning()

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Chapter not found' })
    }

    res.json({ chapter: updated[0] })
  } catch (error) {
    console.error('Error marking chapter as read:', error)
    res.status(500).json({ error: 'Failed to mark chapter as read' })
  }
})

// ============================================
// STORY GENERATION (Backend com OpenAI)
// ============================================

/**
 * Gerar história completa para um paciente
 * POST /stories/generate
 */
router.post('/stories/generate', async (req, res) => {
  try {
    const { patientId, treatmentId, preferences, totalAligners } = req.body

    if (!patientId || !preferences || !totalAligners) {
      return res.status(400).json({ error: 'patientId, preferences e totalAligners são obrigatórios' })
    }

    console.log(`🎨 Gerando história para paciente ${patientId}`)

    // 1. Salvar preferências
    const prefExists = await db
      .select()
      .from(story_preferences)
      .where(eq(story_preferences.patientId, patientId))

    if (prefExists.length > 0) {
      await db
        .update(story_preferences)
        .set({
          environment: preferences.environment,
          mainCharacter: preferences.mainCharacter,
          mainCharacterName: preferences.mainCharacterName,
          sidekick: preferences.sidekick,
          theme: preferences.theme,
          ageGroup: preferences.ageGroup,
          updatedAt: new Date(),
        })
        .where(eq(story_preferences.patientId, patientId))
    } else {
      await db.insert(story_preferences).values({
        id: `pref-${Date.now()}`,
        patientId,
        treatmentId: treatmentId || null,
        environment: preferences.environment,
        mainCharacter: preferences.mainCharacter,
        mainCharacterName: preferences.mainCharacterName,
        sidekick: preferences.sidekick,
        theme: preferences.theme,
        ageGroup: preferences.ageGroup,
      })
    }

    // 2. Criar série de história
    const seriesResponse = await db
      .insert(stories)
      .values({
        id: `story-${Date.now()}`,
        patientId,
        treatmentId: treatmentId || null,
        title: 'História Mágica', // Temporário
        totalChapters: totalAligners,
        currentChapter: 1,
      })
      .returning()

    const series = seriesResponse[0]

    // 3. Gerar capítulos em lotes
    const BATCH_SIZE = 5
    const totalChapters = totalAligners
    const totalBatches = Math.ceil(totalChapters / BATCH_SIZE)
    let storyTitle = ''
    const allChapters: any[] = []

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startChapter = batchIndex * BATCH_SIZE + 1
      const endChapter = Math.min(startChapter + BATCH_SIZE - 1, totalChapters)

      console.log(`📝 Gerando lote ${batchIndex + 1}/${totalBatches} (capítulos ${startChapter}-${endChapter})`)

      const batch = await StoryGenerationService.generateChapterBatch(
        preferences,
        totalChapters,
        startChapter,
        endChapter,
        allChapters.map((ch) => ({
          chapterNumber: ch.chapterNumber,
          title: ch.title,
          content: ch.content,
        })),
        storyTitle || undefined
      )

      // Salvar título (primeira vez)
      if (!storyTitle && batch.storyTitle) {
        storyTitle = batch.storyTitle
        await db
          .update(stories)
          .set({ title: storyTitle })
          .where(eq(stories.id, series.id))
      }

      // Salvar capítulos do lote
      for (const chapterData of batch.chapters) {
        await db.insert(story_chapters).values({
          id: `chapter-${Date.now()}-${chapterData.chapterNumber}`,
          storyId: series.id,
          treatmentId: treatmentId || null,
          chapterNumber: chapterData.chapterNumber,
          requiredAlignerNumber: chapterData.requiredAlignerNumber,
          title: chapterData.title,
          content: chapterData.content,
          wordCount: chapterData.wordCount,
          isUnlocked: chapterData.chapterNumber === 1, // Só o primeiro desbloqueado
          isRead: false,
          audioUrl: null,
          audioGenerated: false,
          readCount: 0,
        })

        allChapters.push(chapterData)

        // Delay para IDs únicos
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }

    // 4. Marcar série como completa
    await db
      .update(stories)
      .set({ updatedAt: new Date() })
      .where(eq(stories.id, series.id))

    console.log(`✅ História gerada com sucesso: ${storyTitle}`)

    res.json({
      success: true,
      story: {
        ...series,
        title: storyTitle,
      },
      chaptersGenerated: allChapters.length,
    })
  } catch (error) {
    console.error('❌ Erro ao gerar história:', error)
    res.status(500).json({
      error: 'Failed to generate story',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export default router
