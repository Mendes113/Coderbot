#!/usr/bin/env python3
"""
Script para testar se o sistema de worked examples está retornando 
a estrutura JSON específica conforme esperado.
"""

import requests
import json
import sys

# Configurações
API_URL = "http://localhost:8000"

def test_json_structure():
    """Testa se a resposta está no formato JSON correto"""
    print("🧪 Testando estrutura JSON da metodologia worked_examples...")
    
    payload = {
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": "Como criar uma função em Python que calcula a área de um retângulo?"}],
        "max_tokens": 1000,
        "temperature": 0.7,
        "methodology": "worked_examples",
        "user_profile": {
            "difficulty_level": "beginner",
            "subject_area": "programming",
            "baseKnowledge": "básico em Python",
            "learning_progress": {"questions_answered": 2, "correct_answers": 1}
        }
    }
    
    try:
        response = requests.post(f"{API_URL}/chat/completions", json=payload, timeout=60)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            # Verificar se há conteúdo
            if "choices" in result and result["choices"]:
                content = result["choices"][0]["message"]["content"]
                print("📥 Resposta recebida")
                print(f"Tamanho da resposta: {len(content)} caracteres")
                
                # Tentar parsear como JSON
                try:
                    json_response = json.loads(content)
                    print("✅ Resposta é um JSON válido!")
                    
                    # Verificar chaves obrigatórias
                    required_keys = [
                        "title", "topic", "knowledge", "origin", "description", 
                        "result", "extra", "problemWECorrect", "problemWEIncorrect"
                    ]
                    
                    missing_keys = []
                    for key in required_keys:
                        if key not in json_response:
                            missing_keys.append(key)
                    
                    if missing_keys:
                        print(f"❌ Chaves obrigatórias ausentes: {missing_keys}")
                    else:
                        print("✅ Todas as chaves obrigatórias estão presentes!")
                        
                        # Verificar estrutura das subchaves
                        if "problemWECorrect" in json_response:
                            correct_keys = ["thinking", "solutionProposal", "correctSolutionProposal"]
                            for subkey in correct_keys:
                                if subkey not in json_response["problemWECorrect"]:
                                    print(f"⚠️  Subchave ausente em problemWECorrect: {subkey}")
                        
                        if "problemWEIncorrect" in json_response:
                            incorrect_keys = ["thinking", "incorrectSolution", "test", "options", "correctOption", "error", "response", "correctSolutionProposal"]
                            for subkey in incorrect_keys:
                                if subkey not in json_response["problemWEIncorrect"]:
                                    print(f"⚠️  Subchave ausente em problemWEIncorrect: {subkey}")
                    
                    # Mostrar primeiro nível das chaves para verificação
                    print("\n📋 Estrutura da resposta:")
                    for key in json_response:
                        if isinstance(json_response[key], dict):
                            print(f"  {key}: [objeto com {len(json_response[key])} propriedades]")
                        elif isinstance(json_response[key], str):
                            preview = json_response[key][:50] + "..." if len(json_response[key]) > 50 else json_response[key]
                            print(f"  {key}: '{preview}'")
                        else:
                            print(f"  {key}: {json_response[key]}")
                    
                except json.JSONDecodeError as e:
                    print(f"❌ Resposta não é um JSON válido: {e}")
                    print("📄 Primeiros 500 caracteres da resposta:")
                    print(content[:500])
                    
            else:
                print("❌ Resposta vazia ou sem conteúdo")
                
        else:
            print(f"❌ Erro na requisição: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Erro durante o teste: {e}")
        return False
    
    return True

if __name__ == "__main__":
    if test_json_structure():
        print("\n🎉 Teste concluído!")
    else:
        print("\n💥 Teste falhou!")
        sys.exit(1)
