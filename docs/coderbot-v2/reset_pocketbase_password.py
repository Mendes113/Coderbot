#!/usr/bin/env python3
"""
🔐 Script para Resetar Senha de Superuser no PocketBase

Este script permite resetar a senha de um superuser do PocketBase
alterando diretamente o hash da senha no banco de dados SQLite.

Uso:
    python reset_pocketbase_password.py --email usuario@exemplo.com --password nova_senha
    python reset_pocketbase_password.py --email usuario@exemplo.com --password nova_senha --db-path ./pocketbase_0.27.2_linux_amd64/pb_data/data.db

Exemplo:
    python reset_pocketbase_password.py --email admin@coderbot.com --password coderbotdagalera
"""

import argparse
import sqlite3
import bcrypt
import os
import sys
from pathlib import Path


def generate_password_hash(password: str) -> str:
    """Gera hash bcrypt para a senha."""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def check_database_exists(db_path: str) -> bool:
    """Verifica se o banco de dados existe."""
    return os.path.exists(db_path)


def list_superusers(db_path: str) -> list:
    """Lista todos os superusers existentes."""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, email, created, updated FROM _superusers")
        users = cursor.fetchall()
        
        conn.close()
        return users
        
    except sqlite3.Error as e:
        print(f"❌ Erro ao acessar banco de dados: {e}")
        return []


def update_superuser_password(db_path: str, email: str, new_password_hash: str) -> bool:
    """Atualiza a senha do superuser no banco de dados."""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Verificar se o usuário existe
        cursor.execute("SELECT id FROM _superusers WHERE email = ?", (email,))
        user = cursor.fetchone()
        
        if not user:
            print(f"❌ Usuário com email '{email}' não encontrado!")
            conn.close()
            return False
        
        # Atualizar a senha
        cursor.execute(
            "UPDATE _superusers SET password = ?, updated = datetime('now') WHERE email = ?",
            (new_password_hash, email)
        )
        
        if cursor.rowcount > 0:
            conn.commit()
            print(f"✅ Senha do usuário '{email}' atualizada com sucesso!")
            success = True
        else:
            print(f"❌ Falha ao atualizar senha do usuário '{email}'")
            success = False
            
        conn.close()
        return success
        
    except sqlite3.Error as e:
        print(f"❌ Erro ao atualizar banco de dados: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Reset da senha de superuser do PocketBase",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos de uso:
  python reset_pocketbase_password.py --email admin@coderbot.com --password novaSenha123
  python reset_pocketbase_password.py --list
  python reset_pocketbase_password.py --email admin@coderbot.com --password novaSenha123 --db-path ./custom/path/data.db
        """
    )
    
    parser.add_argument(
        '--email', 
        type=str, 
        help='Email do superuser para resetar a senha'
    )
    
    parser.add_argument(
        '--password', 
        type=str, 
        help='Nova senha para o superuser'
    )
    
    parser.add_argument(
        '--db-path', 
        type=str, 
        default='./pocketbase_0.27.2_linux_amd64/pb_data/data.db',
        help='Caminho para o banco de dados do PocketBase (padrão: ./pocketbase_0.27.2_linux_amd64/pb_data/data.db)'
    )
    
    parser.add_argument(
        '--list', 
        action='store_true', 
        help='Listar todos os superusers existentes'
    )
    
    args = parser.parse_args()
    
    # Verificar se o banco existe
    if not check_database_exists(args.db_path):
        print(f"❌ Banco de dados não encontrado: {args.db_path}")
        print("💡 Certifique-se de que o PocketBase foi inicializado e o caminho está correto.")
        sys.exit(1)
    
    print(f"🔍 Usando banco de dados: {args.db_path}")
    
    # Listar usuários se solicitado
    if args.list:
        print("\n👥 Superusers existentes:")
        users = list_superusers(args.db_path)
        if users:
            for user_id, email, created, updated in users:
                print(f"  • ID: {user_id}")
                print(f"    Email: {email}")
                print(f"    Criado: {created}")
                print(f"    Atualizado: {updated}")
                print()
        else:
            print("  Nenhum superuser encontrado.")
        return
    
    # Validar argumentos para reset de senha
    if not args.email or not args.password:
        print("❌ Email e senha são obrigatórios para resetar a senha.")
        print("💡 Use --help para ver exemplos de uso.")
        sys.exit(1)
    
    print(f"🔐 Resetando senha para: {args.email}")
    
    # Gerar hash da nova senha
    print("🔄 Gerando hash da nova senha...")
    new_password_hash = generate_password_hash(args.password)
    print(f"✅ Hash gerado: {new_password_hash[:50]}...")
    
    # Atualizar senha no banco
    print("🔄 Atualizando senha no banco de dados...")
    if update_superuser_password(args.db_path, args.email, new_password_hash):
        print("\n🎉 Senha resetada com sucesso!")
        print(f"📧 Email: {args.email}")
        print(f"🔑 Nova senha: {args.password}")
        print("\n💡 Agora você pode fazer login no painel administrativo do PocketBase:")
        print("   http://127.0.0.1:8090/_/")
    else:
        print("\n❌ Falha ao resetar a senha.")
        sys.exit(1)


if __name__ == "__main__":
    main()
