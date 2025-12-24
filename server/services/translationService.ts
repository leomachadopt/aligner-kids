/**
 * Translation Service
 * Handles fetching and applying translations from the database
 */
import { db } from '../db'
import { translations } from '../db/schema'
import { eq, and, inArray } from 'drizzle-orm'

export interface TranslationMap {
  [fieldName: string]: string
}

export interface TranslatedEntity<T> extends Record<string, any> {
  _original?: T
}

export class TranslationService {
  /**
   * Default fallback language
   */
  private static readonly DEFAULT_LANGUAGE = 'pt-PT'

  /**
   * Get translations for a single entity
   * @param entityType - Type of entity (e.g., 'mission_template', 'reward_program')
   * @param entityId - ID of the entity
   * @param language - Target language code (e.g., 'en-US', 'pt-BR')
   * @returns Map of field names to translated values
   */
  static async getTranslations(
    entityType: string,
    entityId: string,
    language: string
  ): Promise<TranslationMap> {
    try {
      const results = await db
        .select()
        .from(translations)
        .where(
          and(
            eq(translations.entityType, entityType),
            eq(translations.entityId, entityId),
            eq(translations.language, language)
          )
        )

      const translationMap: TranslationMap = {}
      for (const result of results) {
        translationMap[result.fieldName] = result.value
      }

      return translationMap
    } catch (error) {
      console.error(`Error fetching translations for ${entityType}:${entityId}:`, error)
      return {}
    }
  }

  /**
   * Get translations for multiple entities at once
   * @param entityType - Type of entity
   * @param entityIds - Array of entity IDs
   * @param language - Target language code
   * @returns Map of entity IDs to their translation maps
   */
  static async getTranslationsForEntities(
    entityType: string,
    entityIds: string[],
    language: string
  ): Promise<Record<string, TranslationMap>> {
    if (entityIds.length === 0) return {}

    try {
      const results = await db
        .select()
        .from(translations)
        .where(
          and(
            eq(translations.entityType, entityType),
            inArray(translations.entityId, entityIds),
            eq(translations.language, language)
          )
        )

      const translationsMap: Record<string, TranslationMap> = {}

      for (const result of results) {
        if (!translationsMap[result.entityId]) {
          translationsMap[result.entityId] = {}
        }
        translationsMap[result.entityId][result.fieldName] = result.value
      }

      return translationsMap
    } catch (error) {
      console.error(`Error fetching bulk translations for ${entityType}:`, error)
      return {}
    }
  }

  /**
   * Apply translations to a base object
   * @param baseObject - The base object to translate
   * @param translationMap - Map of field names to translated values
   * @param fields - Array of field names to translate
   * @returns New object with translations applied
   */
  static applyTranslations<T extends Record<string, any>>(
    baseObject: T,
    translationMap: TranslationMap,
    fields: string[]
  ): TranslatedEntity<T> {
    const translated = { ...baseObject }

    for (const field of fields) {
      if (translationMap[field]) {
        translated[field] = translationMap[field]
      }
    }

    return translated
  }

  /**
   * Translate a single entity with automatic fallback
   * @param entityType - Type of entity
   * @param entity - The entity object (must have 'id' field)
   * @param language - Target language
   * @param fields - Fields to translate
   * @returns Translated entity
   */
  static async translateEntity<T extends { id: string }>(
    entityType: string,
    entity: T,
    language: string,
    fields: string[]
  ): Promise<TranslatedEntity<T>> {
    let translationMap = await this.getTranslations(entityType, entity.id, language)

    // Fallback to default language if no translations found
    if (Object.keys(translationMap).length === 0 && language !== this.DEFAULT_LANGUAGE) {
      translationMap = await this.getTranslations(entityType, entity.id, this.DEFAULT_LANGUAGE)
    }

    return this.applyTranslations(entity, translationMap, fields)
  }

  /**
   * Translate multiple entities with automatic fallback
   * @param entityType - Type of entity
   * @param entities - Array of entities (must have 'id' field)
   * @param language - Target language
   * @param fields - Fields to translate
   * @returns Array of translated entities
   */
  static async translateEntities<T extends { id: string }>(
    entityType: string,
    entities: T[],
    language: string,
    fields: string[]
  ): Promise<TranslatedEntity<T>[]> {
    if (entities.length === 0) return []

    const entityIds = entities.map(e => e.id)
    let translationsMap = await this.getTranslationsForEntities(entityType, entityIds, language)

    // Check if we need fallback
    const needsFallback = entities.some(entity => !translationsMap[entity.id])
    if (needsFallback && language !== this.DEFAULT_LANGUAGE) {
      const fallbackTranslations = await this.getTranslationsForEntities(
        entityType,
        entityIds,
        this.DEFAULT_LANGUAGE
      )

      // Merge fallback translations
      for (const entityId of entityIds) {
        if (!translationsMap[entityId] && fallbackTranslations[entityId]) {
          translationsMap[entityId] = fallbackTranslations[entityId]
        }
      }
    }

    return entities.map(entity => {
      const translationMap = translationsMap[entity.id] || {}
      return this.applyTranslations(entity, translationMap, fields)
    })
  }

  /**
   * Get translated mission templates
   * Convenience method for mission templates
   */
  static async translateMissionTemplates<T extends { id: string }>(
    templates: T[],
    language: string
  ): Promise<TranslatedEntity<T>[]> {
    return this.translateEntities(
      'mission_template',
      templates,
      language,
      ['name', 'description']
    )
  }

  /**
   * Get translated reward programs
   * Convenience method for reward programs
   */
  static async translateRewardPrograms<T extends { id: string }>(
    programs: T[],
    language: string
  ): Promise<TranslatedEntity<T>[]> {
    return this.translateEntities(
      'reward_program',
      programs,
      language,
      ['name', 'description']
    )
  }

  /**
   * Get translated education content
   * Convenience method for education content
   */
  static async translateEducationContent<T extends { id: string }>(
    content: T[],
    language: string
  ): Promise<TranslatedEntity<T>[]> {
    return this.translateEntities(
      'education_content',
      content,
      language,
      ['title', 'content', 'description']
    )
  }
}
