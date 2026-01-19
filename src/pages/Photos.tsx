/**
 * Photos Page - Sistema de Fotos de Progresso
 * Permite upload e visualização de fotos organizadas por período/alinhador
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Folder, ChevronDown, ChevronUp, Loader2, Info, Maximize2, Camera } from 'lucide-react'
import { PhotoUploadModal } from '@/components/PhotoUploadModal'
import { PhotoViewerModal } from '@/components/PhotoViewerModal'
import { PhotoService } from '@/services/photoService'
import { StoreService } from '@/services/storeService'
import { toast } from 'sonner'
import type { PhotoPeriod, PhotoType, ProgressPhoto } from '@/types/photo'
import { format } from 'date-fns'
import { ptBR, enUS, es } from 'date-fns/locale'
import type { Locale } from 'date-fns'
import { normalizeActivePhotoFrame } from '@/utils/photoFrames'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/PageHeader'

const Photos = () => {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [periods, setPeriods] = useState<PhotoPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedPeriods, setExpandedPeriods] = useState<Set<number>>(new Set([0]))
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [selectedPhotoType, setSelectedPhotoType] = useState<PhotoType>('frontal')
  const [currentAligner, setCurrentAligner] = useState(1)
  const [treatmentId, setTreatmentId] = useState<string>('')
  const [requiredPhotos, setRequiredPhotos] = useState<PhotoType[]>([])
  const [viewingPhoto, setViewingPhoto] = useState<ProgressPhoto | null>(null)
  const [viewingPhotoType, setViewingPhotoType] = useState<string>('')
  const [activePhotoFrame, setActivePhotoFrame] = useState<any>(null)

  const getDateLocale = (): Locale => {
    const localeMap: Record<string, Locale> = {
      'pt-BR': ptBR,
      'pt-PT': ptBR,
      'en-US': enUS,
      'es-ES': es,
    }
    return localeMap[i18n.language] || ptBR
  }

  useEffect(() => {
    if (user?.id) {
      loadPhotos()
      checkRequiredPhotos()
      loadCosmetics()
    }
  }, [user?.id])

  const loadPhotos = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const data = await PhotoService.getPatientPhotos(user.id)
      setPeriods(data)

      // Expand the most recent period by default
      if (data.length > 0) {
        setExpandedPeriods(new Set([data[0].period]))
      }
    } catch (error) {
      console.error('Erro ao carregar fotos:', error)
      toast.error('Erro ao carregar fotos')
    } finally {
      setLoading(false)
    }
  }

  const loadCosmetics = async () => {
    if (!user?.id) return
    try {
      const res: any = await StoreService.getActiveCosmetics(user.id)
      const frameInv = res?.cosmetics?.photo_frame?.inventory
      const meta = frameInv?.item?.metadata || {}
      setActivePhotoFrame(normalizeActivePhotoFrame(meta))
    } catch (e) {
      // ignore
    }
  }

  const checkRequiredPhotos = async () => {
    if (!user?.id) return

    try {
      const response = await PhotoService.checkRequiredPhotos(user.id)
      if (response.required) {
        setCurrentAligner(response.currentAligner)
        setRequiredPhotos(response.missingTypes)

        // Get treatment ID (assuming single active treatment)
        // In a real scenario, you'd get this from a treatment context or API
        // For now, we'll set it when uploading
      }
    } catch (error) {
      console.error('Erro ao verificar fotos pendentes:', error)
    }
  }

  const togglePeriod = (period: number) => {
    setExpandedPeriods((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(period)) {
        newSet.delete(period)
      } else {
        newSet.add(period)
      }
      return newSet
    })
  }

  const openUploadModal = (photoType: PhotoType) => {
    setSelectedPhotoType(photoType)
    setUploadModalOpen(true)
  }

  const handleUploadSuccess = () => {
    loadPhotos()
    checkRequiredPhotos()
  }

  const getPhotoByType = (photos: ProgressPhoto[], type: PhotoType) => {
    return photos.find((p) => p.photoType === type)
  }

  const handleViewPhoto = (photo: ProgressPhoto, type: PhotoType) => {
    setViewingPhoto(photo)
    setViewingPhotoType(t(`patient.photos.types.${type}`))
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const dateLocale = getDateLocale()

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title={t('patient.photos.title')}
        subtitle={t('patient.photos.subtitle')}
      />

      {/* Required Photos Alert */}
      {requiredPhotos.length > 0 && (
        <Card className="border-amber-500 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <Info className="h-5 w-5" />
              {t('patient.photos.pending.title')} - {t('patient.photos.gallery.alignerNumber', { number: currentAligner })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-amber-800">
              {t('patient.photos.pending.description', { number: currentAligner, count: requiredPhotos.length })}
            </p>
            <div className="flex flex-wrap gap-2">
              {requiredPhotos.map((type) => (
                <Button
                  key={type}
                  onClick={() => openUploadModal(type)}
                  variant="default"
                  size="sm"
                  className="gap-2 bg-amber-600 hover:bg-amber-700"
                >
                  <Camera className="h-4 w-4" />
                  {t(`patient.photos.types.${type}`)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Section - Always Available */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>{t('patient.photos.upload.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-muted-foreground">
            {t('patient.photos.upload.description')}
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {(['frontal', 'right', 'left'] as PhotoType[]).map((type) => (
              <Button
                key={type}
                onClick={() => openUploadModal(type)}
                variant="outline"
                className="h-auto flex-col gap-2 p-4"
              >
                <Camera className="h-6 w-6" />
                <span>{t(`patient.photos.types.${type}`)}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Photos Gallery - Organized by Period */}
      {periods.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">{t('patient.photos.gallery.title')}</h2>
          {periods.map((period) => {
            const isExpanded = expandedPeriods.has(period.period)
            const frontal = getPhotoByType(period.photos, 'frontal')
            const right = getPhotoByType(period.photos, 'right')
            const left = getPhotoByType(period.photos, 'left')

            return (
              <Card key={period.period}>
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => togglePeriod(period.period)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Folder className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle>
                          {period.alignerNumber
                            ? t('patient.photos.gallery.alignerNumber', { number: period.alignerNumber })
                            : t('patient.photos.gallery.initialPhotos')}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {t(`patient.photos.gallery.photoCount_${period.photos.length === 1 ? 'one' : 'other'}`, { count: period.photos.length })}
                          {period.photos[0] && (
                            <> · {format(new Date(period.photos[0].capturedAt), 'dd MMM yyyy', { locale: dateLocale })}</>
                          )}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      {(['frontal', 'right', 'left'] as PhotoType[]).map((type) => {
                        const photo = getPhotoByType(period.photos, type)

                        return (
                          <div key={type} className="space-y-2">
                            <p className="font-medium text-sm">{t(`patient.photos.types.${type}`)}</p>
                            {photo ? (
                              <div
                                className="group relative aspect-video overflow-hidden rounded-lg border-2 border-primary/20 cursor-pointer"
                                onClick={() => handleViewPhoto(photo, type)}
                              >
                                <img
                                  src={photo.photoUrl}
                                  alt={t(`patient.photos.types.${type}`)}
                                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                />
                                {/* Moldura ativa já na miniatura (preview) */}
                                {activePhotoFrame && (activePhotoFrame.exportMode || 'burn') === 'burn' && (
                                  <>
                                    {activePhotoFrame.overlayUrl ? (
                                      <img
                                        src={activePhotoFrame.overlayUrl}
                                        alt="Moldura"
                                        className="absolute inset-0 h-full w-full pointer-events-none"
                                        style={{ objectFit: 'cover' }}
                                      />
                                    ) : null}
                                  </>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 flex flex-col items-center justify-center gap-2">
                                  <Maximize2 className="h-8 w-8 text-white" />
                                  <p className="font-bold text-white text-sm">
                                    {t('patient.photos.gallery.clickToEnlarge')}
                                  </p>
                                  <p className="text-xs text-white">
                                    {format(new Date(photo.capturedAt), 'dd/MM/yyyy HH:mm', { locale: dateLocale })}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="aspect-video flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30">
                                <p className="text-sm text-muted-foreground">
                                  {t('patient.photos.gallery.noPhoto')}
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Clinician Notes */}
                    {period.photos.some(p => p.clinicianNotes) && (
                      <div className="mt-4 rounded-lg bg-blue-50 p-4">
                        <p className="font-semibold text-blue-900 mb-2">{t('patient.photos.gallery.clinicianNotes')}</p>
                        {period.photos.filter(p => p.clinicianNotes).map(photo => (
                          <div key={photo.id} className="text-sm text-blue-800">
                            <span className="font-medium">{t(`patient.photos.types.${photo.photoType}`)}:</span>{' '}
                            {photo.clinicianNotes}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Camera className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('patient.photos.gallery.noPhotos')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('patient.photos.gallery.noPhotosDescription')}
            </p>
            <Button onClick={() => openUploadModal('frontal')} className="gap-2">
              <Camera className="h-4 w-4" />
              {t('patient.photos.gallery.takeFirst')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upload Modal */}
      {user?.id && (
        <PhotoUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          patientId={user.id}
          treatmentId={treatmentId || `treatment-${user.id}`} // Fallback - ideally get from context
          alignerNumber={currentAligner}
          photoType={selectedPhotoType}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* Photo Viewer Modal */}
      <PhotoViewerModal
        photo={viewingPhoto}
        isOpen={!!viewingPhoto}
        onClose={() => setViewingPhoto(null)}
        photoTypeLabel={viewingPhotoType}
        canDelete={false} // Pacientes não podem deletar suas próprias fotos
        activePhotoFrame={activePhotoFrame}
      />
    </div>
  )
}

export default Photos
