#!/bin/bash

# CoderBot v2 Startup Script for Coolify Deployment
set -e

echo "🚀 Starting CoderBot v2..."

# Set default environment variables if not provided
export POCKETBASE_URL=${POCKETBASE_URL:-"http://localhost:8090"}
export POCKETBASE_ADMIN_EMAIL=${POCKETBASE_ADMIN_EMAIL:-"admin@coderbot.dev"}
export POCKETBASE_ADMIN_PASSWORD=${POCKETBASE_ADMIN_PASSWORD:-"defaultpassword"}

# Create logs directory
mkdir -p /app/logs

# Function to start PocketBase
start_pocketbase() {
    echo "📊 Starting PocketBase..."
    cd /app/pocketbase
    
    # Set PocketBase data directory
    export PB_DATA_DIR="/app/data/pb_data"
    
    # Start PocketBase in background
    ./pocketbase serve --dir="$PB_DATA_DIR" --dev > /app/logs/pocketbase.log 2>&1 &
    POCKETBASE_PID=$!
    echo $POCKETBASE_PID > /app/logs/pocketbase.pid
    
    # Wait for PocketBase to start
    echo "⏳ Waiting for PocketBase to start..."
    for i in {1..30}; do
        if curl -s http://localhost:8090/api/health >/dev/null 2>&1; then
            echo "✅ PocketBase started successfully!"
            break
        fi
        sleep 2
    done
    
    if ! curl -s http://localhost:8090/api/health >/dev/null 2>&1; then
        echo "❌ Failed to start PocketBase"
        exit 1
    fi
}

# Function to start Backend API
start_backend() {
    echo "🐍 Starting Backend API..."
    cd /app/backend
    
    # Wait a bit for PocketBase to be fully ready
    sleep 5
    
    # Start FastAPI backend
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > /app/logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > /app/logs/backend.pid
    
    # Wait for backend to start
    echo "⏳ Waiting for Backend API to start..."
    for i in {1..30}; do
        if curl -s http://localhost:8000/health >/dev/null 2>&1 || curl -s http://localhost:8000/ >/dev/null 2>&1; then
            echo "✅ Backend API started successfully!"
            break
        fi
        sleep 2
    done
}

# Function to serve frontend (optional, for development)
serve_frontend() {
    if [ -d "/app/frontend/build" ]; then
        echo "🌐 Serving Frontend..."
        cd /app/frontend/build
        python -m http.server 3000 > /app/logs/frontend.log 2>&1 &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > /app/logs/frontend.pid
        echo "✅ Frontend served at http://localhost:3000"
    fi
}

# Function to start code-server
start_code_server() {
    echo "💻 Starting Code-Server..."
    
    # Create code-server data directory
    mkdir -p /app/data/code-server
    
    # Set environment variables for code-server
    export PASSWORD=${CODE_SERVER_PASSWORD:-"coderbot2024"}
    
    # Start code-server in background
    code-server \
        --config /app/code-server/config.yaml \
        --bind-addr 0.0.0.0:8080 \
        --auth password \
        --password "$PASSWORD" \
        --disable-telemetry \
        --disable-update-check \
        /app/workspace > /app/logs/code-server.log 2>&1 &
    
    CODE_SERVER_PID=$!
    echo $CODE_SERVER_PID > /app/logs/code-server.pid
    
    # Wait for code-server to start
    echo "⏳ Waiting for Code-Server to start..."
    for i in {1..30}; do
        if curl -s http://localhost:8080 >/dev/null 2>&1; then
            echo "✅ Code-Server started successfully!"
            break
        fi
        sleep 2
    done
    
    if ! curl -s http://localhost:8080 >/dev/null 2>&1; then
        echo "⚠️  Code-Server may take longer to start, check logs for details"
    fi
}

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down services..."
    
    if [ -f /app/logs/backend.pid ]; then
        kill $(cat /app/logs/backend.pid) 2>/dev/null || true
    fi
    
    if [ -f /app/logs/pocketbase.pid ]; then
        kill $(cat /app/logs/pocketbase.pid) 2>/dev/null || true
    fi
    
    if [ -f /app/logs/frontend.pid ]; then
        kill $(cat /app/logs/frontend.pid) 2>/dev/null || true
    fi
    
    if [ -f /app/logs/code-server.pid ]; then
        kill $(cat /app/logs/code-server.pid) 2>/dev/null || true
    fi
    
    echo "✅ Cleanup completed"
}

# Set trap for cleanup
trap cleanup SIGTERM SIGINT

# Check if required environment variables are set
if [ -z "$DEEP_SEEK_API_KEY" ] && [ -z "$OPEN_AI_API_KEY" ]; then
    echo "⚠️  Warning: No AI API keys configured. Some features may not work."
fi

# Start services
start_pocketbase
start_backend
serve_frontend
start_code_server

echo ""
echo "🎉 CoderBot v2 is running!"
echo "📊 PocketBase Admin: http://localhost:8090/_/"
echo "🔗 Backend API: http://localhost:8000"
echo "🌐 Frontend: http://localhost:3000"
echo "💻 Code-Server IDE: http://localhost:8080"
echo "📋 Health Check: http://localhost:8000/health"
echo ""
echo "📝 Logs are available in /app/logs/"
echo "🛑 Press Ctrl+C to stop all services"

# Keep the script running
while true; do
    sleep 30
    
    # Health checks
    if ! curl -s http://localhost:8090/api/health >/dev/null 2>&1; then
        echo "❌ PocketBase health check failed, restarting..."
        start_pocketbase
    fi
    
    if ! curl -s http://localhost:8000/health >/dev/null 2>&1 && ! curl -s http://localhost:8000/ >/dev/null 2>&1; then
        echo "❌ Backend health check failed, restarting..."
        start_backend
    fi
    
    if ! curl -s http://localhost:8080 >/dev/null 2>&1; then
        echo "❌ Code-Server health check failed, restarting..."
        start_code_server
    fi
done
