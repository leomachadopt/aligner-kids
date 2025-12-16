#!/bin/bash

# Script para matar processos nas portas usadas pelo projeto
# Use quando houver conflitos de porta

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔧 Matando processos nas portas 3001 e 5173...${NC}\n"

# Porta 3001 (Backend)
if lsof -ti:3001 > /dev/null 2>&1; then
    echo -e "${RED}Matando processo na porta 3001 (Backend)...${NC}"
    kill -9 $(lsof -ti:3001) 2>/dev/null
    echo -e "${GREEN}✓ Porta 3001 liberada${NC}"
else
    echo -e "${GREEN}✓ Porta 3001 já está livre${NC}"
fi

# Porta 5173 (Frontend)
if lsof -ti:5173 > /dev/null 2>&1; then
    echo -e "${RED}Matando processo na porta 5173 (Frontend)...${NC}"
    kill -9 $(lsof -ti:5173) 2>/dev/null
    echo -e "${GREEN}✓ Porta 5173 liberada${NC}"
else
    echo -e "${GREEN}✓ Porta 5173 já está livre${NC}"
fi

echo -e "\n${GREEN}✓ Todas as portas foram verificadas e liberadas!${NC}"
echo -e "${YELLOW}Agora você pode executar: ./dev.sh${NC}\n"
