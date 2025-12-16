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
    <div className="space-y-8">
      <div className="rounded-2xl border-2 border-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
              <Layers className="h-10 w-10 text-indigo-600" />
              Programas de Missões
            </h1>
            <p className="text-sm text-gray-600 mt-2 font-medium">
              Monte um conjunto padrão de missões para aplicar aos pacientes automaticamente e visualize o cronograma por alinhador.
            </p>
          </div>
          <Button onClick={() => setIsNewDialogOpen(true)} className="rounded-full px-6 py-6 text-lg font-bold bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg hover-bounce">
            <Plus className="h-5 w-5 mr-2" />
            Novo Programa
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 rounded-2xl border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-teal-50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl font-bold">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-teal-400 flex items-center justify-center shadow-md">
                <Layers className="h-6 w-6 text-white" />
              </div>
              Programas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && (
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Loader2 className="h-5 w-5 animate-spin text-cyan-500" /> Carregando...
              </div>
            )}
            {!loading && programs.length === 0 && (
              <div className="text-center py-8">
                <Layers className="h-16 w-16 mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-600 font-medium">
                  Nenhum programa encontrado para esta clínica.
                </p>
              </div>
            )}
            {programs.map((p) => (
              <button
                key={p.id}
                onClick={() => loadProgramTemplates(p.id, programs)}
                className={cn(
                  'w-full rounded-xl border-2 px-4 py-3 text-left transition-all hover-scale',
                  selectedProgramId === p.id
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 border-cyan-500 text-white shadow-lg'
                    : 'bg-white border-cyan-200 hover:border-cyan-400 hover:shadow-md'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-base">{p.name}</span>
                  {p.isDefault && (
                    <Badge className={cn(
                      "text-xs font-bold px-2 py-0.5",
                      selectedProgramId === p.id
                        ? "bg-white/20 text-white border-white/30"
                        : "bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0"
                    )}>
                      Padrão
                    </Badge>
                  )}
                </div>
                <div className={cn(
                  "text-xs font-medium",
                  selectedProgramId === p.id ? "text-white/90" : "text-gray-600"
                )}>
                  {p.description || 'Sem descrição'}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 shadow-xl">
          <CardHeader className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-md">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                Cronograma por alinhador
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1 font-medium">
                Visualize quando cada missão é ativada ao longo dos primeiros {MAX_ALIGNERS_PREVIEW} alinhadores.
              </p>
            </div>
            {selectedProgramId && (
              <Button className="rounded-full px-6 py-3 font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-md hover-scale">
                Editar Programa
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {groupedRows.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-600 font-medium">Selecione um programa para ver o cronograma.</p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-white rounded-xl border-2 border-purple-100 shadow-sm">
                <div className="min-w-[720px]">
                  <div className="grid" style={{ gridTemplateColumns: `220px repeat(${MAX_ALIGNERS_PREVIEW}, 1fr)` }}>
                    <div className="text-xs font-bold uppercase text-purple-700 px-3 py-3 bg-gradient-to-r from-purple-100 to-pink-100">Missão</div>
                    {Array.from({ length: MAX_ALIGNERS_PREVIEW }, (_, i) => (
                      <div key={i} className="text-xs font-bold text-center text-purple-700 px-1 py-3 bg-gradient-to-r from-purple-100 to-pink-100 border-l border-purple-200">
                        A{i + 1}
                      </div>
                    ))}
                    {groupedRows.map((row, idx) => (
                      <Fragment key={row.mission.id}>
                        <div
                          className={cn(
                            "flex items-center gap-3 border-t-2 border-purple-100 px-3 py-3",
                            idx % 2 === 0 ? 'bg-white' : 'bg-gradient-to-r from-purple-50/30 to-pink-50/30'
                          )}
                        >
                          <div
                            className="h-4 w-4 rounded-full shadow-sm border-2 border-white"
                            style={{ backgroundColor: row.mission.color || '#E5E7EB' }}
                          />
                          <div>
                            <div className="text-sm font-bold text-gray-800">{row.mission.name}</div>
                            <div className="text-[11px] font-medium text-gray-600">
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
                                'border-t-2 border-l border-purple-100 flex items-center justify-center px-1 py-3 text-xs cursor-pointer transition-all',
                                idx % 2 === 0 ? 'bg-white' : 'bg-gradient-to-r from-purple-50/30 to-pink-50/30',
                                'hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 hover:shadow-inner'
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
                                <Badge style={{ backgroundColor: row.mission.color || '#E5E7EB' }} className="text-[11px] font-bold text-white shadow-sm">
                                  Ativa
                                </Badge>
                              ) : (
                                <span className="text-[11px] font-medium text-gray-400">-</span>
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

