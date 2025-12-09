/**
 * Admin Clinics - Gerenciamento de Clínicas (Super-Admin)
 * Lista, cria, edita e gerencia todas as clínicas da plataforma
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Building2,
  Plus,
  Edit,
  Power,
  PowerOff,
  Search,
  MapPin,
  Mail,
  Phone,
  Globe,
} from 'lucide-react'
import { ClinicService } from '@/services/clinicService'
import type { Clinic, ClinicInput } from '@/types/clinic'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const AdminClinics = () => {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null)

  // Form state
  const [formData, setFormData] = useState<ClinicInput>({
    name: '',
    slug: '',
    email: '',
    phone: '',
    website: '',
    addressCity: '',
    addressState: '',
    subscriptionTier: 'basic',
  })

  // ============================================
  // LOAD DATA
  // ============================================

  useEffect(() => {
    loadClinics()
  }, [])

  const loadClinics = async () => {
    try {
      setLoading(true)
      const data = await ClinicService.getAllClinics()
      setClinics(data)
    } catch (error) {
      toast.error('Erro ao carregar clínicas')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // HANDLERS
  // ============================================

  const handleCreate = () => {
    setFormData({
      name: '',
      slug: '',
      email: '',
      phone: '',
      website: '',
      addressCity: '',
      addressState: '',
      subscriptionTier: 'basic',
    })
    setIsCreateOpen(true)
  }

  const handleEdit = (clinic: Clinic) => {
    setSelectedClinic(clinic)
    setFormData({
      name: clinic.name,
      slug: clinic.slug,
      email: clinic.email,
      phone: clinic.phone || '',
      website: clinic.website || '',
      addressCity: clinic.addressCity || '',
      addressState: clinic.addressState || '',
      subscriptionTier: clinic.subscriptionTier,
    })
    setIsEditOpen(true)
  }

  const handleSaveCreate = async () => {
    try {
      // Validações
      if (!formData.name || !formData.slug || !formData.email) {
        toast.error('Preencha todos os campos obrigatórios')
        return
      }

      await ClinicService.createClinic(formData)
      toast.success('Clínica criada com sucesso!')
      setIsCreateOpen(false)
      loadClinics()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar clínica')
    }
  }

  const handleSaveEdit = async () => {
    if (!selectedClinic) return

    try {
      const { slug, ...updates } = formData // Slug não pode ser alterado
      await ClinicService.updateClinic(selectedClinic.id, updates)
      toast.success('Clínica atualizada com sucesso!')
      setIsEditOpen(false)
      setSelectedClinic(null)
      loadClinics()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar clínica')
    }
  }

  const handleToggleActive = async (clinic: Clinic) => {
    try {
      if (clinic.isActive) {
        await ClinicService.deactivateClinic(clinic.id)
        toast.success('Clínica desativada')
      } else {
        await ClinicService.activateClinic(clinic.id)
        toast.success('Clínica reativada')
      }
      loadClinics()
    } catch (error) {
      toast.error('Erro ao alterar status da clínica')
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífen
      .replace(/--+/g, '-') // Remove hífens duplicados
      .trim()
  }

  // ============================================
  // FILTER
  // ============================================

  const filteredClinics = clinics.filter((clinic) =>
    clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clinic.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clinic.addressCity?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // ============================================
  // STATS
  // ============================================

  const stats = {
    total: clinics.length,
    active: clinics.filter((c) => c.isActive).length,
    inactive: clinics.filter((c) => !c.isActive).length,
    basic: clinics.filter((c) => c.subscriptionTier === 'basic').length,
    pro: clinics.filter((c) => c.subscriptionTier === 'pro').length,
    enterprise: clinics.filter((c) => c.subscriptionTier === 'enterprise').length,
  }

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Carregando...</h1>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-primary flex items-center gap-3">
            <Building2 className="h-10 w-10" />
            Gerenciar Clínicas
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Administre todas as clínicas da plataforma
          </p>
        </div>

        <Button size="lg" onClick={handleCreate}>
          <Plus className="mr-2 h-5 w-5" />
          Nova Clínica
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Clínicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-400">{stats.inactive}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Planos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <div>Basic: {stats.basic}</div>
              <div>Pro: {stats.pro}</div>
              <div>Enterprise: {stats.enterprise}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Clínicas */}
      <div className="grid gap-4">
        {filteredClinics.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm
                  ? 'Nenhuma clínica encontrada com esse termo.'
                  : 'Nenhuma clínica cadastrada ainda.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredClinics.map((clinic) => (
            <Card
              key={clinic.id}
              className={cn(
                'hover:shadow-md transition-shadow',
                !clinic.isActive && 'opacity-60'
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold">{clinic.name}</h3>
                      <Badge variant={clinic.isActive ? 'default' : 'secondary'}>
                        {clinic.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {clinic.subscriptionTier}
                      </Badge>
                    </div>

                    {/* Info */}
                    <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {clinic.email}
                      </div>
                      {clinic.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {clinic.phone}
                        </div>
                      )}
                      {clinic.addressCity && clinic.addressState && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {clinic.addressCity}, {clinic.addressState}
                        </div>
                      )}
                      {clinic.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          <a
                            href={clinic.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {clinic.website}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Slug */}
                    <div className="text-xs text-muted-foreground">
                      🔗 /{clinic.slug}
                    </div>

                    {/* Stats (TODO: implementar quando tiver dados) */}
                    <div className="flex gap-4 text-sm pt-2 border-t">
                      <div>
                        <span className="font-semibold">Ortodontistas:</span>{' '}
                        <span className="text-muted-foreground">0</span>
                      </div>
                      <div>
                        <span className="font-semibold">Pacientes:</span>{' '}
                        <span className="text-muted-foreground">0</span>
                      </div>
                      <div>
                        <span className="font-semibold">Tratamentos:</span>{' '}
                        <span className="text-muted-foreground">0</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleEdit(clinic)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant={clinic.isActive ? 'destructive' : 'default'}
                      onClick={() => handleToggleActive(clinic)}
                    >
                      {clinic.isActive ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog: Criar Clínica */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Nova Clínica</DialogTitle>
            <DialogDescription>
              Preencha as informações da nova clínica
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Nome da Clínica *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setFormData({
                      ...formData,
                      name,
                      slug: generateSlug(name),
                    })
                  }}
                  placeholder="Ex: Odonto Excellence"
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug (URL) *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="odonto-excellence"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Será usado na URL: /clinicas/{formData.slug}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="contato@clinica.com"
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="(11) 98765-4321"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                placeholder="https://clinica.com"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.addressCity}
                  onChange={(e) =>
                    setFormData({ ...formData, addressCity: e.target.value })
                  }
                  placeholder="São Paulo"
                />
              </div>

              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.addressState}
                  onChange={(e) =>
                    setFormData({ ...formData, addressState: e.target.value.toUpperCase() })
                  }
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tier">Plano de Assinatura</Label>
              <select
                id="tier"
                value={formData.subscriptionTier}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    subscriptionTier: e.target.value as any,
                  })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCreate}>Criar Clínica</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Clínica */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Clínica</DialogTitle>
            <DialogDescription>
              Atualize as informações da clínica
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome da Clínica *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-website">Website</Label>
              <Input
                id="edit-website"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="edit-city">Cidade</Label>
                <Input
                  id="edit-city"
                  value={formData.addressCity}
                  onChange={(e) =>
                    setFormData({ ...formData, addressCity: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="edit-state">Estado</Label>
                <Input
                  id="edit-state"
                  value={formData.addressState}
                  onChange={(e) =>
                    setFormData({ ...formData, addressState: e.target.value.toUpperCase() })
                  }
                  maxLength={2}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-tier">Plano de Assinatura</Label>
              <select
                id="edit-tier"
                value={formData.subscriptionTier}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    subscriptionTier: e.target.value as any,
                  })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false)
                setSelectedClinic(null)
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminClinics
