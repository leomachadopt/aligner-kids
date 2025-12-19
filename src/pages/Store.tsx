import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { StoreService } from '@/services/storeService'
import type { CatalogItem } from '@/types/store'
import { MissionService } from '@/services/missionService.v2'
import { Coins, Gift, Image as ImageIcon, ShoppingBag } from 'lucide-react'

export default function Store() {
  const { user } = useAuth()
  const patientId = user?.id

  const [items, setItems] = useState<CatalogItem[]>([])
  const [coins, setCoins] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [buyingId, setBuyingId] = useState<string | null>(null)

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category))
    return Array.from(set)
  }, [items])

  const load = async () => {
    if (!patientId) return
    setLoading(true)
    try {
      const [catalog, points] = await Promise.all([
        StoreService.getCatalog(patientId),
        MissionService.getPatientPoints(patientId),
      ])
      setItems(catalog.items || [])
      setCoins(points.coins || 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  const handleBuy = async (item: CatalogItem) => {
    if (!patientId) return
    try {
      setBuyingId(item.catalogItemId)
      const result = await StoreService.purchaseCatalogItem(patientId, item.kind, item.catalogItemId)
      setCoins(result.points.coins || 0)
      alert(item.type === 'digital' ? '✅ Item comprado! Veja em Meus Prêmios.' : '✅ Pedido enviado! Aguarde aprovação.')
      await load()
    } catch (e: any) {
      alert(e?.message || 'Erro ao comprar item')
    } finally {
      setBuyingId(null)
    }
  }

  if (!patientId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Faça login para acessar a loja.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold text-primary">Loja</h1>
          <p className="mt-2 text-muted-foreground">
            Use suas moedas para trocar por itens digitais e prêmios.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-2 border">
            <Coins className="h-5 w-5 text-yellow-700" />
            <span className="font-bold text-yellow-900">{coins}</span>
          </div>
          <Button asChild variant="outline">
            <Link to="/my-rewards">
              <Gift className="mr-2 h-4 w-4" />
              Meus Prêmios
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">Carregando loja...</CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Badge key={c} variant="secondary">
                  {c}
                </Badge>
              ))}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Card key={`${item.kind}:${item.catalogItemId}`} className="overflow-hidden">
                <div className="relative aspect-video bg-muted/20 border-b">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-10 w-10 opacity-60" />
                    </div>
                  )}
                  {item.isOwned && (
                    <div className="absolute top-3 right-3">
                      <Badge>Já comprado</Badge>
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-3">
                    <span className="truncate">{item.name}</span>
                    <Badge variant={item.type === 'real' ? 'default' : 'secondary'}>
                      {item.type === 'real' ? 'Vale' : 'Digital'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{item.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-yellow-700" />
                      <span className="font-bold">{item.priceCoins}</span>
                      <span className="text-xs text-muted-foreground">Nível {item.requiredLevel}+</span>
                    </div>
                    <Button
                      onClick={() => handleBuy(item)}
                      disabled={Boolean(item.isOwned) || buyingId === item.catalogItemId || coins < item.priceCoins}
                    >
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      {item.isOwned ? 'Já comprado' : buyingId === item.catalogItemId ? 'Comprando...' : 'Comprar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


