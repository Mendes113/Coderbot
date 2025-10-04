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
  console.log('📬 [sendAchievementNotification] Called with:', {
    userId,
    achievementName,
    achievementIcon,
    points
  });

  try {
    const notificationData = {
      recipient: userId,
      sender: userId, // Self-notification (próprio usuário como sender)
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
    };

    console.log('📬 [sendAchievementNotification] Creating notification with data:', notificationData);

    const result = await pb.collection('notifications').create(notificationData);

    console.log(`✅ [sendAchievementNotification] Notification created successfully:`, result.id);
  } catch (error) {
    console.error('❌ [sendAchievementNotification] Failed to send notification:', error);
    console.error('❌ Error details:', {
      message: (error as any)?.message,
      data: (error as any)?.data,
      status: (error as any)?.status
    });
  }
}
