import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/context/AuthContext'
import { apiClient } from '@/utils/apiClient'
import { Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ClinicRewardPrograms() {
  const { user } = useAuth()
  const clinicId = user?.clinicId
  const { toast } = useToast()

  const [programs, setPrograms] = useState<any[]>([])
  const [clinicItems, setClinicItems] = useState<any[]>([])
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null)
  const [programItems, setProgramItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openCreate, setOpenCreate] = useState(false)

  const [form, setForm] = useState({
    name: '',
    description: '',
    ageMin: 6,
    ageMax: 8,
    isDefault: true,
  })

  const load = async () => {
    if (!clinicId) return
    setLoading(true)
    try {
      const [p, items] = await Promise.all([
        apiClient.get<{ programs: any[] }>(`/clinic/${clinicId}/reward-programs`),
        apiClient.get<{ items: any[] }>(`/clinic/${clinicId}/store/items`),
      ])
      setPrograms(p.programs || [])
      setClinicItems(items.items || [])
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message || 'Falha ao carregar', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const loadProgramItems = async (programId: string) => {
    if (!clinicId) return
    const res = await apiClient.get<{ items: any[] }>(`/clinic/${clinicId}/reward-programs/${programId}/items`)
    setProgramItems(res.items || [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId])

  useEffect(() => {
    if (selectedProgramId) loadProgramItems(selectedProgramId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProgramId])

  const createProgram = async () => {
    if (!clinicId || !user) return
    try {
      const res = await apiClient.post<{ program: any }>(`/clinic/${clinicId}/reward-programs`, {
        createdByUserId: user.id,
        ...form,
      })
      setOpenCreate(false)
      await load()
      setSelectedProgramId(res.program.id)
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message || 'Falha ao criar programa', variant: 'destructive' })
    }
  }

  const addItemToProgram = async (clinicStoreItemId: string) => {
    if (!clinicId || !selectedProgramId) return
    try {
      await apiClient.post(`/clinic/${clinicId}/reward-programs/${selectedProgramId}/items`, { clinicStoreItemId })
      await loadProgramItems(selectedProgramId)
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message || 'Falha ao adicionar item', variant: 'destructive' })
    }
  }

  const program = useMemo(
    () => programs.find((p) => p.id === selectedProgramId) || null,
    [programs, selectedProgramId],
  )

  if (!clinicId) return <p className="text-muted-foreground">Usuário sem clínica vinculada.</p>

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Programas de Prêmios (por idade)</h1>
        <Button onClick={() => setOpenCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Programa
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Programas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : programs.length === 0 ? (
              <p className="text-muted-foreground">Nenhum programa.</p>
            ) : (
              programs.map((p) => (
                <Button
                  key={p.id}
                  variant={selectedProgramId === p.id ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setSelectedProgramId(p.id)}
                >
                  {p.name} ({p.ageMin ?? '-'}–{p.ageMax ?? '-'})
                </Button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {program ? `${program.name} (${program.ageMin ?? '-'}–${program.ageMax ?? '-'})` : 'Selecione um programa'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!program ? (
              <p className="text-muted-foreground">Escolha um programa à esquerda.</p>
            ) : (
              <>
                <div>
                  <p className="text-sm font-semibold">Itens no programa</p>
                  {programItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum item ainda.</p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {programItems.map((pi) => (
                        <div key={pi.id} className="border rounded-lg p-3 text-sm">
                          clinicStoreItemId: {pi.clinicStoreItemId}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold">Adicionar item do catálogo da clínica</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {clinicItems.filter((i) => i.isActive).slice(0, 12).map((i) => (
                      <Button
                        key={i.id}
                        variant="outline"
                        className="justify-start"
                        onClick={() => addItemToProgram(i.id)}
                      >
                        {i.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo programa</DialogTitle>
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
                <Label>Idade mínima</Label>
                <Input type="number" value={form.ageMin} onChange={(e) => setForm((p) => ({ ...p, ageMin: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label>Idade máxima</Label>
                <Input type="number" value={form.ageMax} onChange={(e) => setForm((p) => ({ ...p, ageMax: Number(e.target.value) }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={createProgram}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}






