/**
 * Admin Orthodontists - Gerenciamento de Ortodontistas (Super-Admin)
 * Aprovar, rejeitar e gerenciar ortodontistas da plataforma
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Building2,
  Calendar,
  Shield,
  Trash2,
  RotateCcw,
  Edit,
  Eye,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { AuthService } from '@/services/authService'
import { ClinicService } from '@/services/clinicService'
import type { User } from '@/types/user'
import type { Clinic } from '@/types/clinic'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const AdminOrthodontists = () => {
  const [orthodontists, setOrthodontists] = useState<User[]>([])
  const [pendingOrthodontists, setPendingOrthodontists] = useState<User[]>([])
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [patientCounts, setPatientCounts] = useState<Record<string, number>>({})

  // Modal de visualização/edição
  const [selectedOrtho, setSelectedOrtho] = useState<User | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState<Partial<User>>({})
  const [isSaving, setIsSaving] = useState(false)

  // ============================================
  // LOAD DATA
  // ============================================

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Carregar todos os usuários (assíncrono, via API)
      const allUsers = await AuthService.getAllUsersAsync()

      // Filtrar ortodontistas
      const orthos = allUsers.filter((u) => u.role === 'orthodontist')
      setOrthodontists(orthos)

      // Filtrar pendentes via API
      const pending = await AuthService.getPendingOrthodontistsAsync()
      setPendingOrthodontists(pending)

      // Carregar clínicas
      const clinicsData = await ClinicService.getAllClinics()
      setClinics(clinicsData)

      // Contar pacientes por clínica
      const counts: Record<string, number> = {}
      for (const clinic of clinicsData) {
        const patientsInClinic = allUsers.filter(
          (u) => (u.role === 'patient' || u.role === 'child-patient') && u.clinicId === clinic.id
        )
        counts[clinic.id] = patientsInClinic.length
      }
      setPatientCounts(counts)
    } catch (error) {
      toast.error('Erro ao carregar ortodontistas')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // HANDLERS
  // ============================================

  const handleApprove = async (orthodontistId: string) => {
    try {
      await AuthService.approveOrthodontist('current-admin-id', orthodontistId)
      toast.success('Ortodontista aprovado com sucesso!')
      loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao aprovar')
    }
  }

  const handleReject = async (orthodontistId: string) => {
    if (!confirm('Tem certeza que deseja rejeitar este ortodontista?')) {
      return
    }

    try {
      await AuthService.rejectOrthodontist('current-admin-id', orthodontistId)
      toast.success('Ortodontista rejeitado')
      loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao rejeitar')
    }
  }

  const handleDeactivate = async (orthodontistId: string) => {
    if (!confirm('Tem certeza que deseja desativar este ortodontista?')) {
      return
    }

    try {
      await AuthService.deactivateUser('current-admin-id', orthodontistId)
      toast.success('Ortodontista desativado')
      loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao desativar')
    }
  }

  const handleDelete = async (orthodontistId: string, orthodontistName: string) => {
    if (!confirm(`ATENÇÃO: Tem certeza que deseja EXCLUIR PERMANENTEMENTE o ortodontista "${orthodontistName}"?\n\nEsta ação não pode ser desfeita e removerá todos os dados associados.`)) {
      return
    }

    // Confirmação dupla
    if (!confirm('Esta é uma ação irreversível. Confirma a exclusão permanente?')) {
      return
    }

    try {
      await AuthService.deleteUser(orthodontistId)
      toast.success('Ortodontista excluído permanentemente')
      loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir')
    }
  }

  const handleReactivate = async (orthodontistId: string) => {
    if (!confirm('Tem certeza que deseja reativar este ortodontista?')) {
      return
    }

    try {
      await AuthService.approveOrthodontist('current-admin-id', orthodontistId)
      toast.success('Ortodontista reativado com sucesso!')
      loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao reativar')
    }
  }

  const handleViewOrthodontist = (ortho: User) => {
    setSelectedOrtho(ortho)
    setEditFormData({
      fullName: ortho.fullName,
      email: ortho.email,
      phone: ortho.phone || '',
      cpf: ortho.cpf || '',
      cro: ortho.cro || '',
      birthDate: ortho.birthDate || '',
    })
    setIsEditing(false)
    setIsViewDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedOrtho) return

    try {
      setIsSaving(true)
      await AuthService.updateProfile(selectedOrtho.id, {
        fullName: editFormData.fullName || selectedOrtho.fullName,
        email: editFormData.email || selectedOrtho.email,
        phone: editFormData.phone,
        birthDate: editFormData.birthDate,
      })

      toast.success('Dados atualizados com sucesso!')
      setIsViewDialogOpen(false)
      setIsEditing(false)
      loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar dados')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    if (selectedOrtho) {
      setEditFormData({
        fullName: selectedOrtho.fullName,
        email: selectedOrtho.email,
        phone: selectedOrtho.phone || '',
        cpf: selectedOrtho.cpf || '',
        cro: selectedOrtho.cro || '',
        birthDate: selectedOrtho.birthDate || '',
      })
    }
    setIsEditing(false)
  }

  // ============================================
  // HELPERS
  // ============================================

  const getClinicName = (clinicId?: string) => {
    if (!clinicId) return 'Sem clínica'
    const clinic = clinics.find((c) => c.id === clinicId)
    return clinic?.name || 'Clínica não encontrada'
  }

  const getPatientCount = (clinicId?: string) => {
    if (!clinicId) return 0
    return patientCounts[clinicId] || 0
  }

  const filteredOrthodontists = orthodontists.filter((ortho) =>
    ortho.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ortho.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ortho.cro?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const approvedOrthodontists = filteredOrthodontists.filter((o) => o.isApproved && o.isActive)
  const inactiveOrthodontists = filteredOrthodontists.filter((o) => !o.isActive)

  // ============================================
  // STATS
  // ============================================

  const stats = {
    total: orthodontists.length,
    pending: pendingOrthodontists.length,
    approved: orthodontists.filter((o) => o.isApproved && o.isActive).length,
    inactive: orthodontists.filter((o) => !o.isActive).length,
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
      <div>
        <h1 className="text-4xl font-bold text-primary flex items-center gap-3">
          <Users className="h-10 w-10" />
          Gerenciar Ortodontistas
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Aprove, rejeite e gerencie ortodontistas da plataforma
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Ortodontistas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes de Aprovação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aprovados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-400">{stats.inactive}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pendentes de Aprovação */}
      {pendingOrthodontists.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-orange-600" />
            Pendentes de Aprovação
          </h2>

          <div className="grid gap-4">
            {pendingOrthodontists.map((ortho) => (
              <Card key={ortho.id} className="border-2 border-orange-500/30 bg-orange-50/20">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold">{ortho.fullName}</h3>
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                          Pendente
                        </Badge>
                      </div>

                      {/* Info */}
                      <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {ortho.email}
                        </div>
                        {ortho.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {ortho.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          CRO: {ortho.cro}
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {getClinicName(ortho.clinicId)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Cadastrado em{' '}
                          {format(new Date(ortho.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleApprove(ortho.id)}
                      >
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(ortho.id)}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Rejeitar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(ortho.id, ortho.fullName)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou CRO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Ortodontistas Aprovados */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Ortodontistas Aprovados</h2>

        <div className="grid gap-4">
          {approvedOrthodontists.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm
                    ? 'Nenhum ortodontista encontrado com esse termo.'
                    : 'Nenhum ortodontista aprovado ainda.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            approvedOrthodontists.map((ortho) => (
              <Card key={ortho.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold">{ortho.fullName}</h3>
                        <Badge variant="default" className="bg-green-100 text-green-700">
                          Aprovado
                        </Badge>
                      </div>

                      {/* Info */}
                      <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {ortho.email}
                        </div>
                        {ortho.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {ortho.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          CRO: {ortho.cro}
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {getClinicName(ortho.clinicId)}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex gap-4 text-sm pt-2 border-t">
                        <div>
                          <span className="font-semibold">Pacientes:</span>{' '}
                          <span className="text-muted-foreground">{getPatientCount(ortho.clinicId)}</span>
                        </div>
                        <div>
                          <span className="font-semibold">Último login:</span>{' '}
                          <span className="text-muted-foreground">
                            {ortho.lastLoginAt
                              ? format(new Date(ortho.lastLoginAt), 'dd/MM/yyyy HH:mm', {
                                  locale: ptBR,
                                })
                              : 'Nunca'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewOrthodontist(ortho)}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        Ver/Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDeactivate(ortho.id)}
                      >
                        Desativar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(ortho.id, ortho.fullName)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Ortodontistas Inativos */}
      {inactiveOrthodontists.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-muted-foreground">Ortodontistas Inativos</h2>

          <div className="grid gap-4">
            {inactiveOrthodontists.map((ortho) => (
              <Card key={ortho.id} className="opacity-60">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold">{ortho.fullName}</h3>
                        <Badge variant="secondary">Inativo</Badge>
                      </div>

                      {/* Info */}
                      <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {ortho.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          CRO: {ortho.cro}
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {getClinicName(ortho.clinicId)}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewOrthodontist(ortho)}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        Ver/Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleReactivate(ortho.id)}
                      >
                        <RotateCcw className="mr-1 h-4 w-4" />
                        Reativar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(ortho.id, ortho.fullName)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Dialog de Visualização/Edição */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Edit className="h-5 w-5" />
                  Editar Ortodontista
                </>
              ) : (
                <>
                  <Eye className="h-5 w-5" />
                  Dados do Ortodontista
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? 'Edite os dados do ortodontista' : 'Visualize os dados do ortodontista'}
            </DialogDescription>
          </DialogHeader>

          {selectedOrtho && (
            <div className="space-y-4">
              {/* Status Badges */}
              <div className="flex gap-2">
                {selectedOrtho.isApproved ? (
                  <Badge variant="default" className="bg-green-100 text-green-700">
                    Aprovado
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                    Pendente
                  </Badge>
                )}
                {selectedOrtho.isActive ? (
                  <Badge variant="default" className="bg-blue-100 text-blue-700">
                    Ativo
                  </Badge>
                ) : (
                  <Badge variant="secondary">Inativo</Badge>
                )}
              </div>

              {/* Form Fields */}
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    value={editFormData.fullName || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={editFormData.phone || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      disabled={!isEditing}
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Data de Nascimento</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={editFormData.birthDate || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, birthDate: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={editFormData.cpf || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cro">CRO</Label>
                    <Input
                      id="cro"
                      value={editFormData.cro || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Clínica</Label>
                  <Input
                    value={getClinicName(selectedOrtho.clinicId)}
                    disabled
                    className="bg-muted"
                  />
                </div>

                {/* Info adicional */}
                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pacientes na clínica:</span>
                    <span className="font-semibold">{getPatientCount(selectedOrtho.clinicId)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cadastrado em:</span>
                    <span className="font-semibold">
                      {format(new Date(selectedOrtho.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                  {selectedOrtho.lastLoginAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Último login:</span>
                      <span className="font-semibold">
                        {format(new Date(selectedOrtho.lastLoginAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit} disabled={isSaving}>
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Fechar
                </Button>
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminOrthodontists
