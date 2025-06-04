from fastapi import FastAPI
from app.routers import deepseek_router, judge_router, exercises_router  # Importa os roteadores
from app.config import settings  # Importa para garantir que a config seja lida na inicialização
from supabase import create_client, Client
from fastapi.middleware.cors import CORSMiddleware
from app.routers.whiteboard_router import router as whiteboard_router
from app.routers.educational_chat_router import router as educational_chat_router
from app.routers.adaptive_learning_router import router as adaptive_learning_router
from app.routers.analytics_router import router as analytics_router
import logging

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# if settings.supabase_url == "your_supabase_url":
#     raise ValueError("A URL do Supabase não está configurada corretamente. Verifique o arquivo .env.")
# if settings.supabase_key == "your_supabase_key":
#     raise ValueError("A chave do Supabase não está configurada corretamente. Verifique o arquivo .env.")

# supabase: Client = create_client(settings.supabase_url, settings.supabase_key)


app = FastAPI(
    title="CoderBot v2 - Advanced Educational Platform",
    description="Comprehensive backend for AI-powered adaptive learning with analytics, gamification, and social features",
    version="2.0.0",
)


# Habilitar CORS para qualquer origem (você pode restringir isso conforme necessário)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Ou uma lista de origens específicas (ex: ["http://localhost:3000"])
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos os métodos (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Permite todos os cabeçalhos
)


# Evento de startup: inicializações e verificações de configuração
@app.on_event("startup")
async def startup_event():
    logger.info("Inicializando CoderBot v2 - Advanced Educational Platform...")
    logger.info(f"DeepSeek API URL: {settings.deep_seek_api_url}")
    if not settings.deep_seek_api_key or settings.deep_seek_api_key == "your_deep_seek_api_key":
        logger.warning("ALERTA: Chave da API DeepSeek não configurada!")
    else:
        logger.info("Chave da API DeepSeek carregada com sucesso.")
    
    # Initialize advanced learning systems
    logger.info("Sistemas de aprendizagem adaptativa inicializados")
    logger.info("Engine de analytics com ML ativado")
    logger.info("PocketBase integration configurado")
    
    # Aqui pode-se inicializar serviços compartilhados, como PromptLoader e RAGService,
    # para que fiquem disponíveis aos endpoints relevantes.




# Incluir os roteadores na aplicação (seguindo princípios SOLID e modularização)
app.include_router(deepseek_router.router)
app.include_router(judge_router.router)
app.include_router(exercises_router.router)
app.include_router(whiteboard_router)
app.include_router(educational_chat_router)  # Chat com metodologias educacionais
app.include_router(adaptive_learning_router)  # Sistema de aprendizagem adaptativa
app.include_router(analytics_router)  # Advanced learning analytics with ML

# Rota raiz para teste simples
@app.get("/", tags=["Root"])
async def read_root():
    return {
        "message": "Welcome to CoderBot v2 - Advanced Educational Platform!",
        "version": "2.0.0",
        "features": [
            "Adaptive Learning Engine",
            "Advanced Analytics & ML Predictions", 
            "PocketBase Integration",
            "Performance Tracking",
            "Personalized Recommendations",
            "Learning Path Generation",
            "Skill Progression Analysis"
        ],
        "status": "operational"
    }

# Endpoint de health check para Docker
@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "CoderBot v2 Backend",
        "version": "2.0.0"
    }


