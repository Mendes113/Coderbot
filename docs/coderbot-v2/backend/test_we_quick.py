#!/usr/bin/env python3
"""
Teste rápido para verificar se o novo formato de worked examples está funcionando
"""

from app.services.educational_methodology_service import educational_methodology_service
import json

def test_worked_examples():
    print("🔧 Testando o novo formato de worked examples...")
    
    # Dados de teste
    test_data = {
        "query": "Como implementar um algoritmo de ordenação por inserção?",
        "subject": "algoritmos",
        "difficulty": "intermediario",
        "methodology": "worked_examples"
    }
    
    try:
        # Testa o serviço
        result = educational_methodology_service.get_methodology_for_topic(
            methodology_name="worked_examples",
            **test_data
        )
        
        print(f"✅ Metodologia encontrada: {result.get('name', 'N/A')}")
        print(f"📋 Metadados:")
        metadata = result.get("metadata", {})
        print(f"   - Usa JSON structure: {metadata.get('use_json_structure', 'N/A')}")
        print(f"   - Required keys: {metadata.get('required_keys', [])}")
        print(f"   - Max tokens: {metadata.get('max_tokens', 'N/A')}")
        
        print(f"\n📝 Template (primeiros 200 caracteres):")
        template = result.get("template", "")
        print(f"   {template[:200]}...")
        
        # Verifica se as mudanças estão aplicadas
        if metadata.get('use_json_structure') == False:
            print("✅ use_json_structure = False (correto)")
        else:
            print("❌ use_json_structure deveria ser False")
            
        required_keys = metadata.get('required_keys', [])
        expected_keys = ["description", "result", "extra", "problemWECorrect", "problemWEIncorrect"]
        missing_keys = set(expected_keys) - set(required_keys)
        extra_keys = set(required_keys) - set(expected_keys)
        
        if not missing_keys and not extra_keys:
            print("✅ required_keys estão corretos")
        else:
            if missing_keys:
                print(f"❌ Chaves faltando: {missing_keys}")
            if extra_keys:
                print(f"❌ Chaves extras: {extra_keys}")
        
        # Verifica se o template contém as seções com emojis
        if "🎯" in template and "📚" in template and "💡" in template and "🔥" in template and "🏋️" in template:
            print("✅ Template contém seções organizacionais com emojis")
        else:
            print("❌ Template não contém as seções organizacionais esperadas")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao testar: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_worked_examples()
    if success:
        print("\n🎉 Teste concluído com sucesso!")
    else:
        print("\n💥 Teste falhou!")
