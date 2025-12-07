# 🚀 Guia de Deploy no Vercel - Kids Aligner

Este guia detalha como fazer o deploy do aplicativo Kids Aligner na plataforma Vercel.

## 📋 Pré-requisitos

- Conta no [Vercel](https://vercel.com) (gratuita)
- Repositório Git (GitHub, GitLab ou Bitbucket)
- Node.js 18+ instalado localmente (para testes)

## 🔧 Configurações do Projeto

O projeto já está configurado com os seguintes arquivos otimizados para deploy no Vercel:

- ✅ `vercel.json` - Configuração do Vercel
- ✅ `.vercelignore` - Arquivos ignorados no upload
- ✅ `vite.config.ts` - Otimizado para produção
- ✅ `.gitignore` - Atualizado com arquivos do Vercel

## 📦 Método 1: Deploy via CLI (Recomendado)

### 1. Instalar Vercel CLI

```bash
npm install -g vercel
```

### 2. Login no Vercel

```bash
vercel login
```

### 3. Deploy do Projeto

Na raiz do projeto, execute:

```bash
# Para preview/teste
vercel

# Para produção
vercel --prod
```

## 🌐 Método 2: Deploy via Dashboard Vercel

### 1. Acesse o Dashboard

Vá para [vercel.com/new](https://vercel.com/new)

### 2. Importe o Repositório

- Clique em "Import Project"
- Conecte sua conta do GitHub/GitLab/Bitbucket
- Selecione o repositório `aligner-kids`

### 3. Configure o Projeto

O Vercel detectará automaticamente as configurações do Vite. Verifique se:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4. Deploy

Clique em "Deploy" e aguarde o processo finalizar (~2-3 minutos)

## 🔐 Variáveis de Ambiente (Opcional)

Se o projeto precisar de variáveis de ambiente:

### Via Dashboard:
1. Acesse: Settings → Environment Variables
2. Adicione as variáveis necessárias
3. Redeploye o projeto

### Via CLI:
```bash
vercel env add NOME_DA_VARIAVEL
```

Exemplo de variáveis que você pode precisar:
```
VITE_API_URL=https://api.example.com
VITE_ANALYTICS_ID=your-analytics-id
```

## ⚙️ Configurações Avançadas

### Domínio Customizado

1. Acesse: Settings → Domains
2. Adicione seu domínio personalizado
3. Configure os registros DNS conforme instruções

### Redirecionamentos e Rotas

O arquivo `vercel.json` já está configurado com:
- ✅ Rewrites para SPA (todas rotas → index.html)
- ✅ Cache otimizado para assets
- ✅ Headers de segurança

### Preview Deployments

Cada push em branches diferentes de `main` cria um preview:
- URL única para teste
- Não afeta produção
- Ideal para revisão de código

## 🧪 Testar Localmente Antes do Deploy

```bash
# Build de produção
npm run build

# Preview local
npm run preview
```

Acesse: `http://localhost:4173`

## 📊 Monitoramento e Logs

### Via Dashboard:
- Deployments → [seu-deploy] → Logs
- Analytics para métricas de uso

### Via CLI:
```bash
# Ver logs em tempo real
vercel logs [deployment-url]

# Listar deployments
vercel list
```

## 🔄 CI/CD Automático

Após o primeiro deploy, o Vercel configura automaticamente:

✅ **Deploy Automático**: Cada push para `main` faz deploy em produção
✅ **Preview Automático**: Pull requests criam preview deployments
✅ **Rollback Fácil**: Reverta para qualquer deploy anterior em 1 clique

## 🐛 Troubleshooting

### Build Falha

```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Erro de Rotas (404)

Verifique se o `vercel.json` tem as rewrites configuradas corretamente.

### Tamanho do Bundle Muito Grande

O projeto já está otimizado com code splitting, mas você pode:
```bash
# Analisar bundle
npm run build -- --mode production
```

### Problemas de Cache

No Vercel Dashboard:
- Settings → Data Cache → Clear Cache
- Ou force redeploy: Deployments → ⋯ → Redeploy

## 📱 URLs Importantes

Após o deploy, você terá:

- **Produção**: `https://your-project.vercel.app`
- **Preview**: `https://your-project-git-branch.vercel.app`
- **Dashboard**: `https://vercel.com/seu-usuario/aligner-kids`

## ✅ Checklist de Deploy

- [ ] Código commitado no Git
- [ ] Build local funcionando (`npm run build`)
- [ ] Variáveis de ambiente configuradas (se necessário)
- [ ] `vercel.json` configurado
- [ ] Deploy realizado
- [ ] Teste da aplicação no preview
- [ ] Deploy em produção confirmado
- [ ] Domínio customizado configurado (opcional)

## 🎯 Performance

O projeto está otimizado com:
- ✅ Code splitting automático
- ✅ Cache agressivo de assets
- ✅ Compressão Brotli
- ✅ CDN global do Vercel
- ✅ HTTPS automático
- ✅ HTTP/2 e HTTP/3

## 📞 Suporte

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Vite Docs**: [vitejs.dev](https://vitejs.dev)
- **Problemas**: Abra uma issue no repositório

---

**Tempo estimado de deploy**: 2-5 minutos ⚡

**Status esperado**: ✅ Build Success

Boa sorte com o deploy! 🚀
