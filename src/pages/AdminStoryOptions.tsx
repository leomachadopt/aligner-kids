import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { AdminStoryOptionsService, type StoryOptionTemplate } from '@/services/adminStoryOptionsService'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { compressImageFileToDataUrl } from '@/utils/imageCompression'

type TemplateForm = {
  id: string
  type: 'environment' | 'character' | 'theme'
  name: string
  description?: string
  icon: string
  color: string
  imageUrl?: string | null
  isDefault: boolean
  isActive: boolean
  sortOrder: number
}

const DEFAULT_FORM: TemplateForm = {
  id: '',
  type: 'environment',
  name: '',
  description: '',
  icon: '✨',
  color: 'bg-purple-500',
  imageUrl: null,
  isDefault: false,
  isActive: true,
  sortOrder: 0,
}

export default function AdminStoryOptions() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<StoryOptionTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'environment' | 'character' | 'theme'>('all')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TemplateForm>({ ...DEFAULT_FORM })

  const filtered = useMemo(() => {
    const list = templates.slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    if (filterType === 'all') return list
    return list.filter((t) => t.type === filterType)
  }, [templates, filterType])

  const resetForm = () => {
    setEditingId(null)
    setForm({ ...DEFAULT_FORM })
  }

  const load = async () => {
    setLoading(true)
    try {
      const res = await AdminStoryOptionsService.listTemplates()
      setTemplates(res.templates || [])
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao carregar templates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const startEdit = (t: StoryOptionTemplate) => {
    setEditingId(t.id)
    setForm({
      id: t.id,
      type: (t.type as any) || 'environment',
      name: t.name || '',
      description: (t.description as any) || '',
      icon: t.icon || '✨',
      color: t.color || 'bg-purple-500',
      imageUrl: (t.imageUrl as any) || null,
      isDefault: !!t.isDefault,
      isActive: !!t.isActive,
      sortOrder: Number(t.sortOrder) || 0,
    })
  }

  const onUpload = async (file: File | null) => {
    if (!file) return
    try {
      const { dataUrl, bytes, width, height } = await compressImageFileToDataUrl(file, {
        maxWidth: 512,
        maxHeight: 512,
        maxBytes: 200 * 1024,
        outputMime: 'image/webp',
        quality: 0.82,
      })
      setForm((f) => ({ ...f, imageUrl: dataUrl }))
      toast.success(`Imagem carregada (${Math.round(bytes / 1024)}KB • ${width}x${height})`)
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao carregar imagem')
    }
  }

  const save = async () => {
    if (!user?.id) {
      toast.error('Usuário não autenticado')
      return
    }
    if (!form.id || !form.type || !form.name) {
      toast.error('id, tipo e nome são obrigatórios')
      return
    }
    try {
      if (editingId) {
        await AdminStoryOptionsService.updateTemplate(editingId, {
          createdByUserId: user.id,
          type: form.type,
          name: form.name,
          description: form.description || null,
          icon: form.icon,
          color: form.color,
          imageUrl: form.imageUrl || null,
          isDefault: form.isDefault,
          isActive: form.isActive,
          sortOrder: Number(form.sortOrder) || 0,
        })
        toast.success('Template atualizado')
      } else {
        await AdminStoryOptionsService.createTemplate({
          createdByUserId: user.id,
          id: form.id,
          type: form.type,
          name: form.name,
          description: form.description || null,
          icon: form.icon,
          color: form.color,
          imageUrl: form.imageUrl || null,
          isDefault: form.isDefault,
          isActive: form.isActive,
          sortOrder: Number(form.sortOrder) || 0,
          metadata: {},
        })
        toast.success('Template criado')
      }
      resetForm()
      await load()
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao salvar')
    }
  }

  const softDelete = async (id: string) => {
    if (!user?.id) return
    try {
      await AdminStoryOptionsService.deleteTemplate(id, user.id)
      toast.success('Template desativado')
      await load()
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao desativar')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Story Options (Admin)</CardTitle>
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetForm}>
              Novo
            </Button>
            <Button variant="outline" onClick={load} disabled={loading}>
              Recarregar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? `Editar: ${editingId}` : 'Criar Template'}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>ID (slug)</Label>
            <Input
              value={form.id}
              disabled={!!editingId}
              onChange={(e) => setForm((f) => ({ ...f, id: e.target.value.trim() }))}
              placeholder="ex: floresta, sereia, tesouro..."
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as any }))}
              disabled={!!editingId}
            >
              <option value="environment">environment</option>
              <option value="character">character</option>
              <option value="theme">theme</option>
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Nome</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Descrição</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Fallback Emoji</Label>
            <Input value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Fallback Cor (Tailwind class)</Label>
            <Input value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label>Ordem</Label>
            <Input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch checked={form.isDefault} onCheckedChange={(v) => setForm((f) => ({ ...f, isDefault: v }))} />
              <span className="text-sm">Default</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
              <span className="text-sm">Ativo</span>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Imagem (upload)</Label>
            <Input type="file" accept="image/*" onChange={(e) => onUpload(e.target.files?.[0] || null)} />
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border bg-muted',
                )}
              >
                {form.imageUrl ? (
                  <img src={form.imageUrl} alt="Preview" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-4xl">{form.icon}</span>
                )}
              </div>
              <Button variant="outline" onClick={() => setForm((f) => ({ ...f, imageUrl: null }))}>
                Remover imagem
              </Button>
            </div>
          </div>

          <div className="flex gap-2 md:col-span-2">
            <Button onClick={save}>{editingId ? 'Salvar' : 'Criar'}</Button>
            {editingId && (
              <Button variant="destructive" onClick={() => softDelete(editingId)}>
                Desativar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Templates ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {filtered.map((t) => (
            <button
              key={t.id}
              onClick={() => startEdit(t)}
              className="flex items-center justify-between rounded-xl border p-4 text-left hover:bg-muted"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                  {t.imageUrl ? (
                    <img src={t.imageUrl} alt={t.name} className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-2xl">{t.icon}</span>
                  )}
                </div>
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.type} • {t.id} • ordem {t.sortOrder ?? 0}
                    {t.isDefault ? ' • default' : ''}
                    {!t.isActive ? ' • inativo' : ''}
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">Editar</div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-sm text-muted-foreground">Nenhum template encontrado.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


