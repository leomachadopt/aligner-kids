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
      <div className="aspect-video rounded-2xl border-4 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 overflow-hidden relative shadow-lg">
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
      <div className="aspect-video rounded-2xl border-4 border-indigo-300 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-5 shadow-lg">
        <p className="font-extrabold text-indigo-900 text-lg mb-3 flex items-center gap-2">
          <span className="text-2xl">🎉</span> Você desbloqueia:
        </p>
        <ul className="space-y-2 text-sm text-indigo-800">
          {envs.length > 0 && (
            <li className="flex items-start gap-2">
              <span className="font-bold">🌍 Ambientes:</span>
              <span className="flex-1">{envs.join(', ')}</span>
            </li>
          )}
          {themes.length > 0 && (
            <li className="flex items-start gap-2">
              <span className="font-bold">🎨 Temas:</span>
              <span className="flex-1">{themes.join(', ')}</span>
            </li>
          )}
          {envs.length === 0 && themes.length === 0 && (
            <li className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <span>Opções extras no Story Director</span>
            </li>
          )}
        </ul>
      </div>
    )
  }

  return (
    <div className="aspect-video rounded-2xl border-4 border-slate-300 bg-gradient-to-br from-slate-100 to-gray-100 overflow-hidden shadow-lg">
      {imageUrl ? (
        <img src={imageUrl} alt="Prêmio" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full flex flex-col items-center justify-center gap-2">
          <span className="text-4xl">🎁</span>
          <span className="text-sm font-bold text-slate-600">Sem preview disponível</span>
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
      <DialogContent className="max-w-2xl border-2 border-gradient-to-r from-amber-300 via-yellow-300 to-orange-300">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2 text-2xl font-extrabold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                🏆 {name}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={type === 'real' ? 'default' : 'secondary'} className="font-bold">
                  {type === 'real' ? '🎁 Vale' : '✨ Digital'}
                </Badge>
                <Badge variant="outline" className="font-bold">{category}</Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <RewardPreview entry={entry} />
            <div className="rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 p-4 shadow-md">
              <p className="font-extrabold text-cyan-900 text-base mb-2 flex items-center gap-2">
                <span className="text-xl">💡</span> Como usar
              </p>
              <p className="text-sm text-cyan-800 leading-relaxed">{getHowToUse(entry)}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 p-4 shadow-md">
              <p className="font-extrabold text-purple-900 text-base mb-2">📝 Descrição</p>
              <p className="text-sm text-purple-800 leading-relaxed">{description || 'Sem descrição disponível'}</p>
            </div>

            <div className="rounded-xl bg-gradient-to-br from-green-50 to-teal-50 border-2 border-green-200 p-4 shadow-md">
              <p className="font-extrabold text-green-900 text-base mb-2">📊 Status</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-bold text-base px-3 py-1">
                  🔢 x{entry.quantity}
                </Badge>
                {entry.isEquipped && (
                  <Badge className="font-bold text-base px-3 py-1 bg-gradient-to-r from-green-500 to-teal-500">
                    ✅ Ativo
                  </Badge>
                )}
              </div>
            </div>

            <div className="rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 border-2 border-slate-200 p-4 shadow-md">
              <p className="font-extrabold text-slate-900 text-base mb-2">🔍 Detalhes</p>
              <div className="text-sm text-slate-700 space-y-1.5">
                {entry.slot && (
                  <p className="flex items-center gap-2">
                    <span className="font-bold">Slot:</span> {entry.slot}
                  </p>
                )}
                {meta?.exportMode && (
                  <p className="flex items-center gap-2">
                    <span className="font-bold">Export:</span> {String(meta.exportMode)}
                  </p>
                )}
                {meta?.frameStyle && (
                  <p className="flex items-center gap-2">
                    <span className="font-bold">Frame:</span> {String(meta.frameStyle)}
                  </p>
                )}
                {Array.isArray(meta?.addThemes) && meta.addThemes.length > 0 && (
                  <p className="flex items-start gap-2">
                    <span className="font-bold">Temas:</span>
                    <span className="flex-1">{meta.addThemes.join(', ')}</span>
                  </p>
                )}
                {Array.isArray(meta?.addEnvironments) && meta.addEnvironments.length > 0 && (
                  <p className="flex items-start gap-2">
                    <span className="font-bold">Ambientes:</span>
                    <span className="flex-1">{meta.addEnvironments.join(', ')}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


