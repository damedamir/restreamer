import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Get all RTMP servers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const servers = await prisma.rtmpServer.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    res.json(servers);
  } catch (error) {
    console.error('Error fetching RTMP servers:', error);
    res.status(500).json({ error: 'Failed to fetch RTMP servers' });
  }
});

// Create new RTMP server (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, description, rtmpUrl } = req.body;

    if (!name || !rtmpUrl) {
      return res.status(400).json({ error: 'Name and RTMP URL are required' });
    }

    const server = await prisma.rtmpServer.create({
      data: {
        name,
        description,
        rtmpUrl,
        isActive: true
      }
    });

    res.status(201).json(server);
  } catch (error) {
    console.error('Error creating RTMP server:', error);
    res.status(500).json({ error: 'Failed to create RTMP server' });
  }
});

// Update RTMP server (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { name, description, rtmpUrl, isActive } = req.body;

    const server = await prisma.rtmpServer.update({
      where: { id },
      data: { name, description, rtmpUrl, isActive }
    });

    res.json(server);
  } catch (error) {
    console.error('Error updating RTMP server:', error);
    res.status(500).json({ error: 'Failed to update RTMP server' });
  }
});

// Delete RTMP server (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    // Check if server is being used by any configurations
    const configurations = await prisma.rtmpConfiguration.findMany({
      where: { rtmpServerId: id }
    });

    if (configurations.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete RTMP server that is being used by configurations' 
      });
    }

    await prisma.rtmpServer.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting RTMP server:', error);
    res.status(500).json({ error: 'Failed to delete RTMP server' });
  }
});

export default router;
