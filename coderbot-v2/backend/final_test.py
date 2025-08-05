#!/usr/bin/env python3
"""
Teste final das metodologias educacionais
"""

import requests
import json
import time

API_URL = "http://localhost:8000"

def test_methodology(methodology_name, test_question):
    """Testa uma metodologia específica"""
    print(f"\n🧪 Testando metodologia: {methodology_name}")
    print(f"Pergunta: {test_question}")
    
    payload = {
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": test_question}],
        "max_tokens": 200,
        "temperature": 0.7,
        "methodology": methodology_name,
        "user_profile": {
            "difficulty_level": "beginner",
            "subject_area": "programming",
            "baseKnowledge": "basic"
        }
    }
    
    try:
        start_time = time.time()
        response = requests.post(f"{API_URL}/chat/completions", json=payload, timeout=20)
        end_time = time.time()
        
        duration = end_time - start_time
        
        if response.status_code == 200:
            result = response.json()
            content = result.get('content', 'Sem conteúdo')
            
            print(f"✅ SUCESSO! ({duration:.1f}s)")
            print(f"Resposta: {content[:150]}...")
            return True
        else:
            print(f"❌ ERRO: {response.status_code}")
            print(f"Resposta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ ERRO: {e}")
        return False

def main():
    print("🔧 TESTE FINAL DAS METODOLOGIAS EDUCACIONAIS")
    print("=" * 50)
    
    test_cases = [
        ("worked_examples", "Como implementar um algoritmo de busca binária?"),
        ("default", "Explique o conceito de recursão em programação"),
        ("sequential_thinking", "Como funciona o garbage collection em Python?")
    ]
    
    results = {}
    
    for methodology, question in test_cases:
        success = test_methodology(methodology, question)
        results[methodology] = success
        time.sleep(1)  # Pequena pausa entre testes
    
    print("\n" + "=" * 50)
    print("📊 RESULTADOS FINAIS:")
    
    all_working = True
    for methodology, success in results.items():
        status = "✅ FUNCIONANDO" if success else "❌ COM PROBLEMAS"
        print(f"  {methodology:20} -> {status}")
        if not success:
            all_working = False
    
    print("\n" + "=" * 50)
    if all_working:
        print("🎉 PROBLEMA RESOLVIDO!")
        print("Todas as metodologias estão funcionando corretamente.")
        print("A metodologia 'worked_examples' não trava mais o chat!")
    else:
        print("⚠️ Algumas metodologias ainda apresentam problemas.")
    
    print("\n🔍 Para verificar logs detalhados, execute:")
    print("docker logs coderbot-backend --tail 20")

if __name__ == "__main__":
    main()
