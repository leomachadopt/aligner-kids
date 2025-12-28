import { useEffect } from 'react'

/**
 * Controla uma classe no <body> com cleanup automático.
 * Útil para temas globais baseados em classe (ex: `child-theme`).
 */
export function useBodyClass(className: string, enabled = true) {
  useEffect(() => {
    if (!enabled) {
      document.body.classList.remove(className)
      return
    }

    document.body.classList.add(className)
    return () => {
      document.body.classList.remove(className)
    }
  }, [className, enabled])
}



