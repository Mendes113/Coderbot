# CoderBot v2 - Coolify Deployment Guide

## 🚀 Coolify Deployment Bundle

This repository contains a complete Coolify-deployable bundle for CoderBot v2, an advanced educational platform with AI-powered adaptive learning.

## 📦 What's Included

- **Backend API** (FastAPI) - AI-powered educational engine
- **PocketBase Database** - Embedded database with migrations
- **Frontend Build** - React-based educational interface
- **Code-Server IDE** - Web-based VS Code development environment
- **Docker Configuration** - Multi-stage optimized build
- **Health Monitoring** - Built-in health checks for all services

## 🔧 Quick Deploy to Coolify

### 1. Prerequisites

- Coolify server setup and running
- At least 2GB RAM and 1 CPU core available
- Domain name configured (optional but recommended)

### 2. Environment Variables Setup

In your Coolify dashboard, configure these environment variables:

#### Required - AI API Keys (at least one)
```bash
DEEP_SEEK_API_KEY=your_deepseek_api_key
OPEN_AI_API_KEY=your_openai_api_key
CLAUDE_API_KEY=your_claude_api_key
```

#### Required - Security Configuration
```bash
POCKETBASE_ADMIN_EMAIL=admin@yourcompany.com
POCKETBASE_ADMIN_PASSWORD=your_secure_admin_password
POCKETBASE_USER_EMAIL=user@yourcompany.com
POCKETBASE_USER_PASSWORD=your_secure_user_password
```

#### Optional - Additional Services

```bash
RAPIDAPI_KEY=your_rapidapi_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
CODE_SERVER_PASSWORD=your_secure_code_server_password
```

### 3. Deploy to Coolify

1. **Create New Service** in Coolify dashboard
2. **Choose "Git Repository"** as source
3. **Configure Repository:**
   - Repository URL: `https://github.com/your-username/coderbot-v2`
   - Branch: `main`
   - Build Pack: `Docker`

4. **Set Build Configuration:**
   - Dockerfile: `Dockerfile`
   - Docker Context: `.`
   - Docker Build Arguments: (none required)

5. **Configure Ports:**
   - Port 8000: Backend API (main service)
   - Port 8090: PocketBase Admin UI
   - Port 3000: Frontend (optional)
   - Port 8080: Code-Server IDE

6. **Set Environment Variables** (copy from above)

7. **Configure Volumes:**
   - `/app/data/pb_data` → `coderbot_pocketbase_data` (persistent)
   - `/app/data/code-server` → `coderbot_code_server_data` (persistent)
   - `/app/workspace` → `coderbot_workspace_data` (persistent)
   - `/app/logs` → `coderbot_logs` (persistent)

8. **Deploy!** 🚀

## 📋 Service URLs

After deployment, your services will be available at:

- **Backend API**: `https://your-domain.com:8000`
- **API Documentation**: `https://your-domain.com:8000/docs`
- **PocketBase Admin**: `https://your-domain.com:8090/_/`
- **Code-Server IDE**: `https://your-domain.com:8080`
- **Health Check**: `https://your-domain.com:8000/health`

## 🔍 Health Monitoring

The deployment includes comprehensive health checks:

- **Main Health**: `GET /health`
- **Analytics Health**: `GET /analytics/health`
- **Adaptive Learning Health**: `GET /adaptive-learning/health`

## 💻 Code-Server IDE Integration

The deployment includes a fully integrated code-server instance providing a web-based VS Code environment for development and debugging.

### Features

- **Full VS Code Experience** - Complete IDE in your browser
- **Project Access** - Direct access to all project files
- **Extension Support** - Install VS Code extensions
- **Terminal Access** - Built-in terminal for debugging
- **Real-time Editing** - Live file editing and preview

### Access and Authentication

- **URL**: `https://your-domain.com:8080`
- **Default Password**: `coderbot2024` (change via `CODE_SERVER_PASSWORD` environment variable)
- **Workspace**: Pre-loaded with all project files in `/app/workspace`

### Development Workflow

1. Access code-server via web browser
2. Navigate to project files in the workspace
3. Edit backend/frontend code directly
4. Use integrated terminal for testing
5. Monitor logs and debugging in real-time

## 📊 Features Included

### 🧠 AI-Powered Learning
- Multi-provider AI support (DeepSeek, OpenAI, Claude)
- Adaptive learning paths
- Personalized recommendations
- Performance predictions

### 📈 Advanced Analytics
- Real-time learning analytics
- Performance tracking
- Engagement analysis
- Skill progression monitoring
- ML-powered insights

### 🎮 Gamification
- Learning streaks
- Achievement system
- Progress tracking
- Reward mechanisms

### 👥 Collaboration
- Class management
- Teacher-student interactions
- Social learning features
- Group projects

## 🐛 Troubleshooting

### Common Issues

1. **Service Won't Start**
   - Check environment variables are set
   - Verify at least one AI API key is configured
   - Check logs in Coolify dashboard

2. **PocketBase Connection Issues**
   - Ensure PocketBase port (8090) is accessible
   - Check PocketBase data volume is mounted
   - Verify admin credentials

3. **AI Features Not Working**
   - Verify API keys are valid and active
   - Check API quotas and limits
   - Review backend logs for API errors

### Log Locations

- Backend logs: `/app/logs/backend.log`
- PocketBase logs: `/app/logs/pocketbase.log`
- Frontend logs: `/app/logs/frontend.log`

## 🔒 Security Notes

### Production Security Checklist

- [ ] Change default PocketBase admin credentials
- [ ] Use strong, unique passwords
- [ ] Configure HTTPS/SSL certificates
- [ ] Restrict access to PocketBase admin (port 8090)
- [ ] Regularly update API keys
- [ ] Monitor access logs
- [ ] Set up backup strategy for PocketBase data

### Recommended Security Settings

```bash
# Use environment-specific credentials
POCKETBASE_ADMIN_EMAIL=admin-$(date +%s)@yourcompany.com
POCKETBASE_ADMIN_PASSWORD=$(openssl rand -base64 32)
```

## 📚 API Documentation

Once deployed, visit `/docs` endpoint for complete API documentation:
- Interactive Swagger UI
- Complete endpoint reference
- Request/response examples
- Authentication details

## 🔄 Updates and Maintenance

### Updating the Application

1. Push changes to your Git repository
2. Coolify will automatically detect changes
3. Redeploy through Coolify dashboard
4. Monitor health checks after deployment

### Database Migrations

PocketBase migrations are applied automatically on startup. New migrations in `/pb_migrations` will be processed during deployment.

### Backup Strategy

- **PocketBase Data**: Automatically backed up to persistent volume
- **Configuration**: Store in version control
- **Logs**: Rotated automatically, monitor disk space

## 🆘 Support

### Getting Help

1. **Check Health Endpoints** - Start with `/health` to verify service status
2. **Review Logs** - Check application logs in Coolify dashboard
3. **Database Admin** - Use PocketBase admin UI for database issues
4. **API Testing** - Use `/docs` endpoint to test API functionality

### System Requirements

- **Minimum**: 2GB RAM, 1 CPU, 10GB storage
- **Recommended**: 4GB RAM, 2 CPU, 20GB storage
- **Network**: Outbound HTTPS access for AI APIs

---

## 🎉 Ready to Deploy!

Your CoderBot v2 platform is now ready for Coolify deployment. This bundle includes everything needed for a production-ready educational platform with AI-powered adaptive learning capabilities.

For questions or support, check the documentation or health monitoring endpoints included in the deployment.
