#!/bin/bash

echo "🚀 Script de Deploy Manual - Kids Aligner"
echo "========================================="
echo ""
echo "Este script vai fazer o deploy forçado no Vercel"
echo ""

# Verificar se está na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ ERRO: Execute este script na pasta do projeto!"
    exit 1
fi

echo "✅ Pasta correta detectada"
echo ""

# Verificar se Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI não encontrado. Instalando..."
    npm install -g vercel
fi

echo "✅ Vercel CLI instalado"
echo ""

# Fazer login (vai abrir navegador)
echo "🔐 Fazendo login no Vercel..."
echo "   (Uma página do navegador vai abrir para autenticação)"
echo ""

vercel login

echo ""
echo "🚀 Iniciando deploy com --force..."
echo ""

# Deploy com força
vercel --prod --force

echo ""
echo "========================================="
echo "✅ Deploy concluído!"
echo ""
echo "Próximos passos:"
echo "1. Aguarde 1-2 minutos para o build completar"
echo "2. Acesse a URL que apareceu acima"
echo "3. Force refresh: Ctrl+Shift+R (Windows) ou Cmd+Shift+R (Mac)"
echo "4. Verifique se as features de gamificação aparecem"
echo ""
