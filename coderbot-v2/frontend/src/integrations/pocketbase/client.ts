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

export async function joinClassByCode(code: string) {
  const trimmed = (code || "").trim();
  if (!trimmed) {
    throw new Error("EMPTY_CODE");
  }

  try {
    const res = await api.post(`/classes/join`, { code: trimmed }, getAuthHeaders());
    return res.data;
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 404 || status === 405) {
      return await acceptInvite(trimmed);
    }
    throw error;
  }
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

// ============================
// Class Forum (direct PocketBase)
// ============================

export type ClassForumPostType =
  | 'aviso'
  | 'info'
  | 'conteudo'
  | 'links'
  | 'mensagens';

export interface ClassForumLink {
  label?: string;
  url: string;
}

export interface ClassForumPostRecord extends PBRecord {
  class: string;
  author: string;
  title: string;
  content?: string;
  type: ClassForumPostType;
  attachments?: string[];
  links?: ClassForumLink[] | null;
  expand?: {
    author?: UserRecord;
    class?: any;
  };
}

export interface ClassForumCommentRecord extends PBRecord {
  post: string;
  author: string;
  content: string;
  expand?: {
    author?: UserRecord;
    post?: ClassForumPostRecord;
  };
}

export const CLASS_FORUM_TYPES: ClassForumPostType[] = [
  'aviso',
  'info',
  'conteudo',
  'links',
  'mensagens',
];

/**
 * Lista posts do fórum de eventos da turma.
 */
export const listClassForumPosts = async (
  classId: string,
  options?: { type?: ClassForumPostType }
): Promise<ClassForumPostRecord[]> => {
  try {
    const filters = [`class = "${classId}"`];
    const requestedType = options?.type;
    if (requestedType && CLASS_FORUM_TYPES.includes(requestedType)) {
      filters.push(`type = "${requestedType}"`);
    }

    const filter = filters.join(' && ');

    const records = await pb.collection('class_forum_posts').getFullList({
      filter,
      sort: '-created',
      expand: 'author',
      requestKey: `class_forum_posts_${classId}_${requestedType ?? 'all'}_${Date.now()}`,
    } as any);

    return records as ClassForumPostRecord[];
  } catch (error) {
    console.error('Erro ao listar posts do fórum:', error);
    return [];
  }
};

/**
 * Cria um novo post no fórum de eventos da turma.
 */
export const createClassForumPost = async (data: {
  classId: string;
  title: string;
  content?: string;
  type: ClassForumPostType;
  attachments?: File[];
  links?: ClassForumLink[];
}): Promise<ClassForumPostRecord | null> => {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  try {
    const formData = new FormData();
    formData.append('class', data.classId);
    formData.append('author', user.id);
    formData.append('title', data.title);
    formData.append('type', data.type);

    if (data.content) {
      formData.append('content', data.content);
    }

    if (data.links && data.links.length > 0) {
      formData.append('links', JSON.stringify(data.links));
    }

    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach((file) => {
        formData.append('attachments', file);
      });
    }

    const record = await pb.collection('class_forum_posts').create(formData);
    return record as ClassForumPostRecord;
  } catch (error) {
    console.error('Erro ao criar post do fórum:', error);
    throw error;
  }
};

/**
 * Atualiza um post existente no fórum.
 */
export const updateClassForumPost = async (
  postId: string,
  data: {
    title?: string;
    content?: string;
    type?: ClassForumPostType;
    links?: ClassForumLink[];
  }
): Promise<ClassForumPostRecord | null> => {
  try {
    const updateData: any = {};

    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (data.content !== undefined) {
      updateData.content = data.content;
    }

    if (data.type !== undefined) {
      updateData.type = data.type;
    }

    if (data.links !== undefined) {
      updateData.links = data.links;
    }

    const record = await pb.collection('class_forum_posts').update(postId, updateData);
    return record as ClassForumPostRecord;
  } catch (error) {
    console.error('Erro ao atualizar post do fórum:', error);
    throw error;
  }
};

/**
 * Remove um post do fórum.
 */
export const deleteClassForumPost = async (postId: string): Promise<boolean> => {
  try {
    await pb.collection('class_forum_posts').delete(postId);
    return true;
  } catch (error) {
    console.error('Erro ao remover post do fórum:', error);
    return false;
  }
};

/**
 * Recupera um post específico do fórum.
 */
export const getClassForumPost = async (postId: string): Promise<ClassForumPostRecord | null> => {
  try {
    const record = await pb.collection('class_forum_posts').getOne(postId, {
      expand: 'author,class',
      requestKey: `forum_post_${postId}_${Date.now()}`,
    } as any);
    return record as ClassForumPostRecord;
  } catch (error) {
    console.error('Erro ao obter post do fórum:', error);
    return null;
  }
};

/**
 * Lista comentários de um post.
 */
export const listClassForumComments = async (
  postId: string
): Promise<ClassForumCommentRecord[]> => {
  try {
    const records = await pb.collection('class_forum_comments').getFullList({
      filter: `post = "${postId}"`,
      sort: 'created',
      expand: 'author',
      requestKey: `forum_comments_${postId}_${Date.now()}`,
    } as any);

    return records as ClassForumCommentRecord[];
  } catch (error) {
    console.error('Erro ao listar comentários do fórum:', error);
    return [];
  }
};

/**
 * Cria um novo comentário em um post do fórum.
 */
export const createClassForumComment = async (
  postId: string,
  content: string
): Promise<ClassForumCommentRecord | null> => {
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    return null;
  }

  const user = getCurrentUser();
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  try {
    const record = await pb.collection('class_forum_comments').create({
      post: postId,
      content: trimmedContent,
      author: user.id,
    });
    return record as ClassForumCommentRecord;
  } catch (error) {
    console.error('Erro ao criar comentário no fórum:', error);
    throw error;
  }
};

/**
 * Remove um comentário (apenas autor, professor ou admin).
 */
export const deleteClassForumComment = async (commentId: string): Promise<boolean> => {
  try {
    await pb.collection('class_forum_comments').delete(commentId);
    return true;
  } catch (error) {
    console.error('Erro ao remover comentário:', error);
    return false;
  }
};

/**
 * Obtém uma turma usando id ou nome.
 */
export const getClassByIdentifier = async (identifier: string): Promise<any | null> => {
  
  if (!identifier?.trim()) {
    return null;
  }

  const trimmed = identifier.trim();

  // Primeiro tenta como ID direto
  try {
    const record = await pb.collection('classes').getOne(trimmed, {
      requestKey: null, // Evita cache/autocancellation
    } as any);
    return record;
  } catch (error) {
    console.debug('Identificador não é um ID direto, tentando buscar por nome.', error);
  }

  // Se não encontrar como ID, tenta como nome
  const safeIdentifier = trimmed.replace(/"/g, '\\"');

  try {
    const record = await pb.collection('classes').getFirstListItem(
      `name = "${safeIdentifier}"`,
      {
        requestKey: null, // Evita cache/autocancellation
      } as any,
    );
    return record;
  } catch (error) {
    console.error('Não foi possível encontrar turma pelo identificador fornecido:', error);
    return null;
  }
};

/**
 * Verifica se o usuário autenticado participa da turma.
 */
export const isCurrentUserMemberOfClass = async (classId: string): Promise<boolean> => {
  const user = getCurrentUser();
  if (!user) {
    return false;
  }

  try {
    await pb.collection('class_members').getFirstListItem(
      `class = "${classId}" && user = "${user.id}"`,
      {
        requestKey: `class_member_check_${classId}_${user.id}_${Date.now()}`,
      } as any,
    );
    return true;
  } catch (error) {
    console.warn('Usuário não parece fazer parte da turma ou não foi possível verificar:', error);
    return false;
  }
};
