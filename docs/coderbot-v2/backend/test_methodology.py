import requests
import json

# Configuration
API_URL = "http://localhost:8000"
TEST_MESSAGE = "Explique o conceito de herança em programação orientada a objetos"

def test_default_methodology():
    """Test the default response without any special methodology"""
    response = requests.post(
        f"{API_URL}/deepseek/chat/completions",
        json={
            "model": "gpt-3.5-turbo",
            "messages": [{"role": "user", "content": TEST_MESSAGE}],
            "max_tokens": 350,
            "temperature": 0.7,
        }
    )
    
    if response.status_code != 200:
        print(f"Error: {response.status_code}")
        print(response.text)
        return
    
    result = response.json()
    print("\n=== DEFAULT METHODOLOGY RESPONSE ===")
    if "choices" in result and len(result["choices"]) > 0:
        print(result["choices"][0]["message"]["content"])
    else:
        print("Unexpected response format:", result)

def test_sequential_thinking_methodology():
    """Test the sequential thinking methodology"""
    response = requests.post(
        f"{API_URL}/chat/completions",
        json={
            "model": "gpt-3.5-turbo",
            "messages": [{"role": "user", "content": TEST_MESSAGE}],
            "max_tokens": 350,
            "temperature": 0.7,
            "methodology": "sequential_thinking",
            "user_profile": {
                "difficulty_level": "medium",
                "subject_area": "programming",
                "style_preference": "concise",
                "learning_progress": {"questions_answered": 0, "correct_answers": 0},
                "baseKnowledge": "basic"
            }
        }
    )
    
    if response.status_code != 200:
        print(f"Error: {response.status_code}")
        print(response.text)
        return
    
    result = response.json()
    print("\n=== SEQUENTIAL THINKING METHODOLOGY RESPONSE ===")
    print(result.get("content", "No content found in response"))

def test_analogy_methodology():
    """Test the analogy methodology"""
    response = requests.post(
        f"{API_URL}/deepseek/chat/completions",
        json={
            "model": "gpt-3.5-turbo",
            "messages": [{"role": "user", "content": TEST_MESSAGE}],
            "max_tokens": 350,
            "temperature": 0.7,
            "use_analogies": True
        }
    )
    
    if response.status_code != 200:
        print(f"Error: {response.status_code}")
        print(response.text)
        return
    
    result = response.json()
    print("\n=== ANALOGY METHODOLOGY RESPONSE ===")
    if "choices" in result and len(result["choices"]) > 0:
        print(result["choices"][0]["message"]["content"])
    else:
        print("Unexpected response format:", result)

def test_list_methodologies():
    """Test fetching available methodologies"""
    response = requests.get(f"{API_URL}/chat/methodologies")
    
    if response.status_code != 200:
        print(f"Error: {response.status_code}")
        print(response.text)
        return
    
    result = response.json()
    print("\n=== AVAILABLE METHODOLOGIES ===")
    for methodology in result.get("methodologies", []):
        print(f"ID: {methodology['id']}")
        print(f"Name: {methodology['name']}")
        print(f"Description: {methodology['description']}")
        print(f"Recommended for: {', '.join(methodology['recommended_for'])}")
        print("---")

if __name__ == "__main__":
    print("Testing customizable prompts and methodologies...")
    
    # Test listing available methodologies
    test_list_methodologies()
    
    # Test each methodology type
    test_default_methodology()
    test_sequential_thinking_methodology()
    test_analogy_methodology()

    print("\nAll tests completed!")
