import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/utils/apiClient'
import { Plus, Edit2, Trash2, Check } from 'lucide-react'
import { compressImageFileToDataUrl } from '@/utils/imageCompression'

interface StoreItemTemplate {
  id: string
  name: string
  description: string
  type: 'digital' | 'real'
  category: string
  defaultPriceCoins: number
  defaultRequiredLevel: number
  defaultImageUrl?: string | null
  metadata?: Record<string, any> | null
  isActive: boolean
}

type StoryOptionTemplate = {
  id: string
  type: 'environment' | 'character' | 'theme' | string
  name: string
  description?: string | null
  icon: string
  color: string
  imageUrl?: string | null
  isDefault: boolean
  isActive: boolean
  sortOrder: number
}

function parseCsvIds(v: string): string[] {
  return (v || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function MultiSelectThumb({
  label,
  options,
  valueCsv,
  onChangeCsv,
}: {
  label: string
  options: StoryOptionTemplate[]
  valueCsv: string
  onChangeCsv: (csv: string) => void
}) {
  const selectedIds = parseCsvIds(valueCsv)
  const selected = options.filter((o) => selectedIds.includes(o.id))

  const toggle = (id: string) => {
    const set = new Set(selectedIds)
    if (set.has(id)) set.delete(id)
    else set.add(id)
    onChangeCsv(Array.from(set).join(', '))
  }

  const remove = (id: string) => {
    onChangeCsv(selectedIds.filter((x) => x !== id).join(', '))
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {selected.length > 0
              ? `${selected.length} selecionado(s)`
              : 'Selecionar...'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[420px] p-0" align="start">
          <Command shouldFilter>
            <CommandInput placeholder="Buscar..." />
            <CommandList>
              <CommandEmpty>Nenhum resultado.</CommandEmpty>
              <CommandGroup>
                {options.map((o) => {
                  const isSelected = selectedIds.includes(o.id)
                  return (
                    <CommandItem
                      key={o.id}
                      value={`${o.name} ${o.id}`}
                      onSelect={() => toggle(o.id)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border bg-muted">
                          {o.imageUrl ? (
                            <img
                              src={o.imageUrl}
                              alt={o.name}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <span className="text-xl">{o.icon}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{o.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {o.id}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((o) => (
            <Badge
              key={o.id}
              variant="secondary"
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => remove(o.id)}
              title="Clique para remover"
            >
              <div className="flex h-5 w-5 items-center justify-center overflow-hidden rounded border bg-muted">
                {o.imageUrl ? (
                  <img
                    src={o.imageUrl}
                    alt={o.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-xs">{o.icon}</span>
                )}
              </div>
              <span>{o.name}</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminStoreTemplates() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<StoreItemTemplate[]>([])
  const [storyTemplates, setStoryTemplates] = useState<StoryOptionTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<StoreItemTemplate | null>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'real' as 'digital' | 'real',
    category: 'voucher',
    defaultPriceCoins: 100,
    defaultRequiredLevel: 1,
    defaultImageUrl: '',
    // metadata helpers
    overlayUrl: '',
    previewSampleUrl: '',
    addThemes: '',
    addEnvironments: '',
    addCharacters: '',
    isActive: true,
  })

  const load = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get<{ templates: any[] }>(`/store/templates`)
      setTemplates(res.templates || [])
      // for story_unlock multi-select (thumbnails)
      const so = await apiClient.get<{ templates: StoryOptionTemplate[] }>(
        `/admin/story-option-templates`,
      )
      setStoryTemplates((so.templates || []).filter((t) => t.isActive))
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao carregar templates', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({
      name: '',
      description: '',
      type: 'real',
      category: 'voucher',
      defaultPriceCoins: 100,
      defaultRequiredLevel: 1,
      defaultImageUrl: '',
      overlayUrl: '',
      previewSampleUrl: '',
      addThemes: '',
      addEnvironments: '',
      addCharacters: '',
      isActive: true,
    })
    setOpen(true)
  }

  const openEdit = (t: StoreItemTemplate) => {
    const meta = (t as any).metadata || {}
    setEditing(t)
    setForm({
      name: t.name,
      description: t.description,
      type: t.type,
      category: t.category,
      defaultPriceCoins: t.defaultPriceCoins,
      defaultRequiredLevel: t.defaultRequiredLevel,
      defaultImageUrl: t.defaultImageUrl || '',
      overlayUrl: meta.overlayUrl || '',
      previewSampleUrl: meta.previewSampleUrl || '',
      addThemes: Array.isArray(meta.addThemes) ? meta.addThemes.join(',') : '',
      addEnvironments: Array.isArray(meta.addEnvironments) ? meta.addEnvironments.join(',') : '',
      addCharacters: Array.isArray(meta.addCharacters) ? meta.addCharacters.join(',') : '',
      isActive: t.isActive,
    })
    setOpen(true)
  }

  const buildMetadata = () => {
    const base: any = {}
    if (form.category === 'photo_frame') {
      base.slot = 'photo_frame'
      base.exportMode = 'burn'
      // Se admin informar overlay transparente, usamos ele. Caso contrário, o app usa fallback.
      if (form.overlayUrl) base.overlayUrl = form.overlayUrl
      if (form.previewSampleUrl) base.previewSampleUrl = form.previewSampleUrl
      if (!base.overlayUrl) base.frameStyle = 'rainbow'
    }
    if (form.category === 'story_unlock') {
      base.unlock = 'story_options'
      const addThemes = form.addThemes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const addEnvironments = form.addEnvironments
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const addCharacters = form.addCharacters
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      base.addThemes = addThemes
      base.addEnvironments = addEnvironments
      base.addCharacters = addCharacters
    }
    return base
  }

  const save = async () => {
    try {
      if (!form.name || !form.description) {
        toast({ title: 'Erro', description: 'Nome e descrição são obrigatórios', variant: 'destructive' })
        return
      }
      const metadata = buildMetadata()
      if (editing) {
        await apiClient.put(`/store/templates/${editing.id}`, {
          ...form,
          defaultPriceCoins: Number(form.defaultPriceCoins),
          defaultRequiredLevel: Number(form.defaultRequiredLevel),
          defaultImageUrl: form.defaultImageUrl || null,
          metadata,
        })
      } else {
        await apiClient.post(`/store/templates`, {
          ...form,
          defaultPriceCoins: Number(form.defaultPriceCoins),
          defaultRequiredLevel: Number(form.defaultRequiredLevel),
          defaultImageUrl: form.defaultImageUrl || null,
          metadata,
        })
      }
      setOpen(false)
      await load()
      toast({ title: '✅ Salvo', description: 'Template atualizado' })
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message || 'Falha ao salvar', variant: 'destructive' })
    }
  }

  const remove = async (id: string) => {
    try {
      await apiClient.delete(`/store/templates/${id}`)
      await load()
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message || 'Falha ao remover', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Templates Universais de Prêmios</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : templates.length === 0 ? (
            <p className="text-muted-foreground">Nenhum template cadastrado.</p>
          ) : (
            templates.map((t) => (
              <div key={t.id} className="flex items-start justify-between gap-4 border rounded-lg p-4">
                <div className="flex gap-4 min-w-0">
                  <div className="h-16 w-24 rounded-md overflow-hidden border bg-muted/20 flex items-center justify-center shrink-0">
                    {t.defaultImageUrl ? (
                      <img src={t.defaultImageUrl} alt={t.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs text-muted-foreground">Sem imagem</span>
                    )}
                  </div>
                  <div className="min-w-0">
                  <p className="font-semibold truncate">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.type} • {t.category} • {t.defaultPriceCoins} coins • nível {t.defaultRequiredLevel}+
                  </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(t)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => remove(t.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Template' : 'Novo Template'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Input value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as any }))} />
              </div>
              <div className="space-y-1">
                <Label>Categoria</Label>
                <Input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Preço sugerido (coins)</Label>
                <Input type="number" value={form.defaultPriceCoins} onChange={(e) => setForm((p) => ({ ...p, defaultPriceCoins: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label>Nível sugerido</Label>
                <Input type="number" value={form.defaultRequiredLevel} onChange={(e) => setForm((p) => ({ ...p, defaultRequiredLevel: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Imagem / Preview do Card (URL)</Label>
              <Input value={form.defaultImageUrl} onChange={(e) => setForm((p) => ({ ...p, defaultImageUrl: e.target.value }))} />
              <div className="mt-2">
                <Label className="text-xs text-muted-foreground">Ou faça upload (compressão automática)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    try {
                      const { dataUrl, bytes, width, height } = await compressImageFileToDataUrl(file, {
                        maxWidth: 900,
                        maxHeight: 600,
                        maxBytes: 250 * 1024,
                        outputMime: 'image/webp',
                        quality: 0.82,
                      })
                      setForm((p) => ({ ...p, defaultImageUrl: dataUrl }))
                      toast({
                        title: '✅ Imagem carregada',
                        description: `${Math.round(bytes / 1024)}KB • ${width}x${height}`,
                      })
                    } catch (err: any) {
                      toast({
                        title: 'Erro',
                        description: err?.message || 'Falha ao carregar imagem',
                        variant: 'destructive',
                      })
                    } finally {
                      // permitir subir o mesmo arquivo novamente
                      e.currentTarget.value = ''
                    }
                  }}
                />
              </div>
              {form.defaultImageUrl && (
                <div className="mt-2 aspect-video rounded-lg overflow-hidden border bg-muted/20">
                  <img src={form.defaultImageUrl} alt="Preview" className="h-full w-full object-cover" />
                </div>
              )}
            </div>

            {form.category === 'photo_frame' && (
              <>
                <div className="space-y-1">
                  <Label>Moldura (overlayUrl com fundo transparente)</Label>
                  <Input value={form.overlayUrl} onChange={(e) => setForm((p) => ({ ...p, overlayUrl: e.target.value }))} placeholder="Ex: https://.../frame.svg (transparente)" />
                  <p className="text-xs text-muted-foreground">
                    Se vazio, o app usa o fallback `/rewards/frames/rainbow-frame.svg`.
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Preview sample (URL opcional)</Label>
                  <Input value={form.previewSampleUrl} onChange={(e) => setForm((p) => ({ ...p, previewSampleUrl: e.target.value }))} placeholder="Ex: https://.../sample.jpg" />
                </div>
              </>
            )}

            {form.category === 'story_unlock' && (
              <>
                <MultiSelectThumb
                  label="Temas desbloqueados"
                  options={storyTemplates.filter((t) => t.type === 'theme')}
                  valueCsv={form.addThemes}
                  onChangeCsv={(csv) => setForm((p) => ({ ...p, addThemes: csv }))}
                />
                <MultiSelectThumb
                  label="Ambientes desbloqueados"
                  options={storyTemplates.filter((t) => t.type === 'environment')}
                  valueCsv={form.addEnvironments}
                  onChangeCsv={(csv) => setForm((p) => ({ ...p, addEnvironments: csv }))}
                />
                <MultiSelectThumb
                  label="Personagens desbloqueados"
                  options={storyTemplates.filter((t) => t.type === 'character')}
                  valueCsv={form.addCharacters}
                  onChangeCsv={(csv) => setForm((p) => ({ ...p, addCharacters: csv }))}
                />
                <p className="text-xs text-muted-foreground">
                  Dica: as imagens vêm de <b>Admin → Story Options</b>. Se um item não tiver imagem, cai no emoji.
                </p>
              </>
            )}
          </div>

          <DialogFooter>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


