import { Router } from 'express';
import { prisma, websocketService } from '../index.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  sessionId: z.string().min(1),
  rtmpKey: z.string().min(1),
  chatType: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
  replyToId: z.string().optional()
});

const getMessagesSchema = z.object({
  rtmpKey: z.string().min(1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
  offset: z.string().optional().transform(val => val ? parseInt(val) : 0),
  chatType: z.enum(['PUBLIC', 'PRIVATE']).optional()
});

const adminChatSchema = z.object({
  content: z.string().min(1).max(2000),
  rtmpKey: z.string().min(1),
  chatType: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
  replyToId: z.string().optional()
});

// Get chat configuration for a stream
router.get('/config/:rtmpKey', async (req, res) => {
  try {
    const { rtmpKey } = req.params;
    
    const rtmpConfig = await prisma.rtmpConfiguration.findUnique({
      where: { rtmpKey },
      include: { chatConfiguration: true }
    });

    if (!rtmpConfig) {
      return res.status(404).json({ error: 'Stream configuration not found' });
    }

    // Create default chat config if it doesn't exist
    let chatConfig = rtmpConfig.chatConfiguration;
    if (!chatConfig) {
      chatConfig = await prisma.chatConfiguration.create({
        data: {
          rtmpConfigId: rtmpConfig.id,
          requireEmail: false,
          requireLastName: false,
          maxMessageLength: 2000,
          isEnabled: true,
          moderationEnabled: true
        }
      });
    }

    res.json({
      isEnabled: chatConfig.isEnabled,
      requireEmail: chatConfig.requireEmail,
      requireLastName: chatConfig.requireLastName,
      maxMessageLength: chatConfig.maxMessageLength,
      moderationEnabled: chatConfig.moderationEnabled
    });
  } catch (error) {
    console.error('Error getting chat config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get chat messages for a stream
router.get('/messages/:rtmpKey', async (req, res) => {
  try {
    const { rtmpKey } = req.params;
    const { limit = 50, offset = 0 } = getMessagesSchema.parse(req.query);
    
    const rtmpConfig = await prisma.rtmpConfiguration.findUnique({
      where: { rtmpKey },
      include: { chatConfiguration: true }
    });

    if (!rtmpConfig) {
      return res.status(404).json({ error: 'Stream configuration not found' });
    }

    if (!rtmpConfig.chatConfiguration?.isEnabled) {
      return res.status(403).json({ error: 'Chat is disabled for this stream' });
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        rtmpConfigId: rtmpConfig.id,
        isDeleted: false
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    res.json(messages.reverse()); // Return in chronological order
  } catch (error) {
    console.error('Error getting chat messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send a chat message
router.post('/send', async (req, res) => {
  try {
    const { content, firstName, lastName, email, sessionId, rtmpKey } = sendMessageSchema.parse(req.body);

    // Find the stream configuration
    const rtmpConfig = await prisma.rtmpConfiguration.findUnique({
      where: { rtmpKey },
      include: { chatConfiguration: true }
    });

    if (!rtmpConfig) {
      return res.status(404).json({ error: 'Stream configuration not found' });
    }

    if (!rtmpConfig.chatConfiguration?.isEnabled) {
      return res.status(403).json({ error: 'Chat is disabled for this stream' });
    }

    // Validate required fields based on configuration
    if (rtmpConfig.chatConfiguration.requireEmail && !email) {
      return res.status(400).json({ error: 'Email is required for this chat' });
    }

    if (rtmpConfig.chatConfiguration.requireLastName && !lastName) {
      return res.status(400).json({ error: 'Last name is required for this chat' });
    }

    // Check message length
    if (content.length > rtmpConfig.chatConfiguration.maxMessageLength) {
      return res.status(400).json({ 
        error: `Message too long. Maximum ${rtmpConfig.chatConfiguration.maxMessageLength} characters allowed.` 
      });
    }

    // Find or create chat user
    let chatUser = await prisma.chatUser.findUnique({
      where: { sessionId }
    });

    if (!chatUser) {
      chatUser = await prisma.chatUser.create({
        data: {
          firstName,
          lastName,
          email,
          sessionId
        }
      });
    } else {
      // Update user info if provided
      await prisma.chatUser.update({
        where: { id: chatUser.id },
        data: {
          firstName,
          lastName: lastName || chatUser.lastName,
          email: email || chatUser.email
        }
      });
    }

    // Check if user is banned
    if (chatUser.isBanned) {
      return res.status(403).json({ error: 'You are banned from this chat' });
    }

    // Create the message
    const message = await prisma.chatMessage.create({
      data: {
        content,
        rtmpConfigId: rtmpConfig.id,
        userId: chatUser.id
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Broadcast the message via WebSocket
    await websocketService.broadcastChatMessage(rtmpKey, message);

    res.json(message);
  } catch (error) {
    console.error('Error sending chat message:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a message (moderation)
router.delete('/message/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    
    // TODO: Add admin authentication check
    const message = await prisma.chatMessage.update({
      where: { id: messageId },
      data: { isDeleted: true }
    });

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Ban a user (moderation)
router.post('/ban/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // TODO: Add admin authentication check
    await prisma.chatUser.update({
      where: { id: userId },
      data: { isBanned: true }
    });

    res.json({ success: true, message: 'User banned' });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update chat configuration (admin)
router.put('/config/:rtmpKey', async (req, res) => {
  try {
    const { rtmpKey } = req.params;
    const { requireEmail, requireLastName, maxMessageLength, isEnabled, moderationEnabled } = req.body;
    
    // TODO: Add admin authentication check
    const rtmpConfig = await prisma.rtmpConfiguration.findUnique({
      where: { rtmpKey }
    });

    if (!rtmpConfig) {
      return res.status(404).json({ error: 'Stream configuration not found' });
    }

    const chatConfig = await prisma.chatConfiguration.upsert({
      where: { rtmpConfigId: rtmpConfig.id },
      update: {
        requireEmail: requireEmail ?? false,
        requireLastName: requireLastName ?? false,
        maxMessageLength: maxMessageLength ?? 2000,
        isEnabled: isEnabled ?? true,
        moderationEnabled: moderationEnabled ?? true
      },
      create: {
        rtmpConfigId: rtmpConfig.id,
        requireEmail: requireEmail ?? false,
        requireLastName: requireLastName ?? false,
        maxMessageLength: maxMessageLength ?? 2000,
        isEnabled: isEnabled ?? true,
        moderationEnabled: moderationEnabled ?? true
      }
    });

    res.json(chatConfig);
  } catch (error) {
    console.error('Error updating chat config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin chat routes
// Get all messages for admin (including private)
router.get('/admin/messages/:rtmpKey', async (req, res) => {
  try {
    const { rtmpKey } = req.params;
    const { limit = 50, offset = 0, chatType } = getMessagesSchema.parse(req.query);
    
    // TODO: Add admin authentication check
    const rtmpConfig = await prisma.rtmpConfiguration.findUnique({
      where: { rtmpKey },
      include: { chatConfiguration: true }
    });

    if (!rtmpConfig) {
      return res.status(404).json({ error: 'Stream configuration not found' });
    }

    const whereClause: any = {
      rtmpConfigId: rtmpConfig.id,
      isDeleted: false
    };

    if (chatType) {
      whereClause.chatType = chatType;
    }

    const messages = await prisma.chatMessage.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    res.json(messages.reverse());
  } catch (error) {
    console.error('Error getting admin chat messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send message as admin
router.post('/admin/send', async (req, res) => {
  try {
    const { content, rtmpKey, chatType, replyToId } = adminChatSchema.parse(req.body);
    
    // TODO: Add admin authentication check
    const rtmpConfig = await prisma.rtmpConfiguration.findUnique({
      where: { rtmpKey }
    });

    if (!rtmpConfig) {
      return res.status(404).json({ error: 'Stream configuration not found' });
    }

    // Create admin chat user if not exists
    let adminUser = await prisma.chatUser.findFirst({
      where: { 
        sessionId: 'admin',
        rtmpConfigId: rtmpConfig.id
      }
    });

    if (!adminUser) {
      adminUser = await prisma.chatUser.create({
        data: {
          firstName: 'Admin',
          lastName: 'User',
          sessionId: 'admin',
          role: 'ADMIN',
          rtmpConfigId: rtmpConfig.id
        }
      });
    }

    const message = await prisma.chatMessage.create({
      data: {
        content,
        rtmpConfigId: rtmpConfig.id,
        userId: adminUser.id,
        chatType,
        replyToId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    });

    // Broadcast the message via WebSocket
    await websocketService.broadcastChatMessage(rtmpKey, message);

    res.json(message);
  } catch (error) {
    console.error('Error sending admin message:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update chat online status
router.put('/admin/status/:rtmpKey', async (req, res) => {
  try {
    const { rtmpKey } = req.params;
    const { chatOnline } = req.body;
    
    // TODO: Add admin authentication check
    const rtmpConfig = await prisma.rtmpConfiguration.findUnique({
      where: { rtmpKey }
    });

    if (!rtmpConfig) {
      return res.status(404).json({ error: 'Stream configuration not found' });
    }

    const chatConfig = await prisma.chatConfiguration.upsert({
      where: { rtmpConfigId: rtmpConfig.id },
      update: { chatOnline },
      create: {
        rtmpConfigId: rtmpConfig.id,
        chatOnline,
        requireEmail: false,
        requireLastName: false,
        maxMessageLength: 2000,
        isEnabled: true,
        moderationEnabled: true,
        allowPrivateChat: true,
        allowPublicChat: true
      }
    });

    res.json(chatConfig);
  } catch (error) {
    console.error('Error updating chat status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Pin/unpin message
router.put('/admin/pin/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { isPinned } = req.body;
    
    // TODO: Add admin authentication check
    const message = await prisma.chatMessage.update({
      where: { id: messageId },
      data: { isPinned }
    });

    res.json(message);
  } catch (error) {
    console.error('Error pinning message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
