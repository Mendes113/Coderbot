#!/bin/bash

# Setup script for CoderBot v2 Adaptive Learning System
# This script helps set up the database migrations for the adaptive learning features

set -e

echo "🚀 CoderBot v2 Adaptive Learning Setup"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if PocketBase directory exists
POCKETBASE_DIR="pocketbase_0.27.2_linux_amd64"
if [ ! -d "$POCKETBASE_DIR" ]; then
    echo -e "${RED}❌ PocketBase directory not found: $POCKETBASE_DIR${NC}"
    echo "Please ensure you're running this script from the coderbot-v2 directory"
    exit 1
fi

echo -e "${BLUE}📂 Found PocketBase directory${NC}"

# Check if pocketbase binary exists
if [ ! -f "$POCKETBASE_DIR/pocketbase" ]; then
    echo -e "${RED}❌ PocketBase binary not found${NC}"
    echo "Please ensure PocketBase is installed in $POCKETBASE_DIR"
    exit 1
fi

echo -e "${BLUE}✅ PocketBase binary found${NC}"

# Check for new migrations
MIGRATION_COUNT=$(ls "$POCKETBASE_DIR/pb_migrations/174820*" 2>/dev/null | wc -l)
if [ "$MIGRATION_COUNT" -eq 0 ]; then
    echo -e "${RED}❌ No adaptive learning migrations found${NC}"
    echo "Please ensure the migration files are present in $POCKETBASE_DIR/pb_migrations/"
    exit 1
fi

echo -e "${GREEN}📋 Found $MIGRATION_COUNT new adaptive learning migrations${NC}"

# List the migrations
echo -e "${BLUE}📝 Migrations to be applied:${NC}"
ls "$POCKETBASE_DIR/pb_migrations/174820"* | sort | while read migration; do
    basename_migration=$(basename "$migration")
    case "$basename_migration" in
        *user_learning_profiles*)
            echo "  1. $basename_migration - User Learning Profiles"
            ;;
        *learning_objectives*)
            echo "  2. $basename_migration - Learning Objectives"
            ;;
        *learning_paths*)
            echo "  3. $basename_migration - Personalized Learning Paths"
            ;;
        *assessment_questions*)
            echo "  4. $basename_migration - Assessment Questions"
            ;;
        *adaptive_assessments*)
            echo "  5. $basename_migration - Adaptive Assessment Instances"
            ;;
        *assessment_responses*)
            echo "  6. $basename_migration - Assessment Responses"
            ;;
        *adaptive_recommendations*)
            echo "  7. $basename_migration - AI Recommendations"
            ;;
        *learning_sessions*)
            echo "  8. $basename_migration - Learning Session Tracking"
            ;;
        *skill_matrices*)
            echo "  9. $basename_migration - Skill Progression Matrices"
            ;;
        *user_analytics*)
            echo " 10. $basename_migration - User Analytics"
            ;;
        *learning_streaks*)
            echo " 11. $basename_migration - Learning Streaks & Gamification"
            ;;
        *)
            echo "  ➤  $basename_migration"
            ;;
    esac
done

echo ""

# Check if PocketBase is running
if pgrep -f "pocketbase serve" > /dev/null; then
    echo -e "${YELLOW}⚠️  PocketBase appears to be running${NC}"
    echo "The server will be restarted to apply migrations"
    echo ""
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}❌ Setup cancelled${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}🛑 Stopping PocketBase...${NC}"
    pkill -f "pocketbase serve" || true
    sleep 2
fi

# Backup existing data
echo -e "${BLUE}💾 Creating backup...${NC}"
if [ -d "$POCKETBASE_DIR/pb_data" ]; then
    BACKUP_DIR="$POCKETBASE_DIR/pb_data_backup_$(date +%Y%m%d_%H%M%S)"
    cp -r "$POCKETBASE_DIR/pb_data" "$BACKUP_DIR"
    echo -e "${GREEN}✅ Backup created: $BACKUP_DIR${NC}"
else
    echo -e "${YELLOW}⚠️  No existing data found to backup${NC}"
fi

# Navigate to PocketBase directory
cd "$POCKETBASE_DIR"

# Start PocketBase to apply migrations
echo -e "${BLUE}🚀 Starting PocketBase to apply migrations...${NC}"
echo "This will apply all new migrations automatically"
echo ""

# Run PocketBase in background and capture its PID
./pocketbase serve --dev > pocketbase.log 2>&1 &
POCKETBASE_PID=$!

# Wait for PocketBase to start
echo -e "${BLUE}⏳ Waiting for PocketBase to start...${NC}"
sleep 5

# Check if PocketBase is running
if kill -0 "$POCKETBASE_PID" 2>/dev/null; then
    echo -e "${GREEN}✅ PocketBase started successfully (PID: $POCKETBASE_PID)${NC}"
    echo -e "${GREEN}📊 Admin UI available at: http://localhost:8090/_/${NC}"
    echo -e "${GREEN}🔗 API available at: http://localhost:8090/api/${NC}"
    echo ""
    echo -e "${BLUE}📋 Migrations applied successfully!${NC}"
    echo ""
    echo -e "${YELLOW}📝 Next steps:${NC}"
    echo "1. Visit the admin UI to verify the new collections"
    echo "2. Start the backend API server:"
    echo "   cd ../backend && python -m uvicorn app.main:app --reload"
    echo "3. Start the frontend development server:"
    echo "   cd ../frontend && npm run dev"
    echo ""
    echo -e "${GREEN}🎉 Adaptive Learning System is ready!${NC}"
    echo ""
    echo "Press Ctrl+C to stop PocketBase"
    
    # Keep the script running and forward signals to PocketBase
    trap "echo -e '\n${BLUE}🛑 Stopping PocketBase...${NC}'; kill $POCKETBASE_PID; exit 0" INT TERM
    wait $POCKETBASE_PID
else
    echo -e "${RED}❌ Failed to start PocketBase${NC}"
    echo "Check the log file: pocketbase.log"
    cat pocketbase.log
    exit 1
fi 