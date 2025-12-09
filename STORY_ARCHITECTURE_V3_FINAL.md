# 📖 Arquitetura FINAL - 1 Alinhador = 1 Capítulo

## 🎯 Regra Principal

```
TOTAL DE ALINHADORES = TOTAL DE CAPÍTULOS

Exemplo:
- 24 alinhadores → 24 capítulos
- 12 alinhadores → 12 capítulos
- 18 alinhadores → 18 capítulos
```

---

## 🎬 Fluxo Completo

### 1️⃣ Início do Tratamento

```
Dentista cria tratamento
    ↓
Define: 24 alinhadores totais
    ↓
Sistema mostra: "Criar História do Tratamento"
    ↓
Botão: "🎬 Criar Minha História"
```

### 2️⃣ Story Director (UMA VEZ)

```
Criança abre Story Director
    ↓
Escolhe:
- Ambiente (Floresta, Espaço, etc)
- Personagem (Dragão, Fada, etc)
- Tema (Aventura, Mistério, etc)
- Nome do personagem
- Idade
    ↓
Clica: "Criar Minha História"
    ↓
Loading: "Gerando sua história em 24 capítulos..."
```

### 3️⃣ Geração pela IA

```
OpenAI recebe:
- Preferências da criança
- Total de alinhadores: 24
    ↓
Gera HISTÓRIA COMPLETA dividida em 24 capítulos
    ↓
Cada capítulo: ~300-400 palavras (~2-3 min leitura)
    ↓
Sistema divide e processa:
    ├─ Capítulo 1 → Texto + ElevenLabs → Áudio → Salva
    ├─ Capítulo 2 → Texto + ElevenLabs → Áudio → Salva
    ├─ Capítulo 3 → Texto + ElevenLabs → Áudio → Salva
    └─ ... até capítulo 24
    ↓
HISTÓRIA COMPLETA ARMAZENADA
```

### 4️⃣ Após Criação

```
✅ História criada e salva
    ↓
❌ Botão "Criar História" DESAPARECE
    ↓
✅ Aparece: Card "Minha História"
    ↓
Mostra:
- Título da história
- Personagem principal
- Progresso: "1/24 capítulos lidos"
- Lista de capítulos com status
```

### 5️⃣ Desbloqueio Progressivo

```
Alinhador 1 ativo:
    ├─ ✅ Capítulo 1: DESBLOQUEADO (pode ler/ouvir)
    ├─ 🔒 Capítulo 2: Bloqueado
    ├─ 🔒 Capítulo 3: Bloqueado
    └─ ... todos bloqueados
    ↓
Criança avança para Alinhador 2:
    ├─ ✅ Capítulo 1: Lido
    ├─ ✅ Capítulo 2: DESBLOQUEADO 🎉 (pode ler/ouvir)
    ├─ 🔒 Capítulo 3: Bloqueado
    └─ ...
    ↓
Notificação: "🎉 Novo capítulo disponível!"
```

### 6️⃣ Leitura do Capítulo

```
Criança clica no Capítulo 2
    ↓
Abre Story Reader com:
- Título do capítulo
- Texto completo
- Player de áudio ▶️
- Navegação: ← Cap 1 | Cap 3 → (se desbloqueado)
- Progresso: "Capítulo 2 de 24"
```

---

## 📊 Estrutura de Dados

### story_series (UMA por paciente)

```json
{
  "id": "series-abc123",
  "patient_id": "patient-xyz",
  "title": "A Jornada de Luna pela Floresta Encantada",
  "total_chapters": 24,
  "total_aligners": 24,
  "preferences": {
    "environment": "floresta",
    "mainCharacter": "fada",
    "mainCharacterName": "Luna",
    "theme": "aventura",
    "ageGroup": 8
  },
  "is_complete": false,
  "created_at": "2025-12-08T10:00:00Z"
}
```

### generated_stories (24 capítulos)

```json
[
  {
    "id": "cap-1",
    "story_series_id": "series-abc123",
    "chapter_number": 1,
    "required_aligner_number": 1,
    "title": "O Despertar de Luna",
    "content": "Luna acordou em sua pequena casa...",
    "audio_url": "https://storage.com/series-abc123/cap-1.mp3",
    "word_count": 350,
    "estimated_reading_time": 2
  },
  {
    "id": "cap-2",
    "story_series_id": "series-abc123",
    "chapter_number": 2,
    "required_aligner_number": 2,
    "title": "A Primeira Descoberta",
    "content": "No dia seguinte, algo estranho aconteceu...",
    "audio_url": "https://storage.com/series-abc123/cap-2.mp3",
    "word_count": 380,
    "estimated_reading_time": 2
  },
  // ... mais 22 capítulos
]
```

---

## 🎯 Mapeamento Automático

### Função de Cálculo

```typescript
function mapChaptersToAligners(totalAligners: number) {
  // Simples: 1 alinhador = 1 capítulo
  const chapters = []

  for (let i = 1; i <= totalAligners; i++) {
    chapters.push({
      chapterNumber: i,
      requiredAlignerNumber: i,
      title: `Capítulo ${i}`,
      unlocked: false
    })
  }

  return chapters
}

// Exemplo: 24 alinhadores
// Resultado: 24 capítulos (1→1, 2→2, 3→3, ..., 24→24)
```

---

## 📱 UI/UX Detalhada

### Página Gamificação (Antes de Criar)

```
┌─────────────────────────────────────┐
│ 🎭 Central de Aventuras            │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎬 Crie Sua História Mágica!   │ │
│ │                                 │ │
│ │ Transforme seu tratamento em   │ │
│ │ uma aventura épica com 24      │ │
│ │ capítulos emocionantes!        │ │
│ │                                 │ │
│ │ [✨ Criar Minha História]      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Jornada dos Alinhadores...]       │
│ [Coleção de Selos...]              │
└─────────────────────────────────────┘
```

### Página Gamificação (Após Criar)

```
┌─────────────────────────────────────┐
│ 🎭 Central de Aventuras            │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📖 Minha História               │ │
│ │                                 │ │
│ │ A Jornada de Luna pela         │ │
│ │ Floresta Encantada             │ │
│ │                                 │ │
│ │ 🧚 Luna, a Fada Aventureira    │ │
│ │ 🌳 Ambiente: Floresta Mágica   │ │
│ │                                 │ │
│ │ ━━━━━━━━━━━━━━━━ 4%            │ │
│ │ 1/24 capítulos lidos           │ │
│ │                                 │ │
│ │ [📚 Ver Capítulos]             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Jornada dos Alinhadores...]       │
└─────────────────────────────────────┘
```

### Página "Minha História" (Lista de Capítulos)

```
┌─────────────────────────────────────┐
│ ← Voltar                            │
│                                     │
│ A Jornada de Luna pela Floresta    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│ 🧚 Luna | 🌳 Floresta | ⚔️ Aventura│
│ ━━━━━━━━━━━━━ 4% (1/24)            │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ✅ 📖 Capítulo 1                │ │
│ │ "O Despertar de Luna"           │ │
│ │ Lido • 2 min • [▶️ Ouvir]       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔒 Capítulo 2                   │ │
│ │ "A Primeira Descoberta"         │ │
│ │ 🔐 Desbloqueia: Alinhador 2     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔒 Capítulo 3                   │ │
│ │ "???"                           │ │
│ │ 🔐 Desbloqueia: Alinhador 3     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ... (mais 21 capítulos)             │
└─────────────────────────────────────┘
```

### Story Reader (Capítulo Individual)

```
┌─────────────────────────────────────┐
│ ← Capítulos    1/24    Próximo → 🔒│
│                                     │
│ Capítulo 1: O Despertar de Luna    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│ 🎧 NARRAÇÃO                        │
│ ┌─────────────────────────────────┐ │
│ │ ▶️ ━━━━━━━━●━━━━━ 1:30/2:45   │ │
│ │ 🔊 ━━━━●━━━  1.0x             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│ Luna acordou em sua pequena casa   │
│ na Floresta Encantada. Era um dia  │
│ especial - hoje ela começaria uma  │
│ jornada mágica que mudaria sua     │
│ vida para sempre...                │
│                                     │
│ [... resto do texto ...]           │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│ ✨ Fim do Capítulo 1               │
│                                     │
│ [❤️ Curtir]  [🔄 Ouvir de Novo]   │
└─────────────────────────────────────┘
```

---

## 🤖 Prompt OpenAI

```
Você é um contador de histórias infantis especializado.

TAREFA: Crie uma história COMPLETA dividida em EXATAMENTE {{totalAligners}} capítulos.

INFORMAÇÕES:
- Ambiente: {{environment}}
- Personagem: {{characterName}} ({{mainCharacter}})
- Ajudante: {{sidekick}}
- Tema: {{theme}}
- Idade: {{age}} anos
- CAPÍTULOS TOTAIS: {{totalAligners}}

ESTRUTURA DA HISTÓRIA:

Capítulo 1: INÍCIO
- Apresentar mundo, personagem e situação normal
- Palavras: 300-400

Capítulos 2-{{totalAligners-2}}: DESENVOLVIMENTO
- Cada capítulo: Um evento/desafio específico
- Progressão clara da história
- Incluir aprendizados sobre cuidado com dentes/alinhador
- Cada capítulo: 300-400 palavras
- CADA CAPÍTULO DEVE TERMINAR COM GANCHO

Capítulo {{totalAligners-1}}: CLÍMAX
- Desafio final
- Momento decisivo
- Palavras: 300-400

Capítulo {{totalAligners}}: FINAL
- Resolução vitoriosa
- Celebração
- Mensagem inspiradora
- Palavras: 300-400

REGRAS IMPORTANTES:
1. Cada capítulo é INDEPENDENTE mas conectado
2. Capítulo pode ser lido/ouvido em 2-3 minutos
3. Gancho no final de cada capítulo (exceto último)
4. Mensagens educativas sobre saúde bucal naturalmente inseridas
5. Tom adequado para {{ageRange}}
6. História coesa do início ao fim

FORMATO DE SAÍDA:
=== CAPÍTULO 1: [Título] ===
[Conteúdo 300-400 palavras]

=== CAPÍTULO 2: [Título] ===
[Conteúdo 300-400 palavras]

... até capítulo {{totalAligners}}
```

---

## ⚙️ Lógica de Controle

### 1. Verificar se já tem história

```typescript
function hasStory(patientId: string): boolean {
  const series = db.query(
    'SELECT id FROM story_series WHERE patient_id = $1',
    [patientId]
  )
  return series.length > 0
}
```

### 2. Mostrar/Ocultar Botão

```typescript
// No componente Gamification.tsx
const hasStory = checkIfPatientHasStory(currentPatient.id)

{!hasStory ? (
  <CreateStoryButton onClick={openStoryDirector} />
) : (
  <MyStoryCard storySeriesId={storySeriesId} />
)}
```

### 3. Verificar capítulos desbloqueados

```typescript
function getUnlockedChapters(
  patientId: string,
  currentAlignerNumber: number
) {
  return db.query(`
    SELECT * FROM generated_stories
    WHERE story_series_id = (
      SELECT id FROM story_series WHERE patient_id = $1
    )
    AND required_aligner_number <= $2
    ORDER BY chapter_number ASC
  `, [patientId, currentAlignerNumber])
}
```

### 4. Notificar novo capítulo

```typescript
function checkNewChapterUnlock(
  patientId: string,
  previousAligner: number,
  newAligner: number
) {
  if (newAligner > previousAligner) {
    // Novo capítulo desbloqueado!
    showNotification({
      title: "🎉 Novo Capítulo Disponível!",
      message: `Capítulo ${newAligner} foi desbloqueado!`,
      action: "Ler Agora"
    })
  }
}
```

---

## 💾 Schema do Banco (Ajustes)

### Tabela: story_series

```sql
CREATE TABLE story_series (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL UNIQUE,

  title VARCHAR(200) NOT NULL,
  total_chapters INTEGER NOT NULL,
  total_aligners INTEGER NOT NULL, -- Mesmo valor que total_chapters

  preferences_snapshot JSONB NOT NULL,

  is_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_patient FOREIGN KEY (patient_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Índice
CREATE INDEX idx_story_series_patient ON story_series(patient_id);
```

### Tabela: generated_stories (já existe, apenas usar)

```sql
-- Já tem todos os campos necessários!
-- chapter_id → chapter_number
-- promptId → story_series_id
-- preferencesSnapshot → não precisa (já está na série)
```

---

## 💰 Custos por Paciente

### Exemplo: 24 Alinhadores = 24 Capítulos

**OpenAI:**
- 24 capítulos × 400 palavras × 1.3 = ~12,480 tokens
- Custo: ~$0.03-0.06

**ElevenLabs:**
- 24 capítulos × 400 palavras × 6 chars/palavra = ~57,600 chars
- Custo no plano Creator+ ($22/mês com 100k chars): $0.00 (cabe no plano)
- Ou pay-as-you-go: ~$0.23

**Storage (S3):**
- 24 capítulos × 1.5MB = 36MB
- Custo: ~$0.0008

**TOTAL**: $0.03-0.06 (com plano ElevenLabs) ou ~$0.29 (pay-as-you-go)

### Plano Recomendado ElevenLabs

**Creator+ ($22/mês)**
- 100,000 caracteres/mês
- Permite: ~1.7 pacientes/mês completos
- Para 10-20 pacientes: Considerar plano Pro ($99 = 500k chars)

---

## ✅ Vantagens desta Arquitetura

1. **Simples e Linear**
   - 1 alinhador = 1 capítulo (fácil de entender)
   - Progressão clara e previsível

2. **Altamente Motivador**
   - Cada troca de alinhador = nova parte da história
   - Antecipação constante

3. **Flexível**
   - Funciona com qualquer número de alinhadores
   - 12, 18, 24, 36... adapta automaticamente

4. **Capítulos Curtos**
   - 2-3 min de leitura/áudio
   - Perfeito para crianças (atenção)

5. **Gamificação Perfeita**
   - Desbloqueio = recompensa imediata
   - Progresso visível (barra)

---

## 🚀 Implementação

### Prioridade 1: Core
- [ ] Tabela story_series
- [ ] Lógica "já tem história?"
- [ ] Ocultar/mostrar botão criar
- [ ] Geração OpenAI (história completa)
- [ ] Dividir e salvar capítulos

### Prioridade 2: UI
- [ ] Página "Minha História"
- [ ] Lista de capítulos com status
- [ ] Story Reader ajustado
- [ ] Navegação entre capítulos

### Prioridade 3: Áudio
- [ ] Integração ElevenLabs
- [ ] Storage de áudio
- [ ] Player no Story Reader

### Prioridade 4: Extras
- [ ] Notificações de desbloqueio
- [ ] Animações
- [ ] Estatísticas

---

## 📊 Tempo Estimado

**Total**: 8-10 dias

- DB + Lógica Core: 2 dias
- UI Minha História: 2 dias
- Story Reader + Player: 2 dias
- ElevenLabs + Storage: 2 dias
- Testes + Ajustes: 2 dias

---

## ✅ Resposta à Pergunta

**"Seria possível desta forma?"**

# SIM! Totalmente viável e IDEAL! ✅

Esta arquitetura é:
- ✅ Mais simples que a V2 anterior
- ✅ Mais intuitiva (1:1 alinhador:capítulo)
- ✅ Mais flexível (adapta a qualquer número)
- ✅ Perfeita para gamificação
- ✅ Ótima para experiência da criança

**Pronto para implementar quando autorizado!** 🚀
