#!/usr/bin/env python3
"""
Script de validação do sistema RAG + Exemplos + Feedback.

Testa:
1. Validação anti-gibberish
2. Salvamento de exemplos
3. Sistema de feedback
4. Cálculo de quality_score
"""

import sys
import os

# Adicionar path do backend
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.services.examples_rag_service import ExamplesRAGService


def test_anti_gibberish():
    """Testa validação anti-gibberish."""
    print("\n🧪 Teste 1: Validação Anti-Gibberish")
    print("=" * 60)
    
    service = ExamplesRAGService(None)
    
    test_cases = [
        # (query, should_pass, description)
        ("Como usar loops em Python?", True, "Query válida sobre programação"),
        ("Qual o melhor time de futebol?", False, "Query sobre futebol (off-topic)"),
        ("Me ensine a fazer um bolo", False, "Query sobre receita (off-topic)"),
        ("O que é recursão?", True, "Query válida sobre conceito"),
        ("Como está o clima hoje?", False, "Query sobre clima (off-topic)"),
        ("Como criar uma função em JavaScript?", True, "Query válida sobre JS"),
        ("asd", False, "Query muito curta"),
    ]
    
    passed = 0
    failed = 0
    
    for query, should_pass, description in test_cases:
        result = service.validate_educational_query(query)
        is_valid = result["is_valid"]
        
        status = "✅" if is_valid == should_pass else "❌"
        passed += 1 if is_valid == should_pass else 0
        failed += 0 if is_valid == should_pass else 1
        
        print(f"\n{status} {description}")
        print(f"   Query: \"{query}\"")
        print(f"   Esperado: {'Válida' if should_pass else 'Inválida'}")
        print(f"   Resultado: {'Válida' if is_valid else 'Inválida'}")
        print(f"   Confidence: {result.get('confidence', 0):.2f}")
        
        if not is_valid:
            print(f"   Razão: {result['reason']}")
    
    print(f"\n📊 Resultado: {passed}/{len(test_cases)} testes passaram")
    return failed == 0


def test_quality_score_calculation():
    """Testa cálculo de quality_score."""
    print("\n🧪 Teste 2: Cálculo de Quality Score")
    print("=" * 60)
    
    service = ExamplesRAGService(None)
    
    test_cases = [
        # (upvotes, downvotes, usage_count, days, expected_range, description)
        (0, 0, 1, 0, (0.5, 0.5), "Novo exemplo sem votos"),
        (1, 0, 1, 0, (0.5, 0.7), "1 upvote (poucos dados)"),
        (10, 0, 1, 0, (0.7, 0.85), "10 upvotes (bom)"),
        (20, 3, 1, 0, (0.75, 0.85), "20 up, 3 down (ótimo)"),
        (20, 3, 50, 0, (0.8, 0.95), "Muito usado (usage boost)"),
        (20, 3, 1, 90, (0.65, 0.75), "Antigo 90 dias (decay)"),
        (3, 7, 1, 0, (0.2, 0.4), "Mais downvotes que upvotes"),
    ]
    
    passed = 0
    
    for upvotes, downvotes, usage, days, expected_range, description in test_cases:
        score = service._calculate_quality_score(upvotes, downvotes, usage, days)
        
        min_score, max_score = expected_range
        is_valid = min_score <= score <= max_score
        
        status = "✅" if is_valid else "❌"
        passed += 1 if is_valid else 0
        
        print(f"\n{status} {description}")
        print(f"   Upvotes: {upvotes}, Downvotes: {downvotes}")
        print(f"   Usage: {usage}x, Age: {days} dias")
        print(f"   Score: {score:.3f}")
        print(f"   Esperado: {min_score:.2f} - {max_score:.2f}")
    
    print(f"\n📊 Resultado: {passed}/{len(test_cases)} testes passaram")
    return passed == len(test_cases)


def test_topic_extraction():
    """Testa extração de tópicos."""
    print("\n🧪 Teste 3: Extração de Tópicos")
    print("=" * 60)
    
    service = ExamplesRAGService(None)
    
    test_cases = [
        (
            "Como usar map em JavaScript?",
            None,
            ["javascript", "map"]
        ),
        (
            "Como criar uma função recursiva em Python?",
            None,
            ["python", "recursion", "função"]
        ),
        (
            "O que é um array?",
            {"topics": ["javascript", "arrays"]},
            ["javascript", "arrays", "array"]
        ),
    ]
    
    passed = 0
    
    for query, mission_context, expected_topics in test_cases:
        topics = service._extract_topics_from_query(query, mission_context)
        
        # Verificar se pelo menos alguns tópicos esperados estão presentes
        found = sum(1 for t in expected_topics if t in topics)
        is_valid = found >= len(expected_topics) // 2  # Pelo menos metade
        
        status = "✅" if is_valid else "❌"
        passed += 1 if is_valid else 0
        
        print(f"\n{status} Query: \"{query}\"")
        print(f"   Tópicos extraídos: {topics}")
        print(f"   Tópicos esperados: {expected_topics}")
        print(f"   Match: {found}/{len(expected_topics)}")
    
    print(f"\n📊 Resultado: {passed}/{len(test_cases)} testes passaram")
    return passed == len(test_cases)


def main():
    """Executa todos os testes."""
    print("🚀 Validação do Sistema RAG + Exemplos + Feedback")
    print("=" * 60)
    
    results = []
    
    results.append(("Anti-Gibberish", test_anti_gibberish()))
    results.append(("Quality Score", test_quality_score_calculation()))
    results.append(("Topic Extraction", test_topic_extraction()))
    
    print("\n" + "=" * 60)
    print("📋 RESUMO FINAL")
    print("=" * 60)
    
    for test_name, passed in results:
        status = "✅ PASSOU" if passed else "❌ FALHOU"
        print(f"{status}: {test_name}")
    
    all_passed = all(passed for _, passed in results)
    
    if all_passed:
        print("\n🎉 Todos os testes passaram!")
        return 0
    else:
        print("\n⚠️ Alguns testes falharam. Verifique os logs acima.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
