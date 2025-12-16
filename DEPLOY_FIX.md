# Correções para Problema de 404 em Produção

## Problema
Ao recarregar a página em produção (Vercel) enquanto logado, o sistema deslogava e mostrava erro 404.

## Causa
O Vercel não estava configurado para redirecionar todas as rotas SPA (Single Page Application) para o `index.html`, causando 404 em rotas client-side como `/dashboard`, `/profile`, etc.

## Correções Aplicadas

### 1. ✅ Atualizado `vercel.json`
Adicionado rewrite para todas as rotas não-API serem redirecionadas para index.html:

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.ts"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 2. ✅ Criado `public/_redirects`
Arquivo de fallback para compatibilidade com outros servidores (Netlify, etc):

```
/api/*  /api/:splat  200
/*  /index.html  200
```

### 3. ✅ Adicionados Logs de Debug
- `authService.ts`: Logs para rastrear restauração de sessão
- `ProtectedRoute.tsx`: Logs para verificar estado de autenticação

## Como Testar

### Teste Local
1. Faça build de produção:
   ```bash
   pnpm build
   pnpm preview
   ```

2. Acesse http://localhost:4173
3. Faça login como dentista
4. Navegue para /dashboard
5. Recarregue a página (F5)
6. ✅ Deve permanecer logado e na mesma página

### Teste em Produção (Vercel)
1. Faça commit das alterações:
   ```bash
   git add .
   git commit -m "fix: corrige erro 404 ao recarregar página em produção"
   git push
   ```

2. Aguarde o deploy no Vercel
3. Acesse seu app em produção
4. Faça login como dentista
5. Navegue para /dashboard
6. Recarregue a página (F5)
7. ✅ Deve permanecer logado e na mesma página

## Debug

### Console do Navegador
Abra o console (F12) e procure por logs:
- ✅ `Sessão recuperada do cache` ou `Sessão restaurada`
- 🔒 `ProtectedRoute:` com informações de autenticação
- ⚠️ Se ver "Nenhuma sessão encontrada" ou "Sessão expirada", há problema com localStorage

### localStorage
No console do navegador, verifique:
```javascript
localStorage.getItem('auth_session_v1')
```
Deve retornar um JSON com usuário e token.

## Possíveis Problemas Adicionais

### 1. Sessão Expirando Muito Rápido
Se a sessão expirar antes do esperado, verifique `authService.ts`:
```typescript
const DEFAULT_SESSION_TTL_MS = 24 * 60 * 60 * 1000 // 24h
```

### 2. CORS em Produção
Se o backend estiver em domínio diferente, verifique CORS no servidor.

### 3. localStorage Bloqueado
Alguns navegadores em modo privado bloqueiam localStorage. Teste em modo normal.

## Próximos Passos (Opcional)

### Remover Logs de Produção
Após verificar que tudo funciona, remova os `console.log` adicionados:
- `src/services/authService.ts` (linhas 68, 77, 83, 91, 96)
- `src/components/ProtectedRoute.tsx` (linha 22, 38)

### Implementar Refresh Token
Para sessões mais seguras, considere implementar:
- Access token de curta duração (15min)
- Refresh token de longa duração (30 dias)
- Renovação automática antes da expiração
