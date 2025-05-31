#!/bin/bash

# CoderBot v2 Deployment Validation Script
# This script validates that the Coolify deployment bundle is ready

set -e

echo "🔍 CoderBot v2 Deployment Validation"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Validation counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to check if file exists
check_file() {
    local file="$1"
    local description="$2"
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $description${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ $description - File missing: $file${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Function to check if directory exists
check_directory() {
    local dir="$1"
    local description="$2"
    
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✅ $description${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ $description - Directory missing: $dir${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Function to check file content
check_content() {
    local file="$1"
    local pattern="$2"
    local description="$3"
    
    if [ -f "$file" ] && grep -q "$pattern" "$file"; then
        echo -e "${GREEN}✅ $description${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${YELLOW}⚠️  $description - Pattern not found or file missing${NC}"
        WARNINGS=$((WARNINGS + 1))
        return 1
    fi
}

echo -e "${BLUE}📦 Checking Core Files...${NC}"

# Check essential deployment files
check_file "Dockerfile" "Docker configuration"
check_file "docker-compose.yml" "Docker Compose configuration"
check_file "coolify.yml" "Coolify configuration"
check_file ".env.production" "Production environment template"
check_file "COOLIFY_DEPLOYMENT.md" "Deployment documentation"

echo ""
echo -e "${BLUE}🐍 Checking Backend Components...${NC}"

# Check backend structure
check_directory "backend" "Backend directory"
check_file "backend/requirements.txt" "Python dependencies"
check_file "backend/app/main.py" "Main application file"
check_file "backend/app/config.py" "Configuration module"

# Check backend routers
check_directory "backend/app/routers" "API routers directory"
check_file "backend/app/routers/analytics_router.py" "Analytics router"
check_file "backend/app/routers/adaptive_learning_router.py" "Adaptive learning router"

# Check for health endpoint
check_content "backend/app/main.py" "@app.get(\"/health\"" "Health endpoint in main.py"

echo ""
echo -e "${BLUE}🌐 Checking Frontend Components...${NC}"

# Check frontend structure
check_directory "frontend" "Frontend directory"
check_file "frontend/package.json" "Frontend package configuration"
check_file "frontend/pnpm-lock.yaml" "Frontend lock file"
check_directory "frontend/src" "Frontend source directory"

echo ""
echo -e "${BLUE}💾 Checking PocketBase Components...${NC}"

# Check PocketBase
check_directory "pocketbase_0.27.2_linux_amd64" "PocketBase directory"
check_file "pocketbase_0.27.2_linux_amd64/pocketbase" "PocketBase binary"
check_directory "pocketbase_0.27.2_linux_amd64/pb_migrations" "PocketBase migrations"

# Check if PocketBase binary is executable
if [ -f "pocketbase_0.27.2_linux_amd64/pocketbase" ]; then
    if [ -x "pocketbase_0.27.2_linux_amd64/pocketbase" ]; then
        echo -e "${GREEN}✅ PocketBase binary is executable${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${YELLOW}⚠️  PocketBase binary is not executable${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

# Count migration files
MIGRATION_COUNT=$(ls pocketbase_0.27.2_linux_amd64/pb_migrations/*.js 2>/dev/null | wc -l)
if [ "$MIGRATION_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Found $MIGRATION_COUNT migration files${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ No migration files found${NC}"
    FAILED=$((FAILED + 1))
fi

echo ""
echo -e "${BLUE}🐳 Checking Docker Configuration...${NC}"

# Check Docker files content
check_content "Dockerfile" "FROM python:3.11-slim" "Python base image in Dockerfile"
check_content "Dockerfile" "COPY pocketbase_0.27.2_linux_amd64/pocketbase" "PocketBase copy in Dockerfile"
check_content "Dockerfile" "EXPOSE 8000 8090 3000 8080" "Port exposure in Dockerfile"
check_content "Dockerfile" "code-server" "Code-Server installation in Dockerfile"

# Check docker-compose configuration
check_content "docker-compose.yml" "ports:" "Port configuration in docker-compose"
check_content "docker-compose.yml" "8080:8080" "Code-Server port in docker-compose"
check_content "docker-compose.yml" "volumes:" "Volume configuration in docker-compose"
check_content "docker-compose.yml" "environment:" "Environment configuration in docker-compose"

echo ""
echo -e "${BLUE}🚀 Checking Startup Scripts...${NC}"

# Check startup script
check_file "docker/start.sh" "Startup script"
if [ -f "docker/start.sh" ]; then
    if [ -x "docker/start.sh" ]; then
        echo -e "${GREEN}✅ Startup script is executable${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${YELLOW}⚠️  Startup script is not executable${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

# Check startup script content for all services
check_content "docker/start.sh" "start_pocketbase" "PocketBase startup function"
check_content "docker/start.sh" "start_backend" "Backend startup function"
check_content "docker/start.sh" "start_code_server" "Code-Server startup function"

echo ""
echo -e "${BLUE}💻 Checking Code-Server Configuration...${NC}"

# Check code-server configuration
check_file "docker/code-server-config.yaml" "Code-Server configuration"
check_content "docker/code-server-config.yaml" "bind-addr: 0.0.0.0:8080" "Code-Server bind address"
check_content "docker/code-server-config.yaml" "auth: password" "Code-Server authentication"

echo ""
echo -e "${BLUE}⚙️  Checking Configuration Files...${NC}"

# Check environment files
check_file "backend/.env.example" "Backend environment example"
check_content ".env.production" "DEEP_SEEK_API_KEY" "AI API configuration template"
check_content ".env.production" "POCKETBASE_ADMIN_EMAIL" "PocketBase admin configuration"
check_content ".env.production" "CODE_SERVER_PASSWORD" "Code-Server password configuration"

# Check Coolify configuration
check_file "coolify.yml" "Coolify configuration"
check_content "coolify.yml" "8080" "Code-Server port in Coolify config"
check_content "coolify.yml" "CODE_SERVER_PASSWORD" "Code-Server environment in Coolify config"

echo ""
echo -e "${BLUE}📋 Validation Summary${NC}"
echo "===================="
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"

echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 Deployment bundle validation successful!${NC}"
    echo -e "${GREEN}Your CoderBot v2 bundle is ready for Coolify deployment.${NC}"
    echo ""
    echo -e "${BLUE}📝 Next Steps:${NC}"
    echo "1. Configure environment variables in Coolify"
    echo "2. Set up your Git repository"
    echo "3. Create new service in Coolify dashboard"
    echo "4. Deploy and monitor health endpoints"
    echo ""
    echo -e "${BLUE}📚 Quick Start:${NC}"
    echo "• Read: COOLIFY_DEPLOYMENT.md"
    echo "• Configure: .env.production"
    echo "• Deploy: Push to Git and deploy via Coolify"
    
    if [ $WARNINGS -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}⚠️  Note: There are $WARNINGS warnings that should be addressed.${NC}"
    fi
    
    exit 0
else
    echo -e "${RED}❌ Deployment bundle validation failed!${NC}"
    echo -e "${RED}Please fix the $FAILED failed checks before deploying.${NC}"
    exit 1
fi
