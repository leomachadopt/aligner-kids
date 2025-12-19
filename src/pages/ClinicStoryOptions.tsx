import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import { ClinicStoryOptionsService, type ClinicStoryOptionsItem } from '@/services/clinicStoryOptionsService'
import { toast } from 'sonner'
import { compressImageFileToDataUrl } from '@/utils/imageCompression'

export default function ClinicStoryOptions() {
  const { user } = useAuth()
  const clinicId = (user as any)?.clinicId as string | undefined
  const [items, setItems] = useState<ClinicStoryOptionsItem[]>([])
  const [filterType, setFilterType] = useState<'all' | 'environment' | 'character' | 'theme'>('all')
  const [selected, setSelected] = useState<ClinicStoryOptionsItem | null>(null)

  const filtered = useMemo(() => {
    const list = items.slice().sort((a, b) => (a.effective.sortOrder || 0) - (b.effective.sortOrder || 0))
    if (filterType === 'all') return list
    return list.filter((i) => i.effective.type === filterType)
  }, [items, filterType])

  const load = async () => {
    if (!user?.id || !clinicId) return
    try {
      const res = await ClinicStoryOptionsService.list(clinicId, user.id)
      setItems(res.items || [])
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao carregar opções da clínica')
    }
  }

  useEffect(() => {
    load()
  }, [user?.id, clinicId])

  const saveOverride = async (patch: Partial<any>) => {
    if (!user?.id || !clinicId || !selected) return
    try {
      await ClinicStoryOptionsService.upsertOverride(clinicId, selected.effective.id, {
        createdByUserId: user.id,
        ...patch,
      })
      toast.success('Salvo')
      await load()
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao salvar')
    }
  }

  const uploadImage = async (file: File | null) => {
    if (!file) return
    try {
      const { dataUrl, bytes, width, height } = await compressImageFileToDataUrl(file, {
        maxWidth: 512,
        maxHeight: 512,
        maxBytes: 200 * 1024,
        outputMime: 'image/webp',
        quality: 0.82,
      })
      await saveOverride({ imageUrl: dataUrl })
      toast.success(`Imagem carregada (${Math.round(bytes / 1024)}KB • ${width}x${height})`)
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao carregar imagem')
    }
  }

  if (!clinicId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Story Options (Clínica)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Não foi possível identificar a clínica do usuário.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Story Options (Clínica)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(['all', 'environment', 'character', 'theme'] as const).map((t) => (
              <Button
                key={t}
                variant={filterType === t ? 'default' : 'outline'}
                onClick={() => setFilterType(t)}
              >
                {t === 'all' ? 'Todos' : t}
              </Button>
            ))}
          </div>
          <Button variant="outline" onClick={load}>
            Recarregar
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Catálogo ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {filtered.map((i) => (
              <button
                key={i.effective.id}
                onClick={() => setSelected(i)}
                className="flex items-center justify-between rounded-xl border p-4 text-left hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                    {i.effective.imageUrl ? (
                      <img src={i.effective.imageUrl} alt={i.effective.name} className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-2xl">{i.effective.icon}</span>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">{i.effective.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {i.effective.type} • {i.effective.id}
                      {!i.effective.isActive ? ' • oculto' : ''}
                      {i.effective.isDefault ? ' • default' : ''}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Editar</div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="text-sm text-muted-foreground">Nenhum item.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{selected ? `Editar (override): ${selected.effective.id}` : 'Selecione um item'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selected ? (
              <div className="text-sm text-muted-foreground">
                Clique em um ambiente/personagem/tema para personalizar a versão da sua clínica.
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={selected.effective.isActive}
                    onCheckedChange={(v) => saveOverride({ isActive: v })}
                  />
                  <span className="text-sm">Disponível para meus pacientes</span>
                </div>

                <div className="space-y-2">
                  <Label>Nome (override)</Label>
                  <Input
                    defaultValue={selected.override?.name ?? ''}
                    placeholder={selected.template?.name}
                    onBlur={(e) => saveOverride({ name: e.target.value || null })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição (override)</Label>
                  <Textarea
                    defaultValue={selected.override?.description ?? ''}
                    placeholder={selected.template?.description}
                    onBlur={(e) => saveOverride({ description: e.target.value || null })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Imagem (upload)</Label>
                  <Input type="file" accept="image/*" onChange={(e) => uploadImage(e.target.files?.[0] || null)} />
                  <div className="flex items-center gap-3">
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border bg-muted">
                      {selected.effective.imageUrl ? (
                        <img src={selected.effective.imageUrl} alt="Preview" className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-4xl">{selected.effective.icon}</span>
                      )}
                    </div>
                    <Button variant="outline" onClick={() => saveOverride({ imageUrl: null })}>
                      Remover imagem
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


