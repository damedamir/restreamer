import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Admin dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    // Get actual counts from database
    const totalConfigurations = await prisma.rtmpConfiguration.count();
    const activeStreams = await prisma.streamStatus.count({
      where: { isLive: true }
    });
    const totalUsers = await prisma.user.count();
    const totalBrandedUrls = await prisma.brandedUrl.count();

    res.json({
      stats: {
        totalConfigurations,
        activeStreams,
        totalUsers,
        totalBrandedUrls
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get all configurations
router.get('/configurations', async (req, res) => {
  try {
    const configurations = await prisma.rtmpConfiguration.findMany({
      include: {
        rtmpServer: true,
        streamStatus: true,
        brandedUrls: true
      }
    });
    res.json({ configurations });
  } catch (error) {
    console.error('Get configurations error:', error);
    res.status(500).json({ error: 'Failed to fetch configurations' });
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

// Get all branded URLs
router.get('/branded-urls', async (req, res) => {
  try {
    const brandedUrls = await prisma.brandedUrl.findMany({
      include: {
        rtmpConfig: {
          include: {
            rtmpServer: true
          }
        }
      }
    });
    res.json({ brandedUrls });
  } catch (error) {
    console.error('Get branded URLs error:', error);
    res.status(500).json({ error: 'Failed to fetch branded URLs' });
  }
});

export default router;