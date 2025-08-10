// src/integrations/pocketbase/client.ts

import PocketBase, { RecordModel as PBRecord} from 'pocketbase';
import api from "@/lib/axios";

// -----------------------------
// Backend helpers (headers)
// -----------------------------
function getAuthHeaders() {
  const user = pb.authStore.model as any;
  const userId = user?.id ?? "";
  const role = user?.role ?? "";
  const headers: Record<string, string> = {};
  if (userId) headers["X-User-Id"] = userId;
  if (role) headers["X-User-Role"] = role;
  return { headers };
}

// URL do seu servidor PocketBase, de preferência em variável de ambiente
const POCKETBASE_URL = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';

export const pb = new PocketBase(POCKETBASE_URL);

// --- Tipos de dados ---

/**
 * Modelo de usuário conforme definido na collection "users" do PocketBase.
 * Estende o Record padrão do SDK, que já inclui id, created, updated, etc.
 */
export interface UserRecord extends PBRecord {
  email: string;
  name: string;          // Nome completo
  emailVisibility: boolean;
  role: string;
  bio?: string;
  avatar?: string;
  
  // acrescente outros campos customizados se houver
}

/**
 * Resposta de autenticação via PocketBase.
 * authWithPassword retorna token + record.
 */
export interface AuthResponse {
  token: string;
  record: UserRecord;
}

/**
 * Retorna o usuário logado, ou undefined se não houver sessão.
 * Usa cast via unknown para satisfazer o TS quando os tipos não coincidem exatamente.
 */
export const getCurrentUser = (): UserRecord | undefined => {
  const model = pb.authStore.model;
  if (!model) return undefined;
  
  // Cast do modelo do PocketBase para nosso tipo UserRecord
  const user = model as unknown as UserRecord;
  
  return user;
};


export interface ChatMessageRecord extends PBRecord {
  user: string;
  content: string;
  isAi: boolean;
  sessionId: string;
  timestamp: string;
}


export interface DrawingRecord extends PBRecord {
  title: string;
  data: string; // o JSON serializado do Excalidraw
  user: string; // ID do usuário
}

/**
 * Modelo de gamificação para armazenar pontos, conquistas, níveis, badges, etc.
 * Recomenda-se criar uma collection "gamification" no PocketBase ou adicionar campos ao usuário.
 */
export interface GamificationRecord extends PBRecord {
  user: string; // ID do usuário relacionado
  points: number;
  level: number;
  badges: string[]; // Lista de badges/conquistas
  // Adicione outros campos conforme necessário (ex: missões, streaks, etc)
}

// Exemplo de como buscar dados de gamificação de um usuário
// (supondo que exista a collection "gamification" no PocketBase)
export const getUserGamification = async (userId: string): Promise<GamificationRecord | null> => {
  try {
    const record = await pb.collection('gamification').getFirstListItem(`user = "${userId}"`);
    return record as GamificationRecord;
  } catch (error) {
    // Se não encontrar, retorna null
    return null;
  }
};

/**
 * Modelo de ação de gamificação (ex: enviar mensagem, resolver exercício, etc.)
 * Recomenda-se criar uma collection "actions" ou "gamification_actions" no PocketBase.
 */
export interface ActionRecord extends PBRecord {
  name: string; // Nome da ação (ex: "send_message", "solve_exercise")
  description?: string;
  points: number; // Pontos/XP atribuídos
  multiplier?: number; // Multiplicador de XP (opcional)
  badge?: string; // Badge concedido (opcional)
  context?: string; // Contexto especial (opcional)
}

// Buscar todas as ações de gamificação
export const getAllActions = async (): Promise<ActionRecord[]> => {
  const records = await pb.collection('actions').getFullList();
  return records as ActionRecord[];
};

// Registrar uma ação realizada pelo usuário (pode ser via backend ou diretamente, conforme arquitetura)
export const registerUserAction = async (userId: string, actionName: string, context?: string) => {
  // Exemplo: criar um registro em uma collection "user_actions" (recomendado para histórico)
  return pb.collection('user_actions').create({
    user: userId,
    action: actionName,
    context: context || null,
    timestamp: new Date().toISOString(),
  });
};

// --- GitHub OAuth com PocketBase ---
export function startGithubOAuth() {
  pb.collection('users').authWithOAuth2({ provider: 'github' });
}

// --- API Key Management ---
export interface UserApiKeyRecord extends PBRecord {
  user: string; // relation to user id
  provider: string; // e.g., 'openai', 'deepseek'
  api_key: string;
}

/**
 * Fetches the API key for a user and provider. Returns null if not found.
 */
export const getUserApiKey = async (userId: string, provider: string): Promise<UserApiKeyRecord | null> => {
  try {
    const record = await pb.collection('user_api_keys').getFirstListItem(
      `user = "${userId}" && provider = "${provider}"`
    );
    return record as UserApiKeyRecord;
  } catch (error) {
    return null;
  }
};

/**
 * Creates or updates the API key for a user and provider.
 */
export const upsertUserApiKey = async (userId: string, provider: string, apiKey: string): Promise<UserApiKeyRecord> => {
  const existing = await getUserApiKey(userId, provider);
  if (existing) {
    return await pb.collection('user_api_keys').update(existing.id, { api_key: apiKey });
  } else {
    return await pb.collection('user_api_keys').create({ user: userId, provider, api_key: apiKey });
  }
};

// ============================
// Classes API (via backend)
// ============================

export type ClassSummary = { id: string; title?: string; name?: string; description?: string };
export type ClassMember = { id: string; class: string; user: string; role: 'student'|'teacher'; expand?: any };
export type Invitation = { id: string; class: string; email?: string; user?: string; token: string; status: string; expires_at: string };
export type ClassEvent = { id: string; class: string; type: string; title: string; description?: string; starts_at?: string; ends_at?: string; visibility: string };

// Classes
export async function createClass(title: string, description?: string, code?: string) {
  const res = await api.post("/classes", { title, description, code }, getAuthHeaders());
  return res.data as ClassSummary;
}

export async function listTeachingClasses() {
  const res = await api.get("/classes/teaching", getAuthHeaders());
  return (res.data?.items ?? []) as ClassSummary[];
}

export async function listMyClasses() {
  const res = await api.get("/classes/mine", getAuthHeaders());
  return (res.data?.items ?? []) as any[]; // may include expand from backend when using class_members
}

export async function getClassDetails(classId: string) {
  const res = await api.get(`/classes/${classId}`, getAuthHeaders());
  return res.data as any;
}

export async function updateClass(classId: string, payload: { title?: string; description?: string; archived?: boolean }) {
  const res = await api.put(`/classes/${classId}`, payload, getAuthHeaders());
  return res.data;
}

export async function deleteClass(classId: string) {
  const res = await api.delete(`/classes/${classId}`, getAuthHeaders());
  return res.data;
}

// Members
export async function listClassMembers(classId: string) {
  const res = await api.get(`/classes/${classId}/members`, getAuthHeaders());
  return (res.data?.items ?? []) as ClassMember[];
}

export async function addClassMember(classId: string, userId: string, role: 'student'|'teacher' = 'student') {
  const cfg = { ...getAuthHeaders(), params: { user_id: userId, role } } as any;
  const res = await api.post(`/classes/${classId}/members`, undefined, cfg);
  return res.data;
}

export async function removeClassMember(classId: string, memberUserId: string) {
  const res = await api.delete(`/classes/${classId}/members/${memberUserId}`, getAuthHeaders());
  return res.data;
}

// Invites
export async function createInvite(payload: { class_id: string; email?: string; user_id?: string; ttl_hours?: number }) {
  const res = await api.post(`/classes/invites`, payload, getAuthHeaders());
  return res.data as Invitation;
}

export async function acceptInvite(token: string) {
  const res = await api.post(`/classes/invites/accept`, { token }, getAuthHeaders());
  return res.data;
}

// Events
export async function listClassEvents(classId: string, opts?: { since?: string; until?: string }) {
  const cfg = { ...getAuthHeaders(), params: { since: opts?.since, until: opts?.until } } as any;
  const res = await api.get(`/classes/${classId}/events`, cfg);
  return (res.data?.items ?? []) as ClassEvent[];
}

export async function createClassEvent(classId: string, body: { type: string; title: string; description?: string; starts_at?: string; ends_at?: string; visibility?: string, is_online?: boolean, meeting_url?: string }) {
  const res = await api.post(`/classes/${classId}/events`, body, getAuthHeaders());
  return res.data as ClassEvent;
}

export async function updateClassEvent(classId: string, eventId: string, body: Partial<ClassEvent>) {
  const res = await api.put(`/classes/${classId}/events/${eventId}`, body, getAuthHeaders());
  return res.data;
}

export async function deleteClassEvent(classId: string, eventId: string) {
  const res = await api.delete(`/classes/${classId}/events/${eventId}`, getAuthHeaders());
  return res.data;
}

// Class API keys
export async function setClassApiKey(classId: string, provider: 'openai'|'claude'|'deepseek'|'other', apiKey: string, active = true) {
  const res = await api.post(`/classes/${classId}/api-keys`, { provider, api_key: apiKey, active }, getAuthHeaders());
  return res.data;
}

export async function hasClassApiKey(classId: string, provider: 'openai'|'claude'|'deepseek'|'other') {
  const res = await api.get(`/classes/${classId}/api-keys/${provider}`, getAuthHeaders());
  return res.data as { hasKey: boolean; masked?: string };
}
