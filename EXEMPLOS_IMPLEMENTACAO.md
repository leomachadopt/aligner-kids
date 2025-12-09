# 💻 Exemplos Práticos de Implementação

## 🗄️ 1. Exemplos de Queries SQL

### Criação da Tabela `clinics`

```sql
-- Criar tabela de clínicas
CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address_city VARCHAR(100),
  address_state VARCHAR(2),
  is_active BOOLEAN DEFAULT true,
  subscription_tier VARCHAR(50) DEFAULT 'basic',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed de exemplo
INSERT INTO clinics (name, slug, email, phone, address_city, address_state)
VALUES
  ('Clínica Odonto Excellence', 'odonto-excellence', 'contato@excellence.com', '(11) 98765-4321', 'São Paulo', 'SP'),
  ('Sorrisos Infantis', 'sorrisos-infantis', 'atendimento@sorrisos.com', '(21) 99876-5432', 'Rio de Janeiro', 'RJ'),
  ('OrtoKids', 'ortokids', 'contato@ortokids.com', '(31) 97654-3210', 'Belo Horizonte', 'MG');
```

---

### Adicionar `clinic_id` em `users`

```sql
-- Adicionar coluna clinic_id
ALTER TABLE users ADD COLUMN clinic_id UUID;

-- Criar constraint de foreign key
ALTER TABLE users ADD CONSTRAINT fk_users_clinic
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT;

-- Criar índice
CREATE INDEX idx_users_clinic ON users(clinic_id) WHERE clinic_id IS NOT NULL;

-- Ortodontistas DEVEM ter uma clínica
ALTER TABLE users ADD CONSTRAINT check_orthodontist_clinic
  CHECK (role != 'orthodontist' OR clinic_id IS NOT NULL);

-- Pacientes DEVEM ter uma clínica
ALTER TABLE users ADD CONSTRAINT check_patient_clinic
  CHECK (role NOT IN ('patient', 'child-patient') OR clinic_id IS NOT NULL);
```

---

### Query: Ortodontista Vê APENAS Seus Pacientes

```sql
-- Pacientes da clínica do ortodontista logado
SELECT
  u.id,
  u.full_name,
  u.email,
  u.birth_date,
  u.created_at,
  c.name as clinic_name
FROM users u
INNER JOIN clinics c ON u.clinic_id = c.id
WHERE
  u.role IN ('patient', 'child-patient')
  AND u.clinic_id = (
    SELECT clinic_id
    FROM users
    WHERE id = $1 -- ID do ortodontista logado
  )
  AND u.is_active = true
ORDER BY u.created_at DESC;
```

---

### Query: Super-Admin Vê Estatísticas de Todas Clínicas

```sql
-- Estatísticas globais para super-admin
SELECT
  c.id,
  c.name,
  c.address_city,
  c.address_state,
  c.subscription_tier,
  COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'orthodontist') as total_orthodontists,
  COUNT(DISTINCT u.id) FILTER (WHERE u.role IN ('patient', 'child-patient')) as total_patients,
  COUNT(DISTINCT t.id) as total_treatments,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'active') as active_treatments,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') as completed_treatments
FROM clinics c
LEFT JOIN users u ON u.clinic_id = c.id
LEFT JOIN treatments t ON t.clinic_id = c.id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.address_city, c.address_state, c.subscription_tier
ORDER BY total_patients DESC;
```

---

### Row Level Security (RLS) Policies

```sql
-- Habilitar RLS na tabela users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Super-admin vê todos os usuários
CREATE POLICY super_admin_all_users ON users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = current_setting('app.current_user_id')::uuid
      AND u.role = 'super-admin'
    )
  );

-- Policy: Ortodontista vê apenas usuários da SUA clínica
CREATE POLICY orthodontist_own_clinic_users ON users
  FOR SELECT
  USING (
    role = 'orthodontist' AND id = current_setting('app.current_user_id')::uuid
    OR
    clinic_id = (
      SELECT clinic_id FROM users
      WHERE id = current_setting('app.current_user_id')::uuid
      AND role = 'orthodontist'
    )
  );

-- Policy: Paciente vê apenas SEU próprio perfil
CREATE POLICY patient_own_profile ON users
  FOR SELECT
  USING (
    id = current_setting('app.current_user_id')::uuid
  );
```

---

## 🔧 2. Exemplos de Services (TypeScript)

### `clinicService.ts`

```typescript
import type { Clinic, ClinicInput } from '@/types/clinic'

const STORAGE_KEY = 'clinics'

// ============================================
// HELPERS
// ============================================

function getAllClinics(): Clinic[] {
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

function saveClinics(clinics: Clinic[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clinics))
}

// ============================================
// CLINIC SERVICE
// ============================================

export class ClinicService {
  /**
   * Criar nova clínica (apenas super-admin)
   */
  static async createClinic(input: ClinicInput, adminUserId: string): Promise<Clinic> {
    const clinics = getAllClinics()

    // Validar slug único
    if (clinics.some((c) => c.slug === input.slug)) {
      throw new Error('Slug já está em uso')
    }

    const newClinic: Clinic = {
      id: `clinic-${Date.now()}`,
      ...input,
      isActive: true,
      subscriptionTier: 'basic',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    clinics.push(newClinic)
    saveClinics(clinics)

    return newClinic
  }

  /**
   * Listar todas as clínicas (apenas super-admin)
   */
  static async getAllClinics(): Promise<Clinic[]> {
    return getAllClinics()
  }

  /**
   * Obter clínica por ID
   */
  static async getClinicById(clinicId: string): Promise<Clinic | null> {
    const clinics = getAllClinics()
    return clinics.find((c) => c.id === clinicId) || null
  }

  /**
   * Atualizar clínica
   */
  static async updateClinic(
    clinicId: string,
    updates: Partial<ClinicInput>,
  ): Promise<Clinic> {
    const clinics = getAllClinics()
    const index = clinics.findIndex((c) => c.id === clinicId)

    if (index === -1) {
      throw new Error('Clínica não encontrada')
    }

    clinics[index] = {
      ...clinics[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    saveClinics(clinics)
    return clinics[index]
  }

  /**
   * Desativar clínica
   */
  static async deactivateClinic(clinicId: string): Promise<void> {
    await this.updateClinic(clinicId, { isActive: false })
  }

  /**
   * Obter estatísticas da clínica
   */
  static async getClinicStats(clinicId: string): Promise<{
    totalOrthodontists: number
    totalPatients: number
    activeTreatments: number
    completedTreatments: number
  }> {
    // TODO: Implementar com dados reais
    return {
      totalOrthodontists: 1,
      totalPatients: 0,
      activeTreatments: 0,
      completedTreatments: 0,
    }
  }
}
```

---

### `patientService.ts` (Modificado)

```typescript
import type { User } from '@/types/user'
import { getAllUsers } from '@/services/authService'

export class PatientService {
  /**
   * Obter pacientes da clínica do ortodontista
   * (APENAS pacientes da SUA clínica)
   */
  static async getPatientsByClinic(clinicId: string): Promise<User[]> {
    const allUsers = getAllUsers()

    return allUsers.filter(
      (user) =>
        (user.role === 'patient' || user.role === 'child-patient') &&
        user.clinic_id === clinicId &&
        user.isActive
    )
  }

  /**
   * Criar novo paciente (vinculado à clínica do ortodontista)
   */
  static async createPatient(
    patientData: any,
    orthodontistUserId: string,
  ): Promise<User> {
    const allUsers = getAllUsers()

    // Obter clínica do ortodontista
    const orthodontist = allUsers.find((u) => u.id === orthodontistUserId)
    if (!orthodontist || orthodontist.role !== 'orthodontist') {
      throw new Error('Usuário não é um ortodontista válido')
    }

    if (!orthodontist.clinic_id) {
      throw new Error('Ortodontista não está vinculado a uma clínica')
    }

    // Criar paciente com clinic_id do ortodontista
    const newPatient: User = {
      id: `user-${Date.now()}`,
      email: patientData.email,
      role: patientData.isMinor ? 'child-patient' : 'patient',
      fullName: patientData.fullName,
      cpf: patientData.cpf,
      birthDate: patientData.birthDate,
      phone: patientData.phone,
      clinic_id: orthodontist.clinic_id, // ✅ Vinculado à clínica
      isMinor: patientData.isMinor || false,
      isActive: true,
      isApproved: true,
      emailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // TODO: Salvar no localStorage/banco
    return newPatient
  }
}
```

---

## 🎨 3. Exemplos de UI/Components

### Página: `/admin/clinics`

```typescript
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Building2, Plus, Edit, Trash2 } from 'lucide-react'
import { ClinicService } from '@/services/clinicService'
import type { Clinic } from '@/types/clinic'
import { toast } from 'sonner'

const AdminClinics = () => {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadClinics()
  }, [])

  const loadClinics = async () => {
    try {
      const data = await ClinicService.getAllClinics()
      setClinics(data)
    } catch (error) {
      toast.error('Erro ao carregar clínicas')
    } finally {
      setLoading(false)
    }
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

        <Button size="lg" onClick={() => {/* TODO: Abrir modal */}}>
          <Plus className="mr-2 h-5 w-5" />
          Nova Clínica
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total de Clínicas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{clinics.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {clinics.filter((c) => c.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Inativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-400">
              {clinics.filter((c) => !c.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Este Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {/* TODO: Calcular clínicas criadas este mês */}
              +3
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Clínicas */}
      <div className="grid gap-4">
        {clinics.map((clinic) => (
          <Card key={clinic.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{clinic.name}</h3>
                    <Badge variant={clinic.isActive ? 'default' : 'secondary'}>
                      {clinic.isActive ? 'Ativa' : 'Inativa'}
                    </Badge>
                    <Badge variant="outline">{clinic.subscriptionTier}</Badge>
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>📧 {clinic.email}</p>
                    <p>📞 {clinic.phone}</p>
                    <p>📍 {clinic.addressCity}, {clinic.addressState}</p>
                    <p>🔗 /{clinic.slug}</p>
                  </div>

                  <div className="mt-4 flex gap-4 text-sm">
                    <div>
                      <span className="font-semibold">Ortodontistas:</span>{' '}
                      {/* TODO: Buscar dados reais */}
                      <span className="text-muted-foreground">1</span>
                    </div>
                    <div>
                      <span className="font-semibold">Pacientes:</span>{' '}
                      <span className="text-muted-foreground">24</span>
                    </div>
                    <div>
                      <span className="font-semibold">Tratamentos Ativos:</span>{' '}
                      <span className="text-muted-foreground">18</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="icon" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default AdminClinics
```

---

### Hook: `useClinicPatients`

```typescript
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { PatientService } from '@/services/patientService'
import type { User } from '@/types/user'

/**
 * Hook para ortodontista obter pacientes da SUA clínica
 */
export function useClinicPatients() {
  const { user } = useAuth()
  const [patients, setPatients] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || user.role !== 'orthodontist' || !user.clinic_id) {
      setLoading(false)
      return
    }

    loadPatients()
  }, [user])

  const loadPatients = async () => {
    if (!user?.clinic_id) return

    try {
      setLoading(true)
      const data = await PatientService.getPatientsByClinic(user.clinic_id)
      setPatients(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pacientes')
    } finally {
      setLoading(false)
    }
  }

  const refreshPatients = () => {
    loadPatients()
  }

  return {
    patients,
    loading,
    error,
    refreshPatients,
  }
}
```

---

## 🔒 4. Middleware de Autorização

### `authorizationMiddleware.ts`

```typescript
import type { User, UserRole } from '@/types/user'

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthorizationError'
  }
}

/**
 * Verificar se usuário tem permissão para acessar recurso
 */
export function checkPermission(
  currentUser: User,
  action: string,
  resource: any,
): void {
  // Super-admin pode tudo
  if (currentUser.role === 'super-admin') {
    return
  }

  // Ortodontista só pode acessar recursos da SUA clínica
  if (currentUser.role === 'orthodontist') {
    if (!resource.clinic_id) {
      throw new AuthorizationError('Recurso não pertence a nenhuma clínica')
    }

    if (resource.clinic_id !== currentUser.clinic_id) {
      throw new AuthorizationError(
        'Você não tem permissão para acessar recursos de outra clínica'
      )
    }
    return
  }

  // Paciente só pode acessar SEUS próprios recursos
  if (currentUser.role === 'patient' || currentUser.role === 'child-patient') {
    if (resource.patient_id !== currentUser.id) {
      throw new AuthorizationError(
        'Você não tem permissão para acessar recursos de outro paciente'
      )
    }
    return
  }

  throw new AuthorizationError('Permissão negada')
}

/**
 * Verificar se usuário pode gerenciar clínicas
 */
export function canManageClinics(user: User): boolean {
  return user.role === 'super-admin'
}

/**
 * Verificar se usuário pode aprovar ortodontistas
 */
export function canApproveOrthodontists(user: User): boolean {
  return user.role === 'super-admin'
}

/**
 * Verificar se usuário pode gerenciar pacientes
 */
export function canManagePatients(user: User): boolean {
  return user.role === 'orthodontist' || user.role === 'super-admin'
}

/**
 * Verificar se usuário pode criar tratamentos
 */
export function canCreateTreatments(user: User): boolean {
  return user.role === 'orthodontist'
}

/**
 * Verificar se usuário pode ver dados de um paciente específico
 */
export function canViewPatient(user: User, patient: User): boolean {
  // Super-admin pode ver (apenas estatísticas, não dados sensíveis)
  if (user.role === 'super-admin') {
    return true
  }

  // Ortodontista pode ver pacientes da sua clínica
  if (user.role === 'orthodontist') {
    return patient.clinic_id === user.clinic_id
  }

  // Paciente pode ver apenas a si mesmo
  if (user.role === 'patient' || user.role === 'child-patient') {
    return patient.id === user.id
  }

  // Responsável pode ver o filho
  if (user.role === 'guardian') {
    return patient.guardian_id === user.id
  }

  return false
}
```

---

## 📊 5. Exemplo de Dashboard Super-Admin

### `SuperAdminDashboard.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, TrendingUp, DollarSign } from 'lucide-react'

const SuperAdminDashboard = () => {
  // TODO: Buscar dados reais
  const stats = {
    totalClinics: 47,
    totalOrthodontists: 132,
    totalPatients: 3847,
    monthlyGrowth: 12.5,
    activeSubscriptions: 45,
    revenue: 28450,
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-4xl font-bold">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">
          Visão geral da plataforma Kids Aligner
        </p>
      </div>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clínicas Ativas
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClinics}</div>
            <p className="text-xs text-muted-foreground">
              +3 novas este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ortodontistas
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrthodontists}</div>
            <p className="text-xs text-muted-foreground">
              +8 aprovados este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Pacientes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +{stats.monthlyGrowth}% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Receita Mensal
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.revenue.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.activeSubscriptions} assinaturas ativas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e Tabelas */}
      {/* TODO: Adicionar gráficos de uso, distribuição geográfica, etc. */}
    </div>
  )
}

export default SuperAdminDashboard
```

---

## ✅ Resumo dos Exemplos

1. **SQL**: Estrutura de dados com RLS policies
2. **Services**: Lógica de negócio com filtros por clínica
3. **UI**: Páginas específicas para cada role
4. **Hooks**: Facilitadores para buscar dados filtrados
5. **Middleware**: Verificação de permissões
6. **Dashboard**: Interface administrativa separada

---

**Próximo Passo**: Iniciar implementação seguindo roadmap do documento principal.
