/**
 * Notification Helper
 * 
 * Utilitário para criar notificações com rastreamento de origem.
 * Usa os novos campos source_type, source_id e source_url para melhor rastreabilidade.
 */

import { pb } from '@/integrations/pocketbase/client';

export type NotificationType =
  | 'message'
  | 'mention'
  | 'comment'
  | 'reply'
  | 'forum_reply'
  | 'class_invite'
  | 'system'
  | 'achievement'
  | 'assignment'
  | 'grade';

export type SourceType =
  | 'chat_message'
  | 'forum_post'
  | 'forum_comment'
  | 'exercise'
  | 'exercise_comment'
  | 'class'
  | 'assignment'
  | 'whiteboard'
  | 'note'
  | 'system';

export interface NotificationData {
  recipientId: string;
  senderId: string;
  title: string;
  content: string;
  type: NotificationType;
  sourceType?: SourceType;
  sourceId?: string;
  sourceUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Cria uma notificação com rastreamento de origem
 */
export async function createNotification(data: NotificationData) {
  try {
    const notification = await pb.collection('notifications').create({
      recipient: data.recipientId,
      sender: data.senderId,
      title: data.title,
      content: data.content,
      type: data.type,
      source_type: data.sourceType,
      source_id: data.sourceId,
      source_url: data.sourceUrl,
      metadata: data.metadata || {},
      read: false,
    });

    return notification;
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    throw error;
  }
}

/**
 * Helper específico: Notificação de menção em chat
 */
export async function createChatMentionNotification({
  recipientId,
  senderId,
  classId,
  messageId,
  className,
  messagePreview,
}: {
  recipientId: string;
  senderId: string;
  classId: string;
  messageId: string;
  className: string;
  messagePreview: string;
}) {
  return createNotification({
    recipientId,
    senderId,
    title: 'Você foi mencionado no chat',
    content: `Você foi mencionado na turma "${className}"`,
    type: 'mention',
    sourceType: 'chat_message',
    sourceId: messageId,
    sourceUrl: `/dashboard/chat?classId=${classId}&messageId=${messageId}`,
    metadata: {
      classId,
      className,
      messageId,
      messagePreview,
    },
  });
}

/**
 * Helper específico: Notificação de nova mensagem
 */
export async function createChatMessageNotification({
  recipientId,
  senderId,
  classId,
  messageId,
  className,
  messageContent,
}: {
  recipientId: string;
  senderId: string;
  classId: string;
  messageId: string;
  className: string;
  messageContent: string;
}) {
  return createNotification({
    recipientId,
    senderId,
    title: 'Nova mensagem',
    content: `Nova mensagem na turma "${className}"`,
    type: 'message',
    sourceType: 'chat_message',
    sourceId: messageId,
    sourceUrl: `/dashboard/chat?classId=${classId}&messageId=${messageId}`,
    metadata: {
      classId,
      className,
      messageId,
      messageContent,
    },
  });
}

/**
 * Helper específico: Notificação de comentário em exercício
 */
export async function createExerciseCommentNotification({
  recipientId,
  senderId,
  exerciseId,
  commentId,
  exerciseTitle,
  commentContent,
}: {
  recipientId: string;
  senderId: string;
  exerciseId: string;
  commentId: string;
  exerciseTitle: string;
  commentContent: string;
}) {
  return createNotification({
    recipientId,
    senderId,
    title: 'Novo comentário no exercício',
    content: `Novo comentário em "${exerciseTitle}"`,
    type: 'comment',
    sourceType: 'exercise_comment',
    sourceId: commentId,
    sourceUrl: `/exercises/${exerciseId}/comments#${commentId}`,
    metadata: {
      exerciseId,
      commentId,
      exerciseTitle,
      commentContent,
    },
  });
}

/**
 * Helper específico: Notificação de resposta no fórum
 */
export async function createForumReplyNotification({
  recipientId,
  senderId,
  postId,
  replyId,
  postTitle,
  replyContent,
}: {
  recipientId: string;
  senderId: string;
  postId: string;
  replyId: string;
  postTitle: string;
  replyContent: string;
}) {
  return createNotification({
    recipientId,
    senderId,
    title: 'Nova resposta no seu post',
    content: `Nova resposta em "${postTitle}"`,
    type: 'reply',
    sourceType: 'forum_comment',
    sourceId: replyId,
    sourceUrl: `/forum/post/${postId}#${replyId}`,
    metadata: {
      postId,
      replyId,
      postTitle,
      replyContent,
    },
  });
}

/**
 * Helper específico: Notificação de convite para turma
 */
export async function createClassInviteNotification({
  recipientId,
  senderId,
  classId,
  className,
  teacherName,
}: {
  recipientId: string;
  senderId: string;
  classId: string;
  className: string;
  teacherName: string;
}) {
  return createNotification({
    recipientId,
    senderId,
    title: 'Convite para turma',
    content: `${teacherName} convidou você para a turma "${className}"`,
    type: 'class_invite',
    sourceType: 'class',
    sourceId: classId,
    sourceUrl: `/classes/${classId}`,
    metadata: {
      classId,
      className,
      teacherName,
    },
  });
}

/**
 * Helper específico: Notificação de nova tarefa
 */
export async function createAssignmentNotification({
  recipientId,
  senderId,
  assignmentId,
  assignmentTitle,
  dueDate,
  className,
}: {
  recipientId: string;
  senderId: string;
  assignmentId: string;
  assignmentTitle: string;
  dueDate: string;
  className: string;
}) {
  return createNotification({
    recipientId,
    senderId,
    title: 'Nova tarefa atribuída',
    content: `Tarefa "${assignmentTitle}" na turma "${className}"`,
    type: 'assignment',
    sourceType: 'assignment',
    sourceId: assignmentId,
    sourceUrl: `/assignments/${assignmentId}`,
    metadata: {
      assignmentId,
      assignmentTitle,
      dueDate,
      className,
    },
  });
}

/**
 * Helper específico: Notificação de nota/avaliação
 */
export async function createGradeNotification({
  recipientId,
  senderId,
  assignmentId,
  assignmentTitle,
  grade,
  maxGrade,
}: {
  recipientId: string;
  senderId: string;
  assignmentId: string;
  assignmentTitle: string;
  grade: number;
  maxGrade: number;
}) {
  return createNotification({
    recipientId,
    senderId,
    title: 'Nota recebida',
    content: `Você recebeu ${grade}/${maxGrade} em "${assignmentTitle}"`,
    type: 'grade',
    sourceType: 'assignment',
    sourceId: assignmentId,
    sourceUrl: `/assignments/${assignmentId}`,
    metadata: {
      assignmentId,
      assignmentTitle,
      grade,
      maxGrade,
    },
  });
}

/**
 * Helper específico: Notificação de conquista
 */
export async function createAchievementNotification({
  recipientId,
  achievementTitle,
  achievementDescription,
  achievementIcon,
}: {
  recipientId: string;
  achievementTitle: string;
  achievementDescription: string;
  achievementIcon?: string;
}) {
  return createNotification({
    recipientId,
    senderId: 'system',
    title: '🏆 Conquista desbloqueada!',
    content: `Você desbloqueou: ${achievementTitle}`,
    type: 'achievement',
    sourceType: 'system',
    sourceUrl: '/profile?tab=achievements',
    metadata: {
      achievementTitle,
      achievementDescription,
      achievementIcon,
    },
  });
}

/**
 * Helper: Marca notificação como lida
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    await pb.collection('notifications').update(notificationId, {
      read: true,
      read_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    throw error;
  }
}

/**
 * Helper: Marca múltiplas notificações como lidas
 */
export async function markMultipleAsRead(notificationIds: string[]) {
  try {
    await Promise.all(
      notificationIds.map(id => markNotificationAsRead(id))
    );
  } catch (error) {
    console.error('Erro ao marcar notificações como lidas:', error);
    throw error;
  }
}

/**
 * Helper: Deleta notificação
 */
export async function deleteNotification(notificationId: string) {
  try {
    await pb.collection('notifications').delete(notificationId);
  } catch (error) {
    console.error('Erro ao deletar notificação:', error);
    throw error;
  }
}

/**
 * Helper: Busca notificações por origem
 */
export async function getNotificationsBySource(
  sourceType: SourceType,
  sourceId: string
) {
  try {
    const notifications = await pb.collection('notifications').getFullList({
      filter: `source_type = "${sourceType}" && source_id = "${sourceId}"`,
      sort: '-created',
      expand: 'sender,recipient',
    });

    return notifications;
  } catch (error) {
    console.error('Erro ao buscar notificações por origem:', error);
    throw error;
  }
}
