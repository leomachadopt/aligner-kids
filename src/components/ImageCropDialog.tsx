/**
 * Componente de diálogo para recorte de imagem
 * Permite ao usuário recortar uma imagem em formato quadrado
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { ZoomIn, Loader2 } from 'lucide-react'

interface ImageCropDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageSrc: string
  onCropComplete: (croppedImage: string) => void
}

export const ImageCropDialog = ({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
}: ImageCropDialogProps) => {
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)

  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Resetar ao abrir/fechar
  useEffect(() => {
    if (open) {
      console.log('Dialog aberto, src:', imageSrc?.substring(0, 50))
      setImageLoaded(false)
      setZoom(1)
      setPosition({ x: 0, y: 0 })
      setIsDragging(false)
    }
  }, [open, imageSrc])

  // Callback quando imagem carregar
  const handleImageLoad = useCallback(() => {
    const img = imageRef.current
    const container = containerRef.current

    if (!img || !container) {
      console.error('Ref não disponível')
      return
    }

    console.log('Imagem carregada:', {
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      containerWidth: container.offsetWidth,
    })

    // Calcular zoom inicial baseado no menor lado da imagem
    const containerSize = container.offsetWidth
    const minImgDimension = Math.min(img.naturalWidth, img.naturalHeight)
    const initialZoom = (containerSize / minImgDimension) * 0.8 // 80% para ter margem

    console.log('Definindo zoom inicial:', initialZoom)
    setZoom(initialZoom)
    setImageLoaded(true)
  }, [])

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageLoaded) return
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageLoaded) return
    e.preventDefault()
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!imageLoaded) return
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !imageLoaded) return
    const touch = e.touches[0]
    setPosition({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // Processar crop
  const handleCrop = useCallback(() => {
    const image = imageRef.current
    const container = containerRef.current

    if (!image || !container || !image.complete) {
      console.error('Não é possível fazer crop - imagem não carregada')
      return
    }

    console.log('Processando crop...')

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const outputSize = 512
    canvas.width = outputSize
    canvas.height = outputSize

    const containerSize = container.offsetWidth
    const scaledWidth = image.naturalWidth * zoom
    const scaledHeight = image.naturalHeight * zoom

    // Posição da imagem no container
    const imgX = (containerSize - scaledWidth) / 2 + position.x
    const imgY = (containerSize - scaledHeight) / 2 + position.y

    // Área de origem na imagem original
    const scale = image.naturalWidth / scaledWidth
    const sourceX = Math.max(0, -imgX * scale)
    const sourceY = Math.max(0, -imgY * scale)
    const sourceSize = containerSize * scale

    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      outputSize,
      outputSize
    )

    const croppedImage = canvas.toDataURL('image/jpeg', 0.9)
    console.log('Crop concluído, tamanho:', croppedImage.length)
    onCropComplete(croppedImage)
    onOpenChange(false)
  }, [zoom, position, onCropComplete, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-2 border-gradient-to-r from-teal-300 via-cyan-300 to-blue-300">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-extrabold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                ✂️ Recortar Imagem
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 font-medium mt-1">
                Arraste a imagem para posicionar e ajuste o zoom. A área do quadrado será o avatar.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview da imagem */}
          <div
            ref={containerRef}
            className="relative w-full bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 rounded-2xl overflow-hidden border-4 border-teal-400 shadow-2xl"
            style={{
              aspectRatio: '1',
              maxWidth: '500px',
              margin: '0 auto',
            }}
          >
            {/* Container da imagem arrastável */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                cursor: imageLoaded ? (isDragging ? 'grabbing' : 'grab') : 'default',
                userSelect: 'none',
                WebkitUserSelect: 'none',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* A imagem em si */}
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Preview"
                draggable={false}
                onLoad={handleImageLoad}
                onError={(e) => {
                  console.error('Erro ao carregar imagem:', e)
                }}
                style={{
                  display: 'block',
                  maxWidth: 'none',
                  pointerEvents: 'none',
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                  transformOrigin: 'center',
                  transition: isDragging ? 'none' : 'transform 0.1s',
                  visibility: imageLoaded ? 'visible' : 'hidden',
                }}
              />

              {/* Indicador de loading */}
              {!imageLoaded && (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                  <p className="text-sm text-white">Carregando imagem...</p>
                </div>
              )}
            </div>

            {/* Grid de auxílio */}
            {imageLoaded && (
              <div className="absolute inset-0 pointer-events-none">
                <svg className="w-full h-full">
                  <defs>
                    <pattern id="grid" width="33.33%" height="33.33%" patternUnits="userSpaceOnUse">
                      <rect width="100%" height="100%" fill="none" />
                    </pattern>
                  </defs>
                  {/* Linhas do grid */}
                  <line x1="33.33%" y1="0" x2="33.33%" y2="100%" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                  <line x1="66.66%" y1="0" x2="66.66%" y2="100%" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                  <line x1="0" y1="33.33%" x2="100%" y2="33.33%" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                  <line x1="0" y1="66.66%" x2="100%" y2="66.66%" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                  {/* Borda */}
                  <rect x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)" fill="none" stroke="white" strokeWidth="2" />
                </svg>
              </div>
            )}
          </div>

          {/* Controles */}
          {imageLoaded && (
            <div className="rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200 p-4 shadow-md">
              <Label className="flex items-center gap-2 font-extrabold text-teal-900 text-base mb-3">
                <ZoomIn className="h-5 w-5" />
                🔍 Zoom: {zoom.toFixed(2)}x
              </Label>
              <Slider
                value={[zoom]}
                onValueChange={([value]) => setZoom(value)}
                min={0.1}
                max={3}
                step={0.01}
                className="w-full"
              />
              <p className="text-xs text-teal-800 text-center mt-3 font-medium">
                👆 Arraste para posicionar • 🔎 Deslize para ajustar zoom
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-2 font-bold"
          >
            ❌ Cancelar
          </Button>
          <Button
            onClick={handleCrop}
            disabled={!imageLoaded}
            className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold px-6 shadow-lg"
          >
            {imageLoaded ? '✂️ Recortar e Salvar' : '⏳ Carregando...'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
