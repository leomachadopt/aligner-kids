import { useState, useEffect, useCallback, useRef } from 'react'
import type { Aligner } from '@/types/aligner'

const STORAGE_PREFIX = 'aligner-timer-'

interface DailyUsage {
  date: string // ISO date string (YYYY-MM-DD)
  hours: number
  startTime: number | null // timestamp when timer started
}

interface UseAlignerTimerReturn {
  dailyHours: number
  accumulatedHours: number
  isTracking: boolean
  startTracking: () => void
  stopTracking: () => void
  resetDaily: () => void
  weeklyUsage: DailyUsage[]
}

/**
 * Hook para rastrear tempo de uso do alinhador em tempo real
 */
export function useAlignerTimer(aligner: Aligner | null): UseAlignerTimerReturn {
  const [dailyHours, setDailyHours] = useState(0)
  const [accumulatedHours, setAccumulatedHours] = useState(0)
  const [isTracking, setIsTracking] = useState(false)
  const [weeklyUsage, setWeeklyUsage] = useState<DailyUsage[]>([])
  const startTimeRef = useRef<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const getStorageKey = useCallback(
    (suffix: string) => {
      if (!aligner) return ''
      return `${STORAGE_PREFIX}${aligner.id}-${suffix}`
    },
    [aligner],
  )

  const getTodayKey = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    return getStorageKey(`daily-${today}`)
  }, [getStorageKey])

  const loadDailyUsage = useCallback(() => {
    if (!aligner) return

    const todayKey = getTodayKey()
    const stored = localStorage.getItem(todayKey)
    if (stored) {
      const data: DailyUsage = JSON.parse(stored)
      setDailyHours(data.hours)
      if (data.startTime) {
        setIsTracking(true)
        startTimeRef.current = data.startTime
      }
    }
  }, [aligner, getTodayKey])

  const saveDailyUsage = useCallback(
    (hours: number, startTime: number | null = null) => {
      if (!aligner) return

      const today = new Date().toISOString().split('T')[0]
      const todayKey = getTodayKey()
      const data: DailyUsage = {
        date: today,
        hours,
        startTime,
      }
      localStorage.setItem(todayKey, JSON.stringify(data))
    },
    [aligner, getTodayKey],
  )

  const loadWeeklyUsage = useCallback(() => {
    if (!aligner) return

    const weeklyData: DailyUsage[] = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      const storageKey = getStorageKey(`daily-${dateKey}`)
      const stored = localStorage.getItem(storageKey)

      if (stored) {
        weeklyData.push(JSON.parse(stored))
      } else {
        weeklyData.push({
          date: dateKey,
          hours: 0,
          startTime: null,
        })
      }
    }

    setWeeklyUsage(weeklyData)
  }, [aligner, getStorageKey])

  const loadAccumulatedHours = useCallback(() => {
    if (!aligner) return

    const storageKey = getStorageKey('accumulated')
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      setAccumulatedHours(parseFloat(stored))
    } else {
      setAccumulatedHours(aligner.usageHours || 0)
    }
  }, [aligner, getStorageKey])

  useEffect(() => {
    if (!aligner) return

    loadDailyUsage()
    loadWeeklyUsage()
    loadAccumulatedHours()
  }, [aligner, loadDailyUsage, loadWeeklyUsage, loadAccumulatedHours])

  useEffect(() => {
    if (isTracking && startTimeRef.current) {
      intervalRef.current = setInterval(() => {
        const now = Date.now()
        const elapsed = (now - startTimeRef.current!) / (1000 * 60 * 60) // hours
        const newDailyHours = dailyHours + elapsed / 60 // convert to hours (update every minute)
        setDailyHours(newDailyHours)
        saveDailyUsage(newDailyHours, startTimeRef.current)
      }, 60000) // update every minute

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [isTracking, dailyHours, saveDailyUsage])

  const startTracking = useCallback(() => {
    if (!aligner || isTracking) return

    const now = Date.now()
    startTimeRef.current = now
    setIsTracking(true)
    saveDailyUsage(dailyHours, now)
  }, [aligner, isTracking, dailyHours, saveDailyUsage])

  const stopTracking = useCallback(() => {
    if (!aligner || !isTracking || !startTimeRef.current) return

    const now = Date.now()
    const elapsed = (now - startTimeRef.current) / (1000 * 60 * 60) // hours
    const newDailyHours = dailyHours + elapsed
    const newAccumulated = accumulatedHours + elapsed

    setDailyHours(newDailyHours)
    setAccumulatedHours(newAccumulated)
    setIsTracking(false)
    startTimeRef.current = null

    saveDailyUsage(newDailyHours, null)
    const storageKey = getStorageKey('accumulated')
    localStorage.setItem(storageKey, newAccumulated.toString())

    loadWeeklyUsage()
  }, [
    aligner,
    isTracking,
    dailyHours,
    accumulatedHours,
    saveDailyUsage,
    getStorageKey,
    loadWeeklyUsage,
  ])

  const resetDaily = useCallback(() => {
    if (!aligner) return

    setDailyHours(0)
    setIsTracking(false)
    startTimeRef.current = null
    const todayKey = getTodayKey()
    localStorage.removeItem(todayKey)
  }, [aligner, getTodayKey])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    dailyHours,
    accumulatedHours,
    isTracking,
    startTracking,
    stopTracking,
    resetDaily,
    weeklyUsage,
  }
}


