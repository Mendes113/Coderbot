# Multi-stage Docker build for CoderBot v2 - Coolify Deployment
FROM python:3.11-slim as python-base

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies including Node.js for code-server
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    unzip \
    git \
    sudo \
    openssh-client \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (required for code-server)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Stage 2: Build the backend
FROM python-base as backend-builder

WORKDIR /app

# Copy backend requirements and install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application
COPY backend/ .

# Stage 3: Frontend builder
FROM node:18-alpine as frontend-builder

WORKDIR /app

# Copy frontend package files
COPY frontend/package*.json ./
COPY frontend/pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy frontend source and build
COPY frontend/ .
RUN pnpm build

# Stage 4: Final runtime image
FROM python-base as runtime

# Install additional dependencies for code-server
RUN apt-get update && apt-get install -y \
    git \
    sudo \
    openssh-client \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (required for code-server)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Create app user and add to sudo group for code-server
RUN useradd --create-home --shell /bin/bash app \
    && echo "app ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Install code-server
RUN curl -fsSL https://code-server.dev/install.sh | sh

# Set working directory
WORKDIR /app

# Create necessary directories
RUN mkdir -p /app/backend /app/frontend/build /app/pocketbase /app/data /app/workspace /app/code-server

# Copy Python dependencies from builder
COPY --from=backend-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend-builder /usr/local/bin /usr/local/bin

# Copy backend application
COPY --from=backend-builder /app /app/backend

# Copy built frontend
COPY --from=frontend-builder /app/build /app/frontend/build

# Copy PocketBase and its data
COPY pocketbase_0.27.2_linux_amd64/pocketbase /app/pocketbase/pocketbase
COPY pocketbase_0.27.2_linux_amd64/pb_migrations /app/pocketbase/pb_migrations

# Make PocketBase executable
RUN chmod +x /app/pocketbase/pocketbase

# Copy startup script and code-server configuration
COPY docker/start.sh /app/start.sh
COPY docker/code-server-config.yaml /app/code-server/config.yaml
RUN chmod +x /app/start.sh

# Create data directory for PocketBase and workspace
RUN mkdir -p /app/data/pb_data /app/workspace/projects

# Copy project files to workspace
COPY backend /app/workspace/backend
COPY frontend /app/workspace/frontend
COPY pocketbase_0.27.2_linux_amd64 /app/workspace/pocketbase
COPY *.md /app/workspace/
COPY *.yml /app/workspace/

# Change ownership to app user
RUN chown -R app:app /app

# Switch to app user
USER app

# Expose ports (Backend: 8000, PocketBase: 8090, Frontend: 3000, Code-Server: 8080)
EXPOSE 8000 8090 3000 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start the application
CMD ["/app/start.sh"]
