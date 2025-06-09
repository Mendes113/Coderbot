# 🐳 CoderBot V2 - Docker Setup

Este guia mostra como executar todo o sistema CoderBot V2 usando Docker, incluindo frontend, backend e PocketBase.

## 📋 Pré-requisitos

- Docker e Docker Compose instalados
- Git para clonar o repositório
- Pelo menos 4GB de RAM disponível
- Portas livres: 3000, 8000, 8080, 8090

## 🚀 Início Rápido

### 1. Clone e Configure

```bash
# Clone o repositório
git clone <seu-repositorio>
cd coderbot-v2

# Execute o setup automático
./docker-setup.sh setup
```

### 2. Configure as Variáveis de Ambiente

Edite o arquivo `.env` criado automaticamente:

```bash
# Principais configurações que você DEVE alterar:
DEEP_SEEK_API_KEY=sua_chave_deepseek
SUPABASE_URL=sua_url_supabase
SUPABASE_KEY=sua_chave_supabase
POCKETBASE_ADMIN_EMAIL=seu_email@exemplo.com
POCKETBASE_ADMIN_PASSWORD=sua_senha_segura
CODE_SERVER_PASSWORD=senha_para_ide_online
```

### 3. Inicie o Sistema

```bash
./docker-setup.sh start
```

## 🌐 URLs dos Serviços

Após iniciar, os serviços estarão disponíveis em:

- **Frontend (React)**: http://localhost:3000
- **Backend (FastAPI)**: http://localhost:8000
- **PocketBase (Database)**: http://localhost:8090
- **Code Server (IDE)**: http://localhost:8080 *(opcional)*

## 🛠️ Comandos Úteis

### Script de Gerenciamento

```bash
# Ver ajuda
./docker-setup.sh help

# Configurar sistema pela primeira vez
./docker-setup.sh setup

# Iniciar todos os serviços
./docker-setup.sh start

# Parar todos os serviços
./docker-setup.sh stop

# Reiniciar todos os serviços
./docker-setup.sh restart

# Ver logs de todos os serviços
./docker-setup.sh logs

# Ver logs de um serviço específico
./docker-setup.sh logs backend

# Ver status dos serviços
./docker-setup.sh status

# Reconstruir imagens
./docker-setup.sh build

# Limpeza completa (cuidado!)
./docker-setup.sh cleanup
```

### Comandos Docker Compose Diretos

```bash
# Iniciar em segundo plano
docker-compose up -d

# Ver logs em tempo real
docker-compose logs -f

# Parar serviços
docker-compose down

# Reiniciar um serviço específico
docker-compose restart backend

# Ver status
docker-compose ps

# Executar comando em um container
docker-compose exec backend bash
docker-compose exec frontend sh
```

## 🏗️ Arquitetura dos Containers

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   PocketBase    │
│   (React)       │    │   (FastAPI)     │    │   (Database)    │
│   Port: 3000    │────│   Port: 8000    │────│   Port: 8090    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                       │                       │
          └───────────────────────┼───────────────────────┘
                                  │
                    ┌─────────────────┐
                    │  Code Server    │
                    │     (IDE)       │
│   Port: 8080    │
└─────────────────┘
```

### Extensões no Code Server

O container `code-server` é construído com a extensão **Continue** já instalada.
Isso permite utilizar a IDE com o assistente de IA assim que o serviço é iniciado.
Caso queira adicionar outras extensões, edite `docker/Dockerfile.code-server` e
reconstrua o serviço.

## 📁 Estrutura de Volumes

```
📦 Volumes Persistentes
├── 🗄️ pocketbase_data/     # Dados do banco PocketBase
├── 💾 code_server_data/    # Configurações do Code Server
├── 📂 ./frontend/          # Código fonte (bind mount)
└── 📂 ./backend/           # Código fonte (bind mount)
```

## 🔧 Desenvolvimento

### Hot Reload

Todos os serviços suportam hot reload durante o desenvolvimento:

- **Frontend**: Mudanças em `./frontend/` são refletidas automaticamente
- **Backend**: Mudanças em `./backend/` reiniciam o servidor automaticamente
- **PocketBase**: Migrações em `./pocketbase_0.27.2_linux_amd64/pb_migrations/` são aplicadas

### Debugs

```bash
# Acessar shell do container backend
docker-compose exec backend bash

# Acessar shell do container frontend
docker-compose exec frontend sh

# Ver logs de erro específicos
docker-compose logs backend | grep ERROR
```

## 🔒 Segurança

### Produção

Para produção, certifique-se de:

1. **Alterar senhas padrão** no arquivo `.env`
2. **Usar HTTPS** com proxy reverso (Nginx/Traefik)
3. **Configurar firewall** para expor apenas portas necessárias
4. **Backup regular** dos volumes do PocketBase

### Variáveis Sensíveis

Nunca commite o arquivo `.env` com dados reais. Use:

```bash
# Adicione ao .gitignore
echo ".env" >> .gitignore
```

## 🐛 Troubleshooting

### Problemas Comuns

**Porta já em uso:**
```bash
# Verificar o que está usando a porta
sudo netstat -tulpn | grep :3000

# Alterar porta no docker-compose.yml se necessário
```

**Containers não iniciam:**
```bash
# Ver logs detalhados
./docker-setup.sh logs

# Verificar recursos disponíveis
docker system df
```

**PocketBase não conecta:**
```bash
# Verificar se o container está rodando
docker-compose ps pocketbase

# Verificar logs do PocketBase
docker-compose logs pocketbase
```

**Problemas de permissão:**
```bash
# Dar permissões corretas
sudo chown -R $USER:$USER ./
```

### Reset Completo

Se algo der muito errado:

```bash
# Parar tudo e limpar
./docker-setup.sh cleanup

# Reconfigurar do zero
./docker-setup.sh setup
./docker-setup.sh start
```

## 📊 Monitoramento

### Métricas dos Containers

```bash
# Ver uso de recursos em tempo real
docker stats

# Ver uso de disco
docker system df

# Ver informações detalhadas
./docker-setup.sh status
```

### Health Checks

Todos os serviços têm health checks configurados:

- ✅ **Verde**: Serviço funcionando
- 🟡 **Amarelo**: Iniciando
- ❌ **Vermelho**: Com problemas

## 🤝 Contribuindo

Para contribuir com melhorias no setup Docker:

1. Teste mudanças localmente
2. Documente alterações no README
3. Atualize o `docker-setup.sh` se necessário
4. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença definida no arquivo raiz do repositório.
