import { pb } from '@/integrations/pocketbase/client';
import api from '@/lib/axios';

export interface Mention {
  username: string;
  userId?: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Extrai menções (@usuario) de um texto
 */
export const extractMentions = (text: string): Mention[] => {
  const mentionRegex = /@(\w+)/g;
  const mentions: Mention[] = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push({
      username: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return mentions;
};

/**
 * Busca usuários por nome de usuário para resolver menções
 * Filtra apenas usuários que são membros da turma especificada
 */
export const resolveMentions = async (mentions: Mention[], classId?: string): Promise<Map<string, string>> => {
  const userMap = new Map<string, string>();

  if (mentions.length === 0) return userMap;

  try {
    // Buscar usuários cujos nomes contenham as menções
    const usernames = [...new Set(mentions.map(m => m.username))];

    // Se temos um classId, buscar apenas usuários membros desta turma
    let classMemberIds: string[] = [];
    if (classId) {
      try {
        const membersResponse = await pb.collection('class_members').getFullList({
          filter: `class = "${classId}"`,
          fields: 'user'
        });

        classMemberIds = membersResponse
          .map(member => member.user)
          .filter(id => id && typeof id === 'string' && id.trim().length > 0 && id.length >= 15); // PocketBase IDs are typically 15+ characters

        console.log('IDs de membros da turma encontrados:', classMemberIds);

        if (classMemberIds.length === 0) {
          console.warn('Nenhum membro válido encontrado na turma:', classId);
          return userMap;
        }
      } catch (error) {
        console.error('Erro ao buscar membros da turma:', error);
        // Se não conseguir buscar membros, retorna mapa vazio para evitar menções inválidas
        return userMap;
      }
    }

    for (const username of usernames) {
      try {
        let filter = `name ~ "${username}"`;

        if (classMemberIds.length > 0) {
          const validIds = classMemberIds.filter(id => /^[a-z0-9]{15,}$/i.test(id));
          if (validIds.length === 0) {
            console.warn(`Pulando busca de ${username} - nenhum ID válido na turma`);
            continue;
          }

          const idFilter = validIds.map(id => `id = "${id}"`).join(' || ');
          filter += ` && (${idFilter})`;
        }

        console.log('Consulta de usuários:', { username, filter, classMemberIds: classMemberIds.length });

        try {
          const response = await pb.collection('users').getList(1, 1, {
            filter,
            fields: 'id,name'
          });

          if (response.items.length > 0) {
            userMap.set(username, response.items[0].id);
          } else {
            console.warn(`Usuário não encontrado: ${username} com filtro: ${filter}`);
          }
        } catch (error) {
          console.error(`Erro ao buscar usuário ${username}:`, error);

          // Se houve erro na consulta específica, tentar buscar sem filtro de turma
          if (classMemberIds.length > 0) {
            try {
              console.warn(`Tentando buscar ${username} sem filtro de turma`);
              const fallbackResponse = await pb.collection('users').getList(1, 1, {
                filter: `name ~ "${username}"`,
                fields: 'id,name'
              });

              if (fallbackResponse.items.length > 0) {
                userMap.set(username, fallbackResponse.items[0].id);
                console.log(`Usuário ${username} encontrado no fallback`);
              }
            } catch (fallbackError) {
              console.error(`Erro no fallback para ${username}:`, fallbackError);
            }
          }
        }
      } catch (error) {
        console.error(`Erro ao buscar usuário ${username}:`, error);
      }
    }
  } catch (error) {
    console.error('Erro ao resolver menções:', error);
  }

  return userMap;
};

/**
 * Cria notificações para usuários mencionados
 * Atualizado para usar o novo sistema de rastreamento de origem
 */
export const createMentionNotifications = async (
  mentions: Mention[],
  senderId: string,
  classId: string,
  postId: string,
  commentId?: string,
  message?: string
): Promise<void> => {
  if (mentions.length === 0) return;

  const userMap = await resolveMentions(mentions, classId);

  for (const mention of mentions) {
    const userId = userMap.get(mention.username);
    if (!userId || userId === senderId) continue; // Não notificar o próprio autor

    try {
      // Construir a URL direta para o contexto
      const sourceUrl = `/classes/${classId}/forum${commentId ? `#comment-${commentId}` : `#post-${postId}`}`;
      
      const notificationData = {
        recipient: userId,
        sender: senderId,
        title: 'Você foi mencionado',
        content: message || `Você foi mencionado em um comentário no fórum`,
        type: 'mention',
        
        // Novos campos de rastreamento de origem
        source_type: 'forum_comment',
        source_id: commentId || postId,
        source_url: sourceUrl,
        
        // Metadata legado (mantido para compatibilidade)
        metadata: {
          classId,
          postId,
          commentId,
          mentionedBy: senderId,
          context: 'forum_comment'
        }
      };

      // Criar notificação diretamente via PocketBase
      await pb.collection('notifications').create(notificationData);
      
      console.log(`Notificação de menção criada para @${mention.username} (${userId})`);
    } catch (error) {
      console.error(`Erro ao criar notificação de menção para @${mention.username}:`, error);
    }
  }
};

/**
 * Destaca menções em um texto para exibição (retorna texto com spans HTML)
 */
export const highlightMentions = (text: string): string => {
  return text.replace(/@(\w+)/g, '<span class="bg-primary/10 text-primary px-1 py-0.5 rounded text-sm font-medium">@$1</span>');
};
