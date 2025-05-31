#!/bin/bash

# CoderBot v2 Coolify Deployment - Quick Setup Script
# This script prepares the deployment bundle and provides deployment instructions

echo "🚀 CoderBot v2 Coolify Deployment Setup"
echo "======================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}📦 Deployment Bundle Contents:${NC}"
echo "✓ Backend API (FastAPI + Python)"
echo "✓ PocketBase Database (59 migrations included)"
echo "✓ Frontend Build Configuration"
echo "✓ Docker Multi-stage Build"
echo "✓ Health Monitoring"
echo "✓ Persistent Storage Setup"
echo ""

echo -e "${BLUE}🔧 Running Bundle Validation...${NC}"
if [ -f "validate-deployment.sh" ]; then
    ./validate-deployment.sh
    VALIDATION_RESULT=$?
else
    echo "❌ Validation script not found"
    VALIDATION_RESULT=1
fi

if [ $VALIDATION_RESULT -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Bundle validation successful!${NC}"
    echo ""
    echo -e "${BLUE}📋 Coolify Deployment Checklist:${NC}"
    echo ""
    echo "□ 1. Create Git Repository"
    echo "   - Push this code to your Git repository"
    echo "   - Ensure all files are committed"
    echo ""
    echo "□ 2. Configure Environment Variables in Coolify:"
    echo "   Required:"
    echo "   - DEEP_SEEK_API_KEY or OPEN_AI_API_KEY"
    echo "   - POCKETBASE_ADMIN_EMAIL"
    echo "   - POCKETBASE_ADMIN_PASSWORD"
    echo ""
    echo "□ 3. Create Service in Coolify:"
    echo "   - Service Type: Git Repository"
    echo "   - Build Pack: Docker"
    echo "   - Dockerfile: Dockerfile"
    echo "   - Ports: 8000 (main), 8090 (admin), 3000 (frontend)"
    echo ""
    echo "□ 4. Configure Persistent Storage:"
    echo "   - /app/data/pb_data → Database storage"
    echo "   - /app/logs → Application logs"
    echo ""
    echo "□ 5. Deploy and Verify:"
    echo "   - Monitor deployment logs"
    echo "   - Check health endpoint: /health"
    echo "   - Access PocketBase admin: :8090/_/"
    echo ""
    echo -e "${YELLOW}📚 Documentation:${NC}"
    echo "• Complete Guide: COOLIFY_DEPLOYMENT.md"
    echo "• Environment Template: .env.production"
    echo "• Health Monitoring: /health, /analytics/health, /adaptive-learning/health"
    echo ""
    echo -e "${GREEN}🎯 Ready for Coolify Deployment!${NC}"
    echo "Your CoderBot v2 bundle includes everything needed for production deployment."
    echo ""
    echo -e "${BLUE}💡 Quick Start Commands:${NC}"
    echo "git add ."
    echo "git commit -m 'Add Coolify deployment bundle'"
    echo "git push origin main"
    echo ""
    echo "Then create a new service in your Coolify dashboard using this repository."
    
else
    echo ""
    echo "❌ Bundle validation failed. Please fix the issues before deploying."
    exit 1
fi
