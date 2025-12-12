import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react'
import type { Aligner, Treatment } from '@/types/aligner'
import { alignerService } from '@/services/alignerService'

interface AlignerContextType {
  aligners: Aligner[]
  treatment: Treatment | null
  currentAligner: Aligner | null
  loading: boolean
  error: string | null
  refreshAligners: () => Promise<void>
  refreshTreatment: () => Promise<void>
  createAligner: (
    aligner: Omit<Aligner, 'id' | 'usageDays' | 'usageHours'>,
  ) => Promise<Aligner>
  updateAligner: (id: string, updates: Partial<Aligner>) => Promise<Aligner>
  confirmAlignerChange: (alignerId: string) => Promise<Aligner>
  getPatientId: () => string
}

const AlignerContext = createContext<AlignerContextType | undefined>(undefined)

export const AlignerProvider = ({
  children,
  patientId,
}: {
  children: ReactNode
  patientId: string
}) => {
  const [aligners, setAligners] = useState<Aligner[]>([])
  const [treatment, setTreatment] = useState<Treatment | null>(null)
  const [currentAligner, setCurrentAligner] = useState<Aligner | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshTreatment = useCallback(async () => {
    try {
      setError(null)
      const patientTreatment = await alignerService.getTreatmentByPatient(patientId)
      setTreatment(patientTreatment)
      return patientTreatment
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar tratamento')
      return null
    }
  }, [patientId])

  const refreshAligners = useCallback(
    async (treatmentId?: string) => {
      try {
        setError(null)
        const patientAligners = await alignerService.getAlignersByPatient(
          patientId,
          treatmentId,
        )
        setAligners(patientAligners)
        const current = await alignerService.getCurrentAligner(patientId, treatmentId)
        setCurrentAligner(current)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar alinhadores')
      }
    },
    [patientId],
  )

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const currentTreatment = await refreshTreatment()
      await refreshAligners(currentTreatment?.id)
      setLoading(false)
    }
    loadData()
  }, [patientId, refreshAligners, refreshTreatment])

  const createAligner = useCallback(
    async (alignerData: Omit<Aligner, 'id' | 'usageDays' | 'usageHours'>) => {
      try {
        setError(null)
        const newAligner = await alignerService.createAligner(alignerData)
        await refreshAligners(treatment?.id)
        return newAligner
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erro ao criar alinhador'
        setError(errorMessage)
        throw new Error(errorMessage)
      }
    },
    [refreshAligners],
  )

  const updateAligner = useCallback(
    async (id: string, updates: Partial<Aligner>) => {
      try {
        setError(null)
        const updated = await alignerService.updateAligner(id, updates)
        await refreshAligners(treatment?.id)
        return updated
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erro ao atualizar alinhador'
        setError(errorMessage)
        throw new Error(errorMessage)
      }
    },
    [refreshAligners],
  )

  const confirmAlignerChange = useCallback(
    async (alignerId: string) => {
      try {
        setError(null)
        const updated = await alignerService.confirmAlignerChange(patientId, alignerId)
        const t = await refreshTreatment()
        await refreshAligners(t?.id)
        return updated
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Erro ao confirmar troca de alinhador'
        setError(errorMessage)
        throw new Error(errorMessage)
      }
    },
    [patientId, refreshAligners, refreshTreatment],
  )

  const getPatientId = useCallback(() => patientId, [])

  return (
    <AlignerContext.Provider
      value={{
        aligners,
        treatment,
        currentAligner,
        loading,
        error,
        refreshAligners,
        refreshTreatment,
        createAligner,
        updateAligner,
        confirmAlignerChange,
        getPatientId,
      }}
    >
      {children}
    </AlignerContext.Provider>
  )
}

export const useAligners = () => {
  const context = useContext(AlignerContext)
  if (context === undefined) {
    throw new Error('useAligners must be used within an AlignerProvider')
  }
  return context
}

export const useCurrentAligner = () => {
  const { currentAligner } = useAligners()
  return currentAligner
}

export const useTreatment = () => {
  const { treatment } = useAligners()
  return treatment
}



