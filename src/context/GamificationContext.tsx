import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  earned: boolean
  earnedDate?: Date
}

interface DailyMission {
  id: string
  title: string
  description: string
  reward: number
  completed: boolean
  type: 'usage' | 'photo' | 'education' | 'checkin'
}

interface GamificationContextType {
  // Pontos e Nível
  coins: number
  xp: number
  level: number
  addCoins: (amount: number) => Promise<void>
  addXP: (amount: number) => Promise<void>

  // Streak
  currentStreak: number
  longestStreak: number
  lastCheckIn: Date | null
  checkIn: () => Promise<void>

  // Badges
  badges: Badge[]
  earnBadge: (badgeId: string) => Promise<void>

  // Missões Diárias
  dailyMissions: DailyMission[]
  completeMission: (missionId: string) => Promise<void>

  // Celebração
  showCelebration: boolean
  celebrationMessage: string
  triggerCelebration: (message: string) => void
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined)

const INITIAL_BADGES: Badge[] = [
  {
    id: 'first-week',
    name: 'Primeira Semana',
    description: 'Completou 7 dias de uso',
    icon: '🌟',
    earned: false,
  },
  {
    id: 'perfect-month',
    name: 'Mês de Ouro',
    description: 'Uso perfeito por 30 dias',
    icon: '🏆',
    earned: false,
  },
  {
    id: 'photo-master',
    name: 'Fotógrafo Pro',
    description: 'Enviou 20 fotos',
    icon: '📸',
    earned: false,
  },
  {
    id: 'education-fan',
    name: 'Super Estudante',
    description: 'Completou 10 conteúdos educacionais',
    icon: '📚',
    earned: false,
  },
  {
    id: 'streak-hero',
    name: 'Herói da Constância',
    description: 'Manteve streak de 30 dias',
    icon: '🔥',
    earned: false,
  },
]

const INITIAL_MISSIONS: DailyMission[] = [
  {
    id: 'daily-checkin',
    title: 'Check-in Diário',
    description: 'Faça login no app hoje',
    reward: 10,
    completed: false,
    type: 'checkin',
  },
  {
    id: 'use-aligner',
    title: 'Use o Alinhador',
    description: 'Use por pelo menos 20 horas',
    reward: 50,
    completed: false,
    type: 'usage',
  },
  {
    id: 'take-photo',
    title: 'Tire uma Foto',
    description: 'Registre seu progresso',
    reward: 30,
    completed: false,
    type: 'photo',
  },
  {
    id: 'learn-something',
    title: 'Aprenda Algo Novo',
    description: 'Veja um conteúdo educacional',
    reward: 20,
    completed: false,
    type: 'education',
  },
]

export const GamificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()
  const [coins, setCoins] = useState(0)
  const [xp, setXP] = useState(0)
  const [level, setLevel] = useState(1)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null)
  const [badges, setBadges] = useState<Badge[]>(INITIAL_BADGES)
  const [dailyMissions, setDailyMissions] = useState<DailyMission[]>(INITIAL_MISSIONS)
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationMessage, setCelebrationMessage] = useState('')

  // Carregar pontos reais do servidor
  useEffect(() => {
    const fetchPoints = async () => {
      if (!user?.id) return

      try {
        const response = await fetch(`/api/points/patient/${user.id}`)
        if (response.ok) {
          const data = await response.json()
          if (data.points) {
            setCoins(data.points.coins || 0)
            setXP(data.points.xp || 0)
            setLevel(data.points.level || 1)
            console.log('📊 Pontos carregados:', data.points)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar pontos:', error)
      }
    }

    fetchPoints()
  }, [user?.id])

  // Carregar dados do localStorage (apenas para streak, badges e missões)
  useEffect(() => {
    const savedData = localStorage.getItem('gamification')
    if (savedData) {
      const data = JSON.parse(savedData)
      setCurrentStreak(data.currentStreak || 0)
      setLongestStreak(data.longestStreak || 0)
      setLastCheckIn(data.lastCheckIn ? new Date(data.lastCheckIn) : null)
      setBadges(data.badges || INITIAL_BADGES)
      setDailyMissions(data.dailyMissions || INITIAL_MISSIONS)
    }
  }, [])

  // Salvar dados no localStorage
  useEffect(() => {
    const data = {
      coins,
      xp,
      level,
      currentStreak,
      longestStreak,
      lastCheckIn,
      badges,
      dailyMissions,
    }
    localStorage.setItem('gamification', JSON.stringify(data))
  }, [coins, xp, level, currentStreak, longestStreak, lastCheckIn, badges, dailyMissions])

  // Calcular nível baseado em XP
  useEffect(() => {
    const newLevel = Math.floor(xp / 100) + 1
    if (newLevel > level) {
      setLevel(newLevel)
      triggerCelebration(`🎉 Nível ${newLevel} Alcançado! 🎉`)
    }
  }, [xp, level])

  const addCoins = async (amount: number) => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/points/patient/${user.id}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coins: amount, xp: 0 }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.points) {
          setCoins(data.points.coins || 0)
          setXP(data.points.xp || 0)
          setLevel(data.points.level || 1)
        }
      }
    } catch (error) {
      console.error('Erro ao adicionar moedas:', error)
      // Fallback para atualização local
      setCoins((prev) => prev + amount)
    }
  }

  const addXP = async (amount: number) => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/points/patient/${user.id}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coins: 0, xp: amount }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.points) {
          setCoins(data.points.coins || 0)
          setXP(data.points.xp || 0)
          setLevel(data.points.level || 1)
        }
      }
    } catch (error) {
      console.error('Erro ao adicionar XP:', error)
      // Fallback para atualização local
      setXP((prev) => prev + amount)
    }
  }

  const checkIn = async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (lastCheckIn) {
      const lastDate = new Date(lastCheckIn)
      lastDate.setHours(0, 0, 0, 0)

      const diffTime = today.getTime() - lastDate.getTime()
      const diffDays = diffTime / (1000 * 60 * 60 * 24)

      if (diffDays === 1) {
        // Dia consecutivo
        const newStreak = currentStreak + 1
        setCurrentStreak(newStreak)
        if (newStreak > longestStreak) {
          setLongestStreak(newStreak)
        }
        await addCoins(10)
        await addXP(20)
      } else if (diffDays > 1) {
        // Quebrou a sequência
        setCurrentStreak(1)
        await addCoins(5)
        await addXP(10)
      }
    } else {
      // Primeiro check-in
      setCurrentStreak(1)
      await addCoins(5)
      await addXP(10)
    }

    setLastCheckIn(today)
  }

  const earnBadge = async (badgeId: string) => {
    setBadges((prev) =>
      prev.map((badge) =>
        badge.id === badgeId && !badge.earned
          ? { ...badge, earned: true, earnedDate: new Date() }
          : badge,
      ),
    )

    const badge = badges.find((b) => b.id === badgeId)
    if (badge && !badge.earned) {
      triggerCelebration(`${badge.icon} ${badge.name} conquistado!`)
      await addCoins(100)
      await addXP(50)
    }
  }

  const completeMission = async (missionId: string) => {
    const mission = dailyMissions.find((m) => m.id === missionId && !m.completed)

    if (mission) {
      await addCoins(mission.reward)
      await addXP(mission.reward / 2)

      setDailyMissions((prev) =>
        prev.map((m) =>
          m.id === missionId ? { ...m, completed: true } : m
        ),
      )
    }
  }

  const triggerCelebration = (message: string) => {
    setCelebrationMessage(message)
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 3000)
  }

  return (
    <GamificationContext.Provider
      value={{
        coins,
        xp,
        level,
        addCoins,
        addXP,
        currentStreak,
        longestStreak,
        lastCheckIn,
        checkIn,
        badges,
        earnBadge,
        dailyMissions,
        completeMission,
        showCelebration,
        celebrationMessage,
        triggerCelebration,
      }}
    >
      {children}
    </GamificationContext.Provider>
  )
}

export const useGamification = () => {
  const context = useContext(GamificationContext)
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider')
  }
  return context
}
