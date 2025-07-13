# ==============================================
# CODERBOT V2 - DEVELOPMENT MAKEFILE
# ==============================================

.PHONY: help dev-up dev-down dev-restart dev-logs dev-logs-f dev-backend dev-frontend dev-build dev-clean dev-status

# Default target
help:
	@echo "CodeBot V2 - Development Environment"
	@echo ""
	@echo "Available commands:"
	@echo "  make dev-up        - Start development environment"
	@echo "  make dev-down      - Stop development environment"
	@echo "  make dev-restart   - Restart development environment"
	@echo "  make dev-logs      - Show all logs"
	@echo "  make dev-logs-f    - Show logs in real-time"
	@echo "  make dev-backend   - Show backend logs"
	@echo "  make dev-frontend  - Show frontend logs"
	@echo "  make dev-build     - Rebuild all images"
	@echo "  make dev-clean     - Clean containers, volumes and images"
	@echo "  make dev-status    - Show services status"
	@echo ""
	@echo "Quick start:"
	@echo "  make dev-up        # Start the development environment"
	@echo "  make dev-logs-f    # Watch logs in real-time"

# Development environment commands
dev-up:
	@echo "🚀 Starting development environment..."
	@./dev.sh up

dev-down:
	@echo "🛑 Stopping development environment..."
	@./dev.sh down

dev-restart:
	@echo "🔄 Restarting development environment..."
	@./dev.sh restart

dev-logs:
	@echo "📋 Showing all logs..."
	@./dev.sh logs

dev-logs-f:
	@echo "📋 Showing logs in real-time..."
	@./dev.sh logs-f

dev-backend:
	@echo "📋 Showing backend logs..."
	@./dev.sh backend

dev-frontend:
	@echo "📋 Showing frontend logs..."
	@./dev.sh frontend

dev-build:
	@echo "🔨 Rebuilding all images..."
	@./dev.sh build

dev-clean:
	@echo "🧹 Cleaning containers, volumes and images..."
	@./dev.sh clean

dev-status:
	@echo "📊 Showing services status..."
	@./dev.sh status

# Production environment commands (using original docker-compose)
prod-up:
	@echo "🚀 Starting production environment..."
	@docker-compose up -d --build

prod-down:
	@echo "🛑 Stopping production environment..."
	@docker-compose down

prod-logs:
	@echo "📋 Showing production logs..."
	@docker-compose logs

prod-logs-f:
	@echo "📋 Showing production logs in real-time..."
	@docker-compose logs -f

# Setup commands
setup:
	@echo "🔧 Setting up development environment..."
	@if [ ! -f .env ]; then cp env.example .env; echo "✅ Created .env file from env.example"; fi
	@chmod +x dev.sh
	@echo "✅ Development environment setup complete!"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Edit .env file with your API keys"
	@echo "  2. Run 'make dev-up' to start the environment"

# Utility commands
check:
	@echo "🔍 Checking prerequisites..."
	@command -v docker >/dev/null 2>&1 || { echo "❌ Docker is not installed"; exit 1; }
	@command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is not installed"; exit 1; }
	@echo "✅ All prerequisites are installed"

# Quick development workflow
dev: dev-up dev-logs-f

# Clean everything and start fresh
fresh: dev-clean setup dev-up
