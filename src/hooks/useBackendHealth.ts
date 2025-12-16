/**
 * Hook para monitorar a saúde do backend
 */

import { useEffect, useState } from 'react'
import { HealthCheckService } from '@/services/healthCheck'

export function useBackendHealth() {
  const [isOnline, setIsOnline] = useState(true)
  const [lastCheck, setLastCheck] = useState<Date>(new Date())

  useEffect(() => {
    // Listener para mudanças de status
    const handleStatusChange = (isHealthy: boolean) => {
      setIsOnline(isHealthy)
      setLastCheck(new Date())
    }

    // Adiciona listener
    HealthCheckService.addListener(handleStatusChange)

    // Inicia monitoramento se ainda não estiver ativo
    HealthCheckService.startMonitoring()

    // Atualiza estado inicial
    const status = HealthCheckService.getStatus()
    setIsOnline(status.isHealthy)
    setLastCheck(status.lastCheck)

    // Cleanup
    return () => {
      HealthCheckService.removeListener(handleStatusChange)
    }
  }, [])

  return {
    isOnline,
    lastCheck,
    checkNow: () => HealthCheckService.checkBackendHealth(),
  }
}
