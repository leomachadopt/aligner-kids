# 🔄 Comparação de Funcionalidades por Role

## 📊 Matriz de Permissões

| Funcionalidade | Super-Admin | Ortodontista | Paciente | Responsável |
|----------------|:-----------:|:------------:|:--------:|:-----------:|
| **CLÍNICAS** |
| Criar clínicas | ✅ | ❌ | ❌ | ❌ |
| Editar clínicas | ✅ | ❌ | ❌ | ❌ |
| Ver todas as clínicas | ✅ | ❌ | ❌ | ❌ |
| Ver minha clínica | ✅ | ✅ | ❌ | ❌ |
| **ORTODONTISTAS** |
| Aprovar ortodontistas | ✅ | ❌ | ❌ | ❌ |
| Listar todos ortodontistas | ✅ | ❌ | ❌ | ❌ |
| Ver meu perfil | ✅ | ✅ | ❌ | ❌ |
| **PACIENTES** |
| Ver todos pacientes (global) | ✅ (apenas estatísticas) | ❌ | ❌ | ❌ |
| Ver pacientes da minha clínica | ❌ | ✅ | ❌ | ❌ |
| Criar pacientes | ❌ | ✅ | ❌ | ❌ |
| Editar pacientes | ❌ | ✅ (apenas seus) | ❌ | ❌ |
| Ver meu próprio perfil | N/A | N/A | ✅ | ✅ |
| **TRATAMENTOS** |
| Ver todos tratamentos (global) | ✅ (apenas estatísticas) | ❌ | ❌ | ❌ |
| Criar tratamentos | ❌ | ✅ | ❌ | ❌ |
| Editar tratamentos | ❌ | ✅ (apenas seus) | ❌ | ❌ |
| Ver meu tratamento | N/A | N/A | ✅ | ✅ |
| **ALINHADORES** |
| Gerenciar alinhadores | ❌ | ✅ (apenas seus pacientes) | ❌ | ❌ |
| Ver meus alinhadores | N/A | N/A | ✅ | ✅ |
| **HISTÓRIAS (IA)** |
| Configurar prompts globais | ✅ | ❌ | ❌ | ❌ |
| Ver histórias dos pacientes | ❌ | ✅ (apenas seus) | ❌ | ❌ |
| Ler minhas histórias | N/A | N/A | ✅ | ❌ |
| **GAMIFICAÇÃO** |
| Configurar sistema global | ✅ | ❌ | ❌ | ❌ |
| Configurar para minha clínica | ❌ | ✅ | ❌ | ❌ |
| Ver meus pontos/conquistas | N/A | N/A | ✅ | ✅ |
| **CONTEÚDO EDUCATIVO** |
| Criar templates globais | ✅ | ❌ | ❌ | ❌ |
| Personalizar para clínica | ❌ | ✅ | ❌ | ❌ |
| Ver conteúdo educativo | N/A | N/A | ✅ | ✅ |
| **FOTOS** |
| Ver fotos de todos pacientes | ❌ (LGPD) | ❌ | ❌ | ❌ |
| Ver fotos dos meus pacientes | ❌ | ✅ (apenas seus) | ❌ | ❌ |
| Upload de fotos | N/A | N/A | ✅ | ✅ |
| **CHAT** |
| Chat com todos | ❌ | ❌ | ❌ | ❌ |
| Chat com meus pacientes | ❌ | ✅ | ❌ | ❌ |
| Chat com meu ortodontista | N/A | N/A | ✅ | ✅ |
| **RELATÓRIOS** |
| Analytics globais | ✅ | ❌ | ❌ | ❌ |
| Analytics da minha clínica | ❌ | ✅ | ❌ | ❌ |
| Relatório do meu tratamento | N/A | N/A | ✅ | ✅ |
| **CONFIGURAÇÕES** |
| Configurações do sistema | ✅ | ❌ | ❌ | ❌ |
| Configurações da clínica | ❌ | ✅ | ❌ | ❌ |
| Minhas configurações | N/A | ✅ | ✅ | ✅ |

---

## 🎯 Resumo Executivo

### 🔴 SUPER-ADMIN
**Papel**: Administrador da plataforma
**Foco**: Gestão de clínicas e configurações globais
**NÃO FAZ**: Não gerencia pacientes individuais

**Menu Principal**:
```
📊 Dashboard Administrativo
🏥 Gerenciar Clínicas
👨‍⚕️ Aprovar Ortodontistas
⚙️ Configurar IA (Prompts)
📈 Analytics Globais
🛡️ Auditoria
💬 Suporte
```

---

### 🔵 ORTODONTISTA (Dono de Clínica)
**Papel**: Gestor da clínica e seus pacientes
**Foco**: Tratamentos, pacientes e gamificação da SUA clínica
**NÃO FAZ**: Não vê outras clínicas ou configura sistema global

**Menu Principal**:
```
🏠 Dashboard Clínico
👥 Meus Pacientes
💬 Chat
📊 Relatórios
🎮 Gamificação
📚 Conteúdo Educativo
⚙️ Configurações da Clínica
```

---

### 🟢 PACIENTE
**Papel**: Usuário do tratamento
**Foco**: Acompanhar próprio tratamento
**NÃO FAZ**: Não vê outros pacientes ou configura nada

**Menu Principal**:
```
🏠 Dashboard
😁 Meu Tratamento
📸 Fotos
💬 Chat
📚 Educação
🎮 Gamificação
```

---

### 🟡 RESPONSÁVEL
**Papel**: Acompanhante do paciente menor
**Foco**: Monitorar tratamento do filho
**NÃO FAZ**: Não modifica tratamento

**Menu Principal**:
```
🏠 Dashboard
📊 Relatórios
💬 Chat
```

---

## 📦 Dados que Cada Role Vê

### Super-Admin
```json
{
  "clinics": "TODAS as clínicas",
  "orthodontists": "TODOS os ortodontistas",
  "patients": "ESTATÍSTICAS agregadas (sem dados individuais)",
  "treatments": "ESTATÍSTICAS agregadas (sem dados individuais)",
  "analytics": "Visão global de todas clínicas"
}
```

### Ortodontista
```json
{
  "clinic": "APENAS minha clínica",
  "patients": "APENAS meus pacientes (clinic_id = my_clinic_id)",
  "treatments": "APENAS tratamentos dos meus pacientes",
  "aligners": "APENAS alinhadores dos meus pacientes",
  "stories": "APENAS histórias dos meus pacientes",
  "photos": "APENAS fotos dos meus pacientes",
  "analytics": "Dados APENAS da minha clínica"
}
```

### Paciente
```json
{
  "my_profile": "Meus dados pessoais",
  "my_treatment": "Meu tratamento",
  "my_aligners": "Meus alinhadores",
  "my_stories": "Minhas histórias",
  "my_photos": "Minhas fotos",
  "my_points": "Meus pontos e conquistas"
}
```

### Responsável
```json
{
  "my_profile": "Meus dados",
  "child_treatment": "Tratamento do filho",
  "child_reports": "Relatórios do filho"
}
```

---

## 🔐 Regras de Segurança (RLS)

### Nível 1: Super-Admin
```sql
-- Super-admin vê TUDO
WHERE true
```

### Nível 2: Ortodontista
```sql
-- Ortodontista vê apenas SUA clínica
WHERE clinic_id = (
  SELECT clinic_id FROM users WHERE id = current_user_id()
)
```

### Nível 3: Paciente
```sql
-- Paciente vê apenas SEUS dados
WHERE patient_id = current_user_id()
```

---

## 🚨 Erros da Implementação Atual

### ❌ Problema 1: Super-Admin com Acesso Errado
**Atual**:
```typescript
// Super-admin pode ver "Gerenciar Pacientes"
const superAdminMenu = [
  { href: '/patient-management', label: 'Gerenciar Pacientes', icon: Users },
]
```

**Correto**:
```typescript
// Super-admin gerencia CLÍNICAS, não pacientes
const superAdminMenu = [
  { href: '/admin/clinics', label: 'Gerenciar Clínicas', icon: Building2 },
  { href: '/admin/orthodontists', label: 'Aprovar Ortodontistas', icon: Users },
]
```

---

### ❌ Problema 2: Dados Sem Filtro de Clínica
**Atual**:
```typescript
// PatientManagement.tsx - Todos ortodontistas veem mesmos pacientes (mock)
const mockPatients = [
  { id: 'patient-1', name: 'João Silva', email: 'joao@example.com' },
  { id: 'patient-2', name: 'Maria Santos', email: 'maria@example.com' },
  { id: 'patient-3', name: 'Pedro Costa', email: 'pedro@example.com' },
]
```

**Correto**:
```typescript
// Apenas pacientes da clínica do ortodontista logado
const myPatients = await patientService.getPatientsByClinic(currentUser.clinic_id)
```

---

### ❌ Problema 3: Sem Hierarquia de Dados
**Atual**:
```sql
-- Tabela users NÃO tem clinic_id
CREATE TABLE users (
  id UUID,
  role VARCHAR(50),
  -- SEM clinic_id ❌
)
```

**Correto**:
```sql
-- Tabela users COM clinic_id
CREATE TABLE users (
  id UUID,
  role VARCHAR(50),
  clinic_id UUID REFERENCES clinics(id), -- ✅
)
```

---

## ✅ Solução: Hierarquia Clara

```
                    SISTEMA KIDS ALIGNER
                            │
                            │
                    ┌───────▼────────┐
                    │  SUPER-ADMIN   │ (Leonardo - leomachadopt@gmail.com)
                    │                │
                    │ Gerencia:      │
                    │ • Clínicas     │
                    │ • Ortodontistas│
                    │ • IA/Prompts   │
                    └───────┬────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
    ┌─────▼──────┐   ┌──────▼──────┐   ┌─────▼──────┐
    │  CLÍNICA A │   │  CLÍNICA B  │   │  CLÍNICA C │
    │            │   │             │   │            │
    │ Dr. Silva  │   │ Dra. Santos │   │ Dr. Costa  │
    └─────┬──────┘   └──────┬──────┘   └─────┬──────┘
          │                 │                 │
    ┌─────┼──────┐    ┌─────┼──────┐    ┌─────┼──────┐
    │     │      │    │     │      │    │     │      │
   P1    P2    P3   P4    P5    P6   P7    P8    P9
```

**P1-P3** = Pacientes da Clínica A (só Dr. Silva vê)
**P4-P6** = Pacientes da Clínica B (só Dra. Santos vê)
**P7-P9** = Pacientes da Clínica C (só Dr. Costa vê)

---

**Conclusão**: Sistema atual não tem separação de clínicas. Precisamos implementar multi-tenancy completo.

**Próximo Passo**: Aprovar arquitetura e iniciar Fase 1 (estrutura de dados).
