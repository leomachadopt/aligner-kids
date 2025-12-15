import { useEffect, useMemo, useState, Fragment } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Layers, Plus, Calendar, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { MissionProgramService } from '@/services/missionProgramService'
import { MissionService } from '@/services/missionService.v2'
import type { MissionProgram, MissionProgramTemplate, MissionTemplate } from '@/types/mission'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

const MAX_ALIGNERS_PREVIEW = 12

type GroupRow = {
  mission: MissionTemplate
  entries: MissionProgramTemplate[]
  activeAligners: Set<number>
}

const MissionPrograms = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [programs, setPrograms] = useState<MissionProgram[]>([])
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null)
  const [programTemplates, setProgramTemplates] = useState<MissionProgramTemplate[]>([])
  const [templatesMap, setTemplatesMap] = useState<Record<string, MissionTemplate>>({})
  const [loading, setLoading] = useState(false)
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)
  const [newProgram, setNewProgram] = useState({ name: '', description: '', isDefault: false })
  const [allTemplates, setAllTemplates] = useState<MissionTemplate[]>([])
  const [selectedTemplates, setSelectedTemplates] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPrograms()
    loadAllTemplates()
  }, [user?.clinicId])

  const loadPrograms = async () => {
    setLoading(true)
    try {
      const list = await MissionProgramService.getPrograms(user?.clinicId)
      setPrograms(list)
      const defaultProgram = list.find((p) => p.isDefault) || list[0] || null
      if (defaultProgram) {
        await loadProgramTemplates(defaultProgram.id, list)
      }
    } catch (error) {
      console.error('Erro ao carregar programas', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProgramTemplates = async (programId: string, currentPrograms?: MissionProgram[]) => {
    try {
      const res = await MissionProgramService.getProgramWithTemplates(programId)
      if (!res) return
      setProgramTemplates(res.templates || [])
      setSelectedProgramId(programId)
      if (currentPrograms) setPrograms(currentPrograms)

      const templatesSource =
        allTemplates.length > 0 ? allTemplates : await MissionService.getAllTemplates()
      const map: Record<string, MissionTemplate> = {}
      templatesSource.forEach((t) => {
        map[t.id] = t
      })
      setTemplatesMap(map)
    } catch (error) {
      console.error('Erro ao carregar templates do programa', error)
    }
  }

  const loadAllTemplates = async () => {
    try {
      const all = await MissionService.getAllTemplates()
      setAllTemplates(all)
      const map: Record<string, number> = {}
      all.forEach((t) => {
        map[t.id] = t.alignerInterval || 1
      })
      setSelectedTemplates(map)
    } catch (error) {
      console.error('Erro ao carregar templates', error)
    }
  }

  const groupedRows: GroupRow[] = useMemo(() => {
    const map = new Map<string, GroupRow>()

    programTemplates
      .filter((pt) => pt.isActive)
      .forEach((pt) => {
        const missionId = pt.missionTemplateId
        const tmpl =
          templatesMap[missionId] ||
          ({
            id: missionId,
            name: missionId,
            description: '',
            category: 'usage',
            frequency: 'per_aligner',
            completionCriteria: 'manual',
            targetValue: 1,
            basePoints: pt.customPoints || 0,
            icon: '⭐',
            color: '#E5E7EB',
            isActiveByDefault: true,
            requiresManualValidation: false,
            isGlobal: true,
            createdAt: '',
            updatedAt: '',
            alignerInterval: pt?.alignerInterval || 1,
          } as MissionTemplate)

        if (!map.has(missionId)) {
          map.set(missionId, {
            mission: tmpl,
            entries: [],
            activeAligners: new Set<number>(),
          })
        }

        const group = map.get(missionId)!
        group.entries.push(pt)
        const alignerNum =
          pt.triggerAlignerNumber === null || pt.triggerAlignerNumber === undefined
            ? 1
            : pt.triggerAlignerNumber
        group.activeAligners.add(alignerNum)
      })

    return Array.from(map.values())
  }, [programTemplates, templatesMap])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Layers className="h-6 w-6" />
            Programas de Missões
          </h1>
          <p className="text-muted-foreground">
            Monte um conjunto padrão de missões para aplicar aos pacientes automaticamente e visualize o cronograma por alinhador.
          </p>
        </div>
        <Button onClick={() => setIsNewDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Programa
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle>Programas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
              </div>
            )}
            {!loading && programs.length === 0 && (
              <div className="text-sm text-muted-foreground">
                Nenhum programa encontrado para esta clínica.
              </div>
            )}
            {programs.map((p) => (
              <button
                key={p.id}
                onClick={() => loadProgramTemplates(p.id, programs)}
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-left transition',
                  selectedProgramId === p.id ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{p.name}</span>
                  {p.isDefault && <Badge variant="secondary" className="text-[10px]">Padrão</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {p.description || 'Sem descrição'}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Cronograma por alinhador
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Visualize quando cada missão é ativada ao longo dos primeiros {MAX_ALIGNERS_PREVIEW} alinhadores.
              </p>
            </div>
            {selectedProgramId && (
              <Button variant="outline" size="sm">
                Editar Programa
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {groupedRows.length === 0 ? (
              <div className="text-sm text-muted-foreground">Selecione um programa para ver o cronograma.</div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[720px]">
                  <div className="grid" style={{ gridTemplateColumns: `220px repeat(${MAX_ALIGNERS_PREVIEW}, 1fr)` }}>
                    <div className="text-xs font-semibold text-muted-foreground px-2 py-1">Missão</div>
                    {Array.from({ length: MAX_ALIGNERS_PREVIEW }, (_, i) => (
                      <div key={i} className="text-xs font-semibold text-center text-muted-foreground px-1 py-1">
                        A{i + 1}
                      </div>
                    ))}
                    {groupedRows.map((row, idx) => (
                      <Fragment key={row.mission.id}>
                        <div
                          className="flex items-center gap-2 border-t px-2 py-2"
                          style={{ backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }}
                        >
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: row.mission.color || '#E5E7EB' }}
                          />
                          <div>
                            <div className="text-sm font-medium">{row.mission.name}</div>
            <div className="text-[11px] text-muted-foreground">
              1x alinhador • {row.mission.basePoints} pts
            </div>
                          </div>
                        </div>
                        {Array.from({ length: MAX_ALIGNERS_PREVIEW }, (_, a) => a + 1).map((aligner) => {
                          const isActive = row.activeAligners.has(aligner)
                          return (
                            <div
                              key={`${row.mission.id}-${aligner}`}
                              className={cn(
                                'border-t flex items-center justify-center px-1 py-2 text-xs cursor-pointer',
                                idx % 2 === 0 ? '' : 'bg-muted/50',
                                'hover:bg-accent/40'
                              )}
                              onClick={async () => {
                                if (!selectedProgramId) return
                                const currentProgram = programs.find((p) => p.id === selectedProgramId)
                                if (!currentProgram) return

                                // remove todas entradas desse missionId+aligner
                                const nextTemplates = programTemplates.filter(
                                  (pt) =>
                                    !(
                                      pt.missionTemplateId === row.mission.id &&
                                      (pt.triggerAlignerNumber || 1) === aligner
                                    ),
                                )

                                if (!isActive) {
                                  nextTemplates.push({
                                    id: `program-template-${Date.now()}`,
                                    programId: selectedProgramId,
                                    missionTemplateId: row.mission.id,
                                    isActive: true,
                                    alignerInterval: 1,
                                    trigger: 'on_aligner_N_start',
                                    triggerAlignerNumber: aligner,
                                    triggerDaysOffset: null,
                                    customPoints: null,
                                    createdAt: new Date().toISOString(),
                                    updatedAt: new Date().toISOString(),
                                  })
                                }

                                try {
                                  await MissionProgramService.updateProgram(selectedProgramId, {
                                    name: currentProgram.name,
                                    description: currentProgram.description || '',
                                    isDefault: currentProgram.isDefault,
                                    templates: nextTemplates.map((t) => ({
                                      missionTemplateId: t.missionTemplateId,
                                      isActive: t.isActive,
                                      alignerInterval: t.alignerInterval,
                                      trigger: t.trigger,
                                      triggerAlignerNumber: t.triggerAlignerNumber,
                                      triggerDaysOffset: t.triggerDaysOffset,
                                      customPoints: t.customPoints || undefined,
                                    })),
                                  })
                                  await loadProgramTemplates(selectedProgramId)
                                } catch (error) {
                                  console.error(error)
                                  toast({ title: 'Erro ao atualizar', variant: 'destructive' })
                                }
                              }}
                            >
                              {isActive ? (
                                <Badge style={{ backgroundColor: row.mission.color || '#E5E7EB' }} className="text-[11px]">
                                  Ativa
                                </Badge>
                              ) : (
                                <span className="text-[11px] text-muted-foreground">-</span>
                              )}
                            </div>
                          )
                        })}
                      </Fragment>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Programa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do programa</label>
              <Input
                value={newProgram.name}
                onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })}
                placeholder="Ex: Programa Padrão"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Input
                value={newProgram.description}
                onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                placeholder="Resumo do conjunto de missões"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDefault"
                checked={newProgram.isDefault}
                onCheckedChange={(checked) =>
                  setNewProgram({ ...newProgram, isDefault: !!checked })
                }
              />
              <label htmlFor="isDefault" className="text-sm">
                Marcar como programa padrão da clínica
              </label>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Missões (cronograma por alinhador)</label>
              <div className="max-h-64 overflow-y-auto space-y-2 border rounded-md p-2">
                {allTemplates.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedTemplates[t.id] !== undefined}
                        onCheckedChange={(checked) => {
                          setSelectedTemplates((prev) => {
                            const next = { ...prev }
                            if (!checked) {
                              delete next[t.id]
                            } else {
                              next[t.id] = next[t.id] || t.alignerInterval || 1
                            }
                            return next
                          })
                        }}
                      />
                      <div>
                        <div className="font-medium">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">A cada</span>
                      <Input
                        type="number"
                        min={1}
                        className="w-16 h-8"
                        value={selectedTemplates[t.id] || ''}
                        onChange={(e) => {
                          const value = Number(e.target.value) || 1
                          setSelectedTemplates((prev) => ({
                            ...prev,
                            [t.id]: value,
                          }))
                        }}
                        disabled={selectedTemplates[t.id] === undefined}
                      />
                      <span className="text-xs text-muted-foreground">alin.</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!newProgram.name.trim()) {
                  toast({ title: 'Nome obrigatório', variant: 'destructive' })
                  return
                }
                const templateEntries = Object.entries(selectedTemplates)
                  .filter(([, v]) => v !== undefined)
                  .map(([id, interval]) => ({
                    missionTemplateId: id,
                    alignerInterval: interval || 1,
                    isActive: true,
                    trigger: 'on_aligner_N_start',
                    triggerAlignerNumber: 1,
                  }))
                if (templateEntries.length === 0) {
                  toast({ title: 'Selecione ao menos uma missão', variant: 'destructive' })
                  return
                }
                try {
                  setSaving(true)
                  await MissionProgramService.createProgram({
                    clinicId: user?.clinicId || null,
                    name: newProgram.name,
                    description: newProgram.description,
                    isDefault: newProgram.isDefault,
                    templates: templateEntries,
                  })
                  toast({ title: 'Programa criado' })
                  setIsNewDialogOpen(false)
                  setNewProgram({ name: '', description: '', isDefault: false })
                  await loadPrograms()
                } catch (error) {
                  console.error(error)
                  toast({ title: 'Erro ao salvar', variant: 'destructive' })
                } finally {
                  setSaving(false)
                }
              }}
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MissionPrograms

