import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { InventoryEntry } from '@/types/store'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: InventoryEntry | null
}

function getHowToUse(entry: InventoryEntry): string {
  const category = entry.item?.category
  if (category === 'photo_frame') return 'Ative a moldura e use o botão “Baixar” no visualizador de fotos.'
  if (category === 'story_unlock') return 'Esse prêmio libera novas opções no Diretor de Histórias.'
  return 'Este prêmio está na sua coleção.'
}

function RewardPreview({ entry }: { entry: InventoryEntry }) {
  const category = entry.item?.category
  const meta = entry.item?.metadata || {}
  const imageUrl = entry.item?.imageUrl || null

  if (category === 'photo_frame') {
    // Preview simples: imagem de amostra + borda estilo arco-íris (visual aproximado)
    const sample = meta.previewSampleUrl || 'https://img.usecurling.com/p/800/450?q=smiling%20kid%20portrait'
    return (
      <div className="aspect-video rounded-lg border bg-muted/30 overflow-hidden relative">
        <img src={sample} alt="Exemplo" className="h-full w-full object-cover" />
        <div className="absolute inset-0 pointer-events-none" style={{
          borderRadius: 10,
          border: '14px solid transparent',
          background:
            'linear-gradient(#0000, #0000) padding-box, linear-gradient(135deg, #ff4d4d, #ffa94d, #ffd43b, #69db7c, #4dabf7, #b197fc) border-box',
        }} />
      </div>
    )
  }

  if (category === 'story_unlock') {
    const themes = Array.isArray(meta.addThemes) ? meta.addThemes : []
    const envs = Array.isArray(meta.addEnvironments) ? meta.addEnvironments : []
    return (
      <div className="aspect-video rounded-lg border bg-muted/30 p-4 text-sm">
        <p className="font-semibold">Você desbloqueia:</p>
        <ul className="mt-2 list-disc list-inside text-muted-foreground">
          {envs.length > 0 && <li>Ambientes: {envs.join(', ')}</li>}
          {themes.length > 0 && <li>Temas: {themes.join(', ')}</li>}
          {envs.length === 0 && themes.length === 0 && <li>Opções extras no Story Director</li>}
        </ul>
      </div>
    )
  }

  return (
    <div className="aspect-video rounded-lg border bg-muted/30 overflow-hidden">
      {imageUrl ? (
        <img src={imageUrl} alt="Prêmio" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
          Sem preview
        </div>
      )}
    </div>
  )
}

export function RewardDetailModal({ open, onOpenChange, entry }: Props) {
  if (!entry) return null

  const name = entry.item?.name || entry.itemId
  const description = entry.item?.description || ''
  const type = entry.item?.type || 'digital'
  const category = entry.item?.category || 'unknown'
  const meta = entry.item?.metadata || {}

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {name}
            <Badge variant={type === 'real' ? 'default' : 'secondary'}>
              {type === 'real' ? 'Vale' : 'Digital'}
            </Badge>
            <Badge variant="outline">{category}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <RewardPreview entry={entry} />
            <div className="text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Como usar</p>
              <p className="mt-1">{getHowToUse(entry)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="font-semibold">Descrição</p>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>

            <div>
              <p className="font-semibold">Status</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary">x{entry.quantity}</Badge>
                {entry.isEquipped && <Badge>Ativo</Badge>}
              </div>
            </div>

            <div>
              <p className="font-semibold">Detalhes</p>
              <div className="mt-2 text-xs text-muted-foreground space-y-1">
                {entry.slot && <p>Slot: {entry.slot}</p>}
                {meta?.exportMode && <p>Export: {String(meta.exportMode)}</p>}
                {meta?.frameStyle && <p>Frame: {String(meta.frameStyle)}</p>}
                {Array.isArray(meta?.addThemes) && meta.addThemes.length > 0 && (
                  <p>Temas desbloqueados: {meta.addThemes.join(', ')}</p>
                )}
                {Array.isArray(meta?.addEnvironments) && meta.addEnvironments.length > 0 && (
                  <p>Ambientes desbloqueados: {meta.addEnvironments.join(', ')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


