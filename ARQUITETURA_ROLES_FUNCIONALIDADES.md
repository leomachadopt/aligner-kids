# 🏗️ Arquitetura de Roles e Funcionalidades - Kids Aligner

## 📊 Análise da Situação Atual

### ❌ Problemas Identificados

1. **Confusão de Responsabilidades**
   - Super-admin tem acesso a "Gerenciar Pacientes" - mas não deveria gerenciar pacientes diretamente
   - Não existe separação entre "clínica/dono de clínica" e "dentista"
   - Dentistas atualmente podem ver TODOS os pacientes (mock data não filtra por clínica)
   - Não há conceito de multi-tenancy (clínicas independentes)

2. **Estrutura de Dados Incompleta**
   - Tabela `users` não tem campo `clinic_id` (dentistas não estão vinculados a clínicas)
   - Pacientes não estão vinculados a dentistas/clínicas
   - Não existe tabela `clinics` no schema
   - Tratamentos não têm referência a quem os criou/gerencia

3. **Hierarquia Confusa**
   - Super-admin vê mesma interface que dentista (PatientManagement)
   - Não há diferenciação entre:
     - Gestão de CLÍNICAS (super-admin)
     - Gestão de PACIENTES (dentista)
     - Acompanhamento de TRATAMENTO (paciente)

---

## ✅ Arquitetura Proposta

### 🎯 Hierarquia de Roles

```
┌─────────────────────────────────────────────────────────────┐
│                      SUPER-ADMIN                            │
│  • Gerencia clínicas e ortodontistas                       │
│  • Configurações globais do sistema                        │
│  • Analytics agregados de todas as clínicas               │
│  • Gerenciamento de prompts de IA                         │
│  • NÃO gerencia pacientes individuais                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
           ┌────────────────┴─────────────────┐
           │                                  │
┌──────────▼──────────────────┐  ┌───────────▼─────────────────┐
│   CLINIC OWNER/ORTHODONTIST │  │   CLINIC OWNER/ORTHODONTIST │
│   (Clínica A)               │  │   (Clínica B)               │
│  • Gerencia SEUS pacientes │  │  • Gerencia SEUS pacientes  │
│  • Cria tratamentos         │  │  • Cria tratamentos         │
│  • Define alinhadores       │  │  • Define alinhadores       │
│  • Configura gamificação    │  │  • Configura gamificação    │
│  • Relatórios da clínica    │  │  • Relatórios da clínica    │
└─────────────┬───────────────┘  └──────────────┬──────────────┘
              │                                  │
    ┌─────────┼──────────┐              ┌───────┼────────┐
    │         │          │              │       │        │
┌───▼───┐ ┌──▼───┐ ┌────▼────┐    ┌────▼───┐ ┌▼─────┐ │
│Patient│ │Patient│ │Patient  │    │Patient │ │Patient│ ...
│   1   │ │   2  │ │   3     │    │   X    │ │   Y   │
└───────┘ └──────┘ └─────────┘    └────────┘ └───────┘
```

### 📋 Roles Recomendados

| Role | Nome Técnico | Descrição |
|------|-------------|-----------|
| **Super Administrador** | `super-admin` | Gerencia o sistema, clínicas e ortodontistas |
| **Ortodontista/Dono de Clínica** | `orthodontist` | Gerencia seus próprios pacientes e tratamentos |
| **Paciente Adulto** | `patient` | Visualiza seu próprio tratamento |
| **Paciente Criança** | `child-patient` | Interface gamificada do seu tratamento |
| **Responsável** | `guardian` | Acompanha tratamento do filho |

---

## 🔐 Funcionalidades por Role

### 1️⃣ SUPER-ADMIN

#### ✅ O que PODE fazer:

| Funcionalidade | Descrição | Página/Rota |
|----------------|-----------|-------------|
| **Gerenciar Clínicas** | CRUD de clínicas (criar, editar, desativar) | `/admin/clinics` |
| **Gerenciar Ortodontistas** | Aprovar/rejeitar cadastros, vincular a clínicas | `/admin/orthodontists` |
| **Configurações Globais** | Prompts de IA, templates de histórias | `/admin/prompts` |
| **Analytics Globais** | Visão geral de uso do sistema (todas clínicas) | `/admin/analytics` |
| **Auditoria** | Logs de sistema, atividades suspeitas | `/admin/audit` |
| **Suporte** | Ver tickets de suporte de todas as clínicas | `/admin/support` |

#### ❌ O que NÃO PODE fazer:

- ❌ Gerenciar pacientes individuais (isso é responsabilidade do dentista)
- ❌ Criar/editar tratamentos de pacientes
- ❌ Ver fotos de pacientes (privacidade - LGPD)
- ❌ Chatear diretamente com pacientes

#### 📊 Dashboard Super-Admin

```
┌────────────────────────────────────────────────────────────┐
│  📊 Dashboard Administrativo                               │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  🏥 Clínicas Ativas: 47          👨‍⚕️ Ortodontistas: 132    │
│  👥 Total Pacientes: 3.847       📈 Crescimento: +12%     │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Clínicas por Região                                 │ │
│  │  [Gráfico de Barras]                                 │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Ortodontistas Pendentes de Aprovação              │ │
│  │  • Dr. João Silva - CRO 12345                        │ │
│  │  • Dra. Maria Santos - CRO 67890                     │ │
│  │    [Aprovar] [Rejeitar]                              │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Uso de IA (últimos 30 dias)                        │ │
│  │  • Histórias geradas: 1.234                          │ │
│  │  • Tokens usados: 2.5M                               │ │
│  │  • Custo estimado: $28.50                            │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

#### 🎯 Menu Super-Admin

```typescript
const superAdminMenu = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/admin/clinics', label: 'Gerenciar Clínicas', icon: Building2 },
  { href: '/admin/orthodontists', label: 'Gerenciar Ortodontistas', icon: Users },
  { href: '/admin/prompts', label: 'Configurar IA', icon: Settings },
  { href: '/admin/analytics', label: 'Analytics Globais', icon: BarChart2 },
  { href: '/admin/audit', label: 'Auditoria', icon: Shield },
  { href: '/admin/support', label: 'Suporte', icon: MessageSquare },
]
```

---

### 2️⃣ ORTHODONTIST (Dono de Clínica/Dentista)

#### ✅ O que PODE fazer:

| Funcionalidade | Descrição | Página/Rota |
|----------------|-----------|-------------|
| **Gerenciar SEUS Pacientes** | CRUD dos pacientes da SUA clínica | `/patients` |
| **Criar Tratamentos** | Definir plano de tratamento (alinhadores) | `/patients/:id/treatment` |
| **Gerenciar Alinhadores** | Marcar alinhadores como entregues/concluídos | `/patients/:id/aligners` |
| **Configurar Gamificação** | Definir pontos, prêmios, desafios para SEUS pacientes | `/clinic/gamification` |
| **Personalizar Conteúdo** | Textos educativos customizados | `/clinic/content` |
| **Chat com Pacientes** | Comunicação com SEUS pacientes | `/chat` |
| **Relatórios da Clínica** | Analytics dos SEUS pacientes | `/reports` |
| **Configurações da Clínica** | Nome, logo, horários, etc. | `/clinic/settings` |

#### ❌ O que NÃO PODE fazer:

- ❌ Ver pacientes de OUTRAS clínicas
- ❌ Modificar configurações globais do sistema
- ❌ Aprovar outros ortodontistas
- ❌ Acessar analytics de outras clínicas

#### 📊 Dashboard Ortodontista

```
┌────────────────────────────────────────────────────────────┐
│  🦷 Dashboard Clínico - Clínica Dr. José Silva            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  👥 Meus Pacientes: 34           ⚠️ Atrasados: 3          │
│  ✅ Tratamentos Ativos: 28       🎉 Concluídos: 6         │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Pacientes Atrasados                                 │ │
│  │  • João Silva - Alinhador 5 (3 dias atrasado)        │ │
│  │  • Maria Santos - Alinhador 12 (7 dias atrasado)     │ │
│  │    [Ver Detalhes] [Enviar Lembrete]                  │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Progresso Geral dos Pacientes                       │ │
│  │  [Gráfico de Barras - Distribuição de Progresso]     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Próximos Retornos Agendados                         │ │
│  │  • Pedro Costa - 15/12/2025 14:00                    │ │
│  │  • Ana Lima - 18/12/2025 10:30                       │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

#### 🎯 Menu Ortodontista

```typescript
const orthodontistMenu = [
  { href: '/dashboard', label: 'Dashboard Clínico', icon: Home },
  { href: '/patients', label: 'Meus Pacientes', icon: Users },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/reports', label: 'Relatórios', icon: BarChart2 },
  { href: '/clinic/gamification', label: 'Gamificação', icon: Award },
  { href: '/clinic/content', label: 'Conteúdo Educativo', icon: BookOpen },
  { href: '/clinic/settings', label: 'Configurações', icon: Settings },
]
```

---

### 3️⃣ PATIENT / CHILD-PATIENT

#### ✅ O que PODE fazer:

| Funcionalidade | Descrição | Página/Rota |
|----------------|-----------|-------------|
| **Ver Meu Tratamento** | Visualizar progresso, alinhadores | `/my-treatment` |
| **Ler Histórias** | Histórias personalizadas desbloqueadas | `/my-story` |
| **Gamificação** | Pontos, conquistas, desafios | `/gamification` |
| **Educação** | Conteúdo sobre saúde bucal | `/education` |
| **Fotos** | Upload de fotos do progresso | `/photos` |
| **Chat** | Falar com seu dentista | `/chat` |

#### ❌ O que NÃO PODE fazer:

- ❌ Ver dados de outros pacientes
- ❌ Modificar seu próprio tratamento
- ❌ Gerenciar alinhadores
- ❌ Acessar configurações administrativas

---

### 4️⃣ GUARDIAN (Responsável)

#### ✅ O que PODE fazer:

| Funcionalidade | Descrição | Página/Rota |
|----------------|-----------|-------------|
| **Acompanhar Filho** | Ver progresso do filho | `/dashboard` |
| **Relatórios** | Relatórios de adesão, progresso | `/reports` |
| **Chat** | Falar com dentista sobre filho | `/chat` |

---

## 🗄️ Estrutura de Dados Necessária

### Nova Tabela: `clinics`

```sql
CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Informações da Clínica
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL, -- URL amigável
  logo_url TEXT,

  -- Contato
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  website VARCHAR(255),

  -- Endereço
  address_street VARCHAR(255),
  address_number VARCHAR(20),
  address_complement VARCHAR(100),
  address_neighborhood VARCHAR(100),
  address_city VARCHAR(100),
  address_state VARCHAR(2),
  address_zip VARCHAR(10),

  -- Configurações
  primary_color VARCHAR(7) DEFAULT '#3B82F6', -- Cor primária da marca
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',

  -- Gamificação personalizada (JSON)
  gamification_config JSONB DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT true,
  subscription_tier VARCHAR(50) DEFAULT 'basic', -- basic, pro, enterprise
  subscription_expires_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Índices
  CONSTRAINT clinics_slug_unique UNIQUE (slug)
);

CREATE INDEX idx_clinics_active ON clinics(is_active);
CREATE INDEX idx_clinics_slug ON clinics(slug);
```

### Modificações na Tabela `users`

```sql
-- Adicionar campo clinic_id
ALTER TABLE users ADD COLUMN clinic_id UUID;
ALTER TABLE users ADD CONSTRAINT fk_users_clinic
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT;

-- Criar índice
CREATE INDEX idx_users_clinic ON users(clinic_id) WHERE clinic_id IS NOT NULL;

-- Constraint: Ortodontistas DEVEM ter uma clínica
ALTER TABLE users ADD CONSTRAINT check_orthodontist_clinic
  CHECK (role != 'orthodontist' OR clinic_id IS NOT NULL);

-- Constraint: Pacientes DEVEM ter uma clínica (ou NULL para super-admin)
ALTER TABLE users ADD CONSTRAINT check_patient_clinic
  CHECK (role NOT IN ('patient', 'child-patient') OR clinic_id IS NOT NULL);
```

### Modificações na Tabela `story_series`

```sql
-- Adicionar referência ao ortodontista que gerencia
ALTER TABLE story_series ADD COLUMN orthodontist_id UUID;
ALTER TABLE story_series ADD CONSTRAINT fk_series_orthodontist
  FOREIGN KEY (orthodontist_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_story_series_orthodontist ON story_series(orthodontist_id);
```

### Nova Tabela: `treatments` (Formalizar tratamentos)

```sql
CREATE TABLE IF NOT EXISTS treatments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relacionamentos
  patient_id UUID NOT NULL,
  orthodontist_id UUID NOT NULL,
  clinic_id UUID NOT NULL,

  -- Informações do Tratamento
  treatment_code VARCHAR(50) UNIQUE NOT NULL,
  total_aligners INTEGER NOT NULL,
  current_aligner INTEGER DEFAULT 1,

  -- Datas
  start_date DATE NOT NULL,
  estimated_end_date DATE NOT NULL,
  actual_end_date DATE,

  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('planned', 'active', 'paused', 'completed', 'cancelled')),

  -- Notas
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT fk_treatments_patient FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_treatments_orthodontist FOREIGN KEY (orthodontist_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_treatments_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT
);

CREATE INDEX idx_treatments_patient ON treatments(patient_id);
CREATE INDEX idx_treatments_orthodontist ON treatments(orthodontist_id);
CREATE INDEX idx_treatments_clinic ON treatments(clinic_id);
CREATE INDEX idx_treatments_status ON treatments(status);
```

---

## 🔒 Regras de Acesso (RLS - Row Level Security)

### PostgreSQL Policies

```sql
-- Super-admin pode ver TUDO
CREATE POLICY super_admin_all_clinics ON clinics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = current_user_id()
      AND users.role = 'super-admin'
    )
  );

-- Ortodontista só vê SUA clínica
CREATE POLICY orthodontist_own_clinic ON clinics
  FOR SELECT USING (
    id IN (
      SELECT clinic_id FROM users
      WHERE users.id = current_user_id()
      AND users.role = 'orthodontist'
    )
  );

-- Ortodontista só vê SEUS pacientes
CREATE POLICY orthodontist_own_patients ON users
  FOR SELECT USING (
    role IN ('patient', 'child-patient', 'guardian')
    AND clinic_id = (
      SELECT clinic_id FROM users
      WHERE id = current_user_id()
    )
  );

-- Paciente só vê SEU próprio perfil
CREATE POLICY patient_own_data ON users
  FOR SELECT USING (
    id = current_user_id()
  );
```

---

## 🚀 Roadmap de Implementação

### Fase 1: Estrutura de Dados (3-5 dias)
- [ ] Criar tabela `clinics`
- [ ] Adicionar `clinic_id` em `users`
- [ ] Criar tabela `treatments`
- [ ] Migrar dados existentes
- [ ] Implementar RLS policies
- [ ] Testar queries de acesso

### Fase 2: Backend/Services (3-5 dias)
- [ ] Criar `clinicService.ts`
- [ ] Modificar `authService.ts` para incluir `clinic_id`
- [ ] Criar `treatmentService.ts`
- [ ] Atualizar `alignerService.ts` com filtros de clínica
- [ ] Implementar middleware de autorização

### Fase 3: Frontend - Super Admin (5-7 dias)
- [ ] Criar página `/admin/clinics` (CRUD)
- [ ] Criar página `/admin/orthodontists` (aprovação)
- [ ] Redesenhar Dashboard super-admin
- [ ] Criar página de analytics globais
- [ ] Atualizar menu e rotas

### Fase 4: Frontend - Ortodontista (5-7 dias)
- [ ] Modificar `/patients` para filtrar por clínica
- [ ] Criar `/clinic/settings`
- [ ] Criar `/clinic/gamification`
- [ ] Criar `/clinic/content`
- [ ] Redesenhar Dashboard ortodontista
- [ ] Atualizar menu e rotas

### Fase 5: Ajustes e Testes (3-5 dias)
- [ ] Testes de permissões
- [ ] Testes de multi-tenancy
- [ ] Ajustes de UI/UX
- [ ] Documentação
- [ ] Deploy

**Total Estimado**: 19-29 dias de desenvolvimento

---

## 📊 Comparação: Antes vs Depois

| Aspecto | ❌ Antes | ✅ Depois |
|---------|---------|-----------|
| **Super-admin** | Gerencia pacientes individuais | Gerencia clínicas e ortodontistas |
| **Ortodontista** | Vê todos os pacientes (mock) | Vê apenas SEUS pacientes |
| **Multi-tenancy** | Não existe | Clínicas totalmente isoladas |
| **Dados** | Sem vínculo clínica-paciente | Hierarquia clara: clinic → orthodontist → patient |
| **Segurança** | Nenhuma separação | RLS policies + middleware |
| **Escalabilidade** | Limitada | Suporta N clínicas independentes |

---

## 🎯 Próximos Passos Recomendados

1. **Aprovação do Usuário**: Revisar e aprovar esta arquitetura
2. **Definir Prioridades**: Quais fases implementar primeiro
3. **Estimar Recursos**: Tempo disponível para desenvolvimento
4. **Começar Implementação**: Seguir roadmap proposto

---

## 📝 Notas Importantes

- Esta arquitetura segue padrões de **multi-tenancy** (SaaS)
- Respeita **LGPD** (pacientes de uma clínica não são visíveis para outra)
- Permite **escalabilidade** (adicionar novas clínicas facilmente)
- Mantém **separação de responsabilidades** clara
- Suporta diferentes **modelos de negócio** (clínica pequena vs grande rede)

---

**Criado em**: 2025-12-08
**Versão**: 1.0
**Status**: 🟡 Aguardando Aprovação
