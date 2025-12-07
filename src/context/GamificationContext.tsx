import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

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
  addCoins: (amount: number) => void
  addXP: (amount: number) => void

  // Streak
  currentStreak: number
  longestStreak: number
  lastCheckIn: Date | null
  checkIn: () => void

  // Badges
  badges: Badge[]
  earnBadge: (badgeId: string) => void

  // Missões Diárias
  dailyMissions: DailyMission[]
  completeMission: (missionId: string) => void

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

  // Carregar dados do localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('gamification')
    if (savedData) {
      const data = JSON.parse(savedData)
      setCoins(data.coins || 0)
      setXP(data.xp || 0)
      setLevel(data.level || 1)
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

  const addCoins = (amount: number) => {
    setCoins((prev) => prev + amount)
  }

  const addXP = (amount: number) => {
    setXP((prev) => prev + amount)
  }

  const checkIn = () => {
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
        addCoins(10)
        addXP(20)
      } else if (diffDays > 1) {
        // Quebrou a sequência
        setCurrentStreak(1)
        addCoins(5)
        addXP(10)
      }
    } else {
      // Primeiro check-in
      setCurrentStreak(1)
      addCoins(5)
      addXP(10)
    }

    setLastCheckIn(today)
  }

  const earnBadge = (badgeId: string) => {
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
      addCoins(100)
      addXP(50)
    }
  }

  const completeMission = (missionId: string) => {
    setDailyMissions((prev) =>
      prev.map((mission) => {
        if (mission.id === missionId && !mission.completed) {
          addCoins(mission.reward)
          addXP(mission.reward / 2)
          return { ...mission, completed: true }
        }
        return mission
      }),
    )
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
