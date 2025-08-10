#!/bin/bash

# ==============================================
# CODERBOT V2 - SETUP DE DESENVOLVIMENTO
# ==============================================
# Script para configurar automaticamente o ambiente de desenvolvimento

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para exibir mensagens coloridas
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${BLUE}🤖 CoderBot V2 - Setup de Desenvolvimento${NC}"
    echo "=============================================="
}

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Função para verificar pré-requisitos
check_prerequisites() {
    print_info "Verificando pré-requisitos..."
    
    if ! command_exists docker; then
        print_error "Docker não está instalado. Instale o Docker primeiro."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose não está instalado. Instale o Docker Compose primeiro."
        exit 1
    fi
    
    print_success "Pré-requisitos verificados"
}

# Função para configurar arquivo .env
setup_env_files() {
    print_info "Configurando arquivos .env..."
    
    # Arquivo .env principal
    if [ ! -f ".env" ]; then
        print_warning "Arquivo .env não encontrado. Criando arquivo padrão..."
        cat > .env << 'EOF'
# ==============================================
# CODERBOT V2 - CONFIGURAÇÕES DO AMBIENTE
# ==============================================

EOF
        print_success "Arquivo .env criado"
    else
        print_info "Arquivo .env já existe"
    fi
    
    # Arquivo .env do backend
    if [ ! -f "backend/.env" ]; then
        print_warning "Arquivo backend/.env não encontrado. Criando arquivo padrão..."
        cat > backend/.env << 'EOF'

EOF
        print_success "Arquivo backend/.env criado"
    else
        print_info "Arquivo backend/.env já existe"
        # Verificar se a URL do PocketBase está correta
        if grep -q "POCKETBASE_URL=http://127.0.0.1:8090" backend/.env; then
            print_warning "Corrigindo URL do PocketBase no backend/.env..."
            sed -i 's/POCKETBASE_URL=http:\/\/127.0.0.1:8090/POCKETBASE_URL=http:\/\/pocketbase:8090/g' backend/.env
            print_success "URL do PocketBase corrigida"
        fi
    fi
    
    # Arquivo .env do frontend
    if [ ! -f "frontend/.env" ]; then
        print_warning "Arquivo frontend/.env não encontrado. Criando arquivo padrão..."
        cat > frontend/.env << 'EOF'
VITE_API_URL=http://localhost:8000
VITE_POCKETBASE_URL=http://localhost:8090
NODE_ENV=development
EOF
        print_success "Arquivo frontend/.env criado"
    else
        print_info "Arquivo frontend/.env já existe"
    fi
}

# Função para iniciar o ambiente
start_environment() {
    print_info "Iniciando ambiente de desenvolvimento..."
    
    # Tornar o script dev.sh executável
    chmod +x dev.sh
    
    # Iniciar os serviços
    ./dev.sh up
    
    print_success "Ambiente iniciado com sucesso!"
}

# Função para configurar o PocketBase
setup_pocketbase() {
    print_info "Configurando PocketBase..."
    
    # Aguardar o PocketBase iniciar
    print_info "Aguardando PocketBase iniciar..."
    sleep 10
    
    # Verificar se o PocketBase está rodando
    if ! docker ps | grep -q "coderbot-pocketbase-dev"; then
        print_error "PocketBase não está rodando. Verifique os logs com: ./dev.sh logs pocketbase"
        exit 1
    fi
    
    # Criar usuário admin
    print_info "Criando usuário admin no PocketBase..."
    docker exec -it coderbot-pocketbase-dev /pb/pocketbase superuser upsert andremendes0113@gmail.com coderbotdagalera || true
    
    # Aguardar um pouco
    sleep 3
    
    # Criar usuário regular
    print_info "Criando usuário regular no PocketBase..."
    curl -X POST http://localhost:8090/api/collections/users/records \
      -H "Content-Type: application/json" \
      -d '{
        "email": "andremendes0113@gmail.com",
        "password": "coderbotdagalera",
        "passwordConfirm": "coderbotdagalera",
        "name": "Andre Mendes"
      }' >/dev/null 2>&1 || print_warning "Usuário já pode existir"
    
    # Reiniciar backend para aplicar configurações
    print_info "Reiniciando backend para aplicar configurações..."
    docker restart coderbot-backend-dev
    
    print_success "PocketBase configurado com sucesso!"
}

# Função para testar a configuração
test_configuration() {
    print_info "Testando configuração..."
    
    # Aguardar serviços estabilizarem
    sleep 5
    
    # Testar frontend
    if curl -s http://localhost:3000 >/dev/null; then
        print_success "Frontend está rodando em http://localhost:3000"
    else
        print_warning "Frontend pode não estar pronto ainda"
    fi
    
    # Testar backend
    if curl -s http://localhost:8000/health >/dev/null; then
        print_success "Backend está rodando em http://localhost:8000"
    else
        print_warning "Backend pode não estar pronto ainda"
    fi
    
    # Testar PocketBase
    if curl -s http://localhost:8090/api/health >/dev/null; then
        print_success "PocketBase está rodando em http://localhost:8090"
    else
        print_warning "PocketBase pode não estar pronto ainda"
    fi
}

# Função para exibir informações finais
show_final_info() {
    echo
    print_success "🎉 Setup concluído com sucesso!"
    echo
    echo -e "${BLUE}📋 Serviços disponíveis:${NC}"
    echo "  🌐 Frontend:    http://localhost:3000"
    echo "  🔧 Backend:     http://localhost:8000"
    echo "  🗄️  PocketBase:  http://localhost:8090"
    echo "  💻 Code Server: http://localhost:8787"
    echo
    echo -e "${BLUE}🔑 Credenciais padrão:${NC}"
    echo "  📧 Email:    andremendes0113@gmail.com"
    echo "  🔒 Senha:    coderbotdagalera"
    echo
    echo -e "${BLUE}📚 Comandos úteis:${NC}"
    echo "  ./dev.sh logs-f    # Ver logs em tempo real"
    echo "  ./dev.sh restart   # Reiniciar serviços"
    echo "  ./dev.sh down      # Parar serviços"
    echo "  ./dev.sh status    # Ver status dos serviços"
    echo
    echo -e "${YELLOW}💡 Dicas:${NC}"
    echo "  • Hot reload está ativo no frontend e backend"
    echo "  • Edite arquivos e veja as mudanças automaticamente"
    echo "  • Use Ctrl+C para parar os logs"
    echo
}

# Função principal
main() {
    print_header
    echo
    
    check_prerequisites
    setup_env_files
    start_environment
    setup_pocketbase
    test_configuration
    show_final_info
}

# Executar função principal
main "$@" 