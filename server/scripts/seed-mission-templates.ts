/**
 * Seed de templates de missão no banco (PostgreSQL/Neon)
 * - Adiciona a coluna aligner_interval se não existir
 * - Insere os templates padrão se a tabela estiver vazia
 *
 * Execução sugerida:
 *   pnpm ts-node server/scripts/seed-mission-templates.ts
 */

import { db, mission_templates, mission_programs, mission_program_templates } from '../db'
import { sql } from 'drizzle-orm'

async function ensureAlignerIntervalColumn() {
  await db.execute(
    sql`ALTER TABLE mission_templates ADD COLUMN IF NOT EXISTS aligner_interval integer DEFAULT 1 NOT NULL;`,
  )
  console.log('✅ aligner_interval garantida em mission_templates')
}

async function ensureMissionProgramsTables() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS mission_programs (
      id varchar(255) PRIMARY KEY,
      clinic_id varchar(255),
      name varchar(255) NOT NULL,
      description text,
      is_default boolean DEFAULT false,
      created_by varchar(255),
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS mission_program_templates (
      id varchar(255) PRIMARY KEY,
      program_id varchar(255) NOT NULL,
      mission_template_id varchar(255) NOT NULL,
      is_active boolean DEFAULT true,
      aligner_interval integer DEFAULT 1 NOT NULL,
      trigger varchar(100),
      trigger_aligner_number integer,
      trigger_days_offset integer,
      custom_points integer,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );
  `)
  console.log('✅ Tabelas mission_programs e mission_program_templates garantidas')
}

type DefaultTemplate = {
  name: string
  description: string
  category: string
  frequency: string
  completionCriteria: string
  targetValue: number
  basePoints: number
  bonusPoints?: number
  iconEmoji: string
  color: string
  requiresManualValidation: boolean
  canAutoActivate: boolean
  alignerInterval: number
}

const defaults: DefaultTemplate[] = [
  // Uso do Alinhador
  {
    name: 'Uso Diário Perfeito',
    description: 'Use o alinhador por 22 horas ou mais hoje',
    category: 'usage',
    frequency: 'daily',
    completionCriteria: 'time_based',
    targetValue: 22,
    basePoints: 10,
    bonusPoints: 0,
    iconEmoji: '⭐',
    color: '#FFD700',
    requiresManualValidation: false,
    canAutoActivate: true,
    alignerInterval: 1,
  },
  {
    name: 'Semana Completa',
    description: 'Use o alinhador por 22h+ durante 7 dias consecutivos',
    category: 'usage',
    frequency: 'weekly',
    completionCriteria: 'days_streak',
    targetValue: 7,
    basePoints: 100,
    bonusPoints: 20,
    iconEmoji: '🏆',
    color: '#FF6B6B',
    requiresManualValidation: false,
    canAutoActivate: true,
    alignerInterval: 1,
  },
  {
    name: 'Mês Campeão',
    description: 'Complete 30 dias com 20h+ de uso do alinhador',
    category: 'usage',
    frequency: 'monthly',
    completionCriteria: 'days_streak',
    targetValue: 30,
    basePoints: 300,
    bonusPoints: 50,
    iconEmoji: '💪',
    color: '#4ECDC4',
    requiresManualValidation: false,
    canAutoActivate: true,
    alignerInterval: 1,
  },

  // Higiene
  {
    name: 'Higiene Impecável',
    description: 'Limpe o alinhador 2x ao dia durante 7 dias',
    category: 'hygiene',
    frequency: 'weekly',
    completionCriteria: 'total_count',
    targetValue: 14,
    basePoints: 80,
    bonusPoints: 0,
    iconEmoji: '✨',
    color: '#95E1D3',
    requiresManualValidation: false,
    canAutoActivate: true,
    alignerInterval: 1,
  },
  {
    name: 'Fio Dental Diário',
    description: 'Use fio dental todos os dias por uma semana',
    category: 'hygiene',
    frequency: 'weekly',
    completionCriteria: 'days_streak',
    targetValue: 7,
    basePoints: 60,
    bonusPoints: 0,
    iconEmoji: '🧵',
    color: '#F38181',
    requiresManualValidation: false,
    canAutoActivate: true,
    alignerInterval: 1,
  },

  // Marcos
  {
    name: 'Primeira Semana',
    description: 'Complete sua primeira semana de tratamento',
    category: 'milestones',
    frequency: 'once',
    completionCriteria: 'time_based',
    targetValue: 7,
    basePoints: 50,
    bonusPoints: 0,
    iconEmoji: '🎯',
    color: '#AA96DA',
    requiresManualValidation: false,
    canAutoActivate: true,
    alignerInterval: 1,
  },
  {
    name: 'Primeiro Mês',
    description: 'Complete seu primeiro mês de tratamento',
    category: 'milestones',
    frequency: 'once',
    completionCriteria: 'time_based',
    targetValue: 30,
    basePoints: 150,
    bonusPoints: 0,
    iconEmoji: '🥇',
    color: '#FCBAD3',
    requiresManualValidation: false,
    canAutoActivate: true,
    alignerInterval: 1,
  },
  {
    name: 'Meio do Caminho',
    description: 'Chegue à metade dos seus alinhadores',
    category: 'milestones',
    frequency: 'once',
    completionCriteria: 'percentage',
    targetValue: 50,
    basePoints: 1000,
    bonusPoints: 200,
    iconEmoji: '💎',
    color: '#FFFFD2',
    requiresManualValidation: false,
    canAutoActivate: true,
    alignerInterval: 1,
  },

  // Troca de Alinhador
  {
    name: 'Troca Pontual',
    description: 'Troque o alinhador na data correta',
    category: 'aligner_change',
    frequency: 'per_aligner',
    completionCriteria: 'manual',
    targetValue: 1,
    basePoints: 50,
    bonusPoints: 0,
    iconEmoji: '⏰',
    color: '#A8E6CF',
    requiresManualValidation: true,
    canAutoActivate: false,
    alignerInterval: 1,
  },

  // Consultas
  {
    name: 'Presença Exemplar',
    description: 'Compareça à sua consulta agendada',
    category: 'appointments',
    frequency: 'custom',
    completionCriteria: 'manual',
    targetValue: 1,
    basePoints: 30,
    bonusPoints: 0,
    iconEmoji: '👨‍⚕️',
    color: '#FFD3B6',
    requiresManualValidation: true,
    canAutoActivate: false,
    alignerInterval: 1,
  },
]

async function seed() {
  await ensureAlignerIntervalColumn()
  await ensureMissionProgramsTables()

  // Seed templates if empty
  const current = await db.select().from(mission_templates)
  let templatesToUse = current

  if (current.length === 0) {
    const rows = defaults.map((d) => ({
      id: `template-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      isActiveByDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...d,
    }))

    await db.insert(mission_templates).values(rows)
    templatesToUse = rows as any
    console.log(`✅ Seeded ${rows.length} mission templates`)
  } else {
    console.log(`ℹ️ Já existem ${current.length} templates. Pulando seed de templates.`)
  }

  // Seed default mission program if none exists
  const existingPrograms = await db.select().from(mission_programs)
  if (existingPrograms.length === 0) {
    const programId = `program-${Date.now()}`
    const program = {
      id: programId,
      clinicId: null,
      name: 'Programa Padrão Global',
      description: 'Programa padrão com todos os templates seedados',
      isDefault: true,
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.insert(mission_programs).values(program as any)

    const rows = templatesToUse.map((t: any) => ({
      id: `program-template-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      programId,
      missionTemplateId: t.id,
      isActive: true,
      alignerInterval: t.alignerInterval || 1,
      trigger: 'on_aligner_N_start',
      triggerAlignerNumber: null,
      triggerDaysOffset: null,
      customPoints: t.basePoints,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))

    await db.insert(mission_program_templates).values(rows as any)
    console.log(`✅ Programa padrão criado com ${rows.length} templates`)
  } else {
    console.log(`ℹ️ Já existem ${existingPrograms.length} programas. Pulando seed de programa.`)
  }
}

seed()
  .catch((err) => {
    console.error('❌ Erro ao executar seed de mission templates', err)
    process.exit(1)
  })
  .finally(() => process.exit(0))

