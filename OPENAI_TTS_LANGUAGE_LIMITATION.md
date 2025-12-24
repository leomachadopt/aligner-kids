# Limitação OpenAI TTS: Português Europeu (pt-PT)

## 📋 Resumo do Problema

O texto das histórias está sendo gerado **corretamente em Português de Portugal (pt-PT)**, mas o áudio gerado pela OpenAI TTS soa como **Português Brasileiro (pt-BR)**.

## 🔍 Análise Técnica

### ✅ O que está funcionando

1. **Geração de texto**: O serviço `StoryGenerationService` gera corretamente o texto em pt-PT quando o paciente tem `preferredLanguage: 'pt-PT'`
   - Usa expressões características: "o meu pai", "os seus pés", "num vasto deserto"
   - Sistema prompt específico para pt-PT (linhas 130-140 em `storyGenerationService.ts`)

2. **Detecção de idioma**: O backend detecta e passa o idioma do paciente corretamente
   - Linha 320 em `server/routes/stories.ts`: `const patientLanguage = patient[0]?.preferredLanguage || 'pt-BR'`
   - Linha 424 em `server/routes/stories.ts`: idioma é passado para o TTS

### ❌ Limitação da OpenAI TTS API

A API de Text-to-Speech da OpenAI **não tem parâmetro para especificar dialetos de português**:

```typescript
// API atual da OpenAI TTS
const response = await client.audio.speech.create({
  model: 'tts-1',
  voice: 'nova',
  input: text,
  response_format: 'mp3',
  // ❌ NÃO EXISTE: language: 'pt-PT'
})
```

**Comportamento da API**:
- Detecta automaticamente que o texto está em português
- Usa um modelo geral de português
- O modelo foi treinado principalmente com dados pt-BR
- Resultado: mesmo com texto em pt-PT, o sotaque soa como pt-BR

## 🔧 Soluções Implementadas

### Curto Prazo (✅ Implementado)

1. **Logging do idioma**: O sistema agora registra o idioma desejado nos logs
2. **Aviso de limitação**: Console mostra aviso quando gera áudio pt-PT
3. **Infraestrutura preparada**: Código aceita parâmetro de idioma para futura expansão

```typescript
// server/services/openaiTTS.ts:61-65
if (language === 'pt-PT') {
  console.warn('⚠️  LIMITAÇÃO: OpenAI TTS não distingue pt-PT de pt-BR no sotaque.')
  console.warn('   O áudio pode soar como português brasileiro.')
  console.warn('   Para pt-PT nativo, considere Azure TTS ou Google Cloud TTS.')
}
```

## 🚀 Soluções Futuras

### Opção 1: Azure Cognitive Services TTS ⭐ Recomendado

**Vantagens**:
- ✅ Vozes nativas pt-PT (sotaque europeu autêntico)
- ✅ Custo similar ao OpenAI ($16/1M chars)
- ✅ Qualidade alta (vozes neurais)
- ✅ Múltiplas vozes femininas e masculinas pt-PT

**Vozes disponíveis pt-PT**:
- `pt-PT-FernandaNeural` (feminina, jovem, ideal para histórias)
- `pt-PT-RaquelNeural` (feminina, calorosa)
- `pt-PT-DuarteNeural` (masculina)

**Implementação**:
```typescript
import { SpeechConfig, AudioConfig, SpeechSynthesizer } from 'microsoft-cognitiveservices-speech-sdk'

const speechConfig = SpeechConfig.fromSubscription(azureKey, azureRegion)
speechConfig.speechSynthesisVoiceName = 'pt-PT-FernandaNeural'
```

**Custo estimado** (10 capítulos, 400 palavras cada):
- ~4000 palavras = ~24.000 caracteres
- $16/1M chars = **$0.38 por história**

### Opção 2: Google Cloud Text-to-Speech

**Vantagens**:
- ✅ Vozes pt-PT nativas (WaveNet e Neural2)
- ✅ Qualidade excelente
- ❌ Custo maior ($16/1M chars WaveNet)

**Vozes disponíveis**:
- `pt-PT-Wavenet-A` (feminina)
- `pt-PT-Wavenet-B` (masculina)
- `pt-PT-Wavenet-C` (masculina)
- `pt-PT-Wavenet-D` (feminina)

### Opção 3: ElevenLabs

**Vantagens**:
- ✅ Vozes muito naturais e expressivas
- ✅ Suporta pt-PT
- ❌ Custo MUITO maior (~$0.30/1k chars = $300/1M chars)

**Não recomendado** para este projeto devido ao alto custo.

### Opção 4: Sistema Híbrido

**Estratégia**:
1. pt-BR → OpenAI TTS (custo baixo, ótima qualidade)
2. pt-PT → Azure TTS (custo similar, sotaque correto)
3. en-US → OpenAI TTS (ótima qualidade)
4. es-ES → Azure TTS (vozes nativas)

**Benefícios**:
- ✅ Melhor custo-benefício
- ✅ Qualidade adequada para cada idioma
- ✅ Mantém custos controlados

## 📊 Comparação de Custos

| Serviço | Custo/1M chars | Custo/história* | Sotaque pt-PT | Qualidade |
|---------|----------------|-----------------|---------------|-----------|
| OpenAI TTS | $15 | $0.36 | ❌ Soa pt-BR | ⭐⭐⭐⭐ |
| Azure TTS | $16 | $0.38 | ✅ Nativo | ⭐⭐⭐⭐⭐ |
| Google Cloud | $16 | $0.38 | ✅ Nativo | ⭐⭐⭐⭐⭐ |
| ElevenLabs | $300 | $7.20 | ✅ Muito natural | ⭐⭐⭐⭐⭐ |

*Assumindo 10 capítulos de 400 palavras (~24k caracteres total)

## 🎯 Recomendação

**Implementar Azure TTS para pt-PT**:
1. Diferença de custo mínima (+$0.02 por história)
2. Sotaque europeu autêntico
3. Implementação simples
4. Mantém OpenAI para pt-BR (já funciona bem)

**Próximos passos**:
1. [ ] Criar conta Azure Cognitive Services
2. [ ] Implementar `AzureTTSService` para pt-PT
3. [ ] Criar factory de TTS que escolhe o serviço baseado no idioma
4. [ ] Testar com pacientes pt-PT
5. [ ] Monitorar custos

## 📝 Notas Adicionais

- **Texto já está correto**: Não é necessário modificar a geração de histórias
- **Problema é apenas o áudio**: TTS não distingue sotaque
- **Solução é trocar o serviço de TTS**: Não requer mudanças no fluxo de geração
- **Investimento mínimo**: Diferença de $0.02 por história

## 🔗 Referências

- [OpenAI TTS Documentation](https://platform.openai.com/docs/guides/text-to-speech)
- [Azure TTS Pricing](https://azure.microsoft.com/pricing/details/cognitive-services/speech-services/)
- [Azure TTS Voices](https://learn.microsoft.com/azure/ai-services/speech-service/language-support?tabs=tts)
- [Google Cloud TTS Pricing](https://cloud.google.com/text-to-speech/pricing)
