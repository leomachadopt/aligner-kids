/**
 * Health Check Service
 * Monitora a saúde do backend e notifica sobre mudanças de status
 */

import { getHealthUrl } from '@/config/api'

// Health endpoint - usa /api/health para consistência
const HEALTH_URL = getHealthUrl()

type HealthStatus = {
  isHealthy: boolean
  lastCheck: Date
  consecutiveFailures: number
}

type HealthCheckListener = (isHealthy: boolean) => void

export class HealthCheckService {
  private static readonly CHECK_INTERVAL = 30000 // 30 segundos
  private static readonly TIMEOUT = 5000 // 5 segundos
  private static readonly MAX_CONSECUTIVE_FAILURES = 3

  private static status: HealthStatus = {
    isHealthy: true,
    lastCheck: new Date(),
    consecutiveFailures: 0,
  }

  private static listeners: Set<HealthCheckListener> = new Set()
  private static intervalId: number | null = null

  /**
   * Verifica a saúde do backend
   */
  static async checkBackendHealth(): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT)

      const response = await fetch(HEALTH_URL, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
        },
      })

      clearTimeout(timeoutId)

      const isHealthy = response.ok

      // Atualiza status
      const wasHealthy = this.status.isHealthy
      this.status.isHealthy = isHealthy
      this.status.lastCheck = new Date()

      if (isHealthy) {
        // Reset contador de falhas
        this.status.consecutiveFailures = 0

        // Se estava offline e voltou a ficar online, notifica
        if (!wasHealthy) {
          console.log('✅ Backend voltou a ficar online')
          this.notifyListeners(true)
        }
      } else {
        this.status.consecutiveFailures++

        // Se atingiu o limite de falhas consecutivas, marca como offline
        if (
          this.status.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES &&
          wasHealthy
        ) {
          console.error('❌ Backend está offline após múltiplas tentativas')
          this.notifyListeners(false)
        }
      }

      return isHealthy
    } catch (error) {
      this.status.consecutiveFailures++
      this.status.lastCheck = new Date()

      const wasHealthy = this.status.isHealthy

      // Se atingiu o limite de falhas consecutivas, marca como offline
      if (
        this.status.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES &&
        wasHealthy
      ) {
        this.status.isHealthy = false
        console.error('❌ Backend não está respondendo:', error)
        this.notifyListeners(false)
      }

      return false
    }
  }

  /**
   * Inicia o monitoramento automático
   */
  static startMonitoring() {
    if (this.intervalId !== null) {
      console.warn('⚠️ Monitoramento já está ativo')
      return
    }

    // Check inicial
    this.checkBackendHealth()

    // Monitoramento contínuo
    this.intervalId = window.setInterval(() => {
      this.checkBackendHealth()
    }, this.CHECK_INTERVAL)

    console.log('🔍 Monitoramento de saúde do backend iniciado')
  }

  /**
   * Para o monitoramento automático
   */
  static stopMonitoring() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('🛑 Monitoramento de saúde do backend parado')
    }
  }

  /**
   * Adiciona um listener para mudanças de status
   */
  static addListener(listener: HealthCheckListener) {
    this.listeners.add(listener)
  }

  /**
   * Remove um listener
   */
  static removeListener(listener: HealthCheckListener) {
    this.listeners.delete(listener)
  }

  /**
   * Notifica todos os listeners sobre mudança de status
   */
  private static notifyListeners(isHealthy: boolean) {
    this.listeners.forEach((listener) => {
      try {
        listener(isHealthy)
      } catch (error) {
        console.error('Erro ao notificar listener:', error)
      }
    })
  }

  /**
   * Retorna o status atual
   */
  static getStatus(): HealthStatus {
    return { ...this.status }
  }

  /**
   * Retorna se o backend está saudável
   */
  static isHealthy(): boolean {
    return this.status.isHealthy
  }
}
