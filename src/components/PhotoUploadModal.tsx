/**
 * Photo Upload Modal Component
 * Modal para capturar ou fazer upload de fotos de progresso
 */

import { useState, useRef, useEffect } from 'react'
import { Camera, Upload, X, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { PhotoService } from '@/services/photoService'
import type { PhotoType } from '@/types/photo'

interface PhotoUploadModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  treatmentId: string
  alignerNumber: number
  photoType: PhotoType
  onSuccess: () => void
}

const PHOTO_TYPE_LABELS: Record<PhotoType, string> = {
  frontal: 'Sorriso Frontal',
  right: 'Lado Direito',
  left: 'Lado Esquerdo',
}

export function PhotoUploadModal({
  isOpen,
  onClose,
  patientId,
  treatmentId,
  alignerNumber,
  photoType,
  onSuccess,
}: PhotoUploadModalProps) {
  const [mode, setMode] = useState<'select' | 'camera' | 'preview'>('select')
  const [photoData, setPhotoData] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cleanup camera stream when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopCamera()
      setMode('select')
      setPhotoData(null)
    }
  }, [isOpen])

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      })

      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
      }

      setMode('camera')
    } catch (error) {
      console.error('Erro ao acessar câmera:', error)
      toast.error('Não foi possível acessar a câmera')
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      setPhotoData(dataUrl)
      setMode('preview')
      stopCamera()
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const base64 = await PhotoService.fileToBase64(file)
      setPhotoData(base64)
      setMode('preview')
    } catch (error) {
      console.error('Erro ao processar arquivo:', error)
      toast.error('Erro ao processar arquivo')
    }
  }

  const handleUpload = async () => {
    if (!photoData) return

    setIsUploading(true)

    try {
      await PhotoService.uploadPhoto({
        patientId,
        treatmentId,
        alignerNumber,
        photoType,
        photoData,
        capturedAt: new Date().toISOString(),
      })

      toast.success(`Foto ${PHOTO_TYPE_LABELS[photoType]} enviada com sucesso!`)
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      toast.error('Erro ao enviar foto')
    } finally {
      setIsUploading(false)
    }
  }

  const retake = () => {
    setPhotoData(null)
    setMode('select')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{PHOTO_TYPE_LABELS[photoType]}</DialogTitle>
          <DialogDescription>
            Tire uma foto ou selecione um arquivo para enviar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Select Mode */}
          {mode === 'select' && (
            <div className="flex flex-col gap-3">
              <Button
                onClick={startCamera}
                size="lg"
                className="gap-2"
              >
                <Camera className="h-5 w-5" />
                Abrir Câmera
              </Button>

              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <Upload className="h-5 w-5" />
                Selecionar Arquivo
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          )}

          {/* Camera Mode */}
          {mode === 'camera' && (
            <div className="space-y-4">
              <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={capturePhoto} className="flex-1 gap-2">
                  <Camera className="h-4 w-4" />
                  Capturar Foto
                </Button>
                <Button onClick={retake} variant="outline">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Preview Mode */}
          {mode === 'preview' && photoData && (
            <div className="space-y-4">
              <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
                <img
                  src={photoData}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1 gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Confirmar e Enviar
                    </>
                  )}
                </Button>
                <Button onClick={retake} variant="outline" disabled={isUploading}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
