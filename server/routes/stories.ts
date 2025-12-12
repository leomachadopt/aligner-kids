/**
 * Stories Routes
 */

import { Router } from 'express'
import { db, stories, story_chapters, story_preferences } from '../db/index'
import { eq, and } from 'drizzle-orm'

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

export default router
