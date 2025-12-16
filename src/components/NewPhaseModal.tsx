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
    startDate: new Date().toISOString().split('T')[0],
    expectedEndDate: '',
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
        startDate: formData.startDate || undefined,
        expectedEndDate: formData.expectedEndDate || undefined,
      }

      await PhaseService.createPhase(input)
      toast.success('Nova fase criada com sucesso!')
      onSuccess()
      onOpenChange(false)

      // Reset form
      setFormData({
        phaseName: '',
        description: '',
        totalAligners: '20',
        startDate: new Date().toISOString().split('T')[0],
        expectedEndDate: '',
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Iniciar Nova Fase do Tratamento</DialogTitle>
          <DialogDescription>
            Crie uma nova fase para o tratamento de {patientName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {lastPhase && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium">Fase Anterior: {lastPhase.phaseName}</p>
              <p className="text-muted-foreground">
                Último alinhador: #{lastPhase.endAlignerNumber}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Nova Fase</Label>
            <p className="text-sm text-muted-foreground">Fase #{nextPhaseNumber}</p>
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
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva os objetivos desta fase..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalAligners">Quantidade de Alinhadores *</Label>
            <Input
              id="totalAligners"
              type="number"
              min="1"
              value={formData.totalAligners}
              onChange={(e) => setFormData({ ...formData, totalAligners: e.target.value })}
              required
            />
          </div>

          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
            <p className="font-medium">Numeração dos Alinhadores:</p>
            <p>Inicia em: #{startAlignerNumber}</p>
            <p>Termina em: #{endAlignerNumber}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedEndDate">Previsão de Término</Label>
              <Input
                id="expectedEndDate"
                type="date"
                value={formData.expectedEndDate}
                onChange={(e) => setFormData({ ...formData, expectedEndDate: e.target.value })}
              />
            </div>
          </div>

          {lastPhase && lastPhase.status === 'active' && (
            <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-900">
              ℹ️ A fase anterior será mantida como ativa. Você precisará concluí-la manualmente e depois iniciar esta nova fase.
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar Fase'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
