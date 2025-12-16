/**
 * Pending Photos Alert Component
 * Alerta visual para fotos pendentes no dashboard do paciente
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Camera, AlertCircle } from 'lucide-react'
import { PhotoService } from '@/services/photoService'
import { useNavigate } from 'react-router-dom'
import type { RequiredPhotosResponse } from '@/types/photo'

interface PendingPhotosAlertProps {
  patientId: string
}

const PHOTO_TYPE_LABELS = {
  frontal: 'Frontal',
  right: 'Direita',
  left: 'Esquerda',
}

export function PendingPhotosAlert({ patientId }: PendingPhotosAlertProps) {
  const [requiredPhotos, setRequiredPhotos] = useState<RequiredPhotosResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    checkRequiredPhotos()
  }, [patientId])

  const checkRequiredPhotos = async () => {
    try {
      const response = await PhotoService.checkRequiredPhotos(patientId)
      setRequiredPhotos(response)
    } catch (error) {
      console.error('Erro ao verificar fotos pendentes:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !requiredPhotos || !requiredPhotos.required) {
    return null
  }

  return (
    <Card className="border-amber-500 bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-amber-500 p-2">
            <Camera className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="h-5 w-5" />
              Hora de Tirar suas Fotos!
            </CardTitle>
            <p className="text-sm text-amber-800 mt-1">
              Alinhador {requiredPhotos.currentAligner} · {requiredPhotos.missingTypes.length} foto
              {requiredPhotos.missingTypes.length !== 1 ? 's' : ''} pendente
              {requiredPhotos.missingTypes.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Badge variant="destructive" className="text-lg px-3 py-1">
            {requiredPhotos.missingTypes.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-white/50 p-4">
          <p className="text-sm font-semibold text-amber-900 mb-2">
            Fotos necessárias:
          </p>
          <div className="flex flex-wrap gap-2">
            {requiredPhotos.missingTypes.map((type) => (
              <Badge key={type} variant="outline" className="bg-white border-amber-300">
                <Camera className="h-3 w-3 mr-1" />
                {PHOTO_TYPE_LABELS[type as keyof typeof PHOTO_TYPE_LABELS]}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => navigate('/photos')}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 gap-2"
          >
            <Camera className="h-4 w-4" />
            Tirar Fotos Agora
          </Button>
        </div>

        <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
          <p className="text-xs text-blue-800">
            💎 <strong>Ganhe pontos!</strong> Envie todas as fotos e ganhe até{' '}
            <strong>150 pontos</strong> de bônus!
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
