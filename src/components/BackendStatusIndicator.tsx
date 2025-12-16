/**
 * Indicador visual do status do backend
 * Mostra um alerta quando o backend está offline
 */

import { useBackendHealth } from '@/hooks/useBackendHealth'
import { AlertCircle, Wifi, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'

export function BackendStatusIndicator() {
  const { isOnline, checkNow } = useBackendHealth()
  const [isVisible, setIsVisible] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  // Mostra o alerta apenas quando estiver offline
  useEffect(() => {
    if (!isOnline) {
      setIsVisible(true)
    } else {
      // Delay para esconder suavemente
      const timer = setTimeout(() => setIsVisible(false), 500)
      return () => clearTimeout(timer)
    }
  }, [isOnline])

  const handleRetry = async () => {
    setIsRetrying(true)
    await checkNow()
    setTimeout(() => setIsRetrying(false), 1000)
  }

  if (!isVisible) return null

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
        isOnline ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
    >
      <div className="bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {isRetrying ? (
              <Wifi className="h-5 w-5 animate-pulse" />
            ) : (
              <WifiOff className="h-5 w-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="font-semibold text-sm">Servidor Offline</p>
            </div>

            <p className="text-xs opacity-90 mb-3">
              Não foi possível conectar ao servidor. Algumas funcionalidades
              podem não funcionar.
            </p>

            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="text-xs bg-white text-red-500 px-3 py-1.5 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isRetrying ? 'Tentando...' : 'Tentar Novamente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
