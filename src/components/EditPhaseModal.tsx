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
    expectedEndDate: phase.expectedEndDate || '',
    notes: phase.notes || '',
  })

  // Update form when phase changes
  useEffect(() => {
    setFormData({
      phaseName: phase.phaseName,
      description: phase.description || '',
      status: phase.status,
      expectedEndDate: phase.expectedEndDate || '',
      notes: phase.notes || '',
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
        expectedEndDate: formData.expectedEndDate || undefined,
        notes: formData.notes || undefined,
      })

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Fase {phase.phaseNumber}</DialogTitle>
          <DialogDescription>
            Atualize as informações da fase do tratamento
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">Alinhadores desta fase:</p>
            <p className="text-muted-foreground">
              #{phase.startAlignerNumber} a #{phase.endAlignerNumber} ({phase.totalAligners}{' '}
              total)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              A numeração dos alinhadores não pode ser alterada
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phaseName">Nome da Fase *</Label>
            <Input
              id="phaseName"
              value={formData.phaseName}
              onChange={(e) => setFormData({ ...formData, phaseName: e.target.value })}
              placeholder="Ex: Refinamento Final"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva os objetivos desta fase..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value as TreatmentPhase['status'] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="paused">Pausado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              ⚠️ Atenção: Alterar para "Ativo" pode afetar outras fases ativas
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                value={phase.startDate || ''}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Data de início não pode ser alterada
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedEndDate">Previsão de Término</Label>
              <Input
                id="expectedEndDate"
                type="date"
                value={formData.expectedEndDate}
                onChange={(e) =>
                  setFormData({ ...formData, expectedEndDate: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações adicionais sobre esta fase..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
