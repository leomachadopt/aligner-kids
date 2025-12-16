#!/bin/bash

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando Kids Aligner...${NC}\n"

# Verifica se o .env existe
if [ ! -f .env ]; then
  echo -e "${RED}❌ Arquivo .env não encontrado!${NC}"
  echo -e "${YELLOW}Por favor, crie o arquivo .env com as variáveis necessárias.${NC}"
  exit 1
fi

# Função para limpar processos ao sair
cleanup() {
  echo -e "\n${YELLOW}🛑 Encerrando serviços...${NC}"
  if [ ! -z "$BACKEND_PID" ]; then
    kill $BACKEND_PID 2>/dev/null
  fi
  if [ ! -z "$FRONTEND_PID" ]; then
    kill $FRONTEND_PID 2>/dev/null
  fi
  echo -e "${GREEN}✅ Serviços encerrados${NC}"
  exit 0
}

trap cleanup EXIT INT TERM

# Verifica se as portas estão disponíveis
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
  echo -e "${YELLOW}⚠️  Porta 3001 já está em uso${NC}"
  echo -e "${BLUE}Matando processo existente...${NC}"
  lsof -ti:3001 | xargs kill -9 2>/dev/null
  sleep 1
fi

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
  echo -e "${YELLOW}⚠️  Porta 5173 já está em uso${NC}"
  echo -e "${BLUE}Matando processo existente...${NC}"
  lsof -ti:5173 | xargs kill -9 2>/dev/null
  sleep 1
fi

# Inicia o backend
echo -e "${BLUE}🔧 Iniciando backend na porta 3001...${NC}"
pnpm run server > backend.log 2>&1 &
BACKEND_PID=$!

# Aguarda o backend iniciar
echo -e "${BLUE}⏳ Aguardando backend inicializar...${NC}"
for i in {1..30}; do
  if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend iniciado com sucesso!${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${RED}❌ Backend não iniciou após 30 segundos${NC}"
    echo -e "${YELLOW}Logs do backend:${NC}"
    tail -20 backend.log
    exit 1
  fi
  sleep 1
done

# Inicia o frontend
echo -e "${BLUE}🎨 Iniciando frontend na porta 5173...${NC}"
pnpm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Aguarda o frontend iniciar
echo -e "${BLUE}⏳ Aguardando frontend inicializar...${NC}"
sleep 3

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Kids Aligner está rodando!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
echo -e "${BLUE}📱 Frontend:  ${NC}http://localhost:5173"
echo -e "${BLUE}🔧 Backend:   ${NC}http://localhost:3001"
echo -e "${BLUE}⚕️  Health:    ${NC}http://localhost:3001/api/health"
echo -e "${BLUE}📊 DB Studio: ${NC}pnpm db:studio\n"
echo -e "${YELLOW}💡 Dica: Pressione Ctrl+C para encerrar${NC}\n"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Mostra logs em tempo real
echo -e "${BLUE}📋 Monitorando logs (últimas 50 linhas):${NC}\n"
tail -f -n 50 backend.log frontend.log
