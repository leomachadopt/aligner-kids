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
      <DialogContent className="sm:max-w-lg border-2 border-gradient-to-r from-pink-300 via-purple-300 to-blue-300">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-extrabold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                {PHOTO_TYPE_LABELS[photoType]}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 font-medium">
                Tire uma foto ou selecione um arquivo para enviar
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Select Mode */}
          {mode === 'select' && (
            <div className="flex flex-col gap-4">
              <Button
                onClick={startCamera}
                size="lg"
                className="gap-3 rounded-xl py-6 text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-lg"
              >
                <Camera className="h-6 w-6" />
                📸 Abrir Câmera
              </Button>

              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="lg"
                className="gap-3 rounded-xl py-6 text-lg font-bold border-2 border-purple-300 hover:bg-purple-50"
              >
                <Upload className="h-6 w-6" />
                📁 Selecionar Arquivo
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
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-black border-4 border-purple-400 shadow-xl">
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={capturePhoto}
                  className="flex-1 gap-2 rounded-xl py-6 text-base font-bold bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 shadow-lg"
                >
                  <Camera className="h-5 w-5" />
                  📸 Capturar Foto
                </Button>
                <Button
                  onClick={retake}
                  variant="outline"
                  className="rounded-xl border-2 px-6"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Preview Mode */}
          {mode === 'preview' && photoData && (
            <div className="space-y-4">
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-black border-4 border-green-400 shadow-xl">
                <img
                  src={photoData}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1 gap-2 rounded-xl py-6 text-base font-bold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      ⏳ Enviando...
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5" />
                      ✅ Confirmar e Enviar
                    </>
                  )}
                </Button>
                <Button
                  onClick={retake}
                  variant="outline"
                  disabled={isUploading}
                  className="rounded-xl border-2 px-6"
                >
                  <X className="h-5 w-5" />
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
