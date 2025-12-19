import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { StoreService } from '@/services/storeService'
import type { InventoryEntry, RedemptionEntry } from '@/types/store'
import { Gift, ShoppingBag } from 'lucide-react'
import { RewardDetailModal } from '@/components/RewardDetailModal'
import { toast } from 'sonner'

export default function MyRewards() {
  const { user } = useAuth()
  const patientId = user?.id

  const [inventory, setInventory] = useState<InventoryEntry[]>([])
  const [redemptions, setRedemptions] = useState<RedemptionEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailEntry, setDetailEntry] = useState<InventoryEntry | null>(null)
  const [activatingId, setActivatingId] = useState<string | null>(null)

  const pendingCount = useMemo(
    () => redemptions.filter((r) => r.status === 'requested').length,
    [redemptions],
  )

  const load = async () => {
    if (!patientId) return
    setLoading(true)
    try {
      const [inv, reds] = await Promise.all([
        StoreService.getInventory(patientId),
        StoreService.getRedemptions(patientId),
      ])
      setInventory(inv)
      setRedemptions(reds)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleCosmetic = async (inv: InventoryEntry) => {
    if (!patientId) return
    if (!inv.slot) return
    try {
      setActivatingId(inv.inventoryId)
      if (inv.isEquipped) {
        await StoreService.deactivateInventoryCosmetic(patientId, inv.inventoryId, inv.slot)
        toast.success('Cosmético desativado')
      } else {
        await StoreService.activateInventoryCosmetic(patientId, inv.inventoryId, inv.slot)
        toast.success('Cosmético ativado')
      }
      await load()
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao atualizar cosmético')
    } finally {
      setActivatingId(null)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  if (!patientId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Faça login para ver seus prêmios.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold text-primary">Meus Prêmios</h1>
          <p className="mt-2 text-muted-foreground">Itens comprados e resgates pendentes.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
            <Link to="/store">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Ir para Loja
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/responsible">
              <Gift className="mr-2 h-4 w-4" />
              Aprovar Resgates
              {pendingCount > 0 && (
                <Badge className="ml-2" variant="default">
                  {pendingCount}
                </Badge>
              )}
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">Carregando...</CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Minha Mochila (Digitais)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {inventory.length === 0 ? (
                <p className="text-sm text-muted-foreground">Você ainda não comprou itens digitais.</p>
              ) : (
                inventory.map((inv) => (
                  <div key={inv.inventoryId} className="flex items-start justify-between gap-4 border rounded-lg p-4">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{inv.item?.name || inv.itemId}</p>
                      <p className="text-sm text-muted-foreground">{inv.item?.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="secondary">x{inv.quantity}</Badge>
                        {inv.isEquipped && <Badge>Ativo</Badge>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDetailEntry(inv)
                          setDetailOpen(true)
                        }}
                      >
                        Ver detalhes
                      </Button>
                      {inv.canActivate && inv.slot && (
                        <Button
                          onClick={() => handleToggleCosmetic(inv)}
                          disabled={activatingId === inv.inventoryId}
                        >
                          {inv.isEquipped ? 'Desativar' : 'Ativar'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resgates (Vales)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {redemptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum resgate solicitado ainda.</p>
              ) : (
                redemptions.map((r) => (
                  <div key={r.redemptionId} className="flex items-start justify-between gap-4 border rounded-lg p-4">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{r.item?.name || r.itemId}</p>
                      <p className="text-sm text-muted-foreground">{r.item?.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            r.status === 'approved'
                              ? 'default'
                              : r.status === 'requested'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {r.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Pedido: {new Date(r.requestedAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <RewardDetailModal open={detailOpen} onOpenChange={setDetailOpen} entry={detailEntry} />
    </div>
  )
}


