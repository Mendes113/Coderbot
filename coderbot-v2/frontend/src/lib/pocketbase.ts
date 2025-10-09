// lib/pocketbase.ts
import PocketBase, { RecordModel } from 'pocketbase';

// URL do servidor PocketBase
const POCKETBASE_URL = import.meta.env.VITE_POCKETBASE_URL || 'http://localhost:8090';

// Criar instância do PocketBase
export const pb = new PocketBase(POCKETBASE_URL);

// Habilitar autosave para persistir autenticação
pb.autoCancellation(false);

// --- Tipos de Dados ---

/**
 * Modelo de usuário
 */
export interface UserRecord extends RecordModel {
  email: string;
  name: string;
  emailVisibility?: boolean;
  role?: string;
  bio?: string;
  avatar?: string;
}

/**
 * Modelo de código salvo
 */
export interface CodeSnippetRecord extends RecordModel {
  user: string;           // ID do usuário
  title: string;         // Título do código
  code: string;          // Código fonte
  language: string;      // Linguagem de programação
  fileName: string;      // Nome do arquivo
  lastModified: string;  // Data de última modificação
  isFavorite?: boolean;  // Marcado como favorito
  tags?: string[];       // Tags para organização
}

/**
 * Resposta de autenticação
 */
export interface AuthResponse {
  token: string;
  record: UserRecord;
}

/**
 * Retorna o usuário logado ou null
 */
export function getCurrentUser(): UserRecord | null {
  return pb.authStore.model as UserRecord | null;
}

/**
 * Verifica se há usuário autenticado
 */
export function isAuthenticated(): boolean {
  return pb.authStore.isValid;
}

/**
 * Faz logout do usuário
 */
export function logout(): void {
  pb.authStore.clear();
}
