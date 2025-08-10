# /home/mendes/Documents/Github/Chatbot-educacional/coderbot-v2/backend/test_pb_admin_auth.py
import os
from pocketbase import PocketBase
from dotenv import load_dotenv
import httpx # Import httpx to catch its specific exceptions

# Load .env file from the current directory (backend/.env)
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
print(f"Attempting to load .env from: {os.path.abspath(dotenv_path)}")

if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)
    print(".env file loaded.")
else:
    print(f"Error: .env file not found at {dotenv_path}")
    print("Please ensure the .env file is in the same directory as this script (backend/).")
    exit(1)

POCKETBASE_URL = os.getenv("POCKETBASE_URL")
POCKETBASE_ADMIN_EMAIL = os.getenv("POCKETBASE_ADMIN_EMAIL")
POCKETBASE_ADMIN_PASSWORD = os.getenv("POCKETBASE_ADMIN_PASSWORD")

print(f"PocketBase URL: {POCKETBASE_URL}")
print(f"PocketBase Admin Email: {POCKETBASE_ADMIN_EMAIL}")
# Avoid printing the password directly: print(f"PocketBase Admin Password: {POCKETBASE_ADMIN_PASSWORD}")

if not all([POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL, POCKETBASE_ADMIN_PASSWORD]):
    print("Error: Missing one or more PocketBase environment variables (URL, ADMIN_EMAIL, ADMIN_PASSWORD).")
    print("Please check your .env file.")
    exit(1)

client = PocketBase(POCKETBASE_URL)
print(f"PocketBase client initialized with URL: {client.base_url}")

try:
    print(f"Attempting to authenticate admin ({POCKETBASE_ADMIN_EMAIL}) with PocketBase...")
    
    # This is the critical call, using the standard SDK method for admin authentication
    admin_data = client.admins.auth_with_password(POCKETBASE_ADMIN_EMAIL, POCKETBASE_ADMIN_PASSWORD)
    
    print("Admin authentication successful!")
    if client.auth_store.is_valid and client.auth_store.token and client.auth_store.model:
        print(f"Admin Token: {client.auth_store.token[:10]}... (truncated)") # Show only part of the token
        print(f"Admin Model ID: {client.auth_store.model.id}")
    else:
        print("Authentication reported success, but auth_store seems invalid or empty.")
        print(f"Auth store valid: {client.auth_store.is_valid}")
        print(f"Auth store token present: {client.auth_store.token is not None}")
        print(f"Auth store model present: {client.auth_store.model is not None}")

except httpx.HTTPStatusError as e:
    print(f"HTTPStatusError during admin authentication: {e}")
    print(f"Request URL: {e.request.url}")
    print(f"Response status code: {e.response.status_code}")
    print(f"Response content: {e.response.text}")
except Exception as e:
    print(f"An unexpected error occurred during admin authentication: {type(e).__name__} - {e}")
