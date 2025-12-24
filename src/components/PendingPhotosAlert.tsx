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
import { useTranslation } from 'react-i18next'

interface PendingPhotosAlertProps {
  patientId: string
}

export function PendingPhotosAlert({ patientId }: PendingPhotosAlertProps) {
  const { t } = useTranslation()
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

  const photoCountKey = requiredPhotos.missingTypes.length === 1
    ? 'patient.photos.pending.description'
    : 'patient.photos.pending.description_plural'

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
              {t('patient.photos.pending.title')}
            </CardTitle>
            <p className="text-sm text-amber-800 mt-1">
              {t(photoCountKey, {
                number: requiredPhotos.currentAligner,
                count: requiredPhotos.missingTypes.length
              })}
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
            {t('patient.photos.pending.required')}
          </p>
          <div className="flex flex-wrap gap-2">
            {requiredPhotos.missingTypes.map((type) => (
              <Badge key={type} variant="outline" className="bg-white border-amber-300">
                <Camera className="h-3 w-3 mr-1" />
                {t(`patient.photos.types.${type}`)}
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
            {t('patient.photos.pending.takeNow')}
          </Button>
        </div>

        <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
          <p className="text-xs text-blue-800" dangerouslySetInnerHTML={{ __html: t('patient.photos.pending.earnBonus') }} />
        </div>
      </CardContent>
    </Card>
  )
}
