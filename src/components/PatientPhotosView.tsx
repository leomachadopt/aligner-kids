/**
 * Patient Photos View Component
 * Visualização de fotos de progresso para ortodontistas
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Camera,
  Folder,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
  Save,
  X,
  Maximize2
} from 'lucide-react'
import { PhotoService } from '@/services/photoService'
import { PhotoViewerModal } from '@/components/PhotoViewerModal'
import { toast } from 'sonner'
import type { PhotoPeriod, PhotoType, ProgressPhoto } from '@/types/photo'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PatientPhotosViewProps {
  patientId: string
  patientName: string
}

const PHOTO_TYPE_LABELS: Record<PhotoType, string> = {
  frontal: 'Sorriso Frontal',
  right: 'Lado Direito',
  left: 'Lado Esquerdo',
}

export function PatientPhotosView({ patientId, patientName }: PatientPhotosViewProps) {
  const [periods, setPeriods] = useState<PhotoPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedPeriods, setExpandedPeriods] = useState<Set<number>>(new Set([0]))
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [hasIssues, setHasIssues] = useState(false)
  const [savingNotes, setSavingNotes] = useState(false)
  const [viewingPhoto, setViewingPhoto] = useState<ProgressPhoto | null>(null)
  const [viewingPhotoType, setViewingPhotoType] = useState<string>('')

  useEffect(() => {
    loadPhotos()
  }, [patientId])

  const loadPhotos = async () => {
    setLoading(true)
    try {
      const data = await PhotoService.getPatientPhotos(patientId)
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

  const getPhotoByType = (photos: ProgressPhoto[], type: PhotoType) => {
    return photos.find((p) => p.photoType === type)
  }

  const startEditingNotes = (photo: ProgressPhoto) => {
    setEditingNotes(photo.id)
    setNotes(photo.clinicianNotes || '')
    setHasIssues(photo.hasIssues || false)
  }

  const cancelEditingNotes = () => {
    setEditingNotes(null)
    setNotes('')
    setHasIssues(false)
  }

  const saveNotes = async (photoId: string) => {
    setSavingNotes(true)
    try {
      await PhotoService.updatePhotoNotes(photoId, notes, hasIssues)
      toast.success('Notas salvas com sucesso!')
      setEditingNotes(null)
      loadPhotos() // Reload to show updated notes
    } catch (error) {
      console.error('Erro ao salvar notas:', error)
      toast.error('Erro ao salvar notas')
    } finally {
      setSavingNotes(false)
    }
  }

  const handleViewPhoto = (photo: ProgressPhoto, type: PhotoType) => {
    setViewingPhoto(photo)
    setViewingPhotoType(PHOTO_TYPE_LABELS[type])
  }

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await PhotoService.deletePhoto(photoId)
      toast.success('Foto deletada com sucesso!')
      loadPhotos() // Reload photos
    } catch (error) {
      console.error('Erro ao deletar foto:', error)
      toast.error('Erro ao deletar foto')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (periods.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Fotos de Progresso
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Camera className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma foto disponível</h3>
          <p className="text-muted-foreground">
            {patientName} ainda não enviou fotos de progresso.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Fotos de Progresso
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {periods.length} período{periods.length !== 1 ? 's' : ''} com fotos
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {periods.map((period) => {
          const isExpanded = expandedPeriods.has(period.period)

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
                      <CardTitle className="text-base">
                        {period.alignerNumber
                          ? `Alinhador ${period.alignerNumber}`
                          : 'Fotos Iniciais'}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {period.photos.length} foto{period.photos.length !== 1 ? 's' : ''}
                        {period.photos[0] && (
                          <> · {format(new Date(period.photos[0].capturedAt), 'dd MMM yyyy', { locale: ptBR })}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {period.photos.some(p => p.hasIssues) && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Atenção
                      </Badge>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-3">
                    {(['frontal', 'right', 'left'] as PhotoType[]).map((type) => {
                      const photo = getPhotoByType(period.photos, type)

                      return (
                        <div key={type} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{PHOTO_TYPE_LABELS[type]}</p>
                            {photo?.hasIssues && (
                              <Badge variant="destructive" className="h-5 text-xs gap-1">
                                <AlertTriangle className="h-3 w-3" />
                              </Badge>
                            )}
                          </div>

                          {photo ? (
                            <div className="space-y-2">
                              <div
                                className="group relative aspect-video overflow-hidden rounded-lg border-2 border-primary/20 cursor-pointer"
                                onClick={() => handleViewPhoto(photo, type)}
                              >
                                <img
                                  src={photo.photoUrl}
                                  alt={PHOTO_TYPE_LABELS[type]}
                                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 flex flex-col items-center justify-center gap-2">
                                  <Maximize2 className="h-8 w-8 text-white" />
                                  <p className="font-bold text-white text-sm">
                                    Clique para ampliar
                                  </p>
                                  <p className="text-xs text-white">
                                    {format(new Date(photo.capturedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                  </p>
                                </div>
                              </div>

                              {/* Notes Section */}
                              {editingNotes === photo.id ? (
                                <div className="space-y-2 rounded-lg bg-muted p-3">
                                  <Textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Adicionar observações clínicas..."
                                    className="min-h-[80px]"
                                  />
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id={`issues-${photo.id}`}
                                      checked={hasIssues}
                                      onChange={(e) => setHasIssues(e.target.checked)}
                                      className="rounded"
                                    />
                                    <label
                                      htmlFor={`issues-${photo.id}`}
                                      className="text-xs cursor-pointer"
                                    >
                                      Marcar como atenção necessária
                                    </label>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => saveNotes(photo.id)}
                                      disabled={savingNotes}
                                      className="gap-1"
                                    >
                                      {savingNotes ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Save className="h-3 w-3" />
                                      )}
                                      Salvar
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={cancelEditingNotes}
                                      disabled={savingNotes}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  {photo.clinicianNotes ? (
                                    <div className="rounded-lg bg-blue-50 p-2 text-xs">
                                      <p className="text-blue-900">{photo.clinicianNotes}</p>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="mt-1 h-6 text-xs"
                                        onClick={() => startEditingNotes(photo)}
                                      >
                                        Editar
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full text-xs"
                                      onClick={() => startEditingNotes(photo)}
                                    >
                                      Adicionar Observação
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="aspect-video flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30">
                              <p className="text-sm text-muted-foreground">Sem foto</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </CardContent>

      {/* Photo Viewer Modal */}
      <PhotoViewerModal
        photo={viewingPhoto}
        isOpen={!!viewingPhoto}
        onClose={() => setViewingPhoto(null)}
        photoTypeLabel={viewingPhotoType}
        onDelete={handleDeletePhoto}
        canDelete={true}
      />
    </Card>
  )
}
