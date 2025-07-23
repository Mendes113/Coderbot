#!/usr/bin/env python3
"""
Script para limpar duplicatas e criar template default
"""

import requests
import json

POCKETBASE_URL = "http://localhost:8090"
COLLECTION = "dynamic_prompts"

def remove_duplicate():
    """Remove uma das duplicatas do template worked_examples"""
    print("🧹 Removendo duplicata do template worked_examples...")
    
    # Buscar as duplicatas
    url = f"{POCKETBASE_URL}/api/collections/{COLLECTION}/records"
    params = {"filter": "name='default_worked_examples'"}
    
    try:
        response = requests.get(url, params=params)
        if response.status_code == 200:
            data = response.json()
            if data.get('totalItems', 0) > 1:
                # Remove o primeiro (mais antigo)
                record_id = data['items'][0]['id']
                delete_url = f"{url}/{record_id}"
                
                delete_response = requests.delete(delete_url)
                if delete_response.status_code == 204:
                    print(f"✅ Duplicata removida (ID: {record_id})")
                    return True
                else:
                    print(f"❌ Erro ao remover duplicata: {delete_response.status_code}")
                    return False
            else:
                print("ℹ️ Nenhuma duplicata encontrada")
                return True
        else:
            print(f"❌ Erro ao buscar duplicatas: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False

def create_default_template():
    """Cria o template para metodologia default"""
    print("📝 Criando template para metodologia 'default'...")
    
    template_data = {
        "name": "default_default",
        "methodology": "default",
        "template": """Você é um assistente educacional especializado em programação e ciência da computação.
Sua missão é fornecer respostas claras, precisas e educativas, adaptadas ao nível do aluno.

DIRETRIZES GERAIS:
1. ADAPTE sua linguagem ao nível de dificuldade do aluno: {difficulty_level}
2. CONSIDERE o conhecimento base do aluno: {baseKnowledge}
3. USE exemplos práticos e relevantes quando apropriado
4. ESTRUTURE sua resposta de forma clara e organizada
5. INCENTIVE o aprendizado progressivo

CONTEXTO DO ALUNO:
- Nível de dificuldade: {difficulty_level}
- Conhecimento base: {baseKnowledge}
- Progresso de aprendizado: {learning_progress}
- Área de estudo: {subject_area}
- Preferência de estilo: {style_preference}

CONTEXTO RELEVANTE DA BASE DE CONHECIMENTO:
{knowledge_base}

HISTÓRICO DA CONVERSA:
{context_history}

PERGUNTA DO USUÁRIO:
{user_query}

Por favor, forneça uma resposta educativa e bem estruturada que ajude o aluno a entender o conceito ou resolver o problema apresentado.""",
        "description": "Template padrão para respostas educacionais gerais",
        "version": 1,
        "is_active": True
    }
    
    url = f"{POCKETBASE_URL}/api/collections/{COLLECTION}/records"
    
    try:
        response = requests.post(url, json=template_data)
        
        if response.status_code == 200:
            print("✅ Template 'default_default' criado com sucesso!")
            print(f"ID do template: {response.json().get('id')}")
            return True
        else:
            print(f"❌ Erro ao criar template: {response.status_code}")
            print(f"Resposta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
        return False

def list_all_templates():
    """Lista todos os templates disponíveis"""
    print("\n📋 Templates disponíveis:")
    url = f"{POCKETBASE_URL}/api/collections/{COLLECTION}/records"
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            for item in data['items']:
                status = "✅ Ativo" if item['is_active'] else "❌ Inativo"
                print(f"  - {item['name']} ({item['methodology']}) {status}")
        else:
            print(f"❌ Erro ao listar templates: {response.status_code}")
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    print("🔧 Limpando e organizando templates do PocketBase...\n")
    
    # Remove duplicata
    remove_duplicate()
    
    # Cria template default
    create_default_template()
    
    # Lista todos os templates
    list_all_templates()
    
    print("\n🎉 Organização concluída!")
