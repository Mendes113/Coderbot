# ==============================================
# CODERBOT V2 - MAKEFILE
# ==============================================

.PHONY: help setup start stop restart build logs status cleanup dev prod

# Variáveis
COMPOSE_FILE = docker-compose.yml
PROJECT_NAME = coderbot-v2

# Detectar se é Linux ou macOS para Docker Compose
DOCKER_COMPOSE := $(shell command -v docker-compose 2> /dev/null)
ifndef DOCKER_COMPOSE
	DOCKER_COMPOSE := docker compose
endif

# Cores para output (compatível com make)
GREEN = \033[0;32m
YELLOW = \033[1;33m
BLUE = \033[0;34m
RED = \033[0;31m
NC = \033[0m

# Default target
help: ## 📋 Mostra esta ajuda
	@echo "🤖 $(GREEN)CoderBot V2$(NC) - Sistema de Gerenciamento Docker"
	@echo ""
	@echo "$(BLUE)Comandos disponíveis:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-12s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(BLUE)Exemplos:$(NC)"
	@echo "  make setup    # Primeira configuração"
	@echo "  make start    # Iniciar sistema"
	@echo "  make logs     # Ver todos os logs"
	@echo "  make dev      # Modo desenvolvimento"

setup: ## 🚀 Configuração inicial completa
	@echo "$(GREEN)🚀 Configurando CoderBot V2...$(NC)"
	@./docker-setup.sh setup

start: ## ▶️  Iniciar todos os serviços
	@echo "$(GREEN)▶️  Iniciando CoderBot V2...$(NC)"
	@$(DOCKER_COMPOSE) up -d
	@$(MAKE) status

stop: ## ⏹️  Parar todos os serviços
	@echo "$(YELLOW)⏹️  Parando CoderBot V2...$(NC)"
	@$(DOCKER_COMPOSE) down

restart: ## 🔄 Reiniciar todos os serviços
	@echo "$(BLUE)🔄 Reiniciando CoderBot V2...$(NC)"
	@$(DOCKER_COMPOSE) restart
	@$(MAKE) status

build: ## 🔨 Reconstruir todas as imagens
	@echo "$(BLUE)🔨 Reconstruindo imagens...$(NC)"
	@$(DOCKER_COMPOSE) build --no-cache

logs: ## 📜 Ver logs de todos os serviços
	@$(DOCKER_COMPOSE) logs -f

logs-backend: ## 📜 Ver logs apenas do backend
	@$(DOCKER_COMPOSE) logs -f backend

logs-frontend: ## 📜 Ver logs apenas do frontend
	@$(DOCKER_COMPOSE) logs -f frontend

logs-pocketbase: ## 📜 Ver logs apenas do PocketBase
	@$(DOCKER_COMPOSE) logs -f pocketbase

status: ## 📊 Status dos serviços e recursos
	@echo "$(BLUE)📊 Status dos serviços:$(NC)"
	@$(DOCKER_COMPOSE) ps
	@echo ""
	@echo "$(BLUE)🔗 URLs disponíveis:$(NC)"
	@echo "  📱 Frontend:    http://localhost:3000"
	@echo "  🔧 Backend:     http://localhost:8000"
	@echo "  🗄️  PocketBase:  http://localhost:8090"
	@echo "  💻 Code Server: http://localhost:8080"

dev: ## 🛠️  Modo desenvolvimento (com hot reload)
	@echo "$(GREEN)🛠️  Iniciando em modo desenvolvimento...$(NC)"
	@$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)✅ Modo desenvolvimento ativo!$(NC)"
	@echo ""
	@echo "$(YELLOW)💡 Dicas para desenvolvimento:$(NC)"
	@echo "  • Frontend hot reload: Edite arquivos em ./frontend/"
	@echo "  • Backend hot reload: Edite arquivos em ./backend/"
	@echo "  • Ver logs: make logs"
	@echo "  • Reiniciar serviço: make restart-[serviço]"

prod: ## 🚀 Modo produção
	@echo "$(GREEN)🚀 Preparando para produção...$(NC)"
	@$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) up -d --build
	@echo "$(GREEN)✅ Sistema em produção!$(NC)"

cleanup: ## 🧹 Limpeza completa (⚠️  Remove volumes!)
	@echo "$(RED)⚠️  ATENÇÃO: Isso removerá todos os dados!$(NC)"
	@read -p "Tem certeza? (y/N): " confirm && [ "$$confirm" = "y" ]
	@echo "$(YELLOW)🧹 Fazendo limpeza completa...$(NC)"
	@$(DOCKER_COMPOSE) down -v --remove-orphans
	@docker system prune -f
	@echo "$(GREEN)✅ Limpeza concluída!$(NC)"

# Comandos específicos por serviço
restart-frontend: ## 🔄 Reiniciar apenas frontend
	@$(DOCKER_COMPOSE) restart frontend

restart-backend: ## 🔄 Reiniciar apenas backend
	@$(DOCKER_COMPOSE) restart backend

restart-pocketbase: ## 🔄 Reiniciar apenas PocketBase
	@$(DOCKER_COMPOSE) restart pocketbase

# Comandos de shell
shell-backend: ## 🐚 Acessar shell do backend
	@$(DOCKER_COMPOSE) exec backend bash

shell-frontend: ## 🐚 Acessar shell do frontend
	@$(DOCKER_COMPOSE) exec frontend sh

shell-pocketbase: ## 🐚 Acessar shell do PocketBase
	@$(DOCKER_COMPOSE) exec pocketbase sh

# Comandos de monitoramento
health: ## 🏥 Verificar saúde dos serviços
	@echo "$(BLUE)🏥 Verificando saúde dos serviços...$(NC)"
	@curl -s http://localhost:8000/health | jq '.' || echo "❌ Backend indisponível"
	@curl -s http://localhost:3000 > /dev/null && echo "✅ Frontend funcionando" || echo "❌ Frontend indisponível"
	@curl -s http://localhost:8090/api/health > /dev/null && echo "✅ PocketBase funcionando" || echo "❌ PocketBase indisponível"

stats: ## 📈 Estatísticas de uso dos containers
	@echo "$(BLUE)📈 Estatísticas de recursos:$(NC)"
	@docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"

# Comandos de backup
backup: ## 💾 Backup dos dados do PocketBase
	@echo "$(BLUE)💾 Fazendo backup do PocketBase...$(NC)"
	@mkdir -p ./backups
	@$(DOCKER_COMPOSE) exec pocketbase cp -r /pb/pb_data /pb/backup-$$(date +%Y%m%d_%H%M%S)
	@echo "$(GREEN)✅ Backup criado em ./backups/$(NC)"

# Comandos de testes
test-backend: ## 🧪 Testes do backend
	@echo "$(BLUE)🧪 Executando testes do backend...$(NC)"
	@$(DOCKER_COMPOSE) exec backend python -m pytest

test-frontend: ## 🧪 Testes do frontend
	@echo "$(BLUE)🧪 Executando testes do frontend...$(NC)"
	@$(DOCKER_COMPOSE) exec frontend npm test

# Comandos utilitários
env-check: ## ✅ Verificar configuração do ambiente
	@echo "$(BLUE)✅ Verificando configuração...$(NC)"
	@[ -f .env ] && echo "✅ Arquivo .env encontrado" || echo "❌ Arquivo .env não encontrado"
	@docker --version > /dev/null && echo "✅ Docker instalado" || echo "❌ Docker não encontrado"
	@$(DOCKER_COMPOSE) --version > /dev/null && echo "✅ Docker Compose instalado" || echo "❌ Docker Compose não encontrado"

update: ## 🔄 Atualizar sistema (git pull + rebuild)
	@echo "$(BLUE)🔄 Atualizando sistema...$(NC)"
	@git pull
	@$(MAKE) build
	@$(MAKE) restart
	@echo "$(GREEN)✅ Sistema atualizado!$(NC)"

# Modo quick start para novos usuários
quick-start: ## 🚀 Início rápido (setup + start)
	@echo "$(GREEN)🚀 Início rápido do CoderBot V2...$(NC)"
	@$(MAKE) env-check
	@$(MAKE) setup
	@$(MAKE) start
	@echo ""
	@echo "$(GREEN)🎉 CoderBot V2 está rodando!$(NC)"
	@echo "$(BLUE)🔗 Acesse: http://localhost:3000$(NC)"
