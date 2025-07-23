#!/usr/bin/env python3
"""
Script para criar o template 'default_worked_examples' no PocketBase
"""

import requests
import json

# Configurações
POCKETBASE_URL = "http://localhost:8090"
COLLECTION = "dynamic_prompts"

# Template para worked_examples
template_data = {
    "name": "default_worked_examples",
    "methodology": "worked_examples",
    "template": """Você é um especialista em ensino através de exemplos trabalhados.
Sua missão é demonstrar soluções passo a passo para ajudar o aluno a aprender através de exemplos concretos.

DIRETRIZES PARA EXEMPLOS TRABALHADOS:
1. DEMONSTRE primeiro, depois peça para o aluno praticar
2. MOSTRE cada passo do processo de resolução de forma detalhada
3. EXPLIQUE o raciocínio por trás de cada decisão tomada
4. USE exemplos similares ao problema do aluno quando possível
5. FORNEÇA um exemplo completo antes de apresentar variações
6. DESTAQUE padrões e técnicas reutilizáveis

ESTRUTURA DA RESPOSTA:
1. **Análise do Problema**: Identifique o que precisa ser resolvido
2. **Exemplo Trabalhado**: Demonstre a solução completa passo a passo
3. **Explicação dos Passos**: Justifique cada decisão tomada
4. **Padrões Identificados**: Destaque técnicas reutilizáveis
5. **Exemplo Similar**: Forneça um segundo exemplo quando relevante
6. **Próximos Passos**: Sugira como o aluno pode praticar

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

Por favor, forneça um exemplo trabalhado detalhado que demonstre a solução do problema,
seguindo a metodologia de exemplos trabalhados para reduzir a carga cognitiva e
facilitar a aquisição de habilidades através da demonstração prática.""",
    "description": "Template para metodologia de Exemplos Trabalhados - demonstra soluções passo-a-passo",
    "version": 1,
    "is_active": True
}

def create_template():
    """Cria o template no PocketBase"""
    url = f"{POCKETBASE_URL}/api/collections/{COLLECTION}/records"
    
    try:
        response = requests.post(url, json=template_data)
        
        if response.status_code == 200:
            print("✅ Template 'default_worked_examples' criado com sucesso!")
            print(f"ID do template: {response.json().get('id')}")
            return True
        else:
            print(f"❌ Erro ao criar template: {response.status_code}")
            print(f"Resposta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
        return False

def verify_template():
    """Verifica se o template foi criado corretamente"""
    url = f"{POCKETBASE_URL}/api/collections/{COLLECTION}/records"
    params = {"filter": "name='default_worked_examples'"}
    
    try:
        response = requests.get(url, params=params)
        if response.status_code == 200:
            data = response.json()
            if data.get('totalItems', 0) > 0:
                print("✅ Template verificado com sucesso!")
                print(f"Nome: {data['items'][0]['name']}")
                print(f"Metodologia: {data['items'][0]['methodology']}")
                print(f"Ativo: {data['items'][0]['is_active']}")
                return True
            else:
                print("❌ Template não encontrado após criação")
                return False
        else:
            print(f"❌ Erro ao verificar template: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Erro ao verificar: {e}")
        return False

if __name__ == "__main__":
    print("🔧 Criando template 'default_worked_examples'...")
    
    if create_template():
        print("\n🔍 Verificando template criado...")
        verify_template()
    
    print("\n📋 Listando todos os templates disponíveis:")
    try:
        response = requests.get(f"{POCKETBASE_URL}/api/collections/{COLLECTION}/records")
        if response.status_code == 200:
            data = response.json()
            for item in data['items']:
                print(f"  - {item['name']} ({item['methodology']})")
        else:
            print(f"❌ Erro ao listar templates: {response.status_code}")
    except Exception as e:
        print(f"❌ Erro ao listar: {e}")
