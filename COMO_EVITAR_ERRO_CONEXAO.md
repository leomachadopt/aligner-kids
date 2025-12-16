# 🚀 Como Evitar Erros de Conexão - Guia Rápido

## 🎯 SOLUÇÃO DEFINITIVA (TL;DR)

**Para nunca mais ter problemas de conexão:**

```bash
./dev.sh
```

**Só isso!** Este script:
- ✅ Limpa portas conflitantes automaticamente
- ✅ Inicia backend e aguarda ele estar online
- ✅ Inicia frontend depois
- ✅ Monitora logs de ambos
- ✅ Para tudo com Ctrl+C

❌ **NUNCA execute**:
- `pnpm run server` (separadamente)
- `pnpm run dev` (separadamente)

✅ **SEMPRE execute**:
- `./dev.sh`

---

## ✅ Soluções Implementadas

### 1. **Script de Desenvolvimento Automático** 🎯

Agora você pode iniciar frontend E backend de uma vez:

```bash
./dev.sh
```

O script irá:
- ✅ Verificar se as portas 3001 e 5173 estão disponíveis
- ✅ Iniciar o backend automaticamente na porta 3001
- ✅ Iniciar o frontend automaticamente na porta 5173
- ✅ Verificar se o backend está saudável antes de continuar
- ✅ Mostrar logs em tempo real
- ✅ Limpar processos ao sair (Ctrl+C)

### 2. **Monitoramento de Saúde do Backend** ⚕️

O frontend agora monitora automaticamente a saúde do backend:

- Verifica a cada 30 segundos se o backend está online
- Mostra um alerta visual quando o backend está offline
- Permite tentar reconectar manualmente
- Retry automático com exponential backoff

### 3. **Retry Automático nas Requisições** 🔄

Todas as requisições da API agora tentam novamente automaticamente:

- 3 tentativas antes de falhar
- Exponential backoff (1s, 2s, 4s)
- Apenas em erros de rede (`Failed to fetch`)

---

## 📖 Como Usar

### Desenvolvimento Local

#### Opção 1: Script Automático (Recomendado)
```bash
./dev.sh
```

#### Opção 2: Manual
```bash
# Terminal 1: Backend
pnpm run server

# Terminal 2: Frontend
pnpm run dev
```

### Produção

1. **Configure as variáveis de ambiente no Vercel:**
   - Acesse: https://vercel.com/dashboard
   - Selecione o projeto `aligner-kids`
   - Vá em **Settings** → **Environment Variables**
   - Adicione:
     - `DATABASE_URL`
     - `OPENAI_API_KEY`
     - `NODE_ENV=production`

2. **Verifique se o deploy foi bem sucedido:**
   ```bash
   curl https://seu-dominio.vercel.app/api/health
   ```

3. **Configure monitoramento (Opcional):**
   - UptimeRobot: https://uptimerobot.com
   - Adicione o endpoint: `https://seu-dominio.vercel.app/api/health`

---

## 🔍 Como Testar

### 1. Testar Health Check

No navegador, acesse:
- Local: http://localhost:3001/api/health
- Produção: https://seu-dominio.vercel.app/api/health

Deve retornar:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-15T...",
  "database": "connected"
}
```

### 2. Testar Indicador Visual

1. Inicie apenas o frontend (sem backend):
   ```bash
   pnpm run dev
   ```

2. Abra o navegador: http://localhost:5173

3. Você deve ver um alerta vermelho no canto inferior direito:
   - "Servidor Offline"
   - Botão "Tentar Novamente"

4. Em outro terminal, inicie o backend:
   ```bash
   pnpm run server
   ```

5. Clique em "Tentar Novamente" ou aguarde 30 segundos

6. O alerta deve desaparecer automaticamente

### 3. Testar Retry Automático

1. Com backend rodando, faça login

2. Pare o backend (Ctrl+C)

3. Tente fazer uma ação qualquer

4. Observe os logs no console do navegador:
   ```
   🔄 Tentativa 1/3 falhou. Tentando novamente em 1000ms...
   🔄 Tentativa 2/3 falhou. Tentando novamente em 2000ms...
   ❌ Max retries reached
   ```

---

## 🐛 Resolução de Problemas

### Problema: "Porta 3001 já está em uso"

**Solução:**
```bash
# Mata processo na porta 3001
lsof -ti:3001 | xargs kill -9

# Ou use o script que faz isso automaticamente
./dev.sh
```

### Problema: "Backend não responde em produção"

**Checklist:**
1. [ ] Variáveis de ambiente configuradas no Vercel?
2. [ ] Deploy foi bem sucedido?
3. [ ] Health endpoint responde?
4. [ ] Vercel tem suporte ao seu plano?

**Verificar:**
```bash
# 1. Verificar health endpoint
curl https://seu-dominio.vercel.app/api/health

# 2. Verificar logs do Vercel
vercel logs

# 3. Verificar último deploy
vercel list
```

### Problema: "Alerta de offline aparece mesmo com backend online"

**Solução:**
1. Verifique se o `VITE_API_URL` está correto no `.env`
2. Limpe o cache do navegador (Ctrl+Shift+Delete)
3. Recarregue a página (Ctrl+R)
4. Abra o console e verifique erros

---

## 📚 Documentação Completa

Para mais detalhes, veja:
- [SOLUCOES_ERRO_CONEXAO.md](./SOLUCOES_ERRO_CONEXAO.md) - Soluções técnicas completas
- [VERIFICAR_DEPLOY_VERCEL.md](./VERIFICAR_DEPLOY_VERCEL.md) - Como verificar deploy

---

## 🎓 Boas Práticas

1. **Sempre use `./dev.sh` para desenvolvimento local**
2. **Nunca commite arquivos `.env` com secrets**
3. **Configure monitoramento em produção**
4. **Teste o health endpoint após cada deploy**
5. **Mantenha os logs limpos e organizados**

---

## 📞 Precisa de Ajuda?

Se o problema persistir:

1. Verifique os logs:
   ```bash
   # Logs do backend
   tail -f backend.log

   # Logs do frontend
   tail -f frontend.log
   ```

2. Verifique o status dos serviços:
   - Vercel: https://vercel-status.com
   - Neon: https://neon.tech/docs/introduction/status

3. Reporte o problema com:
   - Logs do backend
   - Logs do frontend
   - Console do navegador
   - Variáveis de ambiente (sem secrets)
