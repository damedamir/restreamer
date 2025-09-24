import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Admin dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    // Get actual counts from database
    const totalStreams = await prisma.stream.count();
    const activeStreams = await prisma.streamStatus.count({
      where: { isLive: true }
    });
    const totalUsers = await prisma.user.count();

    res.json({
      stats: {
        totalStreams,
        activeStreams,
        totalUsers
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get all streams
router.get('/streams', async (req, res) => {
  try {
    const streams = await prisma.stream.findMany({
      include: {
        streamStatus: true,
        brandedUrl: true
      }
    });
    res.json({ streams });
  } catch (error) {
    console.error('Get streams error:', error);
    res.status(500).json({ error: 'Failed to fetch streams' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create a new stream
router.post('/streams', async (req, res) => {
  try {
    const { name, description, slug } = req.body;
    
    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    const stream = await prisma.stream.create({
      data: {
        name,
        description: description || '',
        slug,
        userId: '1' // Default user for now
      }
    });

    res.status(201).json({ stream });
  } catch (error) {
    console.error('Create stream error:', error);
    res.status(500).json({ error: 'Failed to create stream' });
  }
});

// Update stream status
router.put('/streams/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isLive } = req.body;

    const streamStatus = await prisma.streamStatus.upsert({
      where: { streamId: id },
      update: { isLive },
      create: {
        streamId: id,
        isLive: isLive || false
      }
    });

    res.json({ streamStatus });
  } catch (error) {
    console.error('Update stream status error:', error);
    res.status(500).json({ error: 'Failed to update stream status' });
  }
});

export default router;