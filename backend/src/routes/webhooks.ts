import express from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';

const router = express.Router();

// Validation schemas
const webhookSchema = z.object({
  slug: z.string(),
  secret: z.string()
});

// Verify webhook secret
const verifyWebhookSecret = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const secret = req.query.secret as string || req.headers['x-webhook-secret'] as string;
  
  if (!secret || secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// Stream start webhook
router.post('/start', verifyWebhookSecret, async (req, res) => {
  try {
    const { slug } = webhookSchema.parse(req.query);
    
    const stream = await prisma.stream.findUnique({
      where: { slug }
    });

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    await prisma.stream.update({
      where: { slug },
      data: {
        isLive: true,
        streamUrl: req.body.streamUrl || `${process.env.PUBLIC_HLS_URL}/${slug}.m3u8`,
        metadata: {
          startedAt: new Date().toISOString(),
          ...req.body
        }
      }
    });

    // Log webhook
    await prisma.webhookLog.create({
      data: {
        event: 'start',
        streamId: stream.id,
        data: req.body,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook start error:', error);
    res.status(400).json({ error: 'Invalid request' });
  }
});

// Stream stop webhook
router.post('/stop', verifyWebhookSecret, async (req, res) => {
  try {
    const { slug } = webhookSchema.parse(req.query);
    
    const stream = await prisma.stream.findUnique({
      where: { slug }
    });

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    await prisma.stream.update({
      where: { slug },
      data: {
        isLive: false,
        viewers: 0,
        metadata: {
          stoppedAt: new Date().toISOString(),
          ...stream.metadata
        }
      }
    });

    // Log webhook
    await prisma.webhookLog.create({
      data: {
        event: 'stop',
        streamId: stream.id,
        data: req.body,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook stop error:', error);
    res.status(400).json({ error: 'Invalid request' });
  }
});

// Viewer join webhook
router.post('/viewer/join', verifyWebhookSecret, async (req, res) => {
  try {
    const { slug } = webhookSchema.parse(req.query);
    
    const stream = await prisma.stream.findUnique({
      where: { slug }
    });

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    // Increment viewer count
    await prisma.stream.update({
      where: { slug },
      data: {
        viewers: {
          increment: 1
        }
      }
    });

    // Log viewer join
    await prisma.viewerLog.create({
      data: {
        streamId: stream.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    // Log webhook
    await prisma.webhookLog.create({
      data: {
        event: 'viewer_join',
        streamId: stream.id,
        data: req.body,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Viewer join webhook error:', error);
    res.status(400).json({ error: 'Invalid request' });
  }
});

// Viewer leave webhook
router.post('/viewer/leave', verifyWebhookSecret, async (req, res) => {
  try {
    const { slug } = webhookSchema.parse(req.query);
    
    const stream = await prisma.stream.findUnique({
      where: { slug }
    });

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    // Decrement viewer count (ensure it doesn't go below 0)
    await prisma.stream.update({
      where: { slug },
      data: {
        viewers: {
          decrement: 1
        }
      }
    });

    // Update viewer log
    await prisma.viewerLog.updateMany({
      where: {
        streamId: stream.id,
        leftAt: null
      },
      data: {
        leftAt: new Date()
      }
    });

    // Log webhook
    await prisma.webhookLog.create({
      data: {
        event: 'viewer_leave',
        streamId: stream.id,
        data: req.body,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Viewer leave webhook error:', error);
    res.status(400).json({ error: 'Invalid request' });
  }
});

export default router;
