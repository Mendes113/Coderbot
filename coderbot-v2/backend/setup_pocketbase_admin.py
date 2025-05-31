#!/usr/bin/env python3
"""
Script to set up PocketBase admin user and test connection
"""
import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

POCKETBASE_URL = os.getenv("POCKETBASE_URL", "http://localhost:8090")
ADMIN_EMAIL = os.getenv("POCKETBASE_ADMIN_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.getenv("POCKETBASE_ADMIN_PASSWORD", "admin123456")

def create_admin_user():
    """Create admin user if it doesn't exist"""
    try:
        # Try to create admin user
        response = requests.post(
            f"{POCKETBASE_URL}/api/admins",
            json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD,
                "passwordConfirm": ADMIN_PASSWORD
            }
        )
        
        if response.status_code == 200:
            print(f"✅ Admin user created successfully: {ADMIN_EMAIL}")
            return True
        elif response.status_code == 400:
            # User might already exist, try to authenticate
            print(f"ℹ️  Admin user might already exist, testing authentication...")
            return test_admin_auth()
        else:
            print(f"❌ Failed to create admin user: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        return False

def test_admin_auth():
    """Test admin authentication"""
    try:
        response = requests.post(
            f"{POCKETBASE_URL}/api/admins/auth-with-password",
            json={
                "identity": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("token")
            print(f"✅ Admin authentication successful!")
            print(f"Token: {token[:20]}...")
            return True
        else:
            print(f"❌ Admin authentication failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing admin auth: {e}")
        return False

def test_collections():
    """Test if adaptive learning collections exist"""
    try:
        # First authenticate
        auth_response = requests.post(
            f"{POCKETBASE_URL}/api/admins/auth-with-password",
            json={
                "identity": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            }
        )
        
        if auth_response.status_code != 200:
            print("❌ Cannot authenticate to test collections")
            return False
            
        token = auth_response.json().get("token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test collections
        collections_response = requests.get(
            f"{POCKETBASE_URL}/api/collections",
            headers=headers
        )
        
        if collections_response.status_code == 200:
            collections = collections_response.json().get("items", [])
            adaptive_collections = [
                "user_learning_profiles",
                "learning_paths", 
                "adaptive_recommendations",
                "learning_sessions",
                "skill_matrices",
                "user_analytics",
                "learning_streaks"
            ]
            
            existing_collections = [c["name"] for c in collections]
            found_collections = [c for c in adaptive_collections if c in existing_collections]
            
            print(f"✅ Found {len(found_collections)}/{len(adaptive_collections)} adaptive learning collections:")
            for collection in found_collections:
                print(f"   - {collection}")
                
            if len(found_collections) < len(adaptive_collections):
                missing = [c for c in adaptive_collections if c not in existing_collections]
                print(f"⚠️  Missing collections: {missing}")
                print("   Run the migrations to create them.")
                
            return len(found_collections) > 0
        else:
            print(f"❌ Failed to fetch collections: {collections_response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing collections: {e}")
        return False

def main():
    print("🚀 PocketBase Admin Setup")
    print("=" * 40)
    print(f"PocketBase URL: {POCKETBASE_URL}")
    print(f"Admin Email: {ADMIN_EMAIL}")
    print()
    
    # Test PocketBase connection
    try:
        response = requests.get(f"{POCKETBASE_URL}/api/health")
        if response.status_code == 200:
            print("✅ PocketBase is running")
        else:
            print("❌ PocketBase health check failed")
            return
    except Exception as e:
        print(f"❌ Cannot connect to PocketBase: {e}")
        return
    
    # Try authentication first
    if test_admin_auth():
        print("✅ Admin user already exists and authentication works")
    else:
        print("ℹ️  Admin authentication failed, trying to create admin user...")
        if create_admin_user():
            print("✅ Admin user setup complete")
        else:
            print("❌ Admin user setup failed")
            print("💡 Try accessing http://localhost:8090/_/ to set up admin manually")
            return
    
    # Test collections
    if test_collections():
        print("✅ Adaptive learning collections are available")
    else:
        print("⚠️  Some adaptive learning collections are missing")
    
    print()
    print("🎉 Setup complete! You can now run the backend server.")

if __name__ == "__main__":
    main() 