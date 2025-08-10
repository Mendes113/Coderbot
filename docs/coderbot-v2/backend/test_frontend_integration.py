#!/usr/bin/env python3
"""
Teste de integração frontend-backend para verificar como as metodologias 
e templates são processados quando chamadas originam do chat-service.ts
"""

import json
import requests
import uuid
from typing import Dict, Any

# URLs de teste
BASE_URL = "http://localhost:8000"
CHAT_COMPLETIONS_URL = f"{BASE_URL}/chat/completions"
METHODOLOGIES_URL = f"{BASE_URL}/chat/methodologies"

def test_methodologies_endpoint():
    """Testa se o endpoint de metodologias está funcionando"""
    print("🔍 Testando endpoint de metodologias...")
    
    try:
        response = requests.get(METHODOLOGIES_URL)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Metodologias disponíveis:")
            for methodology in data.get("methodologies", []):
                print(f"  - {methodology.get('id')}: {methodology.get('name')}")
            return data.get("methodologies", [])
        else:
            print(f"❌ Erro: {response.text}")
            return []
    except Exception as e:
        print(f"❌ Erro na requisição: {e}")
        return []

def test_chat_with_methodology(methodology: str, test_message: str = "Explique como funciona uma função em Python"):
    """Testa chat completion com uma metodologia específica"""
    print(f"\n🧪 Testando chat com metodologia: {methodology}")
    
    # Simular exatamente o que o frontend envia
    payload = {
        "model": "gpt-3.5-turbo",
        "messages": [
            {
                "role": "user",
                "content": test_message,
                "knowledge_level": "beginner",
                "context": "teaching"
            }
        ],
        "max_tokens": 350,
        "temperature": 0.7,
        "methodology": methodology,
        "user_profile": {
            "difficulty_level": "medium",
            "subject_area": "programming",
            "style_preference": "concise",
            "learning_progress": {"questions_answered": 0, "correct_answers": 0},
            "baseKnowledge": "basic"
        }
    }
    
    print(f"📤 Enviando payload:")
    print(json.dumps(payload, indent=2))
    
    try:
        response = requests.post(
            CHAT_COMPLETIONS_URL,
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=30
        )
        
        print(f"📥 Status da resposta: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Resposta recebida com sucesso!")
            
            # Verificar se tem a estrutura esperada
            if "response" in data:
                choices = data["response"].get("choices", [])
                if choices and len(choices) > 0:
                    content = choices[0].get("message", {}).get("content", "")
                    print(f"📝 Conteúdo da resposta (primeiros 200 chars):")
                    print(f"   {content[:200]}...")
                else:
                    print("⚠️ Estrutura de resposta inesperada - sem choices")
            else:
                print("⚠️ Estrutura de resposta inesperada - sem response")
            
            # Verificar metadata
            if "metadata" in data:
                metadata = data["metadata"]
                print(f"📊 Metadata:")
                print(f"   - methodology_used: {metadata.get('methodology_used')}")
                print(f"   - rag_used: {metadata.get('rag_used')}")
                print(f"   - template_found: {metadata.get('template_found', 'N/A')}")
                
            return True
        else:
            print(f"❌ Erro na resposta: {response.status_code}")
            print(f"   {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Timeout na requisição (30s)")
        return False
    except Exception as e:
        print(f"❌ Erro na requisição: {e}")
        return False

def test_template_retrieval_specific():
    """Testa especificamente a recuperação de templates"""
    print("\n🎯 Testando recuperação específica de templates...")
    
    # Testar metodologias principais
    methodologies_to_test = [
        "worked_examples",
        "default", 
        "sequential_thinking",
        "analogy"
    ]
    
    results = {}
    
    for methodology in methodologies_to_test:
        print(f"\n--- Testando {methodology} ---")
        success = test_chat_with_methodology(methodology)
        results[methodology] = success
    
    return results

def test_frontend_api_simulation():
    """Simula exatamente como o frontend faz as chamadas via api.ts"""
    print("\n🎭 Simulando chamadas exatas do frontend...")
    
    # Teste 1: Metodologia worked_examples (que estava causando travamento)
    print("\n=== TESTE 1: worked_examples ===")
    frontend_payload_worked_examples = {
        "model": "gpt-3.5-turbo",
        "messages": [
            {
                "role": "user", 
                "content": "Como criar uma função em Python que calcula fatorial?",
                "knowledge_level": "beginner",
                "context": "teaching"
            }
        ],
        "max_tokens": 350,
        "temperature": 0.7,
        "methodology": "worked_examples",
        "user_profile": {
            "difficulty_level": "medium",
            "baseKnowledge": "basic",
            "learning_progress": {"questions_answered": 2, "correct_answers": 0},
            "style_preference": "concise",
            "subject_area": "programming"
        }
    }
    
    test_result_1 = send_request_and_analyze(frontend_payload_worked_examples, "worked_examples")
    
    # Teste 2: Metodologia default 
    print("\n=== TESTE 2: default ===")
    frontend_payload_default = {
        "model": "gpt-3.5-turbo", 
        "messages": [
            {
                "role": "user",
                "content": "O que é uma variável em Python?", 
                "knowledge_level": "beginner",
                "context": "teaching"
            }
        ],
        "max_tokens": 350,
        "temperature": 0.7,
        "methodology": "default",
        "user_profile": {
            "difficulty_level": "medium",
            "baseKnowledge": "basic",
            "learning_progress": {"questions_answered": 1, "correct_answers": 0},
            "style_preference": "concise", 
            "subject_area": "programming"
        }
    }
    
    test_result_2 = send_request_and_analyze(frontend_payload_default, "default")
    
    return {
        "worked_examples": test_result_1,
        "default": test_result_2
    }

def send_request_and_analyze(payload: Dict[str, Any], methodology_name: str) -> bool:
    """Envia requisição e analisa resposta detalhadamente"""
    
    try:
        print(f"📤 Enviando requisição para metodologia: {methodology_name}")
        
        response = requests.post(
            CHAT_COMPLETIONS_URL,
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=30
        )
        
        print(f"📥 Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Análise detalhada da resposta
            print("✅ Requisição bem-sucedida!")
            
            # Verificar se template foi encontrado
            metadata = data.get("metadata", {})
            methodology_used = metadata.get("methodology_used")
            template_found = metadata.get("template_found")
            
            print(f"📋 Análise da resposta:")
            print(f"   - Metodologia usada: {methodology_used}")
            print(f"   - Template encontrado: {template_found}")
            print(f"   - RAG usado: {metadata.get('rag_used')}")
            
            # Verificar estrutura da resposta  
            response_data = data.get("response", {})
            choices = response_data.get("choices", [])
            
            if choices:
                message_content = choices[0].get("message", {}).get("content", "")
                print(f"   - Conteúdo gerado: {len(message_content)} caracteres")
                print(f"   - Início da resposta: {message_content[:100]}...")
                
                # Verificar se a resposta parece estar seguindo a metodologia
                if methodology_name == "worked_examples" and "exemplo" in message_content.lower():
                    print("✅ Resposta parece seguir metodologia worked_examples")
                elif methodology_name == "default":
                    print("✅ Resposta gerada com metodologia padrão")
                    
                return True
            else:
                print("⚠️ Resposta sem choices")
                return False
                
        else:
            print(f"❌ Erro HTTP {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Detalhes do erro: {error_data}")
            except:
                print(f"   Texto do erro: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exceção durante requisição: {e}")
        return False

def main():
    print("🚀 TESTE DE INTEGRAÇÃO FRONTEND-BACKEND")
    print("=" * 50)
    
    # Teste 1: Verificar metodologias disponíveis
    methodologies = test_methodologies_endpoint()
    
    if not methodologies:
        print("❌ Não foi possível obter metodologias. Parando testes.")
        return
    
    # Teste 2: Simular chamadas do frontend
    print("\n" + "=" * 50)
    results = test_frontend_api_simulation()
    
    # Resumo final
    print("\n" + "=" * 50)
    print("📊 RESUMO DOS TESTES")
    print("=" * 50)
    
    for methodology, success in results.items():
        status = "✅ PASSOU" if success else "❌ FALHOU"
        print(f"{methodology:20} : {status}")
    
    # Verificar se worked_examples está funcionando
    if results.get("worked_examples"):
        print("\n🎉 SUCESSO: worked_examples está funcionando corretamente!")
        print("   O problema de travamento foi resolvido.")
    else:
        print("\n⚠️ ATENÇÃO: worked_examples ainda apresenta problemas.")
    
    print("\n💡 Para mais detalhes, verifique os logs do backend:")
    print("   docker logs coderbot-backend --tail 20")

if __name__ == "__main__":
    main()
