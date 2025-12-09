# 🔄 Migração: ElevenLabs → OpenAI TTS

**Data:** 08/12/2025  
**Status:** ✅ Concluída

## 📋 Resumo

Migração do serviço de Text-to-Speech de ElevenLabs para OpenAI TTS para reduzir custos em **94%** (de €4,86 para ~€0,30 por criança).

## ✅ Alterações Realizadas

### 1. Novo Serviço Criado
- **Arquivo:** `src/services/openaiTTS.ts`
- **Classe:** `OpenAITTSService`
- **Interface:** Mantém a mesma interface do `ElevenLabsTTSService` para compatibilidade
- **Modelo:** `gpt-4o-mini-tts` ($12 por 1M caracteres)
- **Voz padrão:** `nova` (feminina, jovem, calorosa - ideal para histórias infantis)

### 2. Arquivos Modificados
- **`src/services/storySeriesService.ts`**
  - Import alterado: `ElevenLabsTTSService` → `OpenAITTSService`
  - Todas as chamadas atualizadas para usar o novo serviço

### 3. Arquivos Mantidos (para referência)
- **`src/services/elevenLabsTTS.ts`** - Mantido como backup/referência
  - Pode ser removido após validação completa

## 💰 Impacto Financeiro

### Custo por Criança (20 capítulos, 200 palavras/cap = 24k caracteres)

| Serviço | Custo por Criança | Economia |
|---------|-------------------|----------|
| **ElevenLabs** | €4,86 | - |
| **OpenAI TTS** | €0,29 | **94% mais barato** |

### Economia Anual (exemplo: 100 crianças)
- **Antes:** €486,00
- **Depois:** €29,00
- **Economia:** €457,00

## 🎯 Funcionalidades Mantidas

✅ Todas as funcionalidades permanecem iguais:
- Geração de áudio por capítulo
- Criação de blob URLs para reprodução
- Estimativa de duração do áudio
- Conversão base64 (se necessário)
- Validação de configuração da API

## 🔧 Configuração

### Variáveis de Ambiente

**Remover (opcional):**
```env
VITE_ELEVENLABS_API_KEY=...
```

**Usar (já existente):**
```env
VITE_OPENAI_API_KEY=sk-...
```

### Dependências

**Pode remover (opcional):**
```json
"elevenlabs": "^1.59.0"
```

O SDK `openai` já está instalado e é usado tanto para geração de histórias quanto para TTS.

## 🎙️ Vozes Disponíveis

OpenAI oferece 6 vozes (todas suportam PT-BR):

| Voz | Tipo | Descrição |
|-----|------|-----------|
| `alloy` | Neutra | Versátil, adequada para narrativa |
| `echo` | Masculina | Clara, profissional |
| `fable` | Feminina | Expressiva, dinâmica |
| `onyx` | Masculina | Profunda, narrativa |
| `nova` ⭐ | Feminina | Jovem, calorosa (padrão - ideal para crianças) |
| `shimmer` | Feminina | Suave, delicada |

**Voz padrão:** `nova` (configurada no código)

## 📝 Modelos Disponíveis

| Modelo | Custo (1M chars) | Qualidade | Uso Atual |
|--------|------------------|-----------|-----------|
| `gpt-4o-mini-tts` | $12 | ⭐⭐⭐⭐ | ✅ Padrão |
| `tts-1` | $15 | ⭐⭐⭐⭐ | - |
| `tts-1-hd` | $30 | ⭐⭐⭐⭐⭐ | - |

**Modelo padrão:** `gpt-4o-mini-tts` (mais econômico)

## ✅ Testes Realizados

- ✅ Build compilado sem erros
- ✅ Interface mantida compatível
- ✅ Linter sem erros

## 🧪 Próximos Passos Recomendados

1. **Teste de Qualidade:**
   - Gerar 1-2 capítulos de teste
   - Comparar qualidade de voz com ElevenLabs
   - Validar pronúncia em PT-BR

2. **Validação em Produção:**
   - Testar com histórias reais
   - Verificar feedback de usuários
   - Monitorar custos na dashboard OpenAI

3. **Limpeza (Opcional):**
   - Remover `src/services/elevenLabsTTS.ts` após validação
   - Remover dependência `elevenlabs` do `package.json`
   - Remover variável `VITE_ELEVENLABS_API_KEY` do `.env`

## 📚 Documentação

- **OpenAI TTS API:** https://platform.openai.com/docs/guides/text-to-speech
- **Preços:** https://platform.openai.com/pricing
- **Vozes:** https://platform.openai.com/docs/guides/text-to-speech/voice-options

## ⚠️ Notas Importantes

1. **Qualidade:** OpenAI TTS tem boa qualidade, mas pode ser ligeiramente diferente de ElevenLabs. Teste antes de migrar completamente.

2. **Formato:** Ambos retornam MP3, então é totalmente compatível com o sistema atual.

3. **Custo:** O custo é calculado por caracteres processados, não por execução. Reouvir áudio não gera custo adicional.

4. **Backup:** O arquivo `elevenLabsTTS.ts` foi mantido caso precise reverter rapidamente.

---

**Migração realizada com sucesso! 🎉**

