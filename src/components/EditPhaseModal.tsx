import { useState, useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PhaseService } from '@/services/phaseService'
import type { TreatmentPhase } from '@/types/aligner'
import { toast } from 'sonner'

interface EditPhaseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  phase: TreatmentPhase
  onSuccess: () => void
}

export function EditPhaseModal({
  open,
  onOpenChange,
  phase,
  onSuccess,
}: EditPhaseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    phaseName: phase.phaseName,
    description: phase.description || '',
    status: phase.status,
    notes: phase.notes || '',
    changeInterval: String((phase as any).changeInterval ?? 14),
    targetHoursPerDay: String((phase as any).targetHoursPerDay ?? 22),
    adherenceTargetPercent: String((phase as any).adherenceTargetPercent ?? 80),
  })

  // Update form when phase changes
  useEffect(() => {
    setFormData({
      phaseName: phase.phaseName,
      description: phase.description || '',
      status: phase.status,
      notes: phase.notes || '',
      changeInterval: String((phase as any).changeInterval ?? 14),
      targetHoursPerDay: String((phase as any).targetHoursPerDay ?? 22),
      adherenceTargetPercent: String((phase as any).adherenceTargetPercent ?? 80),
    })
  }, [phase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await PhaseService.updatePhase(phase.id, {
        phaseName: formData.phaseName,
        description: formData.description || undefined,
        status: formData.status,
        notes: formData.notes || undefined,
        changeInterval: parseInt(formData.changeInterval || '14'),
        targetHoursPerDay: parseInt(formData.targetHoursPerDay || '22'),
        adherenceTargetPercent: parseInt(formData.adherenceTargetPercent || '80'),
      } as any)

      toast.success('Fase atualizada com sucesso!')
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating phase:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar fase')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] border-2 border-gradient-to-r from-blue-300 via-purple-300 to-pink-300">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Editar Fase {phase.phaseNumber}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 font-medium">
                Atualize as informações da fase do tratamento
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 border-2 border-slate-300 p-4 text-sm shadow-md">
            <p className="font-bold text-slate-900 text-base mb-2">📋 Alinhadores desta fase:</p>
            <div className="flex items-center gap-2">
              <span className="bg-slate-200 px-3 py-1 rounded-lg font-extrabold text-slate-900">
                #{phase.startAlignerNumber}
              </span>
              <span className="text-slate-600">até</span>
              <span className="bg-slate-200 px-3 py-1 rounded-lg font-extrabold text-slate-900">
                #{phase.endAlignerNumber}
              </span>
              <span className="text-slate-600">({phase.totalAligners} total)</span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-2">
              🔒 A numeração dos alinhadores não pode ser alterada
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phaseName" className="font-bold text-gray-700">Nome da Fase *</Label>
            <Input
              id="phaseName"
              value={formData.phaseName}
              onChange={(e) => setFormData({ ...formData, phaseName: e.target.value })}
              placeholder="Ex: Refinamento Final"
              required
              className="border-2 border-gray-200 focus:border-blue-400 rounded-xl text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-bold text-gray-700">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva os objetivos desta fase..."
              rows={2}
              className="border-2 border-gray-200 focus:border-blue-400 rounded-xl text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="font-bold text-gray-700">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value as TreatmentPhase['status'] })
              }
            >
              <SelectTrigger className="border-2 border-gray-200 focus:border-blue-400 rounded-xl text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">⏳ Pendente</SelectItem>
                <SelectItem value="active">✅ Ativo</SelectItem>
                <SelectItem value="completed">🎉 Concluído</SelectItem>
                <SelectItem value="paused">⏸️ Pausado</SelectItem>
                <SelectItem value="cancelled">❌ Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-amber-700 font-medium bg-amber-50 border border-amber-200 rounded-lg p-2">
              ⚠️ Atenção: Alterar para "Ativo" pode afetar outras fases ativas
            </p>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 p-4 shadow-sm">
            <p className="text-sm font-bold text-blue-900 flex items-center gap-2 mb-1">
              <span className="text-lg">📅</span> Datas Automáticas
            </p>
            <p className="text-xs text-blue-800 leading-relaxed">
              As datas de início e término são calculadas automaticamente com base nas trocas de alinhadores pelos pacientes.
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
                className="border-2 border-gray-200 focus:border-blue-400 rounded-xl text-base"
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
                className="border-2 border-gray-200 focus:border-blue-400 rounded-xl text-base"
              />
              <p className="text-xs text-gray-600 font-medium">
                Padrão: 22 horas/dia
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="font-bold text-gray-700">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações adicionais sobre esta fase..."
              rows={2}
              className="border-2 border-gray-200 focus:border-blue-400 rounded-xl text-base"
            />
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
              className="border-2 border-gray-200 focus:border-blue-400 rounded-xl text-base"
            />
            <p className="text-xs text-gray-600 font-medium">
              Esse % é usado nas quests dos alinhadores da fase.
            </p>
          </div>

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
              className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold px-6 shadow-lg"
            >
              {isSubmitting ? '⏳ Salvando...' : '💾 Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
