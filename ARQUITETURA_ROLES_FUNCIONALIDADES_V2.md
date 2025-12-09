# 🏗️ Arquitetura de Roles e Funcionalidades - Kids Aligner (v2)

## 🎯 Mudança Importante

**❌ REMOVIDO**: Role `guardian` (responsável)
**✅ NOVO MODELO**: Pais e crianças usam a MESMA conta

### Razão
- Criança e pais acessam o MESMO aplicativo
- Pais fazem login com a conta da criança
- Diferença está apenas na INTERFACE (gamificada vs normal)

---

## 📊 Roles do Sistema

### Roles Simplificados

| Role | Nome Técnico | Descrição |
|------|-------------|-----------|
| **Super Administrador** | `super-admin` | Gerencia o sistema, clínicas e ortodontistas |
| **Ortodontista/Dono de Clínica** | `orthodontist` | Gerencia seus próprios pacientes e tratamentos |
| **Paciente Adulto** | `patient` | Visualiza seu próprio tratamento (interface padrão) |
| **Paciente Criança** | `child-patient` | Visualiza seu próprio tratamento (interface gamificada) |

### 🎯 Hierarquia Simplificada

```
┌─────────────────────────────────────────────────────────────┐
│                      SUPER-ADMIN                            │
│  • Gerencia clínicas e ortodontistas                       │
│  • Configurações globais do sistema                        │
│  • Analytics agregados de todas as clínicas               │
│  • Gerenciamento de prompts de IA                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
           ┌────────────────┴─────────────────┐
           │                                  │
┌──────────▼──────────────────┐  ┌───────────▼─────────────────┐
│   ORTHODONTIST (Clínica A)  │  │   ORTHODONTIST (Clínica B)  │
│  • Gerencia SEUS pacientes │  │  • Gerencia SEUS pacientes  │
│  • Cria tratamentos         │  │  • Cria tratamentos         │
│  • Define alinhadores       │  │  • Define alinhadores       │
│  • Configura gamificação    │  │  • Configura gamificação    │
└─────────────┬───────────────┘  └──────────────┬──────────────┘
              │                                  │
    ┌─────────┼──────────┐              ┌───────┼────────┐
    │         │          │              │       │        │
┌───▼───┐ ┌──▼───┐ ┌────▼────┐    ┌────▼───┐ ┌▼─────┐
│Patient│ │Child │ │Patient  │    │Patient │ │Child │
│ Adulto│ │      │ │ Adulto  │    │ Adulto │ │      │
└───────┘ └──────┘ └─────────┘    └────────┘ └──────┘
           ↑                                    ↑
           │                                    │
     Pais fazem login                     Pais fazem login
     com mesma conta                      com mesma conta
```

---

## 🔐 Funcionalidades por Role

### 1️⃣ SUPER-ADMIN (Sem mudanças)

✅ Gerenciar Clínicas
✅ Gerenciar Ortodontistas
✅ Configurações Globais (Prompts de IA)
✅ Analytics Globais
✅ Auditoria

❌ NÃO gerencia pacientes individuais
❌ NÃO vê dados sensíveis de pacientes

**Menu**:
```typescript
const superAdminMenu = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/admin/clinics', label: 'Gerenciar Clínicas', icon: Building2 },
  { href: '/admin/orthodontists', label: 'Gerenciar Ortodontistas', icon: Users },
  { href: '/admin/prompts', label: 'Configurar IA', icon: Settings },
  { href: '/admin/analytics', label: 'Analytics Globais', icon: BarChart2 },
]
```

---

### 2️⃣ ORTHODONTIST (Sem mudanças)

✅ Gerenciar SEUS Pacientes
✅ Criar Tratamentos
✅ Gerenciar Alinhadores
✅ Configurar Gamificação
✅ Personalizar Conteúdo
✅ Chat com Pacientes
✅ Relatórios da Clínica

❌ Ver pacientes de OUTRAS clínicas

**Menu**:
```typescript
const orthodontistMenu = [
  { href: '/dashboard', label: 'Dashboard Clínico', icon: Home },
  { href: '/patients', label: 'Meus Pacientes', icon: Users },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/reports', label: 'Relatórios', icon: BarChart2 },
  { href: '/clinic/gamification', label: 'Gamificação', icon: Award },
  { href: '/clinic/content', label: 'Conteúdo Educativo', icon: BookOpen },
]
```

---

### 3️⃣ PATIENT (Interface Padrão) ✨ ATUALIZADO

#### Modelo de Acesso
- **Paciente adulto** faz login e usa a aplicação normalmente
- Interface limpa e profissional

#### Funcionalidades
✅ Ver Meu Tratamento
✅ Ler Histórias
✅ Gamificação
✅ Educação
✅ Upload de Fotos
✅ Chat com Dentista

**Menu**:
```typescript
const patientMenu = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/my-treatment', label: 'Meu Tratamento', icon: Smile },
  { href: '/photos', label: 'Fotos', icon: Camera },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/education', label: 'Educação', icon: BookOpen },
  { href: '/gamification', label: 'Gamificação', icon: Award },
]
```

---

### 4️⃣ CHILD-PATIENT (Interface Gamificada) ✨ ATUALIZADO

#### Modelo de Acesso
- **Pais fazem login** com a conta da criança
- **Criança usa** a mesma conta com interface gamificada
- Sistema detecta `role = 'child-patient'` e aplica tema infantil

#### Diferenças na Interface
- **Cores vibrantes** e elementos lúdicos
- **Linguagem simplificada** ("Minha Base" ao invés de "Dashboard")
- **Animações** e feedbacks visuais
- **Mesmas funcionalidades**, apenas apresentação diferente

**Menu** (mesmas rotas, labels diferentes):
```typescript
const childPatientMenu = [
  { href: '/dashboard', label: 'Minha Base', icon: Home },
  { href: '/my-treatment', label: 'Minha Jornada', icon: Smile },
  { href: '/photos', label: 'Fotos Mágicas', icon: Camera },
  { href: '/chat', label: 'Falar com Doutor(a)', icon: MessageSquare },
  { href: '/education', label: 'Escola de Heróis', icon: BookOpen },
  { href: '/gamification', label: 'Aventuras', icon: Award },
]
```

#### Como Funciona na Prática

**Cenário 1: Pais acessam**
```
1. Pais abrem o app no celular
2. Fazem login: maria.silva@example.com / senha123
3. Sistema detecta: role = 'child-patient'
4. Mostra interface gamificada (pais veem progresso do filho)
```

**Cenário 2: Criança acessa**
```
1. Criança abre o app no tablet
2. Login já está salvo (maria.silva@example.com)
3. Sistema detecta: role = 'child-patient'
4. Mostra interface gamificada (criança interage com conteúdo lúdico)
```

---

## ❌ Role GUARDIAN Removido

### O que MUDOU

**Antes** (❌ Modelo Antigo):
```typescript
type UserRole = 'patient' | 'child-patient' | 'guardian' | 'orthodontist' | 'super-admin'

// Responsável tinha conta separada
const guardian = {
  id: 'guardian-1',
  email: 'pai@example.com',
  role: 'guardian',
  // Vinculado ao filho
  childId: 'patient-1'
}

// Criança tinha conta separada
const child = {
  id: 'patient-1',
  email: 'filho@example.com',
  role: 'child-patient',
  guardianId: 'guardian-1'
}
```

**Agora** (✅ Modelo Novo):
```typescript
type UserRole = 'patient' | 'child-patient' | 'orthodontist' | 'super-admin'

// UMA única conta (pais e criança usam a mesma)
const childAccount = {
  id: 'patient-1',
  email: 'maria.silva@example.com', // Email dos pais
  role: 'child-patient',
  fullName: 'Maria Silva', // Nome da criança
  guardianName: 'João Silva', // Nome do pai/mãe (campo informativo)
  guardianPhone: '(11) 98765-4321', // Contato dos pais
  // Sem guardian_id - não precisa mais
}
```

---

## 🗄️ Estrutura de Dados Atualizada

### Tabela `users` (Modificada)

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Credenciais (email dos PAIS se for criança)
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,

  -- Role (SEM 'guardian')
  role VARCHAR(50) NOT NULL CHECK (role IN ('child-patient', 'patient', 'orthodontist', 'super-admin')),

  -- Informações pessoais (DA CRIANÇA)
  full_name VARCHAR(255) NOT NULL, -- Nome da criança
  cpf VARCHAR(14) UNIQUE,
  birth_date DATE,
  phone VARCHAR(20), -- Telefone dos pais

  -- Informações do responsável (apenas informativo)
  guardian_name VARCHAR(255), -- Nome do pai/mãe
  guardian_phone VARCHAR(20), -- Telefone alternativo
  guardian_cpf VARCHAR(14), -- CPF do responsável

  -- Ortodontista
  cro VARCHAR(20) UNIQUE,
  clinic_name VARCHAR(255),

  -- Vínculo com clínica
  clinic_id UUID,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT fk_users_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT,
  CONSTRAINT check_orthodontist_cro CHECK (role != 'orthodontist' OR cro IS NOT NULL),
  CONSTRAINT check_patient_clinic CHECK (role NOT IN ('patient', 'child-patient') OR clinic_id IS NOT NULL)
);
```

**Mudanças**:
- ❌ Removido: `guardian_id UUID`
- ❌ Removido: `is_minor BOOLEAN`
- ❌ Removido: constraint `check_child_guardian`
- ✅ Mantido: `guardian_name`, `guardian_phone`, `guardian_cpf` (apenas informativo)

---

## 📱 Fluxo de Registro

### Registro de Criança (Atualizado)

```typescript
// Formulário de registro - Pais preenchem
const registerChildForm = {
  // DADOS DA CRIANÇA
  fullName: 'Maria Silva', // Nome da criança
  birthDate: '2015-03-20', // Data de nascimento da criança
  cpf: '123.456.789-00', // CPF da criança (opcional)

  // CREDENCIAIS (dos pais)
  email: 'joao.silva@example.com', // Email dos pais
  password: 'senha123', // Senha (pais criam)

  // DADOS DOS PAIS (informativo)
  guardianName: 'João Silva', // Nome do pai/mãe
  guardianCpf: '987.654.321-00', // CPF do responsável
  guardianPhone: '(11) 98765-4321', // Telefone dos pais

  // TRATAMENTO (código fornecido pelo dentista)
  treatmentCode: 'ORTHO-2025-001', // Código do tratamento
}

// Sistema cria conta com role = 'child-patient'
const createdUser = {
  id: 'user-123',
  email: 'joao.silva@example.com', // Email dos pais
  role: 'child-patient', // Interface gamificada
  fullName: 'Maria Silva', // Nome da criança
  birthDate: '2015-03-20',
  guardianName: 'João Silva',
  guardianPhone: '(11) 98765-4321',
  clinic_id: 'clinic-abc', // Vinculado à clínica do tratamento
}
```

---

## 🎨 Diferenças na Interface

### PatientDashboard.tsx (Detecta role automaticamente)

```typescript
import { useAuth } from '@/context/AuthContext'
import { useUserRole } from '@/context/UserRoleContext'

const PatientDashboard = () => {
  const { user } = useAuth()
  const { isChild } = useUserRole() // Detecta se é child-patient

  return (
    <div className={cn('space-y-6', isChild && 'font-display')}>
      <h1 className={cn(
        'text-3xl font-bold',
        isChild && 'text-4xl font-extrabold text-primary'
      )}>
        {isChild ? '🏠 Minha Base de Heróis' : '📊 Dashboard'}
      </h1>

      {/* Resto do conteúdo com estilos condicionais */}
      <Card className={cn(
        'border-2',
        isChild && 'border-primary shadow-lg hover:shadow-xl transition-all'
      )}>
        {/* ... */}
      </Card>
    </div>
  )
}
```

---

## 📊 Matriz de Permissões Atualizada

| Funcionalidade | Super-Admin | Ortodontista | Patient | Child-Patient |
|----------------|:-----------:|:------------:|:-------:|:-------------:|
| **CLÍNICAS** |
| Criar clínicas | ✅ | ❌ | ❌ | ❌ |
| Ver minha clínica | ✅ | ✅ | ❌ | ❌ |
| **PACIENTES** |
| Ver pacientes da minha clínica | ❌ | ✅ | ❌ | ❌ |
| Criar pacientes | ❌ | ✅ | ❌ | ❌ |
| Ver meu perfil | N/A | ✅ | ✅ | ✅ |
| **TRATAMENTOS** |
| Criar tratamentos | ❌ | ✅ | ❌ | ❌ |
| Ver meu tratamento | N/A | N/A | ✅ | ✅ |
| **HISTÓRIAS** |
| Configurar prompts | ✅ | ❌ | ❌ | ❌ |
| Ler minhas histórias | N/A | N/A | ✅ | ✅ |
| **GAMIFICAÇÃO** |
| Configurar sistema | ✅ | ❌ | ❌ | ❌ |
| Configurar clínica | ❌ | ✅ | ❌ | ❌ |
| Ver meus pontos | N/A | N/A | ✅ | ✅ |
| **FOTOS** |
| Upload de fotos | N/A | N/A | ✅ | ✅ |
| Ver fotos dos meus pacientes | ❌ | ✅ | ❌ | ❌ |
| **CHAT** |
| Chat com meus pacientes | ❌ | ✅ | ❌ | ❌ |
| Chat com meu ortodontista | N/A | N/A | ✅ | ✅ |

---

## 🔄 Mudanças no Código Existente

### 1. Atualizar `user.ts` types

```typescript
// ANTES (❌)
export type UserRole = 'child-patient' | 'patient' | 'guardian' | 'orthodontist' | 'super-admin'

// DEPOIS (✅)
export type UserRole = 'child-patient' | 'patient' | 'orthodontist' | 'super-admin'

export interface User {
  id: string
  email: string // Email dos PAIS se for child-patient
  role: UserRole
  fullName: string // Nome da CRIANÇA se for child-patient

  // Informações do responsável (apenas informativo)
  guardianName?: string
  guardianCpf?: string
  guardianPhone?: string

  // Removidos:
  // guardianId?: string ❌
  // isMinor: boolean ❌
}
```

### 2. Atualizar `AppSidebar.tsx`

```typescript
// ANTES (❌)
const menuItems: Record<UserRole, typeof patientMenu> = {
  patient: patientMenu,
  'child-patient': childPatientMenu,
  guardian: guardianMenu, // ❌ REMOVER
  orthodontist: orthodontistMenu,
  'super-admin': superAdminMenu,
}

// DEPOIS (✅)
const menuItems: Record<UserRole, typeof patientMenu> = {
  patient: patientMenu,
  'child-patient': childPatientMenu,
  // guardian removido ✅
  orthodontist: orthodontistMenu,
  'super-admin': superAdminMenu,
}
```

### 3. Atualizar `Register.tsx`

```typescript
// Simplificar - não precisa mais de opção "Responsável"
const profileTypes = [
  { value: 'paciente', label: 'Paciente (Adulto)' },
  { value: 'crianca', label: 'Criança (Pais cadastram)' },
  { value: 'ortodontista', label: 'Ortodontista' },
  // 'responsavel' removido ❌
]

// Se selecionar "crianca", mostrar campos:
// - Nome da criança
// - Data de nascimento da criança
// - Email dos pais (login)
// - Senha (pais criam)
// - Nome do responsável
// - CPF do responsável
// - Telefone dos pais
```

---

## ✅ Vantagens do Modelo Simplificado

1. **Menos complexidade**
   - Apenas 4 roles ao invés de 5
   - Sem relacionamento `guardian_id` ↔ `patient_id`
   - Uma conta única por criança

2. **Melhor UX**
   - Pais não precisam criar conta separada
   - Login único para família
   - Mesma conta funciona para pais e criança

3. **Mais simples de implementar**
   - Menos lógica de autorização
   - Sem queries JOIN entre guardian e child
   - Diferença é apenas na apresentação (CSS/UI)

4. **LGPD compliant**
   - Pais têm controle total da conta
   - Dados da criança ficam com os pais
   - Email de cadastro é dos pais

---

## 🚀 Roadmap Atualizado

### Fase 1: Estrutura de Dados (2-3 dias)
- [x] Criar tabela `clinics`
- [x] Adicionar `clinic_id` em `users`
- [x] **Remover** `guardian_id` de `users`
- [x] **Remover** `is_minor` de `users`
- [x] **Remover** constraint `check_child_guardian`
- [x] Criar tabela `treatments`
- [x] Implementar RLS policies

### Fase 2: Backend/Services (2-3 dias)
- [x] Criar `clinicService.ts`
- [x] Modificar `authService.ts` (remover lógica de guardian)
- [x] Criar `treatmentService.ts`
- [x] Atualizar `alignerService.ts`

### Fase 3: Frontend - Super Admin (3-5 dias)
- [x] Criar página `/admin/clinics`
- [x] Criar página `/admin/orthodontists`
- [x] Redesenhar Dashboard
- [x] Atualizar menu

### Fase 4: Frontend - Ortodontista (3-5 dias)
- [x] Modificar `/patients` (filtrar por clínica)
- [x] Criar `/clinic/settings`
- [x] Criar `/clinic/gamification`
- [x] Redesenhar Dashboard

### Fase 5: Ajustes (2-3 dias)
- [x] **Remover** componentes de guardian
- [x] **Remover** guardianMenu do AppSidebar
- [x] Atualizar Register.tsx (remover opção responsável)
- [x] Testes

**Total Estimado**: 12-19 dias (REDUZIDO de 19-29 dias)

---

## 📝 Resumo Executivo

### ✅ Simplificações Aplicadas

1. **Role guardian REMOVIDO**
   - Pais e criança usam mesma conta
   - Email de cadastro é dos pais

2. **Interface adaptativa**
   - `patient` → Interface padrão
   - `child-patient` → Interface gamificada
   - Mesmas funcionalidades, apresentação diferente

3. **Menos código**
   - Sem lógica de relacionamento guardian ↔ child
   - Sem queries complexas de permissão
   - Menos validações

### 🎯 Foco Principal

- **Super-admin**: Gerencia clínicas e ortodontistas
- **Ortodontista**: Gerencia seus pacientes
- **Paciente/Criança**: Usa mesma conta, interface diferente

---

**Próximo Passo**: Implementar esta arquitetura simplificada! 🚀
