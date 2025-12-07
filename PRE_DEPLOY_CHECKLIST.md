# ✅ Checklist Pré-Deploy - Kids Aligner

Use este checklist antes de fazer o deploy em produção.

## 🔍 Verificações de Código

- [ ] **Build Local Funcionando**
  ```bash
  npm run build
  ```
  ✅ Deve completar sem erros (tamanho esperado: ~1.2MB)

- [ ] **Preview Local Funcionando**
  ```bash
  npm run preview
  ```
  ✅ Acesse http://localhost:4173 e teste todas as páginas principais

- [ ] **Linting Sem Erros**
  ```bash
  npm run lint
  ```
  ✅ Não deve ter erros críticos

- [ ] **Código Formatado**
  ```bash
  npm run format
  ```

## 🧪 Testes Funcionais

- [ ] **Navegação Entre Páginas**
  - Dashboard → Gamificação → Educação → Meu Tratamento
  - Verificar que as rotas funcionam corretamente

- [ ] **Sistema de Gamificação**
  - [ ] Moedas aparecem no header (modo child)
  - [ ] Streak counter funciona
  - [ ] Missões diárias são exibidas
  - [ ] Badges são mostrados corretamente

- [ ] **Animações e Efeitos**
  - [ ] Confetes aparecem ao completar alinhador
  - [ ] Animações hover funcionam (bounce, wiggle)
  - [ ] Mascotes têm animação float

- [ ] **Responsividade**
  - [ ] Desktop (1920px, 1366px)
  - [ ] Tablet (768px)
  - [ ] Mobile (375px, 414px)

- [ ] **LocalStorage**
  - [ ] Dados de gamificação persistem ao recarregar
  - [ ] Abra DevTools → Application → Local Storage
  - [ ] Verifique chave "gamification"

## 📁 Arquivos Configurados

- [x] `vercel.json` - Configuração do Vercel
- [x] `.vercelignore` - Arquivos ignorados
- [x] `.env.example` - Template de variáveis
- [x] `vite.config.ts` - Otimizado para produção
- [x] `.gitignore` - Atualizado com .vercel
- [x] `DEPLOY.md` - Documentação de deploy
- [x] `README.md` - Atualizado

## 🔐 Segurança

- [ ] **Variáveis de Ambiente**
  - [ ] Nenhuma API key ou secret no código
  - [ ] Usar VITE_ prefix para variáveis públicas
  - [ ] Configurar no Vercel Dashboard se necessário

- [ ] **Dependências**
  ```bash
  npm audit
  ```
  - [ ] Não há vulnerabilidades críticas

## 🚀 Deploy

### Git

- [ ] **Código Commitado**
  ```bash
  git status
  ```
  - [ ] Nenhum arquivo importante sem commit
  - [ ] package-lock.json commitado

- [ ] **Push para Repositório**
  ```bash
  git push origin main
  ```

### Vercel

- [ ] **Método de Deploy Escolhido**
  - [ ] CLI (`vercel --prod`)
  - [ ] Dashboard (import do GitHub)

- [ ] **Configurações do Vercel**
  - Framework: Vite
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Install Command: `npm install`

## 📊 Pós-Deploy

- [ ] **Verificar Deploy**
  - [ ] Status: Success ✅
  - [ ] URL de produção acessível
  - [ ] Nenhum erro 404

- [ ] **Testar em Produção**
  - [ ] Todas as páginas carregam
  - [ ] Assets carregam (CSS, JS, imagens)
  - [ ] Gamificação funciona
  - [ ] LocalStorage persiste dados

- [ ] **Performance**
  - [ ] Lighthouse Score (abrir DevTools)
    - Performance: > 80
    - Accessibility: > 90
    - Best Practices: > 80
    - SEO: > 80

- [ ] **Console sem Erros**
  - [ ] DevTools → Console
  - [ ] Não deve ter erros JavaScript

## 🔄 Rollback (se necessário)

Se algo der errado:

1. Acesse Vercel Dashboard
2. Deployments → [deployment anterior]
3. Clique em "⋯" → "Promote to Production"

## 📱 Domínio Customizado (Opcional)

- [ ] Domínio adquirido
- [ ] DNS configurado
- [ ] SSL ativo (automático no Vercel)

---

## ⚡ Quick Deploy

Para deploy rápido após verificações:

```bash
# Build local
npm run build

# Preview
npm run preview

# Tudo OK? Deploy!
vercel --prod
```

---

**Última atualização**: Dezembro 2024
**Versão**: 0.0.4
**Build size**: ~1.2MB
**Tempo de build**: ~1-2 segundos
