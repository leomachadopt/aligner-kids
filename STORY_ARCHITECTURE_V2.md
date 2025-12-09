# 📖 Arquitetura de Histórias V2 - Sistema Sequencial por Capítulos

## 🎯 Mudança Fundamental de Conceito

### ❌ Arquitetura Anterior (Implementada)
- Criança cria histórias múltiplas, a qualquer momento
- Cada vez que entra no Story Director = nova história
- Histórias independentes e avulsas

### ✅ Nova Arquitetura (Correta)
- **UMA história por tratamento**
- História criada **UMA VEZ** no início do tratamento
- História dividida em **CAPÍTULOS SEQUENCIAIS**
- Capítulos desbloqueados conforme progresso nos alinhadores
- **História contínua e progressiva**

---

## 🎬 Conceito Principal

### A História como Jornada do Tratamento

```
Início do Tratamento
    ↓
Story Director (UMA VEZ)
    ↓
Criança escolhe: Ambiente, Personagem, Tema, Nome
    ↓
IA Gera HISTÓRIA COMPLETA dividida em capítulos
    ↓
Capítulo 1 desbloqueado (Alinhador 1-2)
    ↓
Capítulo 2 desbloqueado (Alinhador 3-5)
    ↓
Capítulo 3 desbloqueado (Alinhador 6-8)
    ↓
... e assim por diante até o final
    ↓
Capítulo Final (Último alinhador)
    ↓
FIM DA HISTÓRIA = FIM DO TRATAMENTO 🎉
```

---

## 📚 Estrutura da História

### Exemplo: Tratamento com 24 Alinhadores

**História**: "A Jornada de Luna, a Fada do Sorriso Mágico"

#### Capítulo 1: "O Despertar Mágico"
- **Desbloqueio**: Alinhadores 1-3
- **Conteúdo**: Luna descobre seus poderes mágicos
- **Duração**: ~5 min leitura / áudio

#### Capítulo 2: "O Chamado da Aventura"
- **Desbloqueio**: Alinhadores 4-6
- **Conteúdo**: Luna conhece seus aliados
- **Duração**: ~5 min leitura / áudio

#### Capítulo 3: "O Primeiro Desafio"
- **Desbloqueio**: Alinhadores 7-9
- **Conteúdo**: Luna enfrenta obstáculo inicial
- **Duração**: ~5 min leitura / áudio

... *continua*

#### Capítulo 8: "A Vitória Final"
- **Desbloqueio**: Alinhadores 22-24
- **Conteúdo**: Luna completa sua missão e celebra
- **Duração**: ~5 min leitura / áudio

**Total**: 8 capítulos = História completa e coesa

---

## 🏗️ Arquitetura Técnica

### Opção A: Geração Única (Recomendada)

```
Story Director (início do tratamento)
    ↓
Criança escolhe preferências
    ↓
OpenAI gera HISTÓRIA COMPLETA de uma vez
    ├── Capítulo 1 (início)
    ├── Capítulo 2 (desenvolvimento)
    ├── Capítulo 3 (conflito)
    ├── ...
    └── Capítulo N (conclusão)
    ↓
Todos os capítulos salvos no banco
    ↓
Capítulos desbloqueados progressivamente
```

**Vantagens:**
- ✅ História coesa e bem estruturada
- ✅ Arcos narrativos conectados
- ✅ Sem necessidade de "lembrar" contexto
- ✅ Previsível e consistente

**Desvantagens:**
- ⚠️ Custo inicial maior (gera tudo de uma vez)
- ⚠️ Tempo de geração maior (~30-60s)

---

### Opção B: Geração Progressiva

```
Story Director (início do tratamento)
    ↓
Criança escolhe preferências
    ↓
OpenAI gera outline completo + Capítulo 1
    ↓
Salvos: Outline + Cap 1
    ↓
Quando desbloqueia Capítulo 2:
    ├── Busca outline e capítulos anteriores
    ├── Gera Capítulo 2 com contexto
    └── Salva Capítulo 2
    ↓
Repete para cada capítulo
```

**Vantagens:**
- ✅ Custo distribuído ao longo do tempo
- ✅ Geração rápida inicial
- ✅ Pode adaptar história conforme progresso

**Desvantagens:**
- ⚠️ Complexidade maior
- ⚠️ Risco de inconsistências
- ⚠️ Necessita contexto e "memória"

---

## 📊 Comparativo de Abordagens

| Aspecto | Geração Única | Geração Progressiva |
|---------|---------------|---------------------|
| **Tempo inicial** | 30-60s | 5-10s |
| **Custo OpenAI** | $0.04-0.08 | $0.04-0.08 |
| **Consistência** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Complexidade** | ⭐⭐ | ⭐⭐⭐⭐ |
| **Flexibilidade** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Recomendação** | ✅ **MELHOR** | Para v2.0 |

---

## 🎙️ Integração com ElevenLabs

### Fluxo com Narração

```
1. História gerada (OpenAI)
    ↓
2. Para cada capítulo:
    ├── Texto enviado para ElevenLabs
    ├── ElevenLabs retorna áudio (MP3)
    ├── Áudio salvo em storage (S3/Vercel Blob)
    └── URL salva no banco (audio_url)
    ↓
3. Quando criança abre capítulo:
    ├── Carrega texto + áudio
    └── Player com opção de ouvir
```

### Vozes ElevenLabs Recomendadas

**Para Português BR:**
- `Adam` - Masculina, narrativa
- `Bella` - Feminina, calorosa
- `Rachel` - Feminina, jovem e clara
- **Custom Voice** - Criar voz específica para crianças BR

### Custos ElevenLabs

**Planos:**
- Free: 10,000 caracteres/mês (teste)
- Creator: $5/mês - 30,000 caracteres
- Creator+: $22/mês - 100,000 caracteres
- Pro: $99/mês - 500,000 caracteres

**Cálculo:**
- 1 capítulo = ~1500 palavras = ~9000 caracteres
- 8 capítulos = ~72,000 caracteres
- **Custo por história completa**:
  - Free tier: ~7 histórias/mês
  - Creator+: ~1 história completa

**Recomendação Inicial**: Plano Creator+ ($22/mês) para testes

---

## 🗄️ Mudanças no Schema do Banco

### Tabela Atual: `generated_stories`

```sql
-- Já tem o campo chapter_id!
chapter_id VARCHAR(50)  -- ✅ Preparado
```

### Nova Tabela: `story_series` (Adicionar)

```sql
CREATE TABLE story_series (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL UNIQUE, -- Uma série por paciente

  -- Preferências da história
  preferences_snapshot JSONB NOT NULL,

  -- Metadados
  title VARCHAR(200) NOT NULL,
  description TEXT,
  total_chapters INTEGER NOT NULL,

  -- Status
  is_complete BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_patient FOREIGN KEY (patient_id)
    REFERENCES users(id) ON DELETE CASCADE
);
```

### Modificar: `generated_stories`

```sql
-- Adicionar campos
ALTER TABLE generated_stories
  ADD COLUMN story_series_id UUID REFERENCES story_series(id),
  ADD COLUMN chapter_number INTEGER,
  ADD COLUMN required_aligner_number INTEGER; -- Quando desbloqueia
```

---

## 🔄 Novo Fluxo de Uso

### 1. Início do Tratamento

```
Dentista cria tratamento
    ↓
Define: 24 alinhadores totais
    ↓
Sistema sugere: "Criar história para [Nome da Criança]"
    ↓
Story Director (Wizard)
    ↓
Criança escolhe: Ambiente, Personagem, Tema, Nome
```

### 2. Geração da História

```
Preferências enviadas para OpenAI
    ↓
Prompt especial: "Crie uma história completa em 8 capítulos..."
    ↓
OpenAI retorna história estruturada
    ↓
Sistema divide em capítulos
    ↓
Para cada capítulo:
    ├── Salva texto no banco
    ├── Envia para ElevenLabs
    ├── Salva áudio no storage
    └── Vincula ao alinhador correspondente
    ↓
História completa pronta!
```

### 3. Uso Durante Tratamento

```
Criança abre app
    ↓
Vai para "Minhas Histórias" (nova página)
    ↓
Vê sua história com capítulos:
    ├── ✅ Capítulo 1 (desbloqueado - pode ler/ouvir)
    ├── ✅ Capítulo 2 (desbloqueado - pode ler/ouvir)
    ├── 🔒 Capítulo 3 (bloqueado - alinhador 7)
    ├── 🔒 Capítulo 4 (bloqueado - alinhador 10)
    └── ...
    ↓
Clica em capítulo desbloqueado
    ↓
Página de leitura com:
    ├── Texto completo
    ├── Player de áudio ▶️
    └── Progresso da história (2/8 capítulos)
```

### 4. Desbloqueio de Capítulos

```
Criança avança para alinhador 7
    ↓
Sistema detecta: "Capítulo 3 deve desbloquear!"
    ↓
Animação especial: 🎉 "Novo capítulo desbloqueado!"
    ↓
Notificação na app
    ↓
Criança pode ler novo capítulo
```

---

## 🎨 UI/UX - Páginas Necessárias

### 1. Página: "Minha História" (Nova)

**Rota**: `/my-story`

**Componentes:**
- Card principal com título da história
- Preview do personagem principal
- Lista de capítulos com status:
  - ✅ Desbloqueado e lido
  - 📖 Desbloqueado mas não lido
  - 🔒 Bloqueado (mostra requisito)
- Barra de progresso geral (3/8 capítulos)
- Botão "Continuar lendo" (próximo não lido)

### 2. Página: "Leitor de Capítulo" (Modificar atual)

**Adicionar:**
- Navegação entre capítulos (← anterior | próximo →)
- Indicador: "Capítulo 3 de 8"
- Player de áudio integrado:
  - ▶️ Play / ⏸️ Pause
  - Barra de progresso
  - Velocidade (0.75x, 1x, 1.25x)
  - Volume
- Opção: "Ler de novo" vs "Próximo capítulo"

### 3. Story Director (Ajustar)

**Mudanças:**
- Título: "Crie SUA História do Tratamento"
- Descrição: "Essa será sua história especial durante todo o tratamento!"
- Última tela: "Gerando sua história em 8 capítulos emocionantes..."
- Após geração: Redireciona para "Minha História"

---

## 📝 Prompt OpenAI - História Completa

```
Você é um contador de histórias infantis especializado.

TAREFA: Crie uma história COMPLETA e COESA dividida em [N] capítulos.

INFORMAÇÕES:
- Ambiente: {{environment}}
- Personagem Principal: {{characterName}} ({{mainCharacter}})
- Ajudante: {{sidekick}}
- Tema: {{theme}}
- Idade: {{age}} anos
- Total de capítulos: {{totalChapters}}
- Alinhadores totais: {{totalAligners}}

ESTRUTURA OBRIGATÓRIA:

Capítulo 1: INÍCIO
- Apresentar mundo e personagens
- Estabelecer situação normal
- Plantar sementes do conflito
- Palavras: ~800-1000

Capítulo 2: CHAMADO À AVENTURA
- Evento que muda tudo
- Personagem aceita desafio
- Conhece aliados
- Palavras: ~800-1000

Capítulo 3-[N-2]: DESENVOLVIMENTO
- Desafios progressivos
- Crescimento do personagem
- Aprendizados sobre saúde bucal/alinhador
- Cada capítulo: ~800-1000 palavras

Capítulo [N-1]: CLÍMAX
- Desafio final
- Momento de verdade
- Usa tudo que aprendeu
- Palavras: ~800-1000

Capítulo [N]: RESOLUÇÃO
- Vitória e celebração
- Reflexão sobre jornada
- Mensagem final inspiradora
- Palavras: ~800-1000

REGRAS IMPORTANTES:
1. Cada capítulo deve terminar com gancho para o próximo
2. Incluir mensagens sobre cuidado com dentes/alinhador naturalmente
3. Arco narrativo coeso do início ao fim
4. Vocabulário apropriado para {{ageRange}}
5. Tom: Aventureiro, inspirador, educativo

FORMATO DE SAÍDA:
=== CAPÍTULO 1: [Título] ===
[Conteúdo do capítulo]

=== CAPÍTULO 2: [Título] ===
[Conteúdo do capítulo]

... e assim por diante
```

---

## 💾 Exemplo de Dados no Banco

### story_series
```json
{
  "id": "series-123",
  "patient_id": "patient-456",
  "title": "A Jornada de Luna, a Fada do Sorriso Mágico",
  "description": "Uma aventura mágica pela Floresta Encantada",
  "total_chapters": 8,
  "preferences_snapshot": {
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

### generated_stories (Capítulos)
```json
[
  {
    "id": "chapter-1",
    "story_series_id": "series-123",
    "chapter_number": 1,
    "required_aligner_number": 1,
    "title": "O Despertar Mágico",
    "content": "Era uma vez, na Floresta Encantada...",
    "audio_url": "https://storage.com/audio/chapter-1.mp3",
    "word_count": 850,
    "estimated_reading_time": 6
  },
  {
    "id": "chapter-2",
    "story_series_id": "series-123",
    "chapter_number": 2,
    "required_aligner_number": 4,
    "title": "O Chamado da Aventura",
    "content": "Luna acordou com um brilho diferente...",
    "audio_url": "https://storage.com/audio/chapter-2.mp3",
    "word_count": 920,
    "estimated_reading_time": 6
  }
  // ... mais 6 capítulos
]
```

---

## 🎯 Mapeamento de Capítulos para Alinhadores

### Função Inteligente

```typescript
function calculateChapterUnlocks(
  totalAligners: number,
  totalChapters: number = 8
): number[] {
  const unlockPoints: number[] = []

  for (let i = 0; i < totalChapters; i++) {
    const unlockAt = Math.ceil((i / totalChapters) * totalAligners)
    unlockPoints.push(Math.max(1, unlockAt))
  }

  return unlockPoints
}

// Exemplo: 24 alinhadores, 8 capítulos
// Resultado: [1, 3, 6, 9, 12, 15, 18, 21]
```

---

## 🚀 Roadmap de Implementação

### Fase 1: Reestruturação (2-3 dias)
- [ ] Criar tabela `story_series`
- [ ] Modificar `generated_stories`
- [ ] Ajustar tipos TypeScript
- [ ] Atualizar serviço OpenAI (prompt completo)

### Fase 2: UI/UX (2-3 dias)
- [ ] Criar página "Minha História"
- [ ] Modificar Story Reader (navegação capítulos)
- [ ] Ajustar Story Director (contexto único)
- [ ] Componente de lista de capítulos

### Fase 3: ElevenLabs (2 dias)
- [ ] Serviço ElevenLabs TTS
- [ ] Storage de áudio (S3/Vercel Blob)
- [ ] Player de áudio no Reader
- [ ] Controles de reprodução

### Fase 4: Lógica de Desbloqueio (1 dia)
- [ ] Sistema de notificação de novo capítulo
- [ ] Animação de desbloqueio
- [ ] Cálculo automático de requisitos

### Fase 5: Testes e Ajustes (2 dias)
- [ ] Teste de geração completa
- [ ] Validação de áudio
- [ ] UX testing com crianças
- [ ] Ajustes finais

**Total**: ~10-12 dias para implementação completa

---

## 💰 Custos Revisados

### Por Paciente (História Completa)

**OpenAI:**
- 8 capítulos × 1000 palavras = ~48,000 tokens
- Custo: ~$0.05-0.10 por história completa

**ElevenLabs:**
- 8 capítulos × 9000 chars = ~72,000 caracteres
- Plano Creator+ ($22/mês): ~1 história
- **Ou pagar por uso**: ~$0.29 por história

**Storage (áudio):**
- 8 capítulos × 3MB = ~24MB por história
- S3: ~$0.0006 por história
- Desprezível

**Total por paciente:** $0.35-0.40

**Para 50 pacientes/mês:** ~$17.50-20

---

## ✅ Vantagens desta Arquitetura

1. **Engajamento Superior**
   - História contínua mantém interesse
   - Ansiedade para próximo capítulo
   - Motivação para usar alinhador

2. **Coesão Narrativa**
   - História bem estruturada
   - Arco narrativo completo
   - Personagens consistentes

3. **Educacional**
   - Mensagens distribuídas ao longo do tratamento
   - Reforço constante de cuidados
   - Aprendizado progressivo

4. **Gamificação Natural**
   - Desbloqueio = recompensa
   - Senso de progresso
   - Conquista tangível

5. **Valor Percebido**
   - História personalizada única
   - Investimento emocional
   - Memória do tratamento

---

## 🎯 Conclusão

Esta arquitetura transforma o tratamento ortodôntico em uma **jornada narrativa**, onde cada alinhador desbloqueado é um passo na aventura da criança.

**Principais Mudanças:**
- ❌ Histórias múltiplas → ✅ UMA história sequencial
- ❌ Geração sob demanda → ✅ Geração única no início
- ❌ Histórias independentes → ✅ Capítulos conectados
- ✅ **Adiciona**: Narração em áudio premium (ElevenLabs)

**Status Atual:**
- ✅ Chave ElevenLabs configurada
- ✅ Schema parcialmente preparado (chapter_id existe)
- ⏳ Necessita reestruturação e implementação

**Pronto para implementar quando autorizado!** 🚀
