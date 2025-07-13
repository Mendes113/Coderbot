#!/bin/bash

# Script para gerenciar o ambiente de desenvolvimento do CodeBot
# Uso: ./dev.sh [comando]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para exibir ajuda
show_help() {
    echo -e "${BLUE}CodeBot - Ambiente de Desenvolvimento${NC}"
    echo ""
    echo "Comandos disponíveis:"
    echo -e "  ${GREEN}up${NC}        - Iniciar todos os serviços em modo desenvolvimento"
    echo -e "  ${GREEN}down${NC}      - Parar todos os serviços"
    echo -e "  ${GREEN}restart${NC}   - Reiniciar todos os serviços"
    echo -e "  ${GREEN}logs${NC}      - Exibir logs de todos os serviços"
    echo -e "  ${GREEN}logs-f${NC}    - Exibir logs em tempo real"
    echo -e "  ${GREEN}backend${NC}   - Exibir logs apenas do backend"
    echo -e "  ${GREEN}frontend${NC}  - Exibir logs apenas do frontend"
    echo -e "  ${GREEN}build${NC}     - Rebuildar todas as imagens"
    echo -e "  ${GREEN}clean${NC}     - Limpar containers, volumes e imagens"
    echo -e "  ${GREEN}status${NC}    - Exibir status dos serviços"
    echo ""
    echo "Exemplo: ./dev.sh up"
}

# Função para verificar se o Docker está rodando
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker não está rodando. Por favor, inicie o Docker primeiro.${NC}"
        exit 1
    fi
}

# Função para verificar se o arquivo .env existe
check_env() {
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}⚠️  Arquivo .env não encontrado. Criando arquivo de exemplo...${NC}"
        cat > .env << EOF
# Configurações do PocketBase
POCKETBASE_ADMIN_EMAIL=admin@coderbot.dev
POCKETBASE_ADMIN_PASSWORD=admin123456

# Chaves de API
DEEP_SEEK_API_KEY=your_deep_seek_api_key
DEEP_SEEK_API_URL=https://api.deepseek.com
OPEN_AI_API_KEY=your_openai_api_key
OPENAI_API_URL=https://api.openai.com
CLAUDE_API_KEY=your_claude_api_key
RAPIDAPI_KEY=your_rapidapi_key

# Supabase (opcional)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
EOF
        echo -e "${GREEN}✅ Arquivo .env criado. Configure as variáveis antes de continuar.${NC}"
    fi
}

# Comando principal
case "$1" in
    "up")
        check_docker
        check_env
        echo -e "${GREEN}🚀 Iniciando ambiente de desenvolvimento...${NC}"
        docker-compose -f docker-compose.dev.yml up -d --build
        echo -e "${GREEN}✅ Ambiente iniciado com sucesso!${NC}"
        echo ""
        echo -e "${BLUE}📋 Serviços disponíveis:${NC}"
        echo -e "  Frontend: ${YELLOW}http://localhost:3000${NC}"
        echo -e "  Backend:  ${YELLOW}http://localhost:8000${NC}"
        echo -e "  PocketBase: ${YELLOW}http://localhost:8090${NC}"
        echo -e "  Code Server: ${YELLOW}http://localhost:8787${NC}"
        echo ""
        echo -e "${BLUE}Para ver os logs: ${YELLOW}./dev.sh logs-f${NC}"
        ;;
    "down")
        echo -e "${YELLOW}🛑 Parando ambiente de desenvolvimento...${NC}"
        docker-compose -f docker-compose.dev.yml down
        echo -e "${GREEN}✅ Ambiente parado com sucesso!${NC}"
        ;;
    "restart")
        echo -e "${YELLOW}🔄 Reiniciando ambiente de desenvolvimento...${NC}"
        docker-compose -f docker-compose.dev.yml restart
        echo -e "${GREEN}✅ Ambiente reiniciado com sucesso!${NC}"
        ;;
    "logs")
        docker-compose -f docker-compose.dev.yml logs
        ;;
    "logs-f")
        echo -e "${BLUE}📋 Exibindo logs em tempo real (Ctrl+C para sair)...${NC}"
        docker-compose -f docker-compose.dev.yml logs -f
        ;;
    "backend")
        echo -e "${BLUE}📋 Logs do Backend:${NC}"
        docker-compose -f docker-compose.dev.yml logs -f backend
        ;;
    "frontend")
        echo -e "${BLUE}📋 Logs do Frontend:${NC}"
        docker-compose -f docker-compose.dev.yml logs -f frontend
        ;;
    "build")
        check_docker
        echo -e "${YELLOW}🔨 Rebuilding todas as imagens...${NC}"
        docker-compose -f docker-compose.dev.yml build --no-cache
        echo -e "${GREEN}✅ Build concluído!${NC}"
        ;;
    "clean")
        echo -e "${RED}🧹 Limpando containers, volumes e imagens...${NC}"
        docker-compose -f docker-compose.dev.yml down -v --remove-orphans
        docker system prune -f
        echo -e "${GREEN}✅ Limpeza concluída!${NC}"
        ;;
    "status")
        echo -e "${BLUE}📊 Status dos serviços:${NC}"
        docker-compose -f docker-compose.dev.yml ps
        ;;
    *)
        show_help
        ;;
esac 