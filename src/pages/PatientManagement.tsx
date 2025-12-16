import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Link } from 'react-router-dom'
import { Search, Users, TrendingUp, AlertTriangle, UserPlus, Trash2 } from 'lucide-react'
import { alignerService } from '@/services/alignerService'
import { AuthService } from '@/services/authService'
import { ClinicService } from '@/services/clinicService'
import { useAuth } from '@/context/AuthContext'
import type { Treatment, Aligner } from '@/types/aligner'
import type { User, UserRole } from '@/types/user'
import type { Clinic } from '@/types/clinic'
import { COUNTRY_INFO } from '@/types/clinic'
import { isAlignerOverdue } from '@/utils/alignerCalculations'
import { toast } from 'sonner'

const PatientManagement = () => {
  const { user } = useAuth()
  const [patients, setPatients] = useState<User[]>([])
  const [treatments, setTreatments] = useState<
    Array<Treatment & { patient: User }>
  >([])
  const [aligners, setAligners] = useState<Aligner[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [clinic, setClinic] = useState<Clinic | null>(null)

  // Estados do diálogo de cadastro
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [patientType, setPatientType] = useState<'patient' | 'child-patient'>('patient')
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    cpf: '',
    birthDate: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Dados do responsável (apenas para child-patient)
    guardianName: '',
    guardianCpf: '',
    guardianPhone: '',
    // Preferências
    preferredLanguage: 'pt-BR',
  })

  // Estados do diálogo de exclusão
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [patientToDelete, setPatientToDelete] = useState<User | null>(null)

  useEffect(() => {
    if (!user || !user.clinicId) {
      toast.error('Usuário não está vinculado a nenhuma clínica')
      setLoading(false)
      return
    }

    loadData()
  }, [user])

  const loadData = async () => {
    if (!user?.clinicId) return

    try {
      setLoading(true)

      // Buscar dados da clínica
      const clinicData = await ClinicService.getClinicById(user.clinicId)
      setClinic(clinicData)

      // Buscar TODOS os pacientes da clínica (filtrar apenas patients e child-patients)
      const allUsers = await AuthService.getUsersByClinicAsync(user.clinicId)
      const clinicPatients = allUsers.filter(
        (u) => u.role === 'patient' || u.role === 'child-patient'
      )
      setPatients(clinicPatients)

      // Buscar tratamentos e alinhadores para cada paciente
      const allAligners: Aligner[] = []
      const treatmentsWithPatients: Array<Treatment & { patient: User }> = []

      for (const patient of clinicPatients) {
        const patientAligners = await alignerService.getAlignersByPatient(patient.id)
        const treatment = await alignerService.getTreatmentByPatient(patient.id)

        allAligners.push(...patientAligners)
        if (treatment) {
          treatmentsWithPatients.push({ ...treatment, patient })
        }
      }

      setAligners(allAligners)
      setTreatments(treatmentsWithPatients)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Erro ao carregar pacientes')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePatient = () => {
    setFormData({
      fullName: '',
      email: '',
      cpf: '',
      birthDate: '',
      phone: '',
      password: '',
      confirmPassword: '',
      guardianName: '',
      guardianCpf: '',
      guardianPhone: '',
      preferredLanguage: 'pt-BR',
    })
    setPatientType('patient')
    setIsCreateOpen(true)
  }

  const handleSavePatient = async () => {
    try {
      if (!user?.clinicId) {
        toast.error('Usuário não está vinculado a nenhuma clínica')
        return
      }

      // Validações básicas (cpf não é obrigatório)
      if (!formData.fullName || !formData.email || !formData.phone || !formData.password) {
        toast.error('Preencha todos os campos obrigatórios')
        return
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error('As senhas não coincidem')
        return
      }

      // Se for child-patient, validar dados do responsável
      if (patientType === 'child-patient' && !formData.guardianName) {
        toast.error('Preencha os dados do responsável')
        return
      }

      // Registrar paciente (sem criar sessão para não deslogar o ortodontista)
      await AuthService.register({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: patientType,
        fullName: formData.fullName,
        cpf: formData.cpf || undefined,
        birthDate: formData.birthDate || undefined,
        phone: formData.phone,
        guardianName: patientType === 'child-patient' ? formData.guardianName : undefined,
        guardianCpf: patientType === 'child-patient' ? formData.guardianCpf : undefined,
        guardianPhone: patientType === 'child-patient' ? formData.guardianPhone : undefined,
        clinicId: user.clinicId,
        preferredLanguage: formData.preferredLanguage,
      }, false) // false = não criar sessão

      toast.success('Paciente cadastrado com sucesso!')
      setIsCreateOpen(false)
      loadData()
    } catch (error) {
      console.error('Error creating patient:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao cadastrar paciente')
    }
  }

  const handleDeleteClick = (patient: User) => {
    setPatientToDelete(patient)
    setIsDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!patientToDelete) return

    try {
      await AuthService.deleteUser(patientToDelete.id)
      toast.success(`Paciente ${patientToDelete.fullName} foi excluído com sucesso`)
      setIsDeleteOpen(false)
      setPatientToDelete(null)
      loadData()
    } catch (error) {
      console.error('Error deleting patient:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir paciente')
    }
  }

  const filteredPatients = patients.filter((patient) =>
    patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getPatientStatus = (patientId: string) => {
    const treatment = treatments.find((t) => t.patientId === patientId)

    if (!treatment) {
      return { label: 'Sem Tratamento', variant: 'secondary' as const }
    }

    const patientAligners = aligners.filter(
      (a) => a.patientId === patientId,
    )
    const hasOverdue = patientAligners.some((a) => isAlignerOverdue(a))
    const activeAligner = patientAligners.find((a) => a.status === 'active')

    if (treatment.status === 'completed') {
      return { label: 'Concluído', variant: 'default' as const }
    }
    if (hasOverdue) {
      return { label: 'Atrasado', variant: 'destructive' as const }
    }
    if (activeAligner) {
      return { label: 'Em Tratamento', variant: 'default' as const }
    }
    return { label: 'Sem alinhador ativo', variant: 'secondary' as const }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Gerenciamento de Pacientes</h1>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="rounded-2xl border-2 border-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Gerenciamento de Pacientes
            </h1>
            <p className="text-sm text-gray-600 mt-1 font-medium">
              Visualize e gerencie todos os pacientes
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild className="rounded-full px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 font-bold shadow-md hover-bounce">
              <Link to="/aligner-management">Cadastrar Alinhador</Link>
            </Button>
            <Button onClick={handleCreatePatient} className="rounded-full px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 font-bold shadow-md hover-bounce">
              <UserPlus className="h-5 w-5 mr-2" />
              Cadastrar Paciente
            </Button>
          </div>
        </div>
      </div>

      <Card className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl font-bold">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center shadow-md">
              <Search className="h-5 w-5 text-white" />
            </div>
            Buscar Paciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Digite o nome do paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 rounded-xl border-2 border-purple-200 focus:border-purple-400 bg-white font-medium"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {filteredPatients.length === 0 ? (
          <Card className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg">
            <CardContent className="py-12 text-center">
              <Users className="mx-auto h-20 w-20 text-gray-300 mb-4" />
              <p className="text-gray-600 font-medium text-lg">
                {searchTerm
                  ? 'Nenhum paciente encontrado com esse nome.'
                  : 'Nenhum paciente cadastrado ainda.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPatients.map((patient) => {
            const treatment = treatments.find((t) => t.patientId === patient.id)
            const patientAligners = aligners.filter(
              (a) => a.patientId === patient.id,
            )
            const status = getPatientStatus(patient.id)

            const progress = treatment
              ? (treatment.currentAlignerNumber / treatment.totalAligners) * 100
              : 0

            const statusColors = {
              'Sem Tratamento': { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'from-gray-400 to-gray-500' },
              'Concluído': { bg: 'bg-green-50', border: 'border-green-200', badge: 'from-green-400 to-teal-400' },
              'Atrasado': { bg: 'bg-red-50', border: 'border-red-200', badge: 'from-red-400 to-pink-400' },
              'Em Tratamento': { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'from-blue-400 to-purple-400' },
              'Sem alinhador ativo': { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'from-yellow-400 to-orange-400' },
            }

            const colors = statusColors[status.label as keyof typeof statusColors] || statusColors['Sem Tratamento']

            return (
              <Card key={patient.id} className={`rounded-2xl border-2 ${colors.border} ${colors.bg} shadow-lg hover-scale transition-all`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-2xl font-bold text-gray-800">
                          {patient.fullName}
                        </h3>
                        <Badge className={`bg-gradient-to-r ${colors.badge} text-white font-bold px-3 py-1`}>
                          {status.label}
                        </Badge>
                        {patient.role === 'child-patient' && (
                          <Badge className="bg-gradient-to-r from-pink-400 to-purple-400 text-white font-bold px-3 py-1">
                            Criança
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 font-medium">
                        {patient.email}
                      </p>
                      {treatment ? (
                        <div className="flex items-center gap-6 mt-4">
                          <div>
                            <p className="text-xs text-gray-500 font-bold uppercase">
                              Progresso
                            </p>
                            <p className="text-xl font-extrabold text-gray-800">
                              {treatment.currentAlignerNumber} / {treatment.totalAligners}
                            </p>
                          </div>
                          <div className="flex-1">
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className={`bg-gradient-to-r ${colors.badge} h-3 rounded-full transition-all`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-extrabold text-gray-800">
                              {progress.toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 mt-4 font-medium">
                          Nenhum tratamento iniciado ainda
                        </p>
                      )}
                    </div>
                    <div className="flex gap-3 ml-4">
                      <Button asChild className="rounded-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 font-bold shadow-md hover-bounce">
                        <Link to={`/patient/${patient.id}`}>
                          Ver Detalhes
                        </Link>
                      </Button>
                      <Button
                        size="icon"
                        onClick={() => handleDeleteClick(patient)}
                        className="rounded-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-md hover-bounce"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Dialog: Cadastrar Paciente */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Paciente</DialogTitle>
            <DialogDescription>
              Preencha os dados do paciente que será vinculado à sua clínica
            </DialogDescription>
          </DialogHeader>

          {(() => {
            const countryInfo = COUNTRY_INFO[clinic?.country || 'BR']
            return (
              <div className="space-y-4">
                {/* Seleção de Tipo de Paciente */}
                <div>
                  <Label htmlFor="patient-type">Tipo de Paciente *</Label>
                  <select
                    id="patient-type"
                    value={patientType}
                    onChange={(e) =>
                      setPatientType(e.target.value as 'patient' | 'child-patient')
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="patient">Adulto</option>
                    <option value="child-patient">Criança</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {patientType === 'child-patient'
                      ? 'Para pacientes menores de idade (será solicitado dados do responsável)'
                      : 'Para pacientes adultos'}
                  </p>
                </div>

                {/* Dados do Paciente */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">
                    {patientType === 'child-patient'
                      ? 'Dados da Criança'
                      : 'Dados do Paciente'}
                  </h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="fullName">Nome Completo *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        placeholder={
                          patientType === 'child-patient'
                            ? 'Nome da criança'
                            : 'Nome completo'
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="birthDate">Data de Nascimento</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) =>
                          setFormData({ ...formData, birthDate: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 mt-4">
                    <div>
                      <Label htmlFor="email">
                        {patientType === 'child-patient'
                          ? 'Email do Responsável *'
                          : 'Email *'}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder={
                          patientType === 'child-patient'
                            ? 'email@responsavel.com'
                            : 'email@exemplo.com'
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">{countryInfo.phoneLabel} *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder={countryInfo.phoneFormat}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="cpf">{countryInfo.documentLabel}</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) =>
                        setFormData({ ...formData, cpf: e.target.value })
                      }
                      placeholder={countryInfo.documentPlaceholder}
                    />
                  </div>
                </div>

                {/* Dados do Responsável (apenas para child-patient) */}
                {patientType === 'child-patient' && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">
                      Dados do Responsável
                    </h3>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="guardianName">Nome do Responsável *</Label>
                        <Input
                          id="guardianName"
                          value={formData.guardianName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              guardianName: e.target.value,
                            })
                          }
                          placeholder="Nome do pai/mãe ou responsável"
                        />
                      </div>

                      <div>
                        <Label htmlFor="guardianCpf">
                          {countryInfo.documentLabel} do Responsável
                        </Label>
                        <Input
                          id="guardianCpf"
                          value={formData.guardianCpf}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              guardianCpf: e.target.value,
                            })
                          }
                          placeholder={countryInfo.documentPlaceholder}
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <Label htmlFor="guardianPhone">
                        {countryInfo.phoneLabel} do Responsável
                      </Label>
                      <Input
                        id="guardianPhone"
                        value={formData.guardianPhone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            guardianPhone: e.target.value,
                          })
                        }
                        placeholder={countryInfo.phoneFormat}
                      />
                    </div>
                  </div>
                )}

                {/* Idioma Preferido */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Preferências</h3>
                  <div>
                    <Label htmlFor="preferredLanguage">Idioma Preferido</Label>
                    <Select
                      value={formData.preferredLanguage}
                      onValueChange={(value) =>
                        setFormData({ ...formData, preferredLanguage: value })
                      }
                    >
                      <SelectTrigger id="preferredLanguage">
                        <SelectValue placeholder="Selecione o idioma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">🇧🇷 Português (Brasil)</SelectItem>
                        <SelectItem value="pt-PT">🇵🇹 Português (Portugal)</SelectItem>
                        <SelectItem value="en-US">🇺🇸 English (US)</SelectItem>
                        <SelectItem value="es-ES">🇪🇸 Español (España)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      As histórias e áudios serão gerados neste idioma
                    </p>
                  </div>
                </div>

                {/* Senha */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Senha de Acesso</h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="password">Senha *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            confirmPassword: e.target.value,
                          })
                        }
                        placeholder="Repita a senha"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePatient}>Cadastrar Paciente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar Exclusão */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Esta ação é <strong>irreversível</strong> e irá excluir permanentemente:
            </DialogDescription>
          </DialogHeader>

          {patientToDelete && (
            <div className="space-y-4 py-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="font-semibold">{patientToDelete.fullName}</p>
                <p className="text-sm text-muted-foreground">{patientToDelete.email}</p>
              </div>

              <div className="space-y-2 text-sm">
                <p className="font-semibold text-destructive">Serão excluídos:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Cadastro do paciente</li>
                  <li>Todos os alinhadores e tratamentos</li>
                  <li>Histórias geradas</li>
                  <li>Missões e pontuação</li>
                  <li>Preferências e configurações</li>
                </ul>
              </div>

              <p className="text-sm text-muted-foreground border-t pt-4">
                Tem certeza que deseja continuar?
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteOpen(false)
                setPatientToDelete(null)
              }}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Sim, Excluir Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PatientManagement



