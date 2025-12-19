export type ActivePhotoFrame = {
  frameStyle?: string
  overlayUrl?: string
  exportMode?: string
}

const DEFAULT_RAINBOW_OVERLAY_URL = '/rewards/frames/rainbow-frame.svg'

export function normalizeActivePhotoFrame(meta: any): ActivePhotoFrame | null {
  if (!meta) return null
  const slot = String(meta.slot || '')
  const frameStyle = meta.frameStyle || (slot === 'photo_frame' ? 'rainbow' : undefined)
  const exportMode = meta.exportMode || (slot === 'photo_frame' ? 'burn' : undefined)
  const overlayUrl =
    meta.overlayUrl ||
    (slot === 'photo_frame' || String(frameStyle || '') === 'rainbow'
      ? DEFAULT_RAINBOW_OVERLAY_URL
      : undefined)

  return { exportMode, frameStyle, overlayUrl }
}


