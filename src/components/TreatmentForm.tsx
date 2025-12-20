import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export type TreatmentFormValues = {
  patientId: string
  totalAligners: number
  changeInterval: number
  targetHoursPerDay: number
}

interface TreatmentFormProps {
  onSubmit: (data: TreatmentFormValues) => Promise<void>
  defaultValues?: Partial<TreatmentFormValues>
  isLoading?: boolean
}

export function TreatmentForm({ onSubmit, defaultValues, isLoading }: TreatmentFormProps) {
  const [formData, setFormData] = useState<TreatmentFormValues>({
    patientId: defaultValues?.patientId || '',
    totalAligners: defaultValues?.totalAligners || 10,
    changeInterval: defaultValues?.changeInterval || 14,
    targetHoursPerDay: defaultValues?.targetHoursPerDay || 22,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.totalAligners < 1 || formData.totalAligners > 100) {
      alert('O número de alinhadores deve estar entre 1 e 100')
      return
    }

    if (formData.changeInterval < 1 || formData.changeInterval > 30) {
      alert('O intervalo de troca deve estar entre 1 e 30 dias')
      return
    }

    if (formData.targetHoursPerDay < 1 || formData.targetHoursPerDay > 24) {
      alert('O tempo de uso diário deve estar entre 1 e 24 horas')
      return
    }

    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="totalAligners" className="text-sm font-bold uppercase text-gray-600">
          Número de Alinhadores *
        </Label>
        <Input
          id="totalAligners"
          type="number"
          min="1"
          max="100"
          value={formData.totalAligners}
          onChange={(e) =>
            setFormData({ ...formData, totalAligners: parseInt(e.target.value) || 0 })
          }
          required
          className="rounded-xl border-2 border-green-200 focus:border-green-400"
          placeholder="Quantos alinhadores no total do tratamento?"
        />
        <p className="text-xs text-gray-500">
          Total de alinhadores que serão criados automaticamente (ex: 10, 20, 30)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="changeInterval" className="text-sm font-bold uppercase text-gray-600">
          Intervalo de Troca (dias) *
        </Label>
        <Input
          id="changeInterval"
          type="number"
          min="1"
          max="30"
          value={formData.changeInterval}
          onChange={(e) =>
            setFormData({ ...formData, changeInterval: parseInt(e.target.value) || 0 })
          }
          required
          className="rounded-xl border-2 border-green-200 focus:border-green-400"
          placeholder="A cada quantos dias trocar de alinhador?"
        />
        <p className="text-xs text-gray-500">
          Padrão: 14 dias (2 semanas). Pode ser ajustado individualmente depois.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetHoursPerDay" className="text-sm font-bold uppercase text-gray-600">
          Tempo de Uso Diário (horas) *
        </Label>
        <Input
          id="targetHoursPerDay"
          type="number"
          min="1"
          max="24"
          value={formData.targetHoursPerDay}
          onChange={(e) =>
            setFormData({ ...formData, targetHoursPerDay: parseInt(e.target.value) || 0 })
          }
          required
          className="rounded-xl border-2 border-green-200 focus:border-green-400"
          placeholder="Quantas horas por dia o paciente deve usar?"
        />
        <p className="text-xs text-gray-500">
          Padrão: 22 horas/dia. Recomendado pela maioria dos ortodontistas.
        </p>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl py-6 text-base font-bold bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 shadow-md"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Criando tratamento...
          </>
        ) : (
          '✨ Criar Tratamento e Alinhadores'
        )}
      </Button>

      <div className="rounded-lg bg-blue-50 border-2 border-blue-200 p-4">
        <p className="text-sm font-semibold text-blue-900 mb-2">
          ℹ️ O que acontecerá:
        </p>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>
            <strong>{formData.totalAligners} alinhadores</strong> serão criados automaticamente
          </li>
          <li>
            Cada alinhador terá <strong>{formData.changeInterval} dias</strong> de uso
          </li>
          <li>
            Meta diária: <strong>{formData.targetHoursPerDay} horas</strong> de uso
          </li>
          <li>
            <strong>Datas serão definidas automaticamente</strong> quando o tratamento for iniciado
          </li>
          <li>Missões e recompensas serão atribuídas automaticamente</li>
        </ul>
      </div>
    </form>
  )
}
