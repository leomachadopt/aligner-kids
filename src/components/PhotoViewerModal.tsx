/**
 * Photo Viewer Modal Component
 * Modal para visualização ampliada de fotos com ações
 */

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  X,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import type { ProgressPhoto, PhotoType } from '@/types/photo'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface PhotoViewerModalProps {
  photo: ProgressPhoto | null
  isOpen: boolean
  onClose: () => void
  photoTypeLabel: string
  onDelete?: (photoId: string) => void
  canDelete?: boolean
  activePhotoFrame?: {
    frameStyle?: string
    overlayUrl?: string
    exportMode?: string
  } | null
}

const PHOTO_TYPE_LABELS: Record<PhotoType, string> = {
  frontal: 'Sorriso Frontal',
  right: 'Lado Direito',
  left: 'Lado Esquerdo',
}

export function PhotoViewerModal({
  photo,
  isOpen,
  onClose,
  photoTypeLabel,
  onDelete,
  canDelete = false,
  activePhotoFrame = null,
}: PhotoViewerModalProps) {
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  if (!photo) return null

  const handleDownload = () => {
    const fileName = `${photoTypeLabel}-alinhador-${photo.alignerNumber || 'inicial'}-${format(new Date(photo.capturedAt), 'yyyy-MM-dd')}.jpg`

    // If we have an active frame configured for burn export, generate via canvas
    if (activePhotoFrame && (activePhotoFrame.exportMode || 'burn') === 'burn') {
      exportWithFrame(photo.photoUrl, fileName, activePhotoFrame).catch(() => {
        // fallback
        const link = document.createElement('a')
        link.href = photo.photoUrl
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      })
      return
    }

    const link = document.createElement('a')
    link.href = photo.photoUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  function drawRainbowFrame(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const thickness = Math.max(18, Math.floor(Math.min(w, h) * 0.06))
    const radius = Math.floor(Math.min(w, h) * 0.04)

    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, '#ff4d4d')
    grad.addColorStop(0.2, '#ffa94d')
    grad.addColorStop(0.4, '#ffd43b')
    grad.addColorStop(0.6, '#69db7c')
    grad.addColorStop(0.8, '#4dabf7')
    grad.addColorStop(1, '#b197fc')

    ctx.save()
    ctx.lineWidth = thickness
    ctx.strokeStyle = grad
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    const x = thickness / 2
    const y = thickness / 2
    const rw = w - thickness
    const rh = h - thickness

    // Rounded rect path
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + rw - radius, y)
    ctx.quadraticCurveTo(x + rw, y, x + rw, y + radius)
    ctx.lineTo(x + rw, y + rh - radius)
    ctx.quadraticCurveTo(x + rw, y + rh, x + rw - radius, y + rh)
    ctx.lineTo(x + radius, y + rh)
    ctx.quadraticCurveTo(x, y + rh, x, y + rh - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
    ctx.stroke()

    // Inner subtle white stroke
    ctx.lineWidth = Math.max(6, Math.floor(thickness * 0.25))
    ctx.strokeStyle = 'rgba(255,255,255,0.65)'
    ctx.stroke()
    ctx.restore()
  }

  async function exportWithFrame(
    photoUrl: string,
    fileName: string,
    frame: { frameStyle?: string; overlayUrl?: string },
  ) {
    const img = await loadImage(photoUrl)
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth || img.width
    canvas.height = img.naturalHeight || img.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas não suportado')

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    if (frame.overlayUrl) {
      const overlay = await loadImage(frame.overlayUrl)
      ctx.drawImage(overlay, 0, 0, canvas.width, canvas.height)
    } else if ((frame.frameStyle || 'rainbow') === 'rainbow') {
      drawRainbowFrame(ctx, canvas.width, canvas.height)
    }

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92),
    )
    if (!blob) throw new Error('Falha ao exportar imagem')

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50))
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleReset = () => {
    setZoom(100)
    setRotation(0)
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(photo.id)
      setShowDeleteDialog(false)
      onClose()
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[95vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  {photoTypeLabel}
                  {photo.hasIssues && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Atenção
                    </Badge>
                  )}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {photo.alignerNumber
                    ? `Alinhador ${photo.alignerNumber}`
                    : 'Fotos Iniciais'}{' '}
                  · {format(new Date(photo.capturedAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Image Viewer */}
          <div className="relative overflow-auto max-h-[70vh] bg-black/5 rounded-lg flex items-center justify-center p-4">
            <div
              className="relative"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
              }}
            >
              <img
                src={photo.photoUrl}
                alt={photoTypeLabel}
                className="block transition-all duration-300 ease-in-out"
                style={{
                  maxWidth: '100%',
                  maxHeight: '60vh',
                }}
              />

              {/* Moldura visível (preview) */}
              {activePhotoFrame && (activePhotoFrame.exportMode || 'burn') === 'burn' && (
                <>
                  {activePhotoFrame.overlayUrl ? (
                    <img
                      src={activePhotoFrame.overlayUrl}
                      alt="Moldura"
                      className="absolute inset-0 h-full w-full pointer-events-none"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (activePhotoFrame.frameStyle || 'rainbow') === 'rainbow' ? (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        borderRadius: 12,
                        border: '14px solid transparent',
                        background:
                          'linear-gradient(#0000, #0000) padding-box, linear-gradient(135deg, #ff4d4d, #ffa94d, #ffd43b, #69db7c, #4dabf7, #b197fc) border-box',
                      }}
                    />
                  ) : null}
                </>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[60px] text-center">
                {zoom}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>

              <div className="h-4 w-px bg-border mx-2" />

              <Button variant="outline" size="sm" onClick={handleRotate}>
                <RotateCw className="h-4 w-4" />
              </Button>

              <Button variant="outline" size="sm" onClick={handleReset}>
                Resetar
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Baixar
              </Button>

              {canDelete && onDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Deletar
                </Button>
              )}

              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Photo Info */}
          <div className="border-t pt-4 space-y-2">
            {photo.clinicianNotes && (
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Observações Clínicas:
                </p>
                <p className="text-sm text-blue-800">{photo.clinicianNotes}</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
              {photo.fileName && (
                <div>
                  <span className="font-semibold">Arquivo:</span> {photo.fileName}
                </div>
              )}
              {photo.fileSize && (
                <div>
                  <span className="font-semibold">Tamanho:</span>{' '}
                  {(photo.fileSize / 1024 / 1024).toFixed(2)} MB
                </div>
              )}
              <div>
                <span className="font-semibold">Enviado em:</span>{' '}
                {format(new Date(photo.uploadedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </div>
              <div>
                <span className="font-semibold">ID:</span> {photo.id.slice(0, 8)}...
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta foto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar Foto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
