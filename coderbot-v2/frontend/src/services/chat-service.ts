import { pb } from '@/integrations/pocketbase/client';
import type { Message } from '@/services/api';
import { SessionInfo } from '@/components/chat/SessionSelector';

export const chatService = {
  async createSession(title: string = "Nova Conversa"): Promise<string> {
    const userId = pb.authStore.model?.id;
    if (!userId) throw new Error('User not authenticated');
    
    // Create a new session record with title
    const session = await pb.collection('sessao').create({
      usuario: userId,
      messageIDs: [],
      title: title  // Use lowercase 'title' to match the DB schema
    });
    
    return session.id;
  },

  async updateSessionTitle(sessionId: string, title: string): Promise<void> {
    try {
      // Make sure we have a valid title
      const finalTitle = title.trim() || "Nova Conversa";
      
      console.log(`Attempting to update session ${sessionId} title to: ${finalTitle}`);
      
      // Update the session with the new title using the correct field name (title with lowercase t)
      const data = {
        "title": finalTitle
      };
      
      await pb.collection('sessao').update(sessionId, data);
      
      // Verify the update worked by fetching the session again
      const updatedSession = await pb.collection('sessao').getOne(sessionId);
      console.log("Session after title update:", updatedSession);
      console.log("Updated title value:", updatedSession.title);
      
      if (updatedSession.title !== finalTitle) {
        console.warn(`Title mismatch: expected "${finalTitle}" but got "${updatedSession.title}"`);
      }
    } catch (error) {
      console.error("Error updating session title:", error);
      throw error;
    }
  },

  async saveMessage(message: {
    content: string;
    isAi: boolean;
    sessionId: string;
    segments?: any[];
  }): Promise<string> {
    try {
      // First, create the message
      const chatMessage = await pb.collection('chat_messages').create({
        content: message.content,
        isAi: message.isAi,
        sessionId: message.sessionId, // Ensure sessionId is saved
        timestamp: new Date().toISOString(),
        segments: message.segments ? JSON.stringify(message.segments) : null,
      });

      console.log("Created message with ID:", chatMessage.id);

      // Then, update the session to include this message ID
      const session = await pb.collection('sessao').getOne(message.sessionId);
      
      // Ensure messageIDs is an array, even if it's null or undefined
      const messageIDs = Array.isArray(session.messageIDs) ? [...session.messageIDs] : [];
      
      console.log("Current messageIDs:", messageIDs);
      console.log("Adding message ID:", chatMessage.id);

      // Add the new message ID to the array
      messageIDs.push(chatMessage.id);

      // Update the session with the new messageIDs array as JSON
      await pb.collection('sessao').update(message.sessionId, {
        messageIDs: JSON.stringify(messageIDs)
      });

      // Verify the update worked
      const updatedSession = await pb.collection('sessao').getOne(message.sessionId);
      console.log("Updated messageIDs:", updatedSession.messageIDs);

      return chatMessage.id;
    } catch (error) {
      console.error("Error saving message:", error);
      throw error;
    }
  },

  async loadSessionMessages(sessionId: string): Promise<Message[]> {
    try {
      // Get the session
      const session = await pb.collection('sessao').getOne(sessionId);
      
      // Parse messageIDs from JSON if it's a string
      let messageIDs = session.messageIDs;
      if (typeof messageIDs === 'string') {
        try {
          messageIDs = JSON.parse(messageIDs);
        } catch (e) {
          console.error("Error parsing messageIDs JSON:", e);
          messageIDs = [];
        }
      }
      
      if (!messageIDs || !Array.isArray(messageIDs) || messageIDs.length === 0) {
        console.log("No messages found for session:", sessionId);
        return [];
      }
  
      console.log(`Loading ${messageIDs.length} messages for session:`, sessionId);
      
      // Fetch all messages referenced in the session
      const messages: Message[] = [];
      
      for (const messageId of messageIDs) {
        try {
          const msg = await pb.collection('chat_messages').getOne(messageId);
          
          // Parse segments if they exist
          let parsedSegments = undefined;
          if (msg.segments) {
            try {
              parsedSegments = typeof msg.segments === 'string' 
                ? JSON.parse(msg.segments) 
                : msg.segments;
              console.log(`✅ Loaded message ${messageId} with ${parsedSegments?.length || 0} segments`);
            } catch (e) {
              console.error(`Failed to parse segments for message ${messageId}:`, e);
            }
          }
          
          messages.push({
            id: msg.id,
            content: msg.content,
            isAi: msg.isAi,
            timestamp: new Date(msg.timestamp),
            segments: parsedSegments,
          });
        } catch (error) {
          console.error(`Failed to load message ${messageId}:`, error);
        }
      }
  
      console.log(`Successfully loaded ${messages.length} messages`);
      return messages;
    } catch (error) {
      console.error("Error loading session messages:", error);
      throw error;
    }
  },

  async getUserSessions(): Promise<SessionInfo[]> {
    const userId = pb.authStore.model?.id;
    if (!userId) throw new Error('User not authenticated');

    const result = await pb.collection('sessao').getList(1, 100, {
      filter: `usuario = "${userId}"`,
      sort: '-created',
    });

    return result.items.map(item => {
      // Parse messageIDs from JSON if it's a string
      let messageIDs = item.messageIDs;
      if (typeof messageIDs === 'string') {
        try {
          messageIDs = JSON.parse(messageIDs);
        } catch (e) {
          console.error("Error parsing messageIDs JSON:", e);
          messageIDs = [];
        }
      }
      
      return {
        id: item.id,
        title: item.title || "Conversa sem título",  // Use lowercase 'title' to match DB schema
        created: item.created,
        usuario: item.usuario,
        messageIDs: Array.isArray(messageIDs) ? messageIDs : []
      };
    });
  },

  async deleteSession(sessionId: string): Promise<void> {
    try {
      // First, get the session to retrieve message IDs
      const session = await pb.collection('sessao').getOne(sessionId);
      
      // Parse messageIDs from JSON if it's a string
      let messageIDs = session.messageIDs;
      if (typeof messageIDs === 'string') {
        try {
          messageIDs = JSON.parse(messageIDs);
        } catch (e) {
          console.error("Error parsing messageIDs JSON:", e);
          messageIDs = [];
        }
      }
      
      // Delete all associated messages
      if (Array.isArray(messageIDs) && messageIDs.length > 0) {
        console.log(`Deleting ${messageIDs.length} messages for session ${sessionId}`);
        
        for (const messageId of messageIDs) {
          try {
            await pb.collection('chat_messages').delete(messageId);
          } catch (error) {
            console.error(`Failed to delete message ${messageId}:`, error);
            // Continue with other deletions even if one fails
          }
        }
      }
      
      // Finally, delete the session itself
      await pb.collection('sessao').delete(sessionId);
      console.log(`Successfully deleted session ${sessionId}`);
    } catch (error) {
      console.error("Error deleting session:", error);
      throw error;
    }
  }
};