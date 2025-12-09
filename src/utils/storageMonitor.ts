/**
 * Monitor de localStorage
 * Detecta quando dados são perdidos e registra no console
 */

interface StorageSnapshot {
  timestamp: string
  clinics: number
  users: number
  aligners: number
  treatments: number
  stories: number
  missions: number
}

class StorageMonitor {
  private checkInterval: number = 5000 // 5 segundos
  private intervalId: number | null = null
  private lastSnapshot: StorageSnapshot | null = null

  /**
   * Inicia o monitoramento
   */
  start() {
    if (this.intervalId) {
      console.log('⚠️ Storage monitor já está rodando')
      return
    }

    console.log('🔍 Storage Monitor: INICIADO')
    console.log('   Verificando localStorage a cada', this.checkInterval / 1000, 'segundos')

    // Snapshot inicial
    this.lastSnapshot = this.takeSnapshot()
    this.logSnapshot('Snapshot inicial', this.lastSnapshot)

    // Verificar periodicamente
    this.intervalId = window.setInterval(() => {
      this.check()
    }, this.checkInterval)
  }

  /**
   * Para o monitoramento
   */
  stop() {
    if (this.intervalId) {
      window.clearInterval(this.intervalId)
      this.intervalId = null
      console.log('🔍 Storage Monitor: PARADO')
    }
  }

  /**
   * Tira um snapshot do estado atual
   */
  private takeSnapshot(): StorageSnapshot {
    const getCount = (key: string): number => {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data).length : 0
    }

    return {
      timestamp: new Date().toISOString(),
      clinics: getCount('clinics'),
      users: getCount('auth_users'),
      aligners: getCount('aligners'),
      treatments: getCount('treatments'),
      stories: getCount('stories'),
      missions: getCount('patient_missions'),
    }
  }

  /**
   * Verifica se houve mudanças
   */
  private check() {
    const current = this.takeSnapshot()

    if (!this.lastSnapshot) {
      this.lastSnapshot = current
      return
    }

    // Detectar perdas
    const losses: string[] = []

    if (current.clinics < this.lastSnapshot.clinics) {
      losses.push(`${this.lastSnapshot.clinics - current.clinics} clínica(s)`)
    }
    if (current.users < this.lastSnapshot.users) {
      losses.push(`${this.lastSnapshot.users - current.users} usuário(s)`)
    }
    if (current.aligners < this.lastSnapshot.aligners) {
      losses.push(`${this.lastSnapshot.aligners - current.aligners} alinhador(es)`)
    }
    if (current.treatments < this.lastSnapshot.treatments) {
      losses.push(`${this.lastSnapshot.treatments - current.treatments} tratamento(s)`)
    }
    if (current.stories < this.lastSnapshot.stories) {
      losses.push(`${this.lastSnapshot.stories - current.stories} história(s)`)
    }
    if (current.missions < this.lastSnapshot.missions) {
      losses.push(`${this.lastSnapshot.missions - current.missions} missão(ões)`)
    }

    // Se houve perdas, alertar
    if (losses.length > 0) {
      console.error('🚨 PERDA DE DADOS DETECTADA! 🚨')
      console.error('   Timestamp:', current.timestamp)
      console.error('   Perdas:', losses.join(', '))
      this.logSnapshot('Antes', this.lastSnapshot)
      this.logSnapshot('Depois', current)

      // Stack trace para ver o que causou
      console.trace('Stack trace da perda de dados')
    }

    // Detectar ganhos (novos dados criados)
    const gains: string[] = []

    if (current.clinics > this.lastSnapshot.clinics) {
      gains.push(`+${current.clinics - this.lastSnapshot.clinics} clínica(s)`)
    }
    if (current.users > this.lastSnapshot.users) {
      gains.push(`+${current.users - this.lastSnapshot.users} usuário(s)`)
    }
    if (current.aligners > this.lastSnapshot.aligners) {
      gains.push(`+${current.aligners - this.lastSnapshot.aligners} alinhador(es)`)
    }
    if (current.treatments > this.lastSnapshot.treatments) {
      gains.push(`+${current.treatments - this.lastSnapshot.treatments} tratamento(s)`)
    }
    if (current.stories > this.lastSnapshot.stories) {
      gains.push(`+${current.stories - this.lastSnapshot.stories} história(s)`)
    }
    if (current.missions > this.lastSnapshot.missions) {
      gains.push(`+${current.missions - this.lastSnapshot.missions} missão(ões)`)
    }

    if (gains.length > 0) {
      console.log('✅ Novos dados criados:', gains.join(', '))
    }

    this.lastSnapshot = current
  }

  /**
   * Loga um snapshot formatado
   */
  private logSnapshot(label: string, snapshot: StorageSnapshot) {
    console.log(`   ${label}:`, {
      clínicas: snapshot.clinics,
      usuários: snapshot.users,
      alinhadores: snapshot.aligners,
      tratamentos: snapshot.treatments,
      histórias: snapshot.stories,
      missões: snapshot.missions,
      timestamp: new Date(snapshot.timestamp).toLocaleTimeString(),
    })
  }

  /**
   * Mostra estado atual
   */
  showStatus() {
    const current = this.takeSnapshot()
    console.log('📊 Estado atual do localStorage:')
    this.logSnapshot('Dados', current)
  }

  /**
   * Verifica se há dados
   */
  hasData(): boolean {
    const current = this.takeSnapshot()
    return (
      current.clinics > 0 ||
      current.users > 0 ||
      current.aligners > 0 ||
      current.treatments > 0 ||
      current.stories > 0 ||
      current.missions > 0
    )
  }
}

// Instância global
const storageMonitor = new StorageMonitor()

// Iniciar automaticamente em desenvolvimento
if (import.meta.env.DEV) {
  storageMonitor.start()
}

// Disponibilizar globalmente
if (typeof window !== 'undefined') {
  ;(window as any).storageMonitor = storageMonitor
}

export default storageMonitor
