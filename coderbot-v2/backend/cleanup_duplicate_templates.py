#!/usr/bin/env python3
"""
Script para limpar templates duplicados no PocketBase
Mantém apenas o template de maior versão para cada combinação de metodologia/nome
"""

import os
import requests
from dotenv import load_dotenv
from collections import defaultdict

# Carregar variáveis de ambiente
load_dotenv()

# Configurações
POCKETBASE_URL = os.getenv("POCKETBASE_URL", "http://localhost:8090")
COLLECTION = "dynamic_prompts"

def get_all_templates():
    """Busca todos os templates ativos do PocketBase"""
    url = f"{POCKETBASE_URL}/api/collections/{COLLECTION}/records"
    params = {"filter": "is_active=true", "perPage": 100}
    
    try:
        response = requests.get(url, params=params)
        if response.status_code != 200:
            print(f"❌ Erro ao buscar templates: {response.status_code}")
            print(f"Resposta: {response.text}")
            return []
            
        data = response.json()
        return data.get('items', [])
    except Exception as e:
        print(f"❌ Erro ao buscar templates: {e}")
        return []

def delete_template(template_id):
    """Deleta um template específico"""
    url = f"{POCKETBASE_URL}/api/collections/{COLLECTION}/records/{template_id}"
    
    try:
        response = requests.delete(url)
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Erro ao deletar template {template_id}: {e}")
        return False

def main():
    print("🔍 Buscando templates duplicados...")
    
    # Buscar todos os templates
    templates = get_all_templates()
    if not templates:
        print("❌ Nenhum template encontrado.")
        return
        
    print(f"✅ Encontrados {len(templates)} templates ativos.")
    
    # Agrupar templates por metodologia+nome
    template_groups = defaultdict(list)
    for template in templates:
        key = f"{template['methodology']}:{template['name']}"
        template_groups[key].append(template)
    
    duplicates_found = False
    
    # Verificar duplicatas
    for key, group in template_groups.items():
        if len(group) > 1:
            duplicates_found = True
            methodology, name = key.split(':')
            print(f"⚠️  Encontrados {len(group)} templates para '{name}' (metodologia: {methodology})")
            
            # Ordenar por versão (maior primeiro)
            sorted_group = sorted(group, key=lambda t: t.get('version', 0), reverse=True)
            
            # Manter o de maior versão, deletar os outros
            keep = sorted_group[0]
            print(f"   ✅ Mantendo template ID: {keep['id']} (versão: {keep.get('version', 0)})")
            
            for template in sorted_group[1:]:
                print(f"   🗑️  Deletando template ID: {template['id']} (versão: {template.get('version', 0)})")
                success = delete_template(template['id'])
                if success:
                    print(f"      ✅ Template deletado com sucesso.")
                else:
                    print(f"      ❌ Falha ao deletar template.")
    
    if not duplicates_found:
        print("✅ Nenhum template duplicado encontrado!")
    else:
        print("\n🎉 Limpeza de templates duplicados concluída!")

if __name__ == "__main__":
    main()
