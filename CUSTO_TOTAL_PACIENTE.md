# 💰 Análise de Custos - IA por Paciente

## 📊 Premissas

### Tratamento Típico
- **80 alinhadores** por paciente (média)
- **1 capítulo por alinhador** = 80 capítulos totais
- **1 história gerada no início** do tratamento

### Tamanho dos Capítulos
- **300-500 palavras** por capítulo (média: 400 palavras)
- **~2.400 caracteres** por capítulo (palavra média pt: 6 chars)
- **80 capítulos × 2.400 chars** = **192.000 caracteres** por história

---

## 💵 Custos Detalhados

### 1️⃣ Geração de Texto (OpenAI GPT-4o-mini)

**Prompt por lote (5 capítulos):**
- System prompt: ~800 tokens
- User prompt: ~600 tokens
- Contexto capítulos anteriores: ~200 tokens
- **Total input**: ~1.600 tokens por lote

**Output por lote:**
- 5 capítulos × 400 palavras × 1.3 (tokens/palavra pt) = ~2.600 tokens
- **Total output**: ~2.600 tokens por lote

**80 capítulos = 16 lotes:**
- Input: 16 × 1.600 = 25.600 tokens
- Output: 16 × 2.600 = 41.600 tokens

**Custo GPT-4o-mini:**
- Input: 25.600 tokens × $0.150/1M = **$0.0038**
- Output: 41.600 tokens × $0.600/1M = **$0.0250**
- **Total geração de texto: $0.029 por história**

---

### 2️⃣ Geração de Áudio (TTS)

**Por capítulo:**
- 2.400 caracteres (texto do capítulo)

**80 capítulos:**
- 80 × 2.400 = **192.000 caracteres**

#### Opção A: OpenAI TTS (pt-BR)
- Custo: $15/1M caracteres
- **192.000 chars × $15/1M = $2.88 por história**

#### Opção B: Azure TTS (pt-PT)
- Custo: $16/1M caracteres
- **192.000 chars × $16/1M = $3.07 por história**

---

## 📈 Custo Total por Paciente (80 alinhadores)

### Paciente pt-BR (Português Brasileiro)
```
Geração de texto (GPT-4o-mini):  $0.029
Geração de áudio (OpenAI TTS):   $2.880
─────────────────────────────────────────
TOTAL:                           $2.91
```
**~R$ 16,00** (considerando $1 = R$5,50)

### Paciente pt-PT (Português Europeu)
```
Geração de texto (GPT-4o-mini):  $0.029
Geração de áudio (Azure TTS):    $3.072
─────────────────────────────────────────
TOTAL:                           $3.10
```
**~R$ 17,00** (considerando $1 = R$5,50)

---

## 🔍 Detalhamento por Capítulo

### Custo por capítulo individual:
- **Geração de texto**: $0.029 ÷ 80 = **$0.00036/capítulo**
- **Áudio pt-BR**: $2.88 ÷ 80 = **$0.036/capítulo**
- **Áudio pt-PT**: $3.07 ÷ 80 = **$0.038/capítulo**

### Total por capítulo:
- **pt-BR**: $0.036 (~R$ 0,20 por capítulo)
- **pt-PT**: $0.038 (~R$ 0,21 por capítulo)

---

## 📊 Comparação: Tratamento Curto vs Longo

| Alinhadores | Capítulos | Texto | Áudio pt-BR | Áudio pt-PT | **Total pt-BR** | **Total pt-PT** |
|-------------|-----------|-------|-------------|-------------|-----------------|-----------------|
| 10          | 10        | $0.004| $0.36       | $0.38       | **$0.36**       | **$0.38**       |
| 20          | 20        | $0.007| $0.72       | $0.77       | **$0.73**       | **$0.78**       |
| 40          | 40        | $0.015| $1.44       | $1.54       | **$1.46**       | **$1.55**       |
| 80          | 80        | $0.029| $2.88       | $3.07       | **$2.91**       | **$3.10**       |
| 120         | 120       | $0.044| $4.32       | $4.61       | **$4.36**       | **$4.65**       |

**Em Reais (R$):**
| Alinhadores | **pt-BR** | **pt-PT** |
|-------------|-----------|-----------|
| 10          | R$ 2,00   | R$ 2,10   |
| 20          | R$ 4,00   | R$ 4,30   |
| 40          | R$ 8,00   | R$ 8,50   |
| 80          | R$ 16,00  | R$ 17,00  |
| 120         | R$ 24,00  | R$ 25,50  |

---

## 🎯 Conclusões

### 1. Custo é POR HISTÓRIA (gerada 1 vez)
- ✅ História gerada **no início do tratamento**
- ✅ Capítulos desbloqueados progressivamente
- ✅ **Custo único de $2.91-3.10** por paciente

### 2. Componente Dominante: Áudio
- 🎙️ **Áudio representa 99% do custo**
- 📝 Geração de texto é **desprezível** ($0.029)

### 3. Diferença pt-BR vs pt-PT
- 💰 Diferença de apenas **$0.19** (R$ 1,00)
- ✅ **Totalmente viável** usar Azure para pt-PT

### 4. Escalabilidade
- ✅ Para **1.000 pacientes pt-BR**: $2.910 (R$ 16.000)
- ✅ Para **1.000 pacientes pt-PT**: $3.100 (R$ 17.000)
- ✅ Custo por paciente **mantém-se constante**

---

## 💡 Otimizações Futuras (Opcional)

### Se o custo for uma preocupação:

1. **Áudio sob demanda**
   - Gerar áudio apenas quando capítulo for desbloqueado
   - Reduz custo inicial, mas aumenta latência

2. **Cache de capítulos comuns**
   - Capítulos com mesmo tema/personagem podem ser reutilizados
   - Economia de ~30-50% em histórias similares

3. **Tier gratuito sem áudio**
   - Histórias só texto para pacientes gratuitos
   - Áudio premium para pacientes pagos

4. **Compressão de áudio**
   - MP3 já é comprimido, mas pode usar bitrate menor
   - Economia de armazenamento (não de geração)

---

## 🏆 Recomendação Final

**Manter implementação atual:**
- ✅ Custo de **R$ 16-17 por paciente** é **muito baixo**
- ✅ Experiência premium com áudio nativo
- ✅ Diferenciador competitivo importante
- ✅ ROI excelente considerando engajamento do paciente

**Para perspectiva:**
- 1 consulta ortodôntica: R$ 150-300
- 1 alinhador: R$ 80-150
- **Custo da história: R$ 16 (0,5-2% do tratamento)**

O custo de IA é **insignificante** comparado ao valor do tratamento! 🎉
