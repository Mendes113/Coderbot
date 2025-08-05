#!/bin/bash

# ==============================================
# CODERBOT V2 - SCRIPT DE SETUP E EXECUÇÃO
# ==============================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Função para verificar se o Docker está rodando
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        error "Docker não está rodando. Por favor, inicie o Docker e tente novamente."
        exit 1
    fi
    
    if ! docker-compose --version > /dev/null 2>&1; then
        error "Docker Compose não está instalado. Por favor, instale e tente novamente."
        exit 1
    fi
}

# Função para verificar se o arquivo .env existe
check_env() {
    if [ ! -f .env ]; then
        warn "Arquivo .env não encontrado. Criando a partir do .env.example..."
        if [ -f .env.example ]; then
            cp .env.example .env
            info "Arquivo .env criado. Por favor, configure as variáveis de ambiente antes de continuar."
            echo ""
            echo "Principais variáveis que precisam ser configuradas:"
            echo "  - DEEP_SEEK_API_KEY"
            echo "  - SUPABASE_URL e SUPABASE_KEY"
            echo "  - POCKETBASE_ADMIN_EMAIL e POCKETBASE_ADMIN_PASSWORD"
            echo "  - CODE_SERVER_PASSWORD (opcional)"
            echo ""
            read -p "Deseja continuar mesmo assim? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 0
            fi
        else
            error "Arquivo .env.example não encontrado!"
            exit 1
        fi
    fi
}

# Função para fazer build das imagens
build_images() {
    log "Fazendo build das imagens Docker..."
    docker-compose build --no-cache
}

# Função para iniciar todos os serviços
start_all() {
    log "Iniciando todos os serviços..."
    docker-compose up -d
    
    log "Aguardando serviços ficarem prontos..."
    sleep 10
    
    log "Status dos serviços:"
    docker-compose ps
    
    echo ""
    log "✅ Sistema iniciado com sucesso!"
    echo ""
    info "🔗 URLs dos serviços:"
    echo "  📱 Frontend:    http://localhost:3000"
    echo "  🔧 Backend:     http://localhost:8000"
    echo "  🗄️  PocketBase:  http://localhost:8090"
    echo "  💻 Code Server: http://localhost:8080 (opcional)"
    echo ""
    info "📊 Para ver logs em tempo real:"
    echo "  docker-compose logs -f"
    echo ""
    info "🛑 Para parar todos os serviços:"
    echo "  docker-compose down"
}

# Função para parar todos os serviços
stop_all() {
    log "Parando todos os serviços..."
    docker-compose down
    log "✅ Todos os serviços foram parados!"
}

# Função para ver logs
show_logs() {
    if [ -n "$1" ]; then
        log "Mostrando logs do serviço: $1"
        docker-compose logs -f "$1"
    else
        log "Mostrando logs de todos os serviços..."
        docker-compose logs -f
    fi
}

# Função para restart de um serviço específico
restart_service() {
    if [ -n "$1" ]; then
        log "Reiniciando serviço: $1"
        docker-compose restart "$1"
    else
        error "Nome do serviço não fornecido!"
        exit 1
    fi
}

# Função para limpeza
cleanup() {
    log "Removendo containers, volumes e imagens órfãs..."
    docker-compose down -v
    docker system prune -f
    log "✅ Limpeza concluída!"
}

# Função para mostrar status
show_status() {
    log "Status dos serviços:"
    docker-compose ps
    echo ""
    
    log "Uso de recursos:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

# Função para mostrar ajuda
show_help() {
    echo "🤖 CoderBot V2 - Sistema de Gerenciamento Docker"
    echo ""
    echo "Uso: $0 [COMANDO]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  setup     - Verifica dependências e faz build inicial"
    echo "  start     - Inicia todos os serviços"
    echo "  stop      - Para todos os serviços"
    echo "  restart   - Reinicia todos os serviços"
    echo "  build     - Reconstrói todas as imagens"
    echo "  logs      - Mostra logs (use 'logs [serviço]' para um serviço específico)"
    echo "  status    - Mostra status dos serviços"
    echo "  cleanup   - Remove containers, volumes e imagens órfãs"
    echo "  help      - Mostra esta ajuda"
    echo ""
    echo "Serviços disponíveis:"
    echo "  - frontend"
    echo "  - backend"
    echo "  - pocketbase"
    echo "  - code-server"
    echo ""
    echo "Exemplos:"
    echo "  $0 setup"
    echo "  $0 start"
    echo "  $0 logs backend"
    echo "  $0 restart frontend"
}

# Main
case "${1:-help}" in
    "setup")
        log "🚀 Configurando CoderBot V2..."
        check_docker
        check_env
        build_images
        log "✅ Setup concluído! Execute '$0 start' para iniciar o sistema."
        ;;
    "start")
        check_docker
        check_env
        start_all
        ;;
    "stop")
        stop_all
        ;;
    "restart")
        check_docker
        log "Reiniciando todos os serviços..."
        docker-compose restart
        log "✅ Reinicialização concluída!"
        ;;
    "build")
        check_docker
        build_images
        ;;
    "logs")
        show_logs "$2"
        ;;
    "status")
        show_status
        ;;
    "cleanup")
        cleanup
        ;;
    "help"|*)
        show_help
        ;;
esac
