#!/usr/bin/env python3
"""
Script para testar a metodologia worked_examples
"""

import requests
import json

# Configurações
API_URL = "http://localhost:8000"
TEST_MESSAGE = "Como implementar um algoritmo de ordenação bubble sort em Python?"

def test_worked_examples_methodology():
    """Testa a metodologia worked_examples"""
    print("🧪 Testando metodologia 'worked_examples'...")
    
    payload = {
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": TEST_MESSAGE}],
        "max_tokens": 500,
        "temperature": 0.7,
        "methodology": "worked_examples",
        "user_profile": {
            "difficulty_level": "beginner",
            "subject_area": "programming",
            "style_preference": "detailed",
            "learning_progress": {"questions_answered": 5, "correct_answers": 3},
            "baseKnowledge": "basic Python syntax"
        }
    }
    
    try:
        response = requests.post(f"{API_URL}/chat/completions", json=payload, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Metodologia worked_examples está funcionando!")
            print(f"Resposta: {result.get('content', 'Sem conteúdo encontrado')[:200]}...")
            return True
        else:
            print(f"❌ Erro na requisição: {response.status_code}")
            print(f"Resposta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
        return False

def test_default_methodology():
    """Testa a metodologia default para comparação"""
    print("\n🧪 Testando metodologia 'default' para comparação...")
    
    payload = {
        "model": "gpt-3.5-turbo", 
        "messages": [{"role": "user", "content": TEST_MESSAGE}],
        "max_tokens": 500,
        "temperature": 0.7,
        "methodology": "default"
    }
    
    try:
        response = requests.post(f"{API_URL}/chat/completions", json=payload, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Metodologia default está funcionando!")
            print(f"Resposta: {result.get('content', 'Sem conteúdo encontrado')[:200]}...")
            return True
        else:
            print(f"❌ Erro na requisição: {response.status_code}")
            print(f"Resposta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
        return False

if __name__ == "__main__":
    print("🔧 Testando a funcionalidade da metodologia worked_examples...\n")
    
    # Testa metodologia worked_examples
    worked_examples_success = test_worked_examples_methodology()
    
    # Testa metodologia default para comparação
    default_success = test_default_methodology()
    
    print(f"\n📊 Resultados dos testes:")
    print(f"  - worked_examples: {'✅ Funcionando' if worked_examples_success else '❌ Com problemas'}")
    print(f"  - default: {'✅ Funcionando' if default_success else '❌ Com problemas'}")
    
    if worked_examples_success:
        print(f"\n🎉 Problema resolvido! A metodologia 'worked_examples' agora está funcionando corretamente!")
    else:
        print(f"\n⚠️ A metodologia ainda apresenta problemas. Verifique os logs do backend.")
