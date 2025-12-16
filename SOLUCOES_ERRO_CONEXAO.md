# 🛡️ Soluções para Evitar Erros de Conexão com Backend

## 🎯 Problema Identificado

O erro `ERR_CONNECTION_REFUSED` ocorre quando:
- **Desenvolvimento**: Servidor backend não está rodando na porta 3001
- **Produção**: Backend serverless (Vercel) não está respondendo

---

## ✅ Soluções Implementadas

### 1. **Health Check no Frontend** ⚕️

Adicionar verificação automática de saúde do backend:

```typescript
// src/services/healthCheck.ts
export class HealthCheckService {
  private static readonly CHECK_INTERVAL = 30000 // 30 segundos
  private static isBackendHealthy = true

  static async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 segundos timeout
      })

      this.isBackendHealthy = response.ok
      return response.ok
    } catch (error) {
      this.isBackendHealthy = false
      console.error('❌ Backend não está respondendo:', error)
      return false
    }
  }

  static startMonitoring(onStatusChange: (isHealthy: boolean) => void) {
    setInterval(async () => {
      const wasHealthy = this.isBackendHealthy
      const isHealthy = await this.checkBackendHealth()

      if (wasHealthy !== isHealthy) {
        onStatusChange(isHealthy)
      }
    }, this.CHECK_INTERVAL)
  }

  static isHealthy(): boolean {
    return this.isBackendHealthy
  }
}
```

### 2. **Retry com Exponential Backoff** 🔄

Modificar o `apiClient.ts` para tentar novamente em caso de falha:

```typescript
// src/utils/apiClient.ts
class ApiClient {
  private async requestWithRetry<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = 3,
    backoff = 1000
  ): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await this.request<T>(endpoint, options)
      } catch (error) {
        // Se for o último retry, joga o erro
        if (i === retries - 1) throw error

        // Se for erro de rede, tenta novamente
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          console.log(`🔄 Tentativa ${i + 1}/${retries} falhou. Tentando novamente em ${backoff}ms...`)
          await new Promise(resolve => setTimeout(resolve, backoff))
          backoff *= 2 // Exponential backoff
        } else {
          throw error // Outros erros não tentam novamente
        }
      }
    }
    throw new Error('Max retries reached')
  }
}
```

### 3. **Indicador Visual de Status do Backend** 🚦

Adicionar componente de status no header/footer:

```typescript
// src/components/BackendStatusIndicator.tsx
export function BackendStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Check inicial
    HealthCheckService.checkBackendHealth().then(setIsOnline)

    // Monitoramento contínuo
    HealthCheckService.startMonitoring(setIsOnline)
  }, [])

  if (isOnline) return null // Não mostra nada se estiver online

  return (
    <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        <div>
          <p className="font-semibold">Servidor Offline</p>
          <p className="text-sm">Tentando reconectar...</p>
        </div>
      </div>
    </div>
  )
}
```

### 4. **Variáveis de Ambiente Corretas** 🔧

Criar arquivo `.env.production`:

```bash
# .env.production
VITE_API_URL=https://seu-dominio.vercel.app/api
VITE_APP_ENV=production
VITE_ENABLE_DEBUG_MODE=false
```

E garantir que o Vercel tenha as variáveis corretas:

```bash
# No dashboard do Vercel:
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-proj-...
NODE_ENV=production
```

### 5. **Script de Verificação de Deploy** ✅

Criar script para verificar se o deploy foi bem sucedido:

```bash
# scripts/verify-deployment.sh
#!/bin/bash

PRODUCTION_URL="https://seu-dominio.vercel.app"
MAX_RETRIES=10
RETRY_INTERVAL=5

echo "🔍 Verificando deploy..."

for i in $(seq 1 $MAX_RETRIES); do
  echo "Tentativa $i/$MAX_RETRIES..."

  # Verifica health endpoint
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL/api/health")

  if [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ Deploy verificado com sucesso!"
    echo "🌐 URL: $PRODUCTION_URL"
    exit 0
  fi

  echo "❌ Status: $HTTP_CODE - Aguardando $RETRY_INTERVAL segundos..."
  sleep $RETRY_INTERVAL
done

echo "❌ Deploy falhou após $MAX_RETRIES tentativas"
exit 1
```

### 6. **Monitoramento com UptimeRobot** 📊

Configurar monitoramento externo gratuito:

1. Acesse: https://uptimerobot.com
2. Adicione um monitor HTTP(S)
3. URL: `https://seu-dominio.vercel.app/api/health`
4. Intervalo: 5 minutos
5. Configure alertas por email

### 7. **GitHub Actions para Verificar Deploy** 🤖

Criar workflow para verificar deploy automaticamente:

```yaml
# .github/workflows/verify-deployment.yml
name: Verify Deployment

on:
  push:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - name: Wait for Vercel Deploy
        run: sleep 60

      - name: Check Health Endpoint
        run: |
          for i in {1..10}; do
            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${{ secrets.PRODUCTION_URL }}/api/health")
            if [ "$HTTP_CODE" -eq 200 ]; then
              echo "✅ Deploy verified!"
              exit 0
            fi
            echo "Attempt $i/10 failed. Retrying..."
            sleep 10
          done
          echo "❌ Deploy verification failed"
          exit 1
```

### 8. **Graceful Degradation no Frontend** 🎨

Permitir uso offline quando possível:

```typescript
// src/hooks/useOfflineMode.ts
export function useOfflineMode() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const checkConnection = async () => {
      const isHealthy = await HealthCheckService.checkBackendHealth()
      setIsOffline(!isHealthy)
    }

    checkConnection()
    const interval = setInterval(checkConnection, 30000)

    return () => clearInterval(interval)
  }, [])

  return {
    isOffline,
    showOfflineMessage: () => toast.error('Você está offline. Algumas funcionalidades podem não funcionar.')
  }
}
```

---

## 📋 Checklist de Implementação

### Desenvolvimento Local
- [ ] Criar script `dev.sh` que inicia frontend E backend juntos
- [ ] Adicionar health check no frontend
- [ ] Implementar retry logic no apiClient
- [ ] Adicionar indicador visual de status

### Produção (Vercel)
- [ ] Verificar variáveis de ambiente no Vercel
- [ ] Configurar UptimeRobot ou similar
- [ ] Adicionar GitHub Action para verificar deploy
- [ ] Testar health endpoint em produção

### Monitoramento
- [ ] Configurar alertas de email
- [ ] Adicionar logging de erros (Sentry, LogRocket, etc.)
- [ ] Dashboard de monitoramento

---

## 🚀 Script de Desenvolvimento Recomendado

Criar arquivo `dev.sh`:

```bash
#!/bin/bash

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando Kids Aligner...${NC}"

# Verifica se as portas estão disponíveis
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
  echo -e "${GREEN}✅ Backend já está rodando na porta 3001${NC}"
else
  echo -e "${BLUE}🔧 Iniciando backend na porta 3001...${NC}"
  pnpm run server &
  BACKEND_PID=$!
  sleep 3
fi

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
  echo -e "${GREEN}✅ Frontend já está rodando na porta 5173${NC}"
else
  echo -e "${BLUE}🎨 Iniciando frontend na porta 5173...${NC}"
  pnpm run dev &
  FRONTEND_PID=$!
fi

echo -e "${GREEN}✅ Tudo pronto!${NC}"
echo -e "${BLUE}📱 Frontend: http://localhost:5173${NC}"
echo -e "${BLUE}🔧 Backend: http://localhost:3001${NC}"
echo -e "${BLUE}⚕️  Health: http://localhost:3001/api/health${NC}"

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

wait
```

Tornar executável:
```bash
chmod +x dev.sh
```

Usar:
```bash
./dev.sh
```

---

## 🎯 Prioridade de Implementação

### Alta Prioridade (Fazer Agora)
1. ✅ Criar script `dev.sh` para desenvolvimento
2. ⚠️ Adicionar health check no frontend
3. ⚠️ Verificar variáveis de ambiente no Vercel

### Média Prioridade (Esta Semana)
4. Implementar retry logic
5. Adicionar indicador visual de status
6. Configurar UptimeRobot

### Baixa Prioridade (Quando Possível)
7. GitHub Actions para verificar deploy
8. Logging avançado (Sentry)
9. Dashboard de monitoramento

---

## 📞 Contato em Caso de Problemas

Se o problema persistir:
1. Verificar logs do Vercel: `vercel logs`
2. Verificar status do Vercel: https://vercel-status.com
3. Verificar status do Neon: https://neon.tech/docs/introduction/status
