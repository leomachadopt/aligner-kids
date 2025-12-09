/**
 * Admin Prompts - Painel de Administração de Prompts
 * Apenas para Super Admins - Gerenciar prompts do sistema de histórias
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StoryPrompt, StoryPromptInput } from '@/types/story'
import { toast } from 'sonner'

// Mock data - em produção virá do banco
const MOCK_PROMPTS: StoryPrompt[] = [
  {
    id: '1',
    name: 'Prompt Padrão - Aventura Educativa',
    description: 'Prompt padrão para gerar histórias educativas e divertidas sobre saúde bucal',
    systemPrompt: 'Você é um contador de histórias infantis especializado...',
    userPromptTemplate: 'Crie uma história infantil emocionante...',
    ageRanges: {
      '3-5': 'Linguagem muito simples, frases curtas',
      '6-8': 'Linguagem clara, frases médias',
      '9-12': 'Linguagem mais rica, frases complexas',
    },
    isActive: true,
    createdBy: 'admin-1',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
]

const AdminPrompts = () => {
  const [prompts, setPrompts] = useState<StoryPrompt[]>(MOCK_PROMPTS)
  const [selectedPrompt, setSelectedPrompt] = useState<StoryPrompt | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Form state
  const [formData, setFormData] = useState<Partial<StoryPromptInput>>({
    name: '',
    description: '',
    systemPrompt: '',
    userPromptTemplate: '',
    ageRanges: {
      '3-5': '',
      '6-8': '',
      '9-12': '',
    },
    isActive: true,
  })

  // ============================================
  // AÇÕES
  // ============================================

  const handleCreate = () => {
    setIsCreating(true)
    setFormData({
      name: '',
      description: '',
      systemPrompt: '',
      userPromptTemplate: '',
      ageRanges: {
        '3-5': '',
        '6-8': '',
        '9-12': '',
      },
      isActive: true,
    })
  }

  const handleEdit = (prompt: StoryPrompt) => {
    setSelectedPrompt(prompt)
    setFormData({
      name: prompt.name,
      description: prompt.description,
      systemPrompt: prompt.systemPrompt,
      userPromptTemplate: prompt.userPromptTemplate,
      ageRanges: prompt.ageRanges,
      isActive: prompt.isActive,
    })
    setIsEditing(true)
  }

  const handleSave = () => {
    // TODO: Salvar no backend
    if (!formData.name || !formData.systemPrompt || !formData.userPromptTemplate) {
      toast.error('Preencha todos os campos obrigatórios!')
      return
    }

    if (isCreating) {
      // Criar novo
      const newPrompt: StoryPrompt = {
        id: `prompt-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        systemPrompt: formData.systemPrompt,
        userPromptTemplate: formData.userPromptTemplate,
        ageRanges: formData.ageRanges as any,
        isActive: formData.isActive || true,
        createdBy: 'current-admin', // TODO: Pegar do contexto
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      setPrompts([...prompts, newPrompt])
      toast.success('✅ Prompt criado com sucesso!')
      setIsCreating(false)
    } else if (isEditing && selectedPrompt) {
      // Editar existente
      const updated = prompts.map((p) =>
        p.id === selectedPrompt.id
          ? {
              ...p,
              ...formData,
              updatedAt: new Date().toISOString(),
            }
          : p,
      )
      setPrompts(updated as StoryPrompt[])
      toast.success('✅ Prompt atualizado com sucesso!')
      setIsEditing(false)
      setSelectedPrompt(null)
    }
  }

  const handleDelete = (promptId: string) => {
    if (confirm('Tem certeza que deseja excluir este prompt?')) {
      setPrompts(prompts.filter((p) => p.id !== promptId))
      toast.success('✅ Prompt excluído com sucesso!')
    }
  }

  const toggleActive = (promptId: string) => {
    const updated = prompts.map((p) =>
      p.id === promptId
        ? { ...p, isActive: !p.isActive, updatedAt: new Date().toISOString() }
        : p,
    )
    setPrompts(updated)
    toast.success('Status atualizado!')
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-extrabold text-primary flex items-center gap-3">
            <ShieldCheck className="h-10 w-10" />
            Gestão de Prompts
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Configure os prompts usados para gerar histórias personalizadas
          </p>
        </div>

        <Button size="lg" onClick={handleCreate} className="min-w-[150px]">
          <Plus className="mr-2 h-5 w-5" />
          Novo Prompt
        </Button>
      </div>

      {/* Lista de Prompts */}
      <div className="grid gap-4">
        {prompts.map((prompt) => (
          <Card
            key={prompt.id}
            className={cn(
              'border-2 transition-all hover:shadow-lg',
              prompt.isActive
                ? 'border-green-500/30 bg-green-50/20'
                : 'border-gray-300 bg-gray-50/20',
            )}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-xl">{prompt.name}</CardTitle>
                    <Badge variant={prompt.isActive ? 'default' : 'secondary'}>
                      {prompt.isActive ? (
                        <>
                          <Eye className="mr-1 h-3 w-3" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <EyeOff className="mr-1 h-3 w-3" />
                          Inativo
                        </>
                      )}
                    </Badge>
                  </div>
                  <CardDescription>{prompt.description}</CardDescription>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => toggleActive(prompt.id)}
                  >
                    {prompt.isActive ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleEdit(prompt)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => handleDelete(prompt.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-sm">
                <div>
                  <span className="font-semibold">System Prompt:</span>
                  <p className="text-muted-foreground truncate">
                    {prompt.systemPrompt}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Badge variant="outline">3-5 anos</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {prompt.ageRanges['3-5']}
                    </p>
                  </div>
                  <div>
                    <Badge variant="outline">6-8 anos</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {prompt.ageRanges['6-8']}
                    </p>
                  </div>
                  <div>
                    <Badge variant="outline">9-12 anos</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {prompt.ageRanges['9-12']}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de Criação/Edição */}
      <Dialog
        open={isCreating || isEditing}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false)
            setIsEditing(false)
            setSelectedPrompt(null)
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? 'Criar Novo Prompt' : 'Editar Prompt'}
            </DialogTitle>
            <DialogDescription>
              Configure como as histórias serão geradas pela IA
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Prompt *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Prompt Aventura Espacial"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Breve descrição do propósito deste prompt"
              />
            </div>

            <div>
              <Label htmlFor="systemPrompt">System Prompt *</Label>
              <Textarea
                id="systemPrompt"
                value={formData.systemPrompt}
                onChange={(e) =>
                  setFormData({ ...formData, systemPrompt: e.target.value })
                }
                placeholder="Instruções para a IA sobre como se comportar..."
                rows={6}
                className="font-mono text-sm"
              />
            </div>

            <div>
              <Label htmlFor="userPromptTemplate">User Prompt Template *</Label>
              <Textarea
                id="userPromptTemplate"
                value={formData.userPromptTemplate}
                onChange={(e) =>
                  setFormData({ ...formData, userPromptTemplate: e.target.value })
                }
                placeholder="Template do prompt com variáveis {{variavel}}..."
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use variáveis: {'{'}
                {'{'}environment{'}'}
                {'}'}, {'{'}
                {'{'}mainCharacter{'}'}
                {'}'}, {'{'}
                {'{'}theme{'}'}
                {'}'}, {'{'}
                {'{'}age{'}'}
                {'}'}, etc.
              </p>
            </div>

            <div className="space-y-3">
              <Label>Instruções por Faixa Etária</Label>

              <div>
                <Label htmlFor="age-3-5" className="text-sm">
                  3-5 anos
                </Label>
                <Input
                  id="age-3-5"
                  value={formData.ageRanges?.['3-5']}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ageRanges: { ...formData.ageRanges, '3-5': e.target.value } as any,
                    })
                  }
                  placeholder="Instruções para crianças de 3-5 anos"
                />
              </div>

              <div>
                <Label htmlFor="age-6-8" className="text-sm">
                  6-8 anos
                </Label>
                <Input
                  id="age-6-8"
                  value={formData.ageRanges?.['6-8']}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ageRanges: { ...formData.ageRanges, '6-8': e.target.value } as any,
                    })
                  }
                  placeholder="Instruções para crianças de 6-8 anos"
                />
              </div>

              <div>
                <Label htmlFor="age-9-12" className="text-sm">
                  9-12 anos
                </Label>
                <Input
                  id="age-9-12"
                  value={formData.ageRanges?.['9-12']}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ageRanges: { ...formData.ageRanges, '9-12': e.target.value } as any,
                    })
                  }
                  placeholder="Instruções para crianças de 9-12 anos"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
              <Label htmlFor="isActive">Prompt ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreating(false)
                setIsEditing(false)
                setSelectedPrompt(null)
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminPrompts
