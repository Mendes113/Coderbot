#!/usr/bin/env python3
"""
Script para criar o novo template de worked examples com estrutura JSON específica
no PocketBase.
"""

import os
import sys
from pocketbase import PocketBase
from dotenv import load_dotenv

# Carrega variáveis de ambiente
load_dotenv()

# Configuração do PocketBase
POCKETBASE_URL = os.getenv("POCKETBASE_URL", "http://localhost:8090")
ADMIN_EMAIL = os.getenv("POCKETBASE_ADMIN_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.getenv("POCKETBASE_ADMIN_PASSWORD", "adminpassword")

# Template atualizado para worked examples com estrutura organizacional implícita
WORKED_EXAMPLES_TEMPLATE = """Você é um especialista em ensino através de exemplos trabalhados.
Sua missão é criar respostas estruturadas e interativas para facilitar o aprendizado.

IMPORTANTE: Organize sua resposta usando as seguintes seções, mas NÃO mostre os cabeçalhos "Title", "Topic" e "Knowledge" para o usuário final:

🎯 **[Título do exemplo]**

📚 **Explicação:**
[Descrição detalhada do problema e conceitos necessários]

💡 **Exemplo Prático:**
[Exemplo resolvido PASSO A PASSO corretamente - inclua:
- **Raciocínio:** Análise do problema
- **Passos da solução:** Cada etapa explicada
- **Teste:** Como testar com exemplo específico
- **Código completo:** Solução funcional]

🔥 **Dica Pro:**
[Recursos extras ou materiais de apoio]

🏋️ **Exercício:**
[Apresente um código com erro comum e:
- Mostre o código incorreto
- Apresente 4-5 opções de possíveis erros
- NÃO revele a resposta imediatamente
- Diga: "Qual você acha que é o erro? Escolha uma opção e eu explico!"
- Aguarde a interação do aluno]

DIRETRIZES IMPORTANTES:
1. NÃO mostre seções "Title", "Topic" ou "Knowledge" na resposta final
2. Use emojis e formatação moderna para tornar o conteúdo atrativo
3. No exercício, apresente as opções mas NÃO revele a resposta correta
4. Incentive a interação: "O que você acha?"
5. Seja didático e use linguagem acessível
6. Torne o código facilmente copiável com blocos ```java```

CONTEXTO DO ALUNO:
- Nível de dificuldade: {difficulty_level}
- Conhecimento base: {baseKnowledge}
- Progresso de aprendizado: {learning_progress}
- Área de estudo: {subject_area}

CONTEXTO RELEVANTE DA BASE DE CONHECIMENTO:
{knowledge_base}

HISTÓRICO DA CONVERSA:
{context_history}

PERGUNTA DO USUÁRIO:
{user_query}

Crie um exemplo trabalhado envolvente seguindo a estrutura acima.
Lembre-se: no exercício, apresente as opções e incentive a participação do aluno!"""

def create_template():
    """Cria o template no PocketBase"""
    try:
        client = PocketBase(POCKETBASE_URL)
        
        # Autentica como admin
        client.admins.auth_with_password(ADMIN_EMAIL, ADMIN_PASSWORD)
        print("✅ Autenticado como admin no PocketBase")
        
        # Dados do template
        template_data = {
            "name": "default_worked_examples",
            "methodology": "worked_examples", 
            "template": WORKED_EXAMPLES_TEMPLATE,
            "description": "Template para metodologia de Exemplos Trabalhados com estrutura organizacional baseada em seções",
            "version": 2,  # Incrementando a versão
            "is_active": True
        }
        
        # Verifica se já existe
        try:
            existing = client.collection("dynamic_prompts").get_list(
                page=1, per_page=1,
                query_params={"filter": 'name="default_worked_examples" && methodology="worked_examples"'}
            )
            
            if existing.items:
                # Atualiza o existente
                record_id = existing.items[0].id
                updated = client.collection("dynamic_prompts").update(record_id, template_data)
                print(f"✅ Template atualizado com sucesso! ID: {updated.id}")
                return True
            else:
                # Cria novo
                created = client.collection("dynamic_prompts").create(template_data)
                print(f"✅ Novo template criado com sucesso! ID: {created.id}")
                return True
                
        except Exception as e:
            print(f"❌ Erro ao verificar/criar template: {e}")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao conectar com PocketBase: {e}")
        return False

def verify_template():
    """Verifica se o template foi criado corretamente"""
    try:
        client = PocketBase(POCKETBASE_URL)
        
        # Busca o template sem autenticação (teste de acesso público)
        records = client.collection("dynamic_prompts").get_list(
            page=1, per_page=1,
            query_params={"filter": 'methodology="worked_examples" && is_active=true'}
        )
        
        if records.items:
            template = records.items[0]
            print(f"✅ Template encontrado:")
            print(f"   - ID: {template.id}")
            print(f"   - Nome: {template.name}")
            print(f"   - Metodologia: {template.methodology}")
            print(f"   - Versão: {getattr(template, 'version', 'N/A')}")
            print(f"   - Ativo: {template.is_active}")
            print(f"   - Tamanho do template: {len(template.template)} caracteres")
            return True
        else:
            print("❌ Template não encontrado!")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao verificar template: {e}")
        return False

if __name__ == "__main__":
    print("🔧 Criando/atualizando template 'default_worked_examples' com estrutura JSON...")
    
    if create_template():
        print("\n🔍 Verificando template criado...")
        verify_template()
    else:
        print("❌ Falha ao criar template")
        sys.exit(1)
    
    print("\n✅ Processo concluído!")
