import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Aligner } from '@/types/aligner'
import { AlignerWearApi, type WearStatusResponse } from '@/services/alignerWearService'

// Usa patientId também como userId (celular dos pais, mas conta do paciente/responsável).
export function useAlignerWear(patientId: string | null | undefined, aligner: Aligner | null) {
  const [status, setStatus] = useState<WearStatusResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!patientId || !aligner?.id) return
    setLoading(true)
    try {
      const res = await AlignerWearApi.getStatus(patientId, aligner.id)
      setStatus(res)
    } finally {
      setLoading(false)
    }
  }, [patientId, aligner?.id])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Poll every 60s while wearing, because backend computes "open session" with now()
  useEffect(() => {
    if (!status || status.state !== 'wearing') return
    const t = setInterval(() => {
      refresh()
    }, 60_000)
    return () => clearInterval(t)
  }, [status, refresh])

  const pause = useCallback(async () => {
    if (!patientId || !aligner?.id) return
    const res = await AlignerWearApi.pause(patientId, patientId, aligner.id)
    setStatus(res)
  }, [patientId, aligner?.id])

  const resume = useCallback(async () => {
    if (!patientId || !aligner?.id) return
    const res = await AlignerWearApi.resume(patientId, patientId, aligner.id)
    setStatus(res)
  }, [patientId, aligner?.id])

  const checkin = useCallback(
    async (woreAligner: boolean, date?: string) => {
      if (!patientId || !aligner?.id) return
      const res = await AlignerWearApi.checkin(patientId, patientId, aligner.id, woreAligner, date)
      setStatus(res)
    },
    [patientId, aligner?.id],
  )

  const dailyHours = useMemo(() => (status?.daily?.wearMinutes || 0) / 60, [status])
  const targetHours = useMemo(() => (status?.daily?.targetMinutes || 0) / 60, [status])

  return { status, loading, refresh, pause, resume, checkin, dailyHours, targetHours }
}