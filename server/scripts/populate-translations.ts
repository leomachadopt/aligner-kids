/**
 * Script to populate initial translations
 */
import { db } from '../db'
import { translations } from '../db/schema'
import { nanoid } from 'nanoid'

const initialTranslations = [
  // Mission: Uso Diário Perfeito (Daily Perfect Usage)
  { entityId: 'daily-22h-usage', field: 'name', lang: 'pt-PT', value: 'Uso Diário Perfeito' },
  { entityId: 'daily-22h-usage', field: 'description', lang: 'pt-PT', value: 'Usa o alinhador por 22 horas ou mais hoje' },
  { entityId: 'daily-22h-usage', field: 'name', lang: 'en-US', value: 'Daily Perfect Usage' },
  { entityId: 'daily-22h-usage', field: 'description', lang: 'en-US', value: 'Wear your aligner for 22 hours or more today' },
  { entityId: 'daily-22h-usage', field: 'name', lang: 'es-ES', value: 'Uso Diario Perfecto' },
  { entityId: 'daily-22h-usage', field: 'description', lang: 'es-ES', value: 'Usa el alineador por 22 horas o más hoy' },

  // Mission: Semana Completa (Complete Week)
  { entityId: 'week-7-days', field: 'name', lang: 'pt-PT', value: 'Semana Completa' },
  { entityId: 'week-7-days', field: 'description', lang: 'pt-PT', value: 'Usa o alinhador por 22h+ durante 7 dias consecutivos' },
  { entityId: 'week-7-days', field: 'name', lang: 'en-US', value: 'Complete Week' },
  { entityId: 'week-7-days', field: 'description', lang: 'en-US', value: 'Wear your aligner for 22h+ for 7 consecutive days' },
  { entityId: 'week-7-days', field: 'name', lang: 'es-ES', value: 'Semana Completa' },
  { entityId: 'week-7-days', field: 'description', lang: 'es-ES', value: 'Usa el alineador por 22h+ durante 7 días consecutivos' },

  // Mission: Mês Campeão (Champion Month)
  { entityId: 'month-30-days', field: 'name', lang: 'pt-PT', value: 'Mês Campeão' },
  { entityId: 'month-30-days', field: 'description', lang: 'pt-PT', value: 'Completa 30 dias com 20h+ de uso do alinhador' },
  { entityId: 'month-30-days', field: 'name', lang: 'en-US', value: 'Champion Month' },
  { entityId: 'month-30-days', field: 'description', lang: 'en-US', value: 'Complete 30 days with 20h+ of aligner usage' },
  { entityId: 'month-30-days', field: 'name', lang: 'es-ES', value: 'Mes Campeón' },
  { entityId: 'month-30-days', field: 'description', lang: 'es-ES', value: 'Completa 30 días con 20h+ de uso del alineador' },

  // Mission: Primeira Semana (First Week Milestone)
  { entityId: 'milestone-first-week', field: 'name', lang: 'pt-PT', value: 'Primeira Semana' },
  { entityId: 'milestone-first-week', field: 'description', lang: 'pt-PT', value: 'Completa a tua primeira semana de tratamento' },
  { entityId: 'milestone-first-week', field: 'name', lang: 'en-US', value: 'First Week' },
  { entityId: 'milestone-first-week', field: 'description', lang: 'en-US', value: 'Complete your first week of treatment' },
  { entityId: 'milestone-first-week', field: 'name', lang: 'es-ES', value: 'Primera Semana' },
  { entityId: 'milestone-first-week', field: 'description', lang: 'es-ES', value: 'Completa tu primera semana de tratamiento' },

  // Mission: Primeiro Mês (First Month Milestone)
  { entityId: 'milestone-first-month', field: 'name', lang: 'pt-PT', value: 'Primeiro Mês' },
  { entityId: 'milestone-first-month', field: 'description', lang: 'pt-PT', value: 'Completa o teu primeiro mês de tratamento' },
  { entityId: 'milestone-first-month', field: 'name', lang: 'en-US', value: 'First Month' },
  { entityId: 'milestone-first-month', field: 'description', lang: 'en-US', value: 'Complete your first month of treatment' },
  { entityId: 'milestone-first-month', field: 'name', lang: 'es-ES', value: 'Primer Mes' },
  { entityId: 'milestone-first-month', field: 'description', lang: 'es-ES', value: 'Completa tu primer mes de tratamiento' },

  // Mission: Meio do Caminho (Halfway Milestone)
  { entityId: 'milestone-halfway', field: 'name', lang: 'pt-PT', value: 'A Meio Caminho' },
  { entityId: 'milestone-halfway', field: 'description', lang: 'pt-PT', value: 'Chega a metade dos teus alinhadores' },
  { entityId: 'milestone-halfway', field: 'name', lang: 'en-US', value: 'Halfway There' },
  { entityId: 'milestone-halfway', field: 'description', lang: 'en-US', value: 'Reach the halfway point of your aligners' },
  { entityId: 'milestone-halfway', field: 'name', lang: 'es-ES', value: 'A Mitad de Camino' },
  { entityId: 'milestone-halfway', field: 'description', lang: 'es-ES', value: 'Llega a la mitad de tus alineadores' },
]

async function populateTranslations() {
  console.log('🚀 Populating initial translations...')
  console.log(`📝 Inserting ${initialTranslations.length} translation entries...`)

  try {
    for (const trans of initialTranslations) {
      await db.insert(translations).values({
        id: `trans_${trans.entityId}_${trans.field}_${trans.lang}_${nanoid(6)}`,
        entityType: 'mission_template',
        entityId: trans.entityId,
        fieldName: trans.field,
        language: trans.lang,
        value: trans.value,
      }).onConflictDoNothing()
    }

    console.log('✅ Translations populated successfully!')

    // Verify
    const result = await db.select().from(translations)
    console.log(`📊 Total translations in database: ${result.length}`)

  } catch (error) {
    console.error('❌ Error populating translations:', error)
    throw error
  }
}

populateTranslations()
  .then(() => {
    console.log('✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Failed:', error)
    process.exit(1)
  })
