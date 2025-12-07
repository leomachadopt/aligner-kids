import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface ConfettiProps {
  trigger?: boolean
  onComplete?: () => void
}

interface ConfettiPiece {
  id: number
  left: number
  color: string
  delay: number
  size: number
}

const CONFETTI_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFA07A',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E2',
  '#F8B739',
  '#FF85A2',
]

export const Confetti = ({ trigger = false, onComplete }: ConfettiProps) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (trigger && !isActive) {
      setIsActive(true)
      const newPieces: ConfettiPiece[] = []

      for (let i = 0; i < 50; i++) {
        newPieces.push({
          id: i,
          left: Math.random() * 100,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          delay: Math.random() * 0.5,
          size: Math.random() * 10 + 5,
        })
      }

      setPieces(newPieces)

      setTimeout(() => {
        setIsActive(false)
        setPieces([])
        onComplete?.()
      }, 3500)
    }
  }, [trigger, isActive, onComplete])

  if (!isActive || pieces.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${piece.left}%`,
            top: '-20px',
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
          }}
        />
      ))}
    </div>
  )
}

interface CelebrationProps {
  show: boolean
  message?: string
  icon?: React.ReactNode
  onComplete?: () => void
}

export const Celebration = ({
  show,
  message = '🎉 Parabéns! 🎉',
  icon,
  onComplete,
}: CelebrationProps) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      setTimeout(() => {
        setIsVisible(false)
        onComplete?.()
      }, 3000)
    }
  }, [show, onComplete])

  if (!isVisible) return null

  return (
    <>
      <Confetti trigger={show} />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div className="animate-bounce-slow rounded-3xl bg-gradient-to-br from-yellow-400 via-pink-400 to-purple-400 p-8 text-center shadow-2xl">
          {icon && <div className="mb-4 flex justify-center text-6xl">{icon}</div>}
          <h2 className="font-display text-4xl font-extrabold text-white drop-shadow-lg">
            {message}
          </h2>
        </div>
      </div>
    </>
  )
}
