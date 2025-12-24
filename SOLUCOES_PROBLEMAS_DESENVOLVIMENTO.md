# 🔧 Soluções para Problemas de Desenvolvimento

## ❌ Problema: "ERR_CONNECTION_REFUSED" ou "Failed to fetch"

### Causa
O frontend não consegue se conectar ao backend na porta 3001.

### Soluções

#### 1. **Solução Rápida - Usar o script dev.sh**
```bash
./dev.sh
```

Este script:
- ✅ Mata processos conflitantes automaticamente
- ✅ Inicia backend e frontend na ordem correta
- ✅ Verifica se o backend está pronto antes de iniciar o frontend
- ✅ Mostra logs em tempo real

#### 2. **Limpar Portas Manualmente**
```bash
./kill-ports.sh
```

Depois execute:
```bash
./dev.sh
```

#### 3. **Verificar se o Backend Está Rodando**
```bash
curl http://localhost:3001/health
```

Se retornar erro, o backend não está rodando. Execute:
```bash
pnpm run server
```

#### 4. **Verificar Processos nas Portas**
```bash
lsof -ti:3001  # Backend
lsof -ti:5173  # Frontend
```

#### 5. **Reiniciar do Zero**
```bash
# 1. Matar todos os processos
./kill-ports.sh

# 2. Limpar cache do node
rm -rf node_modules/.vite
rm -rf node_modules/.cache

# 3. Iniciar desenvolvimento
./dev.sh
```

---

## ❌ Problema: Múltiplos Servidores Rodando

### Causa
Executar `pnpm run server` ou `pnpm run dev` múltiplas vezes cria processos duplicados.

### Solução

**SEMPRE use `./dev.sh` em vez de executar os comandos separadamente!**

Se você já tem processos duplicados:
```bash
./kill-ports.sh
./dev.sh
```

---

## ❌ Problema: Backend Não Conecta ao Banco de Dados

### Causa
Variáveis de ambiente incorretas ou faltando.

### Solução

1. Verifique se o arquivo `.env` existe:
```bash
ls -la .env
```

2. Verifique se contém a variável `DATABASE_URL`:
```bash
cat .env | grep DATABASE_URL
```

3. Se estiver faltando, copie do `.env.example`:
```bash
cp .env.example .env
```

4. Edite o `.env` com suas credenciais do Neon DB.

---

## ❌ Problema: Frontend Não Encontra o Backend

### Causa
Backend não está rodando **ou** URL do backend/proxy está incorreta.

### Solução

1. Primeiro, verifique se o backend está respondendo:

```bash
curl http://localhost:3001/api/health
```

2. Se o backend estiver ok, verifique o arquivo `.env` (na raiz do projeto):
```bash
cat .env | grep VITE_API_URL
```

3. **Importante**:

- Se `VITE_API_URL` **não estiver definido**, o frontend usa **`/api` por padrão** (recomendado). Em dev, o Vite faz proxy de `/api` para `http://localhost:3001`.
- Se você definir `VITE_API_URL`, ele deve apontar para o backend correto (incluindo `/api`), por exemplo:

```env
# Exemplo (opcional)
VITE_API_URL=http://localhost:3001/api
```

4. Reinicie o frontend:
```bash
# Ctrl+C para parar
# Depois:
./dev.sh
```

---

## ❌ Problema: Erro "Module not found" no Backend

### Causa
Dependências não instaladas ou cache corrompido.

### Solução

```bash
# 1. Limpar cache
rm -rf node_modules
rm -rf .pnpm-store
rm pnpm-lock.yaml

# 2. Reinstalar dependências
pnpm install

# 3. Iniciar novamente
./dev.sh
```

---

## ❌ Problema: Hot Reload Não Funciona

### Causa
Vite ou TSX não está detectando mudanças.

### Solução

1. **Frontend (Vite)**:
```bash
# Parar tudo
./kill-ports.sh

# Limpar cache
rm -rf node_modules/.vite

# Reiniciar
./dev.sh
```

2. **Backend (TSX)**:
- O `tsx watch` deve recarregar automaticamente
- Se não funcionar, reinicie o `dev.sh`

---

## ✅ Melhores Práticas para Evitar Problemas

### 1. **SEMPRE use `./dev.sh`**
- ❌ NÃO execute `pnpm run server` e `pnpm run dev` separadamente
- ✅ USE `./dev.sh`

### 2. **Pare Tudo com Ctrl+C**
- Sempre use `Ctrl+C` no terminal onde rodou `./dev.sh`
- Isso garante que todos os processos serão encerrados corretamente

### 3. **Se Algo Der Errado**
```bash
./kill-ports.sh  # Limpa portas
./dev.sh         # Reinicia tudo
```

### 4. **Verifique os Logs**
```bash
# Backend
tail -f backend.log

# Frontend
tail -f frontend.log
```

### 5. **Health Check Regular**
```bash
# Verificar backend
curl http://localhost:3001/health

# Verificar frontend
curl http://localhost:5173
```

---

## 🚀 Workflow Recomendado

### Início do Dia
```bash
./dev.sh
```

### Durante o Desenvolvimento
- Faça suas alterações
- O hot reload deve funcionar automaticamente
- Se não funcionar, use `Ctrl+C` e depois `./dev.sh`

### Fim do Dia
```bash
# Pressione Ctrl+C no terminal do dev.sh
# Ou execute:
./kill-ports.sh
```

### Se Algo Der Errado
```bash
./kill-ports.sh
./dev.sh
```

---

## 📊 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `./dev.sh` | Inicia todo o ambiente de desenvolvimento |
| `./kill-ports.sh` | Mata processos nas portas 3001 e 5173 |
| `pnpm run server` | ❌ Não use diretamente - use `./dev.sh` |
| `pnpm run dev` | ❌ Não use diretamente - use `./dev.sh` |
| `pnpm db:push` | Aplica mudanças no schema do banco |
| `pnpm db:studio` | Abre Drizzle Studio (interface do DB) |

---

## 🔍 Diagnóstico Rápido

Execute esses comandos para diagnosticar problemas:

```bash
# 1. Verificar portas
lsof -ti:3001
lsof -ti:5173

# 2. Verificar backend
curl http://localhost:3001/health

# 3. Verificar variáveis de ambiente
cat .env

# 4. Verificar logs
tail -20 backend.log
tail -20 frontend.log

# 5. Verificar processos node
ps aux | grep node
```

---

## 🆘 Última Tentativa - Reset Completo

Se nada funcionar, faça um reset completo:

```bash
# 1. Matar TODOS os processos Node
pkill -9 node

# 2. Limpar completamente
./kill-ports.sh
rm -rf node_modules
rm -rf .pnpm-store
rm -rf node_modules/.vite
rm -rf node_modules/.cache
rm pnpm-lock.yaml
rm backend.log frontend.log

# 3. Reinstalar
pnpm install

# 4. Verificar .env
cat .env

# 5. Iniciar
./dev.sh
```

---

## 📞 Ainda com Problemas?

Se os problemas persistirem:

1. Verifique se todas as dependências estão instaladas:
```bash
pnpm install
```

2. Verifique se o Node.js está atualizado (v18+):
```bash
node --version
```

3. Verifique se o pnpm está atualizado:
```bash
pnpm --version
```

4. Consulte os logs completos:
```bash
cat backend.log
cat frontend.log
```
