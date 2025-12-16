# 🏗️ Plano de Implementação: Múltiplas Fases de Tratamento

## 📋 Resumo da Solução Escolhida

**Opção 2: Tabela `treatment_phases` separada**

### Especificações:
- ✅ Numeração de alinhadores **continua sequencial** entre fases
  - Fase 1: Alinhadores #1 a #20
  - Fase 2: Alinhadores #21 a #40
- ✅ Gamificação **unificada** (mesmo treatmentId para todas as fases)
- ✅ **Apenas uma fase** pode estar ativa por vez

---

## 🗄️ 1. Nova Estrutura do Banco de Dados

### 1.1. Tabela `treatments` (Container Geral)

**Antes:**
```typescript
treatments
├─ id
├─ patientId
├─ totalAligners (20)          ← Específico de uma fase
├─ currentAlignerNumber (3)    ← Específico de uma fase
├─ status ('active')           ← Específico de uma fase
├─ startDate
└─ expectedEndDate
```

**Depois:**
```typescript
treatments (Container do tratamento completo)
├─ id
├─ patientId
├─ name ("Tratamento Ortodôntico - João")
├─ overallStatus ('active' | 'completed' | 'paused' | 'cancelled')
├─ totalPhasesPlanned (2)      ← Total de fases previstas
├─ currentPhaseNumber (2)      ← Fase atual ativa
├─ totalAlignersOverall (40)   ← Soma de TODAS as fases
├─ currentAlignerOverall (23)  ← Alinhador atual considerando TODAS as fases
├─ startDate                   ← Data de início do tratamento geral
├─ expectedEndDate             ← Data esperada de fim geral
├─ notes
├─ createdAt
└─ updatedAt
```

### 1.2. Nova Tabela `treatment_phases` (Fases Individuais)

```typescript
treatment_phases
├─ id
├─ treatmentId                 ← FK para treatments (container)
├─ phaseNumber (1, 2, 3...)
├─ phaseName ("Primeira Fase - Alinhamento inicial")
├─ description ("Correção da mordida cruzada...")
│
├─ startAlignerNumber (1)      ← Alinhador inicial DESTA fase (1, 21, 41...)
├─ endAlignerNumber (20)       ← Alinhador final DESTA fase (20, 40, 60...)
├─ totalAligners (20)          ← Qtd de alinhadores nesta fase (20, 20, 20...)
├─ currentAlignerNumber (3)    ← Alinhador atual DENTRO desta fase (3 de 20)
│
├─ status ('pending' | 'active' | 'completed' | 'paused' | 'cancelled')
├─ startDate                   ← Data de início desta fase
├─ expectedEndDate             ← Data esperada de fim desta fase
├─ actualEndDate               ← Data real de fim (quando completada)
│
├─ notes
├─ createdAt
└─ updatedAt
```

**Exemplo prático:**

| id | treatmentId | phaseNumber | startAlignerNumber | endAlignerNumber | totalAligners | currentAlignerNumber | status |
|----|------------|-------------|-------------------|------------------|---------------|---------------------|---------|
| ph1 | tr1 | 1 | 1 | 20 | 20 | 20 | completed |
| ph2 | tr1 | 2 | 21 | 40 | 20 | 23 | active |
| ph3 | tr1 | 3 | 41 | 60 | 20 | 0 | pending |

**Cálculos automáticos:**
- `startAlignerNumber` da fase N = `endAlignerNumber` da fase N-1 + 1
- `endAlignerNumber` = `startAlignerNumber` + `totalAligners` - 1
- `currentAlignerNumber` = progresso dentro da fase (0 a totalAligners)

### 1.3. Tabela `aligners` (Atualizada)

**Antes:**
```typescript
aligners
├─ id
├─ patientId
├─ treatmentId                 ← Referência à fase específica
├─ alignerNumber (3)
└─ ...
```

**Depois:**
```typescript
aligners
├─ id
├─ patientId
├─ treatmentId                 ← FK para treatment (container) - para gamificação
├─ phaseId                     ← FK para treatment_phases (fase específica) - NOVO!
├─ alignerNumber (23)          ← Número GLOBAL do alinhador (continua sequencial)
├─ alignerNumberInPhase (3)    ← Número dentro da fase (3 de 20) - NOVO!
├─ startDate
├─ endDate
├─ actualEndDate
├─ status ('pending' | 'active' | 'completed')
├─ usageHours
├─ targetHoursPerDay
├─ notes
├─ createdAt
└─ updatedAt
```

### 1.4. Tabelas de Gamificação (Mantidas - Usam treatmentId)

**Não mudam - continuam usando treatmentId do container:**
- `stories.treatmentId` → treatmentId do container
- `story_chapters.treatmentId` → treatmentId do container
- `story_preferences.treatmentId` → treatmentId do container
- `patient_missions` → não tem treatmentId (por paciente)

---

## 🔄 2. Estratégia de Migração

### 2.1. Script de Migração de Dados

```typescript
// Migration: Convert existing treatments to new structure

async function migrateExistingTreatments() {
  // 1. Para cada treatment existente:
  const existingTreatments = await db.select().from(treatments)

  for (const oldTreatment of existingTreatments) {
    // 2. Manter o treatment como container
    await db.update(treatments)
      .set({
        overallStatus: oldTreatment.status,
        totalPhasesPlanned: 1,
        currentPhaseNumber: 1,
        totalAlignersOverall: oldTreatment.totalAligners,
        currentAlignerOverall: oldTreatment.currentAlignerNumber,
        name: `Tratamento - ${patientName}`,
      })
      .where(eq(treatments.id, oldTreatment.id))

    // 3. Criar uma phase baseada no treatment antigo
    const phase = await db.insert(treatment_phases).values({
      id: generateId(),
      treatmentId: oldTreatment.id,
      phaseNumber: 1,
      phaseName: 'Primeira Fase',
      startAlignerNumber: 1,
      endAlignerNumber: oldTreatment.totalAligners,
      totalAligners: oldTreatment.totalAligners,
      currentAlignerNumber: oldTreatment.currentAlignerNumber,
      status: oldTreatment.status,
      startDate: oldTreatment.startDate,
      expectedEndDate: oldTreatment.expectedEndDate,
    })

    // 4. Atualizar aligners para apontar para a nova phase
    await db.update(aligners)
      .set({
        phaseId: phase.id,
        alignerNumberInPhase: aligners.alignerNumber, // Mesma numeração (fase única)
      })
      .where(eq(aligners.treatmentId, oldTreatment.id))
  }
}
```

### 2.2. Compatibilidade Retroativa

**Durante período de transição:**
- Se `phaseId` for `null` → alinhador antigo (pré-migração)
- Código deve suportar ambos os modelos temporariamente

---

## 🔧 3. Mudanças nos Services

### 3.1. TreatmentService - Novos métodos

```typescript
class TreatmentService {
  // Métodos existentes (container)
  async getTreatmentByPatient(patientId: string): Promise<Treatment>
  async updateTreatment(id: string, data: Partial<Treatment>): Promise<Treatment>

  // NOVOS métodos para fases
  async getPhasesByTreatment(treatmentId: string): Promise<TreatmentPhase[]>
  async getActivePhase(treatmentId: string): Promise<TreatmentPhase | null>
  async createPhase(data: CreatePhaseInput): Promise<TreatmentPhase>
  async updatePhase(phaseId: string, data: Partial<TreatmentPhase>): Promise<TreatmentPhase>
  async completePhase(phaseId: string): Promise<TreatmentPhase>
  async startNewPhase(treatmentId: string, data: NewPhaseInput): Promise<TreatmentPhase>

  // Métodos de cálculo
  async calculateOverallProgress(treatmentId: string): Promise<number>
  async getNextAlignerNumber(treatmentId: string): Promise<number>
}

interface NewPhaseInput {
  phaseName: string
  description?: string
  totalAligners: number
  expectedDurationDays?: number
}
```

### 3.2. AlignerService - Ajustes

```typescript
class AlignerService {
  // Atualizado para considerar fases
  async createAligner(data: CreateAlignerInput): Promise<Aligner> {
    // 1. Buscar fase ativa
    const activePhase = await treatmentService.getActivePhase(data.treatmentId)

    // 2. Calcular números
    const alignerNumber = await treatmentService.getNextAlignerNumber(data.treatmentId)
    const alignerNumberInPhase = alignerNumber - activePhase.startAlignerNumber + 1

    // 3. Criar alinhador
    return db.insert(aligners).values({
      ...data,
      phaseId: activePhase.id,
      alignerNumber,
      alignerNumberInPhase,
    })
  }

  async getAlignersByPhase(phaseId: string): Promise<Aligner[]>
  async getAlignersByTreatment(treatmentId: string): Promise<Aligner[]>
}
```

---

## 🎨 4. Mudanças na Interface

### 4.1. PatientDetail.tsx

**Antes:**
```
┌─────────────────────────────────────┐
│ Informações do Tratamento          │
├─────────────────────────────────────┤
│ Status: Ativo                       │
│ Progresso: 15%                      │
│ Alinhador Atual: #3 de 20          │
│ Data de Início: 15/12/2025         │
└─────────────────────────────────────┘
```

**Depois:**
```
┌─────────────────────────────────────────────────────┐
│ Tratamento Ortodôntico - João                      │
├─────────────────────────────────────────────────────┤
│ Status Geral: Ativo                                 │
│ Progresso Geral: 58% (23 de 40 alinhadores)       │
│ Data de Início: 15/06/2025                         │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Fase 1: Alinhamento Inicial                 │   │
│ │ Status: ✅ Concluído                        │   │
│ │ Alinhadores: #1 a #20 (20 total)           │   │
│ │ Período: 15/06/2025 - 15/11/2025           │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Fase 2: Correção da Mordida         ← ATIVA│   │
│ │ Status: 🔵 Em Andamento                     │   │
│ │ Alinhadores: #21 a #40 (20 total)          │   │
│ │ Atual: #23 (3 de 20 nesta fase)            │   │
│ │ Progresso da fase: 15%                      │   │
│ │ Período: 16/11/2025 - previsto 16/04/2026  │   │
│ │                                              │   │
│ │ [13 dias até próxima troca]                 │   │
│ └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘

┌─────────────────────┐
│ Ações               │
├─────────────────────┤
│ [Editar Dados]      │
│ [Cadastrar Alinhador] ← Cadastra na fase ativa
│ [Editar Fase Ativa] │
│ [Iniciar Nova Fase] │ ← NOVO!
│ [Enviar Mensagem]   │
└─────────────────────┘
```

### 4.2. Modal "Iniciar Nova Fase"

```
┌─────────────────────────────────────────────────┐
│ Iniciar Nova Fase do Tratamento                │
├─────────────────────────────────────────────────┤
│                                                 │
│ Paciente: João Silva                            │
│ Tratamento: Tratamento Ortodôntico - João      │
│                                                 │
│ Fase Anterior: Fase 2                          │
│ └─ Último alinhador: #40                       │
│                                                 │
│ ─────────────────────────────────────────      │
│                                                 │
│ Nova Fase: #3                                   │
│                                                 │
│ Nome da Fase *                                  │
│ [Refinamento Final____________]                │
│                                                 │
│ Descrição (opcional)                            │
│ [Ajustes finais para perfei...]                │
│                                                 │
│ Quantidade de Alinhadores *                     │
│ [15_____]                                       │
│                                                 │
│ Numeração dos Alinhadores:                      │
│ └─ Inicia em: #41                              │
│ └─ Termina em: #55                             │
│                                                 │
│ Data de Início                                  │
│ [17/12/2025_____]                              │
│                                                 │
│ ℹ️  A fase anterior será marcada como          │
│    concluída automaticamente.                   │
│                                                 │
├─────────────────────────────────────────────────┤
│              [Cancelar]  [Iniciar Fase]         │
└─────────────────────────────────────────────────┘
```

### 4.3. AlignerManagement.tsx

**Seletor de Fase:**
```
Paciente: [João Silva ▼]
Fase: [Fase 2 - Correção da Mordida (Ativa) ▼]
      ├─ Fase 1 - Alinhamento Inicial (Concluído)
      └─ Fase 2 - Correção da Mordida (Ativa) ←

Número do Alinhador:
[23___] ← Próximo número global (calculado automaticamente)
(Alinhador #3 da Fase 2)
```

---

## 📊 5. Lógica de Cálculos

### 5.1. Progresso Geral do Tratamento

```typescript
function calculateOverallProgress(treatment: Treatment): number {
  return (treatment.currentAlignerOverall / treatment.totalAlignersOverall) * 100
}

// Exemplo:
// currentAlignerOverall = 23
// totalAlignersOverall = 40
// Progresso = 57.5%
```

### 5.2. Progresso da Fase Ativa

```typescript
function calculatePhaseProgress(phase: TreatmentPhase): number {
  return (phase.currentAlignerNumber / phase.totalAligners) * 100
}

// Exemplo:
// currentAlignerNumber = 3 (dentro da fase)
// totalAligners = 20 (da fase)
// Progresso da Fase = 15%
```

### 5.3. Próximo Número de Alinhador

```typescript
async function getNextAlignerNumber(treatmentId: string): Promise<number> {
  const aligners = await getAlignersByTreatment(treatmentId)

  if (aligners.length === 0) return 1

  const maxNumber = Math.max(...aligners.map(a => a.alignerNumber))
  return maxNumber + 1
}

// Exemplo:
// Fase 1: #1 a #20 (completa)
// Fase 2: #21 a #23 (ativa, 3 cadastrados)
// Próximo: #24
```

---

## 🎮 6. Impacto na Gamificação

### 6.1. Histórias (Unificadas)

**Mantém vinculação ao treatmentId do container:**
```sql
-- Uma história para o tratamento inteiro
stories
├─ treatmentId = 'tr1'  ← Container (não muda entre fases)
└─ story_chapters
    ├─ chapter 1: desbloqueado em alinhador #1  (Fase 1)
    ├─ chapter 2: desbloqueado em alinhador #5  (Fase 1)
    ├─ chapter 3: desbloqueado em alinhador #10 (Fase 1)
    ├─ chapter 4: desbloqueado em alinhador #15 (Fase 1)
    ├─ chapter 5: desbloqueado em alinhador #20 (Fase 1)
    ├─ chapter 6: desbloqueado em alinhador #25 (Fase 2) ← continua
    └─ ...
```

**Cálculo de desbloqueio:**
```typescript
function shouldUnlockChapter(
  chapter: StoryChapter,
  treatment: Treatment
): boolean {
  return treatment.currentAlignerOverall >= chapter.requiredAlignerNumber
}

// Exemplo:
// chapter 6 requer alinhador #25
// currentAlignerOverall = 23 → NÃO desbloqueia
// currentAlignerOverall = 25 → DESBLOQUEIA
```

### 6.2. Missões

**Continua funcionando normalmente:**
- Missões são por paciente (não por fase)
- Progresso continua acumulado
- Timeline unificado

---

## ✅ 7. Regras de Negócio

### 7.1. Validações

1. **Apenas uma fase ativa por tratamento:**
   ```sql
   SELECT COUNT(*) FROM treatment_phases
   WHERE treatmentId = ? AND status = 'active'
   -- Deve retornar 0 ou 1
   ```

2. **Numeração sequencial:**
   ```typescript
   // Ao criar nova fase
   const lastPhase = await getLastPhase(treatmentId)
   newPhase.phaseNumber = lastPhase.phaseNumber + 1
   newPhase.startAlignerNumber = lastPhase.endAlignerNumber + 1
   ```

3. **Não pode iniciar nova fase se atual não estiver completa:**
   ```typescript
   if (activePhase.status !== 'completed') {
     throw new Error('Complete a fase atual antes de iniciar nova fase')
   }
   ```

### 7.2. Transições de Status

**Fase:**
- `pending` → `active` (quando iniciada)
- `active` → `completed` (quando último alinhador completa)
- `active` → `paused` (manualmente)
- `paused` → `active` (manualmente)

**Tratamento (Container):**
- `active` (enquanto houver fase ativa)
- `completed` (quando todas as fases estiverem completas)
- `paused` (manualmente)
- `cancelled` (manualmente)

---

## 🚀 8. Ordem de Implementação

### Fase 1: Schema e Migration
1. ✅ Criar tabela `treatment_phases` no schema
2. ✅ Adicionar campos novos em `treatments`
3. ✅ Adicionar campos novos em `aligners`
4. ✅ Criar migration script
5. ✅ Executar `pnpm db:push`

### Fase 2: Types e Interfaces
6. ✅ Criar interface `TreatmentPhase`
7. ✅ Atualizar interface `Treatment`
8. ✅ Atualizar interface `Aligner`

### Fase 3: Services
9. ✅ Criar `PhaseService` ou adicionar métodos em `TreatmentService`
10. ✅ Atualizar `AlignerService`
11. ✅ Atualizar rotas da API

### Fase 4: UI
12. ✅ Atualizar `PatientDetail.tsx`
13. ✅ Criar componente `PhaseCard`
14. ✅ Criar modal `NewPhaseModal`
15. ✅ Atualizar `AlignerManagement.tsx`

### Fase 5: Testes
16. ✅ Testar migration
17. ✅ Testar criação de fases
18. ✅ Testar numeração sequencial
19. ✅ Testar gamificação unificada

---

## 📝 9. Checklist de Implementação

- [ ] Schema atualizado e migration criado
- [ ] Interfaces TypeScript criadas
- [ ] Services atualizados
- [ ] API routes atualizadas
- [ ] PatientDetail mostra múltiplas fases
- [ ] Botão "Iniciar Nova Fase" funcional
- [ ] AlignerManagement suporta fases
- [ ] Numeração de alinhadores continua sequencial
- [ ] Gamificação permanece unificada
- [ ] Apenas uma fase pode estar ativa
- [ ] Migration testada com dados existentes
- [ ] Documentação atualizada

---

## 🎯 10. Resultado Final Esperado

### Exemplo de Tratamento Completo:

**Tratamento: Tratamento Ortodôntico - Maria**
- Progresso Geral: 65% (39 de 60 alinhadores)
- Status: Ativo
- Início: 01/01/2025

**Fases:**

1. **Fase 1: Alinhamento Inicial** ✅
   - Alinhadores: #1 a #20
   - Status: Concluído
   - Período: 01/01/2025 - 01/06/2025

2. **Fase 2: Correção da Mordida** ✅
   - Alinhadores: #21 a #40
   - Status: Concluído
   - Período: 02/06/2025 - 02/11/2025

3. **Fase 3: Refinamento Final** 🔵 ATIVA
   - Alinhadores: #41 a #60
   - Status: Em andamento
   - Alinhador atual: #39 (19 de 20)
   - Progresso da fase: 95%
   - Período: 03/11/2025 - previsto 03/04/2026

**Gamificação:**
- História única com 30 capítulos
- Capítulos 1-10: desbloqueados na Fase 1
- Capítulos 11-20: desbloqueados na Fase 2
- Capítulos 21-30: sendo desbloqueados na Fase 3
- Missões acumuladas: 47 completadas
- Pontos totais: 2.350

---

## 💡 11. Vantagens da Solução

1. ✅ **Estrutura limpa e organizada**
2. ✅ **Histórico completo** de todas as fases
3. ✅ **Gamificação unificada** mantém engajamento
4. ✅ **Numeração sequencial** facilita entendimento
5. ✅ **Escalável** - fácil adicionar novas fases
6. ✅ **Controle preciso** - uma fase ativa por vez
7. ✅ **Dados isolados** - cada fase tem seus próprios indicadores

---

## 📞 Próximos Passos

Aguardando aprovação para iniciar implementação! 🚀
