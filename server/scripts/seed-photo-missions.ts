/**
 * Seed Photo Mission Templates
 * Cria templates de missões para envio de fotos periódicas
 */

import dotenv from 'dotenv'
dotenv.config()

import { db, mission_templates } from '../db/index'
import { nanoid } from 'nanoid'
import { eq } from 'drizzle-orm'

const photoMissionTemplates = [
  {
    id: `template-${nanoid()}`,
    name: 'Foto Frontal do Sorriso',
    description: 'Tire uma foto do seu sorriso de frente para registrar o progresso do tratamento',
    category: 'photos',
    frequency: 'per_aligner',
    completionCriteria: 'photo_upload',
    targetValue: 1,
    basePoints: 50,
    bonusPoints: 20,
    iconEmoji: '📸',
    color: '#10B981',
    alignerInterval: 1, // Toda troca de alinhador
    isActiveByDefault: true,
    requiresManualValidation: false,
    canAutoActivate: true,
    repetitionType: 'per_aligner',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: `template-${nanoid()}`,
    name: 'Foto Lateral Direita',
    description: 'Tire uma foto do lado direito do seu sorriso',
    category: 'photos',
    frequency: 'per_aligner',
    completionCriteria: 'photo_upload',
    targetValue: 1,
    basePoints: 30,
    bonusPoints: 10,
    iconEmoji: '📸',
    color: '#10B981',
    alignerInterval: 1,
    isActiveByDefault: true,
    requiresManualValidation: false,
    canAutoActivate: true,
    repetitionType: 'per_aligner',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: `template-${nanoid()}`,
    name: 'Foto Lateral Esquerda',
    description: 'Tire uma foto do lado esquerdo do seu sorriso',
    category: 'photos',
    frequency: 'per_aligner',
    completionCriteria: 'photo_upload',
    targetValue: 1,
    basePoints: 30,
    bonusPoints: 10,
    iconEmoji: '📸',
    color: '#10B981',
    alignerInterval: 1,
    isActiveByDefault: true,
    requiresManualValidation: false,
    canAutoActivate: true,
    repetitionType: 'per_aligner',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: `template-${nanoid()}`,
    name: 'Registro Fotográfico Completo',
    description: 'Complete todas as 3 fotos (frontal, direita e esquerda) e ganhe bônus extra!',
    category: 'photos',
    frequency: 'per_aligner',
    completionCriteria: 'photo_set_complete',
    targetValue: 3,
    basePoints: 100,
    bonusPoints: 50,
    iconEmoji: '🎯',
    color: '#F59E0B',
    alignerInterval: 1,
    isActiveByDefault: true,
    requiresManualValidation: false,
    canAutoActivate: true,
    repetitionType: 'per_aligner',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

async function seedPhotoMissions() {
  try {
    console.log('🌱 Iniciando seed de missões de fotos...')

    // Verificar se já existem missões de fotos
    const existingPhotoMissions = await db
      .select()
      .from(mission_templates)
      .where(eq(mission_templates.category, 'photos'))

    if (existingPhotoMissions.length > 0) {
      console.log('⚠️  Missões de fotos já existem. Pulando seed.')
      return
    }

    // Inserir templates
    await db.insert(mission_templates).values(photoMissionTemplates)

    console.log('✅ Templates de missões de fotos criados com sucesso!')
    console.log(`📸 ${photoMissionTemplates.length} templates adicionados`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Erro ao criar templates de missões:', error)
    process.exit(1)
  }
}

seedPhotoMissions()
