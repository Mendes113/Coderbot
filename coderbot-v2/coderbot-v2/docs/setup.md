# Setup do CoderBot v2 com Docker

A partir de julho de 2025, o sistema CoderBot v2 é executado preferencialmente via Docker, facilitando a configuração e execução de todos os serviços (frontend, backend, banco de dados e IDE online) de forma integrada.

## Pré-requisitos

- Docker e Docker Compose instalados
- Git
- Linux, macOS ou Windows

## Passos para rodar o sistema

1. **Clone o repositório:**

   ```fish
   git clone <seu-repositorio>
   cd coderbot-v2
   ```

2. **Execute o setup automático:**

   ```fish
   ./docker-setup.sh setup
   ```

3. **Configure o arquivo `.env`:**

   O script cria um `.env` baseado no `.env.example`. Edite-o e preencha as variáveis obrigatórias (chaves de API, senhas, etc).

4. **Inicie todos os serviços:**

   ```fish
   ./docker-setup.sh start
   ```

5. **Acesse os serviços:**

   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend: [http://localhost:8000](http://localhost:8000)
   - PocketBase (DB): [http://localhost:8090](http://localhost:8090)
   - IDE Online (opcional): [http://localhost:8080](http://localhost:8080)

## Comandos úteis

- Parar todos os serviços: `./docker-setup.sh stop`
- Ver status: `./docker-setup.sh status`
- Ver logs: `./docker-setup.sh logs`
- Limpeza completa: `./docker-setup.sh cleanup`

## Hot reload

- Alterações em `frontend/` e `backend/` são refletidas automaticamente nos containers.

## Dicas

- Nunca commite seu `.env` real.
- Para reset total, use `./docker-setup.sh cleanup && ./docker-setup.sh setup && ./docker-setup.sh start`.

Para detalhes avançados, consulte o arquivo `DOCKER_README.md` na raiz do projeto.
