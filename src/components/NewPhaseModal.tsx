import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PhaseService, type CreatePhaseInput } from '@/services/phaseService'
import type { TreatmentPhase } from '@/types/aligner'
import { toast } from 'sonner'

interface NewPhaseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  treatmentId: string
  patientName: string
  lastPhase: TreatmentPhase | null
  onSuccess: () => void
}

export function NewPhaseModal({
  open,
  onOpenChange,
  treatmentId,
  patientName,
  lastPhase,
  onSuccess,
}: NewPhaseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    phaseName: '',
    description: '',
    totalAligners: '20',
    changeInterval: '14',
    targetHoursPerDay: '22',
    adherenceTargetPercent: '80',
  })

  const nextPhaseNumber = lastPhase ? lastPhase.phaseNumber + 1 : 1
  const startAlignerNumber = lastPhase ? lastPhase.endAlignerNumber + 1 : 1
  const endAlignerNumber = startAlignerNumber + parseInt(formData.totalAligners || '0') - 1

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const input: CreatePhaseInput = {
        treatmentId,
        phaseName: formData.phaseName,
        description: formData.description || undefined,
        totalAligners: parseInt(formData.totalAligners),
        // Sistema dinâmico: datas serão definidas quando a fase for iniciada
        adherenceTargetPercent: parseInt(formData.adherenceTargetPercent || '80'),
        // TODO: Backend needs to be updated to accept and use these fields
        changeInterval: parseInt(formData.changeInterval || '14'),
        targetHoursPerDay: parseInt(formData.targetHoursPerDay || '22'),
      } as any

      await PhaseService.createPhase(input)
      toast.success('Nova fase criada com sucesso!')
      onSuccess()
      onOpenChange(false)

      // Reset form
      setFormData({
        phaseName: '',
        description: '',
        totalAligners: '20',
        changeInterval: '14',
        targetHoursPerDay: '22',
        adherenceTargetPercent: '80',
      })
    } catch (error) {
      console.error('Error creating phase:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar fase')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] border-2 border-gradient-to-r from-green-300 via-teal-300 to-cyan-300">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-extrabold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                Iniciar Nova Fase do Tratamento
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 font-medium">
                Crie uma nova fase para o tratamento de {patientName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {lastPhase && (
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 p-4 text-sm shadow-md">
              <p className="font-bold text-blue-900">📋 Fase Anterior: {lastPhase.phaseName}</p>
              <p className="text-blue-700 font-medium mt-1">
                Último alinhador: #{lastPhase.endAlignerNumber}
              </p>
            </div>
          )}

          <div className="rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 p-4 shadow-sm">
            <Label className="font-bold text-purple-900">✨ Nova Fase</Label>
            <p className="text-lg font-extrabold text-purple-700 mt-1">Fase #{nextPhaseNumber}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phaseName" className="font-bold text-gray-700">Nome da Fase *</Label>
            <Input
              id="phaseName"
              value={formData.phaseName}
              onChange={(e) => setFormData({ ...formData, phaseName: e.target.value })}
              placeholder="Ex: Refinamento Final"
              required
              className="border-2 border-gray-200 focus:border-green-400 rounded-xl text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-bold text-gray-700">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva os objetivos desta fase..."
              rows={2}
              className="border-2 border-gray-200 focus:border-green-400 rounded-xl text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalAligners" className="font-bold text-gray-700">Quantidade de Alinhadores *</Label>
            <Input
              id="totalAligners"
              type="number"
              min="1"
              value={formData.totalAligners}
              onChange={(e) => setFormData({ ...formData, totalAligners: e.target.value })}
              required
              className="border-2 border-gray-200 focus:border-green-400 rounded-xl text-base"
            />
            <p className="text-xs text-gray-600 font-medium">
              Total de alinhadores que serão criados para esta fase
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="changeInterval" className="font-bold text-gray-700">Intervalo de Troca (dias) *</Label>
              <Input
                id="changeInterval"
                type="number"
                min="1"
                max="30"
                value={formData.changeInterval}
                onChange={(e) => setFormData({ ...formData, changeInterval: e.target.value })}
                required
                className="border-2 border-gray-200 focus:border-green-400 rounded-xl text-base"
              />
              <p className="text-xs text-gray-600 font-medium">
                Padrão: 14 dias (2 semanas)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetHoursPerDay" className="font-bold text-gray-700">Meta de Uso Diário (horas) *</Label>
              <Input
                id="targetHoursPerDay"
                type="number"
                min="1"
                max="24"
                value={formData.targetHoursPerDay}
                onChange={(e) => setFormData({ ...formData, targetHoursPerDay: e.target.value })}
                required
                className="border-2 border-gray-200 focus:border-green-400 rounded-xl text-base"
              />
              <p className="text-xs text-gray-600 font-medium">
                Padrão: 22 horas/dia
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-300 p-4 text-sm text-cyan-900 shadow-md">
            <p className="font-bold text-lg mb-2">📊 Numeração dos Alinhadores:</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/60 rounded-lg p-2">
                <p className="text-xs text-cyan-700">Inicia em:</p>
                <p className="text-xl font-extrabold text-cyan-900">#{startAlignerNumber}</p>
              </div>
              <div className="bg-white/60 rounded-lg p-2">
                <p className="text-xs text-cyan-700">Termina em:</p>
                <p className="text-xl font-extrabold text-cyan-900">#{endAlignerNumber}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-300 p-4 text-sm text-amber-900 shadow-md">
            <p className="font-bold text-base mb-2">📅 Sistema de Datas Dinâmico</p>
            <p className="text-sm leading-relaxed">
              As datas de início e término serão calculadas automaticamente quando a fase for iniciada e os alinhadores forem trocados pelo paciente.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adherenceTargetPercent" className="font-bold text-gray-700">% mínimo aceitável (fase)</Label>
            <Input
              id="adherenceTargetPercent"
              type="number"
              min="0"
              max="100"
              value={formData.adherenceTargetPercent}
              onChange={(e) => setFormData({ ...formData, adherenceTargetPercent: e.target.value })}
              className="border-2 border-gray-200 focus:border-green-400 rounded-xl text-base"
            />
            <p className="text-xs text-gray-600 font-medium">
              Ex.: 80% (se a meta do alinhador é 22h/dia, o dia conta como OK a partir de 17h36).
            </p>
          </div>

          {lastPhase && lastPhase.status === 'active' && (
            <div className="rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 p-4 text-sm text-yellow-900 shadow-md">
              <span className="text-2xl">ℹ️</span> <span className="font-bold">Atenção:</span> A fase anterior será mantida como ativa. Você precisará concluí-la manualmente e depois iniciar esta nova fase.
            </div>
          )}

          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-2 font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold px-6 shadow-lg"
            >
              {isSubmitting ? '⏳ Criando...' : '✨ Criar Fase'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
