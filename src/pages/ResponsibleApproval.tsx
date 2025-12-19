import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { StoreService } from '@/services/storeService'
import type { RedemptionEntry } from '@/types/store'
import { Check, X, ClipboardCheck, ArrowLeft } from 'lucide-react'
import { apiClient } from '@/utils/apiClient'

export default function ResponsibleApproval() {
  const { user } = useAuth()
  const patientId = user?.id

  const [redemptions, setRedemptions] = useState<RedemptionEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [pin, setPin] = useState('')

  const pending = useMemo(
    () => redemptions.filter((r) => r.status === 'requested'),
    [redemptions],
  )
  const approved = useMemo(
    () => redemptions.filter((r) => r.status === 'approved'),
    [redemptions],
  )

  const load = async () => {
    if (!patientId) return
    setLoading(true)
    try {
      const reds = await StoreService.getRedemptions(patientId)
      setRedemptions(reds)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  const approveOne = async (r: RedemptionEntry) => {
    if (!user) return
    try {
      setActingId(r.redemptionId)
      await StoreService.approveRedemption(r.redemptionId, user.id, pin)
      await load()
    } catch (e: any) {
      alert(e?.message || 'Erro ao aprovar')
    } finally {
      setActingId(null)
    }
  }

  const rejectOne = async (r: RedemptionEntry) => {
    if (!user) return
    try {
      setActingId(r.redemptionId)
      await StoreService.rejectRedemption(r.redemptionId, user.id, pin)
      await load()
    } catch (e: any) {
      alert(e?.message || 'Erro ao rejeitar')
    } finally {
      setActingId(null)
    }
  }

  const fulfillOne = async (r: RedemptionEntry) => {
    if (!user) return
    try {
      setActingId(r.redemptionId)
      await StoreService.fulfillRedemption(r.redemptionId, user.id, pin)
      await load()
    } catch (e: any) {
      alert(e?.message || 'Erro ao marcar como entregue')
    } finally {
      setActingId(null)
    }
  }

  const savePin = async () => {
    if (!user) return
    try {
      await apiClient.put<{ user: any }>(`/auth/users/${user.id}`, { responsiblePin: pin })
      alert('✅ PIN atualizado')
    } catch (e: any) {
      alert(e?.message || 'Erro ao salvar PIN')
    }
  }

  if (!patientId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Faça login para aprovar resgates.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Modo Responsável</h1>
          <p className="mt-2 text-muted-foreground">Aprove, rejeite e marque como entregue.</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/my-rewards">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>PIN do Responsável</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Digite seu PIN (4 a 8 dígitos)"
            className="h-10 w-full rounded-md border px-3 text-sm"
            inputMode="numeric"
          />
          <Button onClick={savePin} className="whitespace-nowrap">
            Salvar PIN
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">Carregando...</CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Pendentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pending.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum resgate pendente.</p>
              ) : (
                pending.map((r) => (
                  <div key={r.redemptionId} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{r.item?.name || r.itemId}</p>
                        <p className="text-sm text-muted-foreground">{r.item?.description}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="secondary">{r.status}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => approveOne(r)}
                        disabled={actingId === r.redemptionId}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Aprovar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => rejectOne(r)}
                        disabled={actingId === r.redemptionId}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aprovados (entregar)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {approved.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum resgate aprovado.</p>
              ) : (
                approved.map((r) => (
                  <div key={r.redemptionId} className="border rounded-lg p-4 space-y-3">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{r.item?.name || r.itemId}</p>
                      <p className="text-sm text-muted-foreground">{r.item?.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge>{r.status}</Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => fulfillOne(r)}
                      disabled={actingId === r.redemptionId}
                    >
                      <ClipboardCheck className="mr-2 h-4 w-4" />
                      Marcar como entregue
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}


