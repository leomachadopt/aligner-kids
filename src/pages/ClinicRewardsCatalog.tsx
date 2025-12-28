import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { apiClient } from '@/utils/apiClient'
import { Plus, Download } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

export default function ClinicRewardsCatalog() {
  const { user } = useAuth()
  const { toast } = useToast()
  const clinicId = user?.clinicId

  const [templates, setTemplates] = useState<any[]>([])
  const [clinicItems, setClinicItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openCreate, setOpenCreate] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'real',
    category: 'voucher',
    priceCoins: 100,
    requiredLevel: 1,
  })

  const load = async () => {
    if (!clinicId) return
    setLoading(true)
    try {
      const [tpl, items] = await Promise.all([
        apiClient.get<{ templates: any[] }>(`/store/templates`),
        apiClient.get<{ items: any[] }>(`/clinic/${clinicId}/store/items`),
      ])
      setTemplates((tpl.templates || []).filter((t) => t.isActive))
      setClinicItems(items.items || [])
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message || 'Falha ao carregar', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId])

  const importTemplate = async (templateId: string) => {
    if (!clinicId || !user) return
    try {
      await apiClient.post(`/clinic/${clinicId}/store/items/from-template`, {
        templateId,
        createdByUserId: user.id,
      })
      await load()
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message || 'Falha ao importar', variant: 'destructive' })
    }
  }

  const createItem = async () => {
    if (!clinicId || !user) return
    try {
      await apiClient.post(`/clinic/${clinicId}/store/items`, {
        createdByUserId: user.id,
        ...form,
      })
      setOpenCreate(false)
      await load()
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message || 'Falha ao criar item', variant: 'destructive' })
    }
  }

  if (!clinicId) {
    return <p className="text-muted-foreground">Usuário sem clínica vinculada.</p>
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Catálogo da Clínica</h1>
        <Button onClick={() => setOpenCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Item da Clínica
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Templates Universais (importar)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : templates.length === 0 ? (
              <p className="text-muted-foreground">Nenhum template ativo.</p>
            ) : (
              templates.map((t) => (
                <div key={t.id} className="flex items-start justify-between gap-4 border rounded-lg p-4">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.type} • {t.category} • {t.defaultPriceCoins} coins
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => importTemplate(t.id)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Itens da Clínica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : clinicItems.length === 0 ? (
              <p className="text-muted-foreground">Nenhum item ainda.</p>
            ) : (
              clinicItems.map((i) => (
                <div key={i.id} className="border rounded-lg p-4">
                  <p className="font-semibold">{i.name}</p>
                  <p className="text-sm text-muted-foreground">{i.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {i.sourceType} • {i.type} • {i.category} • {i.priceCoins} coins • nível {i.requiredLevel}+
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo item da clínica</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Input value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Categoria</Label>
                <Input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Preço (coins)</Label>
                <Input type="number" value={form.priceCoins} onChange={(e) => setForm((p) => ({ ...p, priceCoins: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label>Nível mínimo</Label>
                <Input type="number" value={form.requiredLevel} onChange={(e) => setForm((p) => ({ ...p, requiredLevel: Number(e.target.value) }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={createItem}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}






