#!/bin/bash

# Code-Server Integration Test Script for CoderBot v2
# This script tests the code-server integration within the deployment bundle

set -e

echo "💻 Code-Server Integration Test"
echo "==============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0

# Function to test specific functionality
test_function() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${BLUE}Testing: $test_name${NC}"
    
    if eval "$test_command" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $test_name - PASSED${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ $test_name - FAILED${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo ""
echo -e "${BLUE}🔍 Testing Code-Server Configuration Files...${NC}"

# Test configuration file structure
test_function "Code-Server config file exists" "test -f docker/code-server-config.yaml"
test_function "Config has bind address" "grep -q 'bind-addr: 0.0.0.0:8080' docker/code-server-config.yaml"
test_function "Config has password auth" "grep -q 'auth: password' docker/code-server-config.yaml"
test_function "Config disables telemetry" "grep -q 'disable-telemetry: true' docker/code-server-config.yaml"

echo ""
echo -e "${BLUE}🐳 Testing Docker Integration...${NC}"

# Test Docker configuration
test_function "Dockerfile exposes port 8080" "grep -q 'EXPOSE.*8080' Dockerfile"
test_function "Dockerfile installs code-server" "grep -q 'code-server.dev/install.sh' Dockerfile"
test_function "Dockerfile copies config" "grep -q 'code-server-config.yaml' Dockerfile"
test_function "Dockerfile creates workspace" "grep -q '/app/workspace' Dockerfile"

echo ""
echo -e "${BLUE}🐙 Testing Docker Compose Configuration...${NC}"

# Test docker-compose configuration
test_function "Docker-compose maps port 8080" "grep -q '8080:8080' docker-compose.yml"
test_function "Docker-compose has code-server env" "grep -q 'CODE_SERVER_PASSWORD' docker-compose.yml"
test_function "Docker-compose has code-server volume" "grep -q 'code_server_data' docker-compose.yml"
test_function "Docker-compose has workspace volume" "grep -q 'workspace_data' docker-compose.yml"

echo ""
echo -e "${BLUE}🚀 Testing Startup Script Integration...${NC}"

# Test startup script
test_function "Startup script has code-server function" "grep -q 'start_code_server' docker/start.sh"
test_function "Startup script calls code-server" "grep -q 'start_code_server' docker/start.sh"
test_function "Startup script has code-server cleanup" "grep -q 'code-server.pid' docker/start.sh"
test_function "Startup script has code-server health check" "grep -q 'localhost:8080' docker/start.sh"

echo ""
echo -e "${BLUE}☁️  Testing Coolify Configuration...${NC}"

# Test Coolify configuration
test_function "Coolify config exposes port 8080" "grep -q '8080' coolify.yml"
test_function "Coolify has code-server env" "grep -q 'CODE_SERVER_PASSWORD' coolify.yml"
test_function "Coolify has code-server volume" "grep -q 'code_server_data' coolify.yml"
test_function "Coolify has workspace volume" "grep -q 'workspace_data' coolify.yml"

echo ""
echo -e "${BLUE}🔧 Testing Environment Configuration...${NC}"

# Test environment configuration
test_function "Production env has code-server password" "grep -q 'CODE_SERVER_PASSWORD' .env.production"

echo ""
echo -e "${BLUE}📁 Testing Workspace Structure...${NC}"

# Test that key project files exist for workspace
test_function "Backend directory exists" "test -d backend"
test_function "Frontend directory exists" "test -d frontend"
test_function "PocketBase directory exists" "test -d pocketbase_0.27.2_linux_amd64"
test_function "Documentation exists" "test -f COOLIFY_DEPLOYMENT.md"

echo ""
echo -e "${BLUE}📋 Integration Test Summary${NC}"
echo "=========================="
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"

echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 Code-Server integration test successful!${NC}"
    echo -e "${GREEN}Your code-server is properly integrated into the CoderBot v2 bundle.${NC}"
    echo ""
    echo -e "${BLUE}💻 Code-Server Features Available:${NC}"
    echo "• Web-based VS Code IDE at :8080"
    echo "• Full project workspace access"
    echo "• Integrated terminal and debugging"
    echo "• VS Code extensions support"
    echo "• Real-time file editing"
    echo ""
    echo -e "${BLUE}🔐 Default Access:${NC}"
    echo "• URL: http://localhost:8080 (or your domain:8080)"
    echo "• Password: coderbot2024 (configurable via CODE_SERVER_PASSWORD)"
    echo "• Workspace: /app/workspace (contains all project files)"
    exit 0
else
    echo -e "${RED}❌ Code-Server integration test failed!${NC}"
    echo -e "${RED}Please fix the $FAILED failed checks before deploying.${NC}"
    echo ""
    echo -e "${YELLOW}💡 Common fixes:${NC}"
    echo "• Ensure docker/code-server-config.yaml exists"
    echo "• Check Dockerfile includes code-server installation"
    echo "• Verify startup script includes code-server functions"
    echo "• Confirm all configuration files have code-server settings"
    exit 1
fi
