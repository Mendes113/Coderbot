# filepath: backend/app/services/prompt_loader.py
import os
from pocketbase import PocketBase # Ou a biblioteca cliente PocketBase que você estiver usando
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '..', '.env')) # Ajuste o caminho para o .env

POCKETBASE_URL = os.getenv("POCKETBASE_URL")

class PromptLoader:
    def __init__(self):
        self.client = PocketBase(POCKETBASE_URL)
        # Autenticação de administrador removida, pois as regras de API da coleção dynamic_prompts
        # foram ajustadas para permitir leitura pública ou por usuários autenticados.

    def get_prompt(self, methodology: str, name: str = None) -> str | None:
        """
        Busca um template de prompt do PocketBase.
        Se 'name' for fornecido, busca por nome e metodologia.
        Caso contrário, busca um prompt padrão para a metodologia.
        """
        try:
            filter_parts = [f'methodology="{methodology}"', 'is_active=true']
            if name:
                filter_parts.append(f'name="{name}"')
            else:
                # Convenção para nome de prompt padrão por metodologia, ex: "default_analogy"
                filter_parts.append(f'name="default_{methodology}"')
            
            filter_string = " && ".join(filter_parts)
            
            records = self.client.collection("dynamic_prompts").get_list(
                page=1, 
                per_page=1, 
                query_params={"filter": filter_string, "sort": "-version"} # Pega a versão mais recente
            ).items

            if records:
                return records[0].template
            
            # Fallback para um prompt global padrão se nenhum específico for encontrado
            if not name: # Evita fallback se um nome específico foi pedido e não encontrado
                global_default_records = self.client.collection("dynamic_prompts").get_list(
                    page=1,
                    per_page=1,
                    query_params={"filter": 'name="global_default" && is_active=true', "sort": "-version"}
                ).items
                if global_default_records:
                    return global_default_records[0].template

            return None
        except Exception as e:
            print(f"Error fetching prompt from PocketBase: {e}")
            return None # Ou lançar uma exceção/usar um prompt de fallback estático

    def format_prompt(self, template: str, data: dict) -> str:
        """
        Preenche os placeholders no template do prompt com os dados fornecidos.
        """
        prompt = template
        for key, value in data.items():
            placeholder = "{" + key + "}"
            prompt = prompt.replace(placeholder, str(value))
        return prompt

# Exemplo de como você poderia usar (em um endpoint da API):
# prompt_loader = PromptLoader()
#
# def handle_chat_request(user_query: str, methodology: str, context_history: str = "", knowledge_base: str = ""):
#     template = prompt_loader.get_prompt(methodology=methodology) # ou com um nome específico
#     if not template:
#         return {"error": "Prompt template not found for the given methodology."}
#
#     prompt_data = {
#         "user_query": user_query,
#         "context_history": context_history,
#         "knowledge_base": knowledge_base
#     }
#     final_prompt = prompt_loader.format_prompt(template, prompt_data)
#     
#     # ... lógica para enviar o final_prompt para a LLM ...
#     # llm_response = send_to_llm(final_prompt)
#     # return {"response": llm_response}