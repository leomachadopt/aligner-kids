import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, Pause, XCircle } from 'lucide-react'
import type { TreatmentPhase } from '@/types/aligner'
import { PhaseService } from '@/services/phaseService'

interface PhaseCardProps {
  phase: TreatmentPhase
  isActive?: boolean
  onEdit?: () => void
  onStart?: () => void
  onComplete?: () => void
}

export function PhaseCard({ phase, isActive, onEdit, onStart, onComplete }: PhaseCardProps) {
  const progress = PhaseService.calculateLocalPhaseProgress(phase)
  const statusLabel = PhaseService.getStatusLabel(phase.status)

  const getStatusIcon = () => {
    switch (phase.status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'active':
        return <Circle className="h-5 w-5 text-blue-500 fill-blue-500" />
      case 'paused':
        return <Pause className="h-5 w-5 text-yellow-500" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Circle className="h-5 w-5 text-gray-400" />
    }
  }

  return (
    <Card className={isActive ? 'border-blue-500 border-2' : ''}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <h3 className="font-semibold text-lg">{phase.phaseName}</h3>
                {phase.description && (
                  <p className="text-sm text-muted-foreground">{phase.description}</p>
                )}
              </div>
            </div>
            <Badge variant={phase.status === 'active' ? 'default' : 'secondary'}>
              {statusLabel}
            </Badge>
          </div>

          {/* Aligner Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Alinhadores</p>
              <p className="font-semibold">
                #{phase.startAlignerNumber} a #{phase.endAlignerNumber}
              </p>
              <p className="text-xs text-muted-foreground">({phase.totalAligners} total)</p>
            </div>
            {phase.status === 'active' && (
              <div>
                <p className="text-muted-foreground">Progresso</p>
                <p className="font-semibold">{progress}%</p>
                <p className="text-xs text-muted-foreground">
                  Alinhador {phase.currentAlignerNumber} de {phase.totalAligners}
                </p>
              </div>
            )}
          </div>

          {/* Dates */}
          {(phase.startDate || phase.expectedEndDate) && (
            <div className="text-sm">
              <p className="text-muted-foreground mb-1">Período</p>
              {phase.startDate && (
                <p className="text-xs">
                  Início: {new Date(phase.startDate).toLocaleDateString('pt-BR')}
                </p>
              )}
              {phase.expectedEndDate && (
                <p className="text-xs">
                  Previsto: {new Date(phase.expectedEndDate).toLocaleDateString('pt-BR')}
                </p>
              )}
              {phase.actualEndDate && (
                <p className="text-xs">
                  Concluído: {new Date(phase.actualEndDate).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          {(onEdit || onStart || onComplete) && (
            <div className="flex gap-2 pt-2 flex-wrap">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  Editar Fase
                </Button>
              )}
              {onStart && phase.status === 'pending' && (
                <Button size="sm" onClick={onStart}>
                  Iniciar Fase
                </Button>
              )}
              {onComplete && phase.status === 'active' && (
                <Button size="sm" onClick={onComplete} variant="outline">
                  Concluir Fase
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
