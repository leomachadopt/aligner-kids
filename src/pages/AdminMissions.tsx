import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { MissionService } from '@/services/missionService.v2'
import type {
  MissionTemplate,
  MissionCategory,
  MissionFrequency,
  CompletionCriteria,
  CreateMissionTemplateInput,
} from '@/types/mission'
import { Plus, Edit2, Trash2, Star, Award, Copy, Calendar } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

const AdminMissions = () => {
  const [missions, setMissions] = useState<MissionTemplate[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMission, setEditingMission] = useState<MissionTemplate | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState<CreateMissionTemplateInput>({
    name: '',
    description: '',
    category: 'usage',
    frequency: 'daily',
    completionCriteria: 'total_count',
    targetValue: 1,
    basePoints: 10,
    bonusPoints: 0,
    icon: '⭐',
    color: '#FFD700',
    isActiveByDefault: true,
    requiresManualValidation: false,
    availableFrom: 'start',
    expiresAfter: undefined,
    scheduledStartDate: undefined,
    scheduledEndDate: undefined,
    autoActivate: false,
    activeDaysOfWeek: undefined,
    repeatSchedule: 'none',
  })

  const [selectedDays, setSelectedDays] = useState<number[]>([])

  useEffect(() => {
    loadMissions()
  }, [])

  const loadMissions = async () => {
    try {
      const allMissions = await MissionService.getAllTemplates()
      setMissions(allMissions)
    } catch (error) {
      console.error('Error loading missions:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as missões.',
        variant: 'destructive',
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'usage',
      frequency: 'daily',
      completionCriteria: 'total_count',
      targetValue: 1,
      basePoints: 10,
      bonusPoints: 0,
      icon: '⭐',
      color: '#FFD700',
      isActiveByDefault: true,
      requiresManualValidation: false,
      availableFrom: 'start',
      expiresAfter: undefined,
      scheduledStartDate: undefined,
      scheduledEndDate: undefined,
      autoActivate: false,
      activeDaysOfWeek: undefined,
      repeatSchedule: 'none',
    })
    setSelectedDays([])
  }

  const handleOpenDialog = (mission?: MissionTemplate) => {
    if (mission) {
      setEditingMission(mission)
      setFormData({
        name: mission.name,
        description: mission.description,
        category: mission.category,
        frequency: mission.frequency,
        completionCriteria: mission.completionCriteria,
        targetValue: mission.targetValue,
        basePoints: mission.basePoints,
        bonusPoints: mission.bonusPoints,
        icon: mission.icon,
        color: mission.color,
        isActiveByDefault: mission.isActiveByDefault,
        requiresManualValidation: mission.requiresManualValidation,
        availableFrom: mission.availableFrom,
        expiresAfter: mission.expiresAfter,
        scheduledStartDate: mission.scheduledStartDate,
        scheduledEndDate: mission.scheduledEndDate,
        autoActivate: mission.autoActivate || false,
        activeDaysOfWeek: mission.activeDaysOfWeek,
        repeatSchedule: mission.repeatSchedule || 'none',
      })
      setSelectedDays(mission.activeDaysOfWeek || [])
    } else {
      setEditingMission(null)
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const dataToSave = {
        ...formData,
        activeDaysOfWeek: selectedDays.length > 0 ? selectedDays : undefined,
      }

      if (editingMission) {
        await MissionService.updateTemplate(editingMission.id, dataToSave)
        toast({
          title: 'Sucesso',
          description: 'Missão atualizada com sucesso!',
        })
      } else {
        await MissionService.createTemplate(dataToSave)
        toast({
          title: 'Sucesso',
          description: 'Missão criada com sucesso!',
        })
      }
      await loadMissions()
      setIsDialogOpen(false)
      setEditingMission(null)
    } catch (error) {
      console.error('Error saving mission:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a missão.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClone = async (id: string) => {
    try {
      await MissionService.cloneTemplate(id)
      toast({
        title: 'Sucesso',
        description: 'Missão clonada com sucesso!',
      })
      await loadMissions()
    } catch (error) {
      console.error('Error cloning mission:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível clonar a missão.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta missão?')) return

    try {
      await MissionService.deleteTemplate(id)
      toast({
        title: 'Sucesso',
        description: 'Missão excluída com sucesso!',
      })
      await loadMissions()
    } catch (error) {
      console.error('Error deleting mission:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a missão.',
        variant: 'destructive',
      })
    }
  }

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    )
  }

  const categoryLabels: Record<MissionCategory, string> = {
    usage: 'Uso do Alinhador',
    hygiene: 'Higiene Bucal',
    tracking: 'Acompanhamento',
    education: 'Educação',
    milestones: 'Marcos',
    aligner_change: 'Troca de Alinhador',
    appointments: 'Consultas',
    challenges: 'Desafios',
  }

  const frequencyLabels: Record<MissionFrequency, string> = {
    once: 'Única',
    daily: 'Diária',
    weekly: 'Semanal',
    monthly: 'Mensal',
    per_aligner: 'Por Alinhador',
    custom: 'Personalizada',
  }

  const criteriaLabels: Record<CompletionCriteria, string> = {
    days_streak: 'Dias Consecutivos',
    total_count: 'Contagem Total',
    percentage: 'Porcentagem',
    time_based: 'Baseado em Tempo',
    manual: 'Validação Manual',
  }

  const daysOfWeek = [
    { value: 0, label: 'Dom' },
    { value: 1, label: 'Seg' },
    { value: 2, label: 'Ter' },
    { value: 3, label: 'Qua' },
    { value: 4, label: 'Qui' },
    { value: 5, label: 'Sex' },
    { value: 6, label: 'Sáb' },
  ]

  const missionsByCategory = missions.reduce(
    (acc, mission) => {
      if (!acc[mission.category]) {
        acc[mission.category] = []
      }
      acc[mission.category].push(mission)
      return acc
    },
    {} as Record<MissionCategory, MissionTemplate[]>,
  )

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Missões</h1>
          <p className="text-muted-foreground">
            Gerencie templates globais de missões para gamificação
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Missão
        </Button>
      </div>

      <div className="grid gap-6">
        {Object.entries(missionsByCategory).map(([category, categoryMissions]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                {categoryLabels[category as MissionCategory]}
                <span className="text-sm font-normal text-muted-foreground">
                  ({categoryMissions.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoryMissions.map((mission) => (
                  <div
                    key={mission.id}
                    className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex gap-3 flex-1">
                      <div
                        className="text-2xl w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: mission.color + '20' }}
                      >
                        {mission.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{mission.name}</h3>
                          {mission.isActiveByDefault && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                              Ativa por padrão
                            </span>
                          )}
                          {mission.requiresManualValidation && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              Validação manual
                            </span>
                          )}
                          {mission.autoActivate && (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                              Auto-ativar
                            </span>
                          )}
                          {mission.scheduledStartDate && (
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Programada
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {mission.description}
                        </p>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                          <span>
                            📊 {criteriaLabels[mission.completionCriteria]}:{' '}
                            {mission.targetValue}
                          </span>
                          <span>🔄 {frequencyLabels[mission.frequency]}</span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {mission.basePoints}
                            {mission.bonusPoints ? ` + ${mission.bonusPoints} bônus` : ''}
                          </span>
                          {mission.repeatSchedule && mission.repeatSchedule !== 'none' && (
                            <span>🔁 Repete: {mission.repeatSchedule}</span>
                          )}
                        </div>
                        {mission.scheduledStartDate && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            📅 Início: {new Date(mission.scheduledStartDate).toLocaleString('pt-BR')}
                            {mission.scheduledEndDate && (
                              <> • Fim: {new Date(mission.scheduledEndDate).toLocaleString('pt-BR')}</>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleClone(mission.id)}
                        title="Clonar missão"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(mission)}
                        title="Editar missão"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(mission.id)}
                        title="Excluir missão"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {missions.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhuma missão cadastrada. Clique em "Nova Missão" para começar.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMission ? 'Editar Missão' : 'Nova Missão'}
            </DialogTitle>
            <DialogDescription>
              Configure os detalhes da missão de gamificação
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Seção: Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Informações Básicas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Missão *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ex: Uso Diário Perfeito"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as MissionCategory,
                      })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descreva o objetivo da missão..."
                  rows={3}
                />
              </div>
            </div>

            {/* Seção: Critérios e Pontuação */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Critérios e Pontuação</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequência *</Label>
                  <select
                    id="frequency"
                    value={formData.frequency}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        frequency: e.target.value as MissionFrequency,
                      })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    {Object.entries(frequencyLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="completionCriteria">Critério de Conclusão *</Label>
                  <select
                    id="completionCriteria"
                    value={formData.completionCriteria}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        completionCriteria: e.target.value as CompletionCriteria,
                      })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    {Object.entries(criteriaLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetValue">Valor Alvo *</Label>
                  <Input
                    id="targetValue"
                    type="number"
                    min="1"
                    value={formData.targetValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetValue: parseInt(e.target.value, 10),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="basePoints">Pontos Base *</Label>
                  <Input
                    id="basePoints"
                    type="number"
                    min="1"
                    value={formData.basePoints}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        basePoints: parseInt(e.target.value, 10),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bonusPoints">Pontos Bônus</Label>
                  <Input
                    id="bonusPoints"
                    type="number"
                    min="0"
                    value={formData.bonusPoints || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bonusPoints: parseInt(e.target.value, 10) || undefined,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Seção: Visual */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Visual</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="icon">Ícone (emoji) *</Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) =>
                      setFormData({ ...formData, icon: e.target.value })
                    }
                    placeholder="⭐"
                    maxLength={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Cor (hex) *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      className="w-20"
                    />
                    <Input
                      type="text"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      placeholder="#FFD700"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Seção: Programação */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Programação e Agendamento</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledStartDate">Data/Hora de Início</Label>
                  <Input
                    id="scheduledStartDate"
                    type="datetime-local"
                    value={formData.scheduledStartDate?.slice(0, 16) || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduledStartDate: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : undefined,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduledEndDate">Data/Hora de Fim</Label>
                  <Input
                    id="scheduledEndDate"
                    type="datetime-local"
                    value={formData.scheduledEndDate?.slice(0, 16) || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduledEndDate: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : undefined,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="availableFrom">Disponível A Partir De</Label>
                  <select
                    id="availableFrom"
                    value={formData.availableFrom || 'start'}
                    onChange={(e) =>
                      setFormData({ ...formData, availableFrom: e.target.value as any })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="start">Início do Tratamento</option>
                    <option value="aligner_1">Alinhador 1</option>
                    <option value="aligner_5">Alinhador 5</option>
                    <option value="week_1">1 Semana</option>
                    <option value="month_1">1 Mês</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="repeatSchedule">Repetição</Label>
                  <select
                    id="repeatSchedule"
                    value={formData.repeatSchedule || 'none'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        repeatSchedule: e.target.value as any,
                      })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="none">Não repetir</option>
                    <option value="daily">Diariamente</option>
                    <option value="weekly">Semanalmente</option>
                    <option value="monthly">Mensalmente</option>
                    <option value="yearly">Anualmente</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresAfter">Expira Após (dias)</Label>
                <Input
                  id="expiresAfter"
                  type="number"
                  min="1"
                  value={formData.expiresAfter || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expiresAfter: e.target.value
                        ? parseInt(e.target.value, 10)
                        : undefined,
                    })
                  }
                  placeholder="Deixe vazio para não expirar"
                />
              </div>

              {formData.frequency === 'weekly' && (
                <div className="space-y-2">
                  <Label>Dias da Semana Ativos</Label>
                  <div className="flex gap-2 flex-wrap">
                    {daysOfWeek.map((day) => (
                      <Button
                        key={day.value}
                        type="button"
                        variant={
                          selectedDays.includes(day.value) ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={() => toggleDay(day.value)}
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Seção: Configurações */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Configurações</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActiveByDefault"
                    checked={formData.isActiveByDefault}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActiveByDefault: !!checked })
                    }
                  />
                  <Label htmlFor="isActiveByDefault" className="cursor-pointer">
                    Ativa por padrão em novas clínicas
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requiresManualValidation"
                    checked={formData.requiresManualValidation}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        requiresManualValidation: !!checked,
                      })
                    }
                  />
                  <Label
                    htmlFor="requiresManualValidation"
                    className="cursor-pointer"
                  >
                    Requer validação manual do ortodontista
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autoActivate"
                    checked={formData.autoActivate}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, autoActivate: !!checked })
                    }
                  />
                  <Label htmlFor="autoActivate" className="cursor-pointer">
                    Ativar automaticamente quando agendado
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Salvando...' : editingMission ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminMissions
