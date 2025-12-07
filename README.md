# Kids Aligner - Aplicativo Gamificado para Ortodontia Infantil 🦷✨

Aplicativo gamificado projetado para engajar crianças durante o tratamento ortodôntico com alinhadores invisíveis.

Este projeto foi criado de ponta a ponta com o [Skip](https://goskip.dev).

## 🚀 Stack Tecnológica

- **React 19** - Biblioteca JavaScript para construção de interfaces
- **Vite** - Build tool extremamente rápida
- **TypeScript** - Superset tipado do JavaScript
- **Shadcn UI** - Componentes reutilizáveis e acessíveis
- **Tailwind CSS** - Framework CSS utility-first
- **React Router** - Roteamento para aplicações React
- **React Hook Form** - Gerenciamento de formulários performático
- **Zod** - Validação de schemas TypeScript-first
- **Recharts** - Biblioteca de gráficos para React

## 📋 Pré-requisitos

- Node.js 18+
- npm

## 🔧 Instalação

```bash
npm install
```

## 💻 Scripts Disponíveis

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm start
# ou
npm run dev
```

Abre a aplicação em modo de desenvolvimento em [http://localhost:5173](http://localhost:5173).

### Build

```bash
# Build para produção
npm run build

# Build para desenvolvimento
npm run build:dev
```

Gera os arquivos otimizados para produção na pasta `dist/`.

### Preview

```bash
# Visualizar build de produção localmente
npm run preview
```

Permite visualizar a build de produção localmente antes do deploy.

### Linting e Formatação

```bash
# Executar linter
npm run lint

# Executar linter e corrigir problemas automaticamente
npm run lint:fix

# Formatar código com Prettier
npm run format
```

## 📁 Estrutura do Projeto

```
.
├── src/              # Código fonte da aplicação
├── public/           # Arquivos estáticos
├── dist/             # Build de produção (gerado)
├── node_modules/     # Dependências (gerado)
└── package.json      # Configurações e dependências do projeto
```

## 🎨 Componentes UI

Este template inclui uma biblioteca completa de componentes Shadcn UI baseados em Radix UI:

- Accordion
- Alert Dialog
- Avatar
- Button
- Checkbox
- Dialog
- Dropdown Menu
- Form
- Input
- Label
- Select
- Switch
- Tabs
- Toast
- Tooltip
- E muito mais...

## 📝 Ferramentas de Qualidade de Código

- **TypeScript**: Tipagem estática
- **ESLint**: Análise de código estático
- **Oxlint**: Linter extremamente rápido
- **Prettier**: Formatação automática de código

## 🔄 Workflow de Desenvolvimento

1. Instale as dependências: `npm install`
2. Inicie o servidor de desenvolvimento: `npm start`
3. Faça suas alterações
4. Verifique o código: `npm run lint`
5. Formate o código: `npm run format`
6. Crie a build: `npm run build`
7. Visualize a build: `npm run preview`

## 🎮 Features de Gamificação

### Sistema de Recompensas
- 🪙 **Moedas Virtuais**: Ganhe moedas por ações (check-in diário, fotos, conteúdo educativo)
- ⭐ **Sistema de XP e Níveis**: Progrida através de níveis com experiência acumulada
- 🔥 **Streak Counter**: Contador de dias consecutivos com recompensas especiais
- 🏆 **Badges e Conquistas**: Coleção de selos personalizados por marcos importantes

### Jornada Interativa
- 🗺️ **Mapa Temático**: 4 temas visuais ao longo da jornada (Floresta, Montanhas, Reino Mágico, Céu Estrelado)
- 🎯 **Missões Diárias**: Desafios diários com recompensas em moedas
- 📊 **Progresso Visual**: Acompanhamento detalhado da evolução do tratamento
- 🎉 **Celebrações**: Confetes e animações ao completar marcos importantes

### Conteúdo Educacional Gamificado
- 📚 Vídeos, artigos e quizzes interativos
- 🎁 Recompensas por cada conteúdo completado
- 🏫 "Escola de Heróis do Sorriso" - ambiente lúdico de aprendizado

### Animações e Efeitos Visuais
- ✨ Micro-animações em botões e cards (bounce, wiggle, shake, glow)
- 🎊 Sistema de confetes para celebrações
- 🌈 Gradientes coloridos e vibrantes
- 🎨 Design adaptado para público infantil

## 📦 Build e Deploy

### Build Local

Para criar uma build otimizada para produção:

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/` e estarão prontos para deploy.

### Deploy no Vercel 🚀

Este projeto está otimizado para deploy no Vercel com configurações pré-definidas.

**Método Rápido via CLI:**
```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**Método via Dashboard:**
1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe o repositório
3. Configure:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Deploy!

📖 **Guia Completo**: Veja [DEPLOY.md](./DEPLOY.md) para instruções detalhadas.

### Otimizações de Build
- ✅ Code splitting automático
- ✅ Minificação com esbuild
- ✅ Chunks otimizados por vendor
- ✅ Cache agressivo de assets
- ✅ Compressão Brotli no Vercel
