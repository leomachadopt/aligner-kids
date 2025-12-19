import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/context/AuthContext'
import { apiClient } from '@/utils/apiClient'
import { Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ParentItems() {
  const { user } = useAuth()
  const patientId = user?.id
  const { toast } = useToast()

  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', priceCoins: 120, requiredLevel: 1 })

  const load = async () => {
    if (!patientId) return
    setLoading(true)
    try {
      const res = await apiClient.get<{ items: any[] }>(`/patients/${patientId}/parent-items`)
      setItems(res.items || [])
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message || 'Falha ao carregar', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  const create = async () => {
    if (!patientId) return
    try {
      await apiClient.post(`/patients/${patientId}/parent-items`, {
        createdByUserId: patientId,
        ...form,
      })
      setOpen(false)
      setForm({ name: '', description: '', priceCoins: 120, requiredLevel: 1 })
      await load()
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message || 'Falha ao criar item', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Área dos Pais: Itens Próprios</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Vale
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meus vales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground">Nenhum item criado ainda.</p>
          ) : (
            items.map((i) => (
              <div key={i.id} className="border rounded-lg p-4">
                <p className="font-semibold">{i.name}</p>
                <p className="text-sm text-muted-foreground">{i.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {i.priceCoins} coins • nível {i.requiredLevel}+
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo vale</DialogTitle>
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
            <Button onClick={create}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


