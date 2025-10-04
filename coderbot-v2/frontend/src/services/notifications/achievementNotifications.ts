import { pb } from '@/integrations/pocketbase/client';

interface SendAchievementNotificationParams {
  userId: string;
  achievementName: string;
  achievementIcon: string;
  achievementDescription: string;
  points: number;
}

/**
 * Envia uma notificação "carta especial" quando um achievement é desbloqueado
 */
export async function sendAchievementNotification({
  userId,
  achievementName,
  achievementIcon,
  achievementDescription,
  points
}: SendAchievementNotificationParams): Promise<void> {
  try {
    await pb.collection('notifications').create({
      recipient: userId,
      sender: 'system', // Sistema envia a notificação
      title: `${achievementIcon} Carta Especial: ${achievementName}`,
      content: `Parabéns! Você desbloqueou "${achievementName}"!\n\n${achievementDescription}\n\n🎯 +${points} pontos ganhos!`,
      type: 'achievement',
      read: false,
      source_type: 'system',
      metadata: {
        achievementName,
        points,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`[Achievement] Notification sent for "${achievementName}" to user ${userId}`);
  } catch (error) {
    console.error('[Achievement] Failed to send notification:', error);
  }
}
