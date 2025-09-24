import express from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Validation schemas
const createStreamSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  config: z.object({
    brandColor: z.string().default('#111827'),
    logoUrl: z.string().url().optional(),
    overlayText: z.string().optional(),
    customCss: z.string().optional(),
    rtmpKey: z.string().optional(),
    hlsUrl: z.string().url().optional(),
    offlineTitle: z.string().optional(),
    offlineMessage: z.string().optional(),
    offlineImageUrl: z.string().url().optional()
  }).optional()
});

const updateStreamSchema = createStreamSchema.partial();

// Get all streams for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    
    const streams = await prisma.stream.findMany({
      where: { userId },
      include: {
        config: true,
        _count: {
          select: { viewersLog: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(streams);
  } catch (error) {
    console.error('Error fetching streams:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single stream
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const stream = await prisma.stream.findFirst({
      where: { 
        id,
        userId 
      },
      include: {
        config: true,
        viewersLog: {
          orderBy: { joinedAt: 'desc' },
          take: 10
        }
      }
    });

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    res.json(stream);
  } catch (error) {
    console.error('Error fetching stream:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new stream
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const data = createStreamSchema.parse(req.body);

    // Generate unique slug
    const baseSlug = data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.stream.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const stream = await prisma.stream.create({
      data: {
        name: data.name,
        description: data.description,
        slug,
        userId,
        config: data.config ? {
          create: data.config
        } : undefined
      },
      include: {
        config: true
      }
    });

    res.status(201).json(stream);
  } catch (error) {
    console.error('Error creating stream:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update stream
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const data = updateStreamSchema.parse(req.body);

    const stream = await prisma.stream.findFirst({
      where: { id, userId }
    });

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    const updatedStream = await prisma.stream.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        config: data.config ? {
          upsert: {
            create: data.config,
            update: data.config
          }
        } : undefined
      },
      include: {
        config: true
      }
    });

    res.json(updatedStream);
  } catch (error) {
    console.error('Error updating stream:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete stream
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const stream = await prisma.stream.findFirst({
      where: { id, userId }
    });

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    await prisma.stream.delete({
      where: { id }
    });

    res.json({ message: 'Stream deleted successfully' });
  } catch (error) {
    console.error('Error deleting stream:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get stream by slug (public)
router.get('/public/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const stream = await prisma.stream.findUnique({
      where: { slug },
      include: {
        config: true,
        user: {
          select: { name: true }
        }
      }
    });

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    res.json(stream);
  } catch (error) {
    console.error('Error fetching public stream:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
