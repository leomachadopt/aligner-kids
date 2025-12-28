export type CompressImageOptions = {
  maxWidth: number
  maxHeight: number
  maxBytes: number
  outputMime: 'image/webp' | 'image/jpeg'
  quality: number // 0..1
}

const DEFAULTS: CompressImageOptions = {
  maxWidth: 512,
  maxHeight: 512,
  maxBytes: 200 * 1024, // 200KB
  outputMime: 'image/webp',
  quality: 0.82,
}

function dataUrlToBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',')
  if (comma === -1) return dataUrl.length
  const base64 = dataUrl.slice(comma + 1)
  // base64 size ~ 4/3 of bytes (+padding)
  return Math.floor((base64.length * 3) / 4)
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

async function fileToImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Falha ao carregar imagem'))
    })
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

function canvasToDataUrl(
  canvas: HTMLCanvasElement,
  mime: 'image/webp' | 'image/jpeg',
  quality: number,
): string {
  // Some browsers may not support webp; fall back to jpeg.
  try {
    const out = canvas.toDataURL(mime, quality)
    if (mime === 'image/webp' && !out.startsWith('data:image/webp')) {
      return canvas.toDataURL('image/jpeg', quality)
    }
    return out
  } catch {
    return canvas.toDataURL('image/jpeg', quality)
  }
}

export async function compressImageFileToDataUrl(
  file: File,
  opts?: Partial<CompressImageOptions>,
): Promise<{ dataUrl: string; bytes: number; width: number; height: number; mime: string }> {
  const o: CompressImageOptions = { ...DEFAULTS, ...(opts || {}) }
  const img = await fileToImage(file)

  // Resize preserving aspect ratio.
  const scale = Math.min(o.maxWidth / img.width, o.maxHeight / img.height, 1)
  let targetW = Math.max(1, Math.round(img.width * scale))
  let targetH = Math.max(1, Math.round(img.height * scale))

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas não suportado')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // Iteratively reduce quality and (if needed) downscale.
  let quality = clamp(o.quality, 0.4, 0.95)
  let dataUrl = ''
  let bytes = Number.POSITIVE_INFINITY

  for (let attempt = 0; attempt < 10; attempt++) {
    canvas.width = targetW
    canvas.height = targetH
    ctx.clearRect(0, 0, targetW, targetH)
    ctx.drawImage(img, 0, 0, targetW, targetH)

    dataUrl = canvasToDataUrl(canvas, o.outputMime, quality)
    bytes = dataUrlToBytes(dataUrl)

    if (bytes <= o.maxBytes) break

    // First try lowering quality, then downscale slightly.
    if (quality > 0.55) {
      quality = clamp(quality - 0.08, 0.45, 0.95)
    } else {
      targetW = Math.max(1, Math.round(targetW * 0.9))
      targetH = Math.max(1, Math.round(targetH * 0.9))
    }
  }

  return { dataUrl, bytes, width: targetW, height: targetH, mime: dataUrl.slice(5, dataUrl.indexOf(';')) }
}






