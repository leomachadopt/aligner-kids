/**
 * Serviço de Exportação e Importação de Dados
 * Permite transferir todos os dados do localStorage entre ambientes
 */

// ============================================
// TIPOS
// ============================================

interface ExportData {
  version: string
  exportedAt: string
  clinics: any[]
  patients: any[]
  aligners: any[]
  missionTemplates: any[]
  clinicMissionConfigs: any[]
  patientMissions: any[]
  patientPoints: any[]
  stories: any[]
  storyPreferences: any[]
}

// ============================================
// CLASSE PRINCIPAL
// ============================================

export class DataExportService {
  private static readonly VERSION = '1.0.0'

  /**
   * Exporta todos os dados do localStorage
   */
  static exportAll(): ExportData {
    console.log('📦 Exportando todos os dados...')

    const data: ExportData = {
      version: this.VERSION,
      exportedAt: new Date().toISOString(),
      clinics: this.getStorageData('clinics'),
      patients: this.getStorageData('patients'),
      aligners: this.getStorageData('aligners'),
      missionTemplates: this.getStorageData('mission_templates'),
      clinicMissionConfigs: this.getStorageData('clinic_mission_configs'),
      patientMissions: this.getStorageData('patient_missions'),
      patientPoints: this.getStorageData('patient_points'),
      stories: this.getStorageData('stories'),
      storyPreferences: this.getStorageData('story_preferences'),
    }

    console.log('✅ Dados exportados:', {
      clinics: data.clinics.length,
      patients: data.patients.length,
      aligners: data.aligners.length,
      missionTemplates: data.missionTemplates.length,
      patientMissions: data.patientMissions.length,
      stories: data.stories.length,
    })

    return data
  }

  /**
   * Importa todos os dados para o localStorage
   */
  static importAll(data: ExportData, options: { merge?: boolean } = {}): void {
    console.log('📥 Importando dados...', {
      version: data.version,
      exportedAt: data.exportedAt,
      merge: options.merge,
    })

    try {
      if (options.merge) {
        // Modo merge: mescla com dados existentes
        this.mergeStorageData('clinics', data.clinics)
        this.mergeStorageData('patients', data.patients)
        this.mergeStorageData('aligners', data.aligners)
        this.mergeStorageData('mission_templates', data.missionTemplates)
        this.mergeStorageData('clinic_mission_configs', data.clinicMissionConfigs)
        this.mergeStorageData('patient_missions', data.patientMissions)
        this.mergeStorageData('patient_points', data.patientPoints)
        this.mergeStorageData('stories', data.stories)
        this.mergeStorageData('story_preferences', data.storyPreferences)
      } else {
        // Modo replace: substitui completamente
        this.setStorageData('clinics', data.clinics)
        this.setStorageData('patients', data.patients)
        this.setStorageData('aligners', data.aligners)
        this.setStorageData('mission_templates', data.missionTemplates)
        this.setStorageData('clinic_mission_configs', data.clinicMissionConfigs)
        this.setStorageData('patient_missions', data.patientMissions)
        this.setStorageData('patient_points', data.patientPoints)
        this.setStorageData('stories', data.stories)
        this.setStorageData('story_preferences', data.storyPreferences)
      }

      console.log('✅ Dados importados com sucesso!')
    } catch (error) {
      console.error('❌ Erro ao importar dados:', error)
      throw new Error(
        `Erro ao importar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      )
    }
  }

  /**
   * Baixa os dados como arquivo JSON
   */
  static downloadAsFile(): void {
    const data = this.exportAll()
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const filename = `aligner-kids-backup-${new Date().toISOString().split('T')[0]}.json`

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    console.log('💾 Arquivo baixado:', filename)
  }

  /**
   * Lê arquivo JSON e importa
   */
  static async importFromFile(
    file: File,
    options: { merge?: boolean } = {},
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const json = event.target?.result as string
          const data = JSON.parse(json) as ExportData

          // Validar estrutura
          if (!data.version || !data.exportedAt) {
            throw new Error('Arquivo inválido: falta informações de versão')
          }

          this.importAll(data, options)
          resolve()
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => {
        reject(new Error('Erro ao ler arquivo'))
      }

      reader.readAsText(file)
    })
  }

  /**
   * Limpa todos os dados (usar com cuidado!)
   */
  static clearAll(): void {
    console.warn('⚠️ LIMPANDO TODOS OS DADOS...')

    localStorage.removeItem('clinics')
    localStorage.removeItem('patients')
    localStorage.removeItem('aligners')
    localStorage.removeItem('mission_templates')
    localStorage.removeItem('clinic_mission_configs')
    localStorage.removeItem('patient_missions')
    localStorage.removeItem('patient_points')
    localStorage.removeItem('stories')
    localStorage.removeItem('story_preferences')

    console.log('🗑️ Todos os dados foram removidos')
  }

  /**
   * Obtém estatísticas dos dados atuais
   */
  static getStats() {
    return {
      clinics: this.getStorageData('clinics').length,
      patients: this.getStorageData('patients').length,
      aligners: this.getStorageData('aligners').length,
      missionTemplates: this.getStorageData('mission_templates').length,
      patientMissions: this.getStorageData('patient_missions').length,
      stories: this.getStorageData('stories').length,
    }
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  private static getStorageData(key: string): any[] {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  }

  private static setStorageData(key: string, data: any[]): void {
    localStorage.setItem(key, JSON.stringify(data))
  }

  private static mergeStorageData(key: string, newData: any[]): void {
    const existing = this.getStorageData(key)

    // Criar um mapa por ID para evitar duplicatas
    const merged = new Map()

    // Adicionar existentes
    existing.forEach((item) => {
      if (item.id) {
        merged.set(item.id, item)
      }
    })

    // Adicionar/sobrescrever com novos
    newData.forEach((item) => {
      if (item.id) {
        merged.set(item.id, item)
      }
    })

    // Salvar
    this.setStorageData(key, Array.from(merged.values()))
  }
}

export default DataExportService
