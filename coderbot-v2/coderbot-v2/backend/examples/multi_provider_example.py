#!/usr/bin/env python3
"""
Exemplo Prático: Sistema AGNO Multi-Provedor
============================================

Este script demonstra como usar o sistema AGNO com múltiplos provedores
de IA (OpenAI e Claude) para diferentes metodologias educacionais.

Para executar:
    python examples/multi_provider_example.py

Certifique-se de ter as variáveis de ambiente configuradas:
- OPEN_AI_API_KEY
- CLAUDE_API_KEY (opcional)
"""

import sys
import os
import asyncio
from typing import Dict, Any

# Adicionar o diretório pai ao path para importar os módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.agno_service import AgnoService
from app.services.agno_methodology_service import MethodologyType

def print_separator(title: str):
    """Imprime um separador visual."""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def print_response(provider: str, methodology: str, response: str):
    """Formata e imprime uma resposta."""
    print(f"\n🤖 {provider.upper()} | {methodology}")
    print("-" * 40)
    print(response[:500] + "..." if len(response) > 500 else response)

def demo_basic_usage():
    """Demonstra uso básico com diferentes provedores."""
    print_separator("DEMO 1: Uso Básico - Diferentes Provedores")
    
    # Pergunta de teste
    question = "Explique o que é recursão em programação de forma simples."
    context = "Aula introdutória sobre algoritmos"
    
    try:
        # Testar OpenAI
        print("\n🔄 Inicializando com OpenAI (GPT-4o)...")
        agno_openai = AgnoService(model_id="gpt-4o")
        openai_response = agno_openai.get_analogy_response(question, context)
        print_response("OpenAI", "Analogias", openai_response)
        
    except Exception as e:
        print(f"❌ Erro com OpenAI: {e}")
    
    try:
        # Testar Claude
        print("\n🔄 Inicializando com Claude (Claude-3.5-Sonnet)...")
        agno_claude = AgnoService(model_id="claude-3-5-sonnet")
        claude_response = agno_claude.get_analogy_response(question, context)
        print_response("Claude", "Analogias", claude_response)
        
    except Exception as e:
        print(f"❌ Erro com Claude: {e}")

def demo_methodology_comparison():
    """Compara diferentes metodologias com o mesmo provedor."""
    print_separator("DEMO 2: Comparação de Metodologias")
    
    # Usar Claude para comparação
    agno = AgnoService("claude-3-5-sonnet")
    
    question = "Como implementar busca binária?"
    context = "Algoritmos de busca"
    
    methodologies = [
        (MethodologyType.SEQUENTIAL_THINKING, "Pensamento Sequencial"),
        (MethodologyType.ANALOGY, "Analogias"),
        (MethodologyType.SOCRATIC, "Método Socrático"),
        (MethodologyType.SCAFFOLDING, "Scaffolding")
    ]
    
    for methodology, name in methodologies:
        try:
            print(f"\n🧠 Testando: {name}...")
            response = agno.ask_question(methodology, question, context)
            print_response("Claude", name, response)
        except Exception as e:
            print(f"❌ Erro com {name}: {e}")

def demo_model_switching():
    """Demonstra alternância dinâmica entre modelos."""
    print_separator("DEMO 3: Alternância Dinâmica de Modelos")
    
    agno = AgnoService()
    
    question = "Explique programação orientada a objetos usando analogias."
    
    models_to_test = [
        ("gpt-4o", "openai"),
        ("claude-3-5-sonnet", "claude"),
        ("gpt-3.5-turbo", "openai"),
    ]
    
    for model, provider in models_to_test:
        try:
            print(f"\n🔄 Alternando para: {provider}/{model}")
            
            # Alternar modelo
            agno.switch_model(model, provider)
            
            # Verificar informações atuais
            info = agno.get_current_model_info()
            print(f"   Modelo ativo: {info['provider']}/{info['model_id']}")
            
            # Fazer pergunta
            response = agno.get_analogy_response(question)
            print_response(info['provider'], "Analogias", response)
            
        except Exception as e:
            print(f"❌ Erro ao alternar para {provider}/{model}: {e}")

def demo_performance_comparison():
    """Compara performance entre provedores."""
    print_separator("DEMO 4: Comparação de Performance")
    
    agno = AgnoService()
    
    try:
        results = agno.compare_providers_performance(
            methodology=MethodologyType.ANALOGY,
            user_query="Explique como funciona uma API REST",
            providers=["openai", "claude"],
            context="Desenvolvimento web"
        )
        
        print("\n📊 Resultados da Comparação:")
        print("-" * 40)
        
        for provider, result in results.items():
            if result["success"]:
                print(f"✅ {provider.upper()}:")
                print(f"   Modelo: {result['model_used']}")
                print(f"   Tempo: {result['execution_time']:.2f}s")
                print(f"   Tamanho: {result['response_length']} chars")
            else:
                print(f"❌ {provider.upper()}: {result['error']}")
        
    except Exception as e:
        print(f"❌ Erro na comparação: {e}")

def demo_recommendations():
    """Demonstra sistema de recomendações."""
    print_separator("DEMO 5: Recomendações Inteligentes")
    
    agno = AgnoService()
    
    use_cases = ["general", "creative", "analytical", "educational"]
    
    for use_case in use_cases:
        try:
            print(f"\n💡 Recomendações para: {use_case.upper()}")
            
            # Recomendação normal
            rec = agno.get_provider_recommendations(use_case=use_case, budget_conscious=False)
            print(f"   Recomendado: {rec['recommended']['provider']}/{rec['recommended']['model']}")
            print(f"   Motivo: {rec['recommended']['reason']}")
            
            # Recomendação econômica
            budget_rec = agno.get_provider_recommendations(use_case=use_case, budget_conscious=True)
            print(f"   Econômico: {budget_rec['recommended']['provider']}/{budget_rec['recommended']['model']}")
            print(f"   Motivo: {budget_rec['recommended']['reason']}")
            
        except Exception as e:
            print(f"❌ Erro para {use_case}: {e}")

def demo_worked_examples():
    """Demonstra exemplos resolvidos com ambos provedores."""
    print_separator("DEMO 6: Worked Examples (XML)")
    
    question = "Como implementar ordenação por seleção (selection sort)?"
    context = "Algoritmos de ordenação básicos"
    
    providers = [
        ("openai", "gpt-4o"),
        ("claude", "claude-3-5-sonnet")
    ]
    
    for provider, model in providers:
        try:
            print(f"\n📚 Testando Worked Examples com {provider.upper()}...")
            agno = AgnoService(model, provider)
            
            response = agno.get_worked_example(question, context)
            
            print(f"🤖 {provider.upper()} | Worked Example")
            print("-" * 40)
            
            # Mostrar apenas os primeiros 800 caracteres para economizar espaço
            preview = response[:800] + "..." if len(response) > 800 else response
            print(preview)
            
            # Verificar se é XML válido
            is_xml = agno.is_methodology_xml_formatted(MethodologyType.WORKED_EXAMPLES)
            print(f"   ✓ Formato XML: {'Sim' if is_xml else 'Não'}")
            
        except Exception as e:
            print(f"❌ Erro com {provider}: {e}")

def show_system_info():
    """Mostra informações do sistema."""
    print_separator("INFORMAÇÕES DO SISTEMA")
    
    try:
        agno = AgnoService()
        
        # Provedores disponíveis
        providers = agno.get_available_providers()
        print(f"\n🔌 Provedores disponíveis: {', '.join(providers)}")
        
        # Modelos por provedor
        for provider in providers:
            models = agno.get_available_models_for_provider(provider)
            print(f"\n📋 Modelos {provider.upper()}:")
            for model in models:
                print(f"   • {model}")
        
        # Metodologias disponíveis
        methodologies = agno.get_available_methodologies()
        print(f"\n🧠 Metodologias disponíveis:")
        for methodology in methodologies:
            print(f"   • {methodology}")
        
        # Informações do modelo atual
        info = agno.get_current_model_info()
        print(f"\n🎯 Modelo padrão:")
        print(f"   Provider: {info['provider']}")
        print(f"   Model ID: {info['model_id']}")
        print(f"   Real Model: {info['real_model_name']}")
        print(f"   Streaming: {'Sim' if info['supports_streaming'] else 'Não'}")
        
    except Exception as e:
        print(f"❌ Erro ao obter informações: {e}")

def main():
    """Função principal que executa todos os demos."""
    print("🚀 SISTEMA AGNO - DEMO MULTI-PROVEDOR")
    print("=====================================")
    print("\nEste demo mostra as capacidades do sistema AGNO")
    print("com suporte para OpenAI e Claude (Anthropic).")
    print("\nCertifique-se de ter as chaves de API configuradas:")
    print("- OPEN_AI_API_KEY (obrigatório)")
    print("- CLAUDE_API_KEY (opcional)")
    
    # Verificar variáveis de ambiente
    openai_key = os.getenv("OPEN_AI_API_KEY")
    claude_key = os.getenv("CLAUDE_API_KEY")
    
    print(f"\n✅ OpenAI API Key: {'Configurada' if openai_key else '❌ NÃO CONFIGURADA'}")
    print(f"✅ Claude API Key: {'Configurada' if claude_key else '❌ NÃO CONFIGURADA'}")
    
    if not openai_key:
        print("\n❌ ERRO: OpenAI API Key é obrigatória!")
        print("Configure a variável OPEN_AI_API_KEY e tente novamente.")
        return
    
    # Executar demos
    try:
        show_system_info()
        demo_basic_usage()
        demo_methodology_comparison()
        demo_model_switching()
        
        if claude_key:  # Só executar se Claude estiver configurado
            demo_performance_comparison()
            demo_worked_examples()
        else:
            print("\n⚠️  Demos de comparação pulados (Claude API Key não configurada)")
        
        demo_recommendations()
        
    except KeyboardInterrupt:
        print("\n\n❌ Demo interrompido pelo usuário.")
    except Exception as e:
        print(f"\n❌ Erro durante execução do demo: {e}")
    
    print("\n🎉 Demo concluído!")
    print("Para mais informações, consulte AGNO_MULTI_PROVIDER_GUIDE.md")

if __name__ == "__main__":
    main() 