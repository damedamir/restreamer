import { Router } from 'express';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';
const router = Router();
// Generate unique RTMP stream key
function generateRtmpKey() {
    const prefix = 'zmr_';
    const randomPart = Math.random().toString(36).substr(2, 9);
    const timestamp = Date.now().toString(36).substr(-4);
    return `${prefix}${randomPart}$${timestamp}`;
}
// Get all RTMP configurations for a user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const configurations = await prisma.rtmpConfiguration.findMany({
            where: { userId },
            include: {
                brandedUrls: true,
                rtmpServer: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(configurations);
    }
    catch (error) {
        console.error('Error fetching configurations:', error);
        res.status(500).json({ error: 'Failed to fetch configurations' });
    }
});
// Create new RTMP configuration
router.post('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, rtmpServerId } = req.body;
        console.log('Creating configuration with userId:', userId);
        console.log('Request body:', { name, rtmpServerId });
        if (!name || !rtmpServerId) {
            return res.status(400).json({ error: 'Configuration name and RTMP server are required' });
        }
        // Verify user exists
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            console.error('User not found with ID:', userId);
            return res.status(400).json({ error: 'User not found' });
        }
        console.log('User found:', user.email);
        // Verify RTMP server exists
        const rtmpServer = await prisma.rtmpServer.findUnique({
            where: { id: rtmpServerId }
        });
        if (!rtmpServer) {
            return res.status(400).json({ error: 'Invalid RTMP server selected' });
        }
        // Generate unique RTMP key
        let rtmpKey;
        let isUnique = false;
        let attempts = 0;
        do {
            rtmpKey = generateRtmpKey();
            const existing = await prisma.rtmpConfiguration.findUnique({
                where: { rtmpKey }
            });
            isUnique = !existing;
            attempts++;
        } while (!isUnique && attempts < 10);
        if (!isUnique) {
            return res.status(500).json({ error: 'Failed to generate unique RTMP key' });
        }
        const configuration = await prisma.rtmpConfiguration.create({
            data: {
                name,
                rtmpKey,
                rtmpServerId,
                status: 'Inactive',
                selected: false,
                userId
            },
            include: {
                brandedUrls: true,
                rtmpServer: true
            }
        });
        res.status(201).json(configuration);
    }
    catch (error) {
        console.error('Error creating configuration:', error);
        res.status(500).json({ error: 'Failed to create configuration' });
    }
});
// Update RTMP configuration
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { name, status, selected } = req.body;
        // If setting as selected, unselect all others first
        if (selected) {
            await prisma.rtmpConfiguration.updateMany({
                where: { userId },
                data: { selected: false }
            });
        }
        const configuration = await prisma.rtmpConfiguration.updateMany({
            where: {
                id,
                userId // Ensure user can only update their own configurations
            },
            data: {
                ...(name && { name }),
                ...(status && { status }),
                ...(selected !== undefined && { selected })
            }
        });
        if (configuration.count === 0) {
            return res.status(404).json({ error: 'Configuration not found' });
        }
        const updatedConfiguration = await prisma.rtmpConfiguration.findUnique({
            where: { id },
            include: {
                brandedUrls: true,
                rtmpServer: true
            }
        });
        res.json(updatedConfiguration);
    }
    catch (error) {
        console.error('Error updating configuration:', error);
        res.status(500).json({ error: 'Failed to update configuration' });
    }
});
// Clone RTMP configuration
router.post('/:id/clone', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const originalConfig = await prisma.rtmpConfiguration.findFirst({
            where: {
                id,
                userId // Ensure user can only clone their own configurations
            }
        });
        if (!originalConfig) {
            return res.status(404).json({ error: 'Configuration not found' });
        }
        // Generate unique RTMP key for clone
        let rtmpKey;
        let isUnique = false;
        let attempts = 0;
        do {
            rtmpKey = generateRtmpKey();
            const existing = await prisma.rtmpConfiguration.findUnique({
                where: { rtmpKey }
            });
            isUnique = !existing;
            attempts++;
        } while (!isUnique && attempts < 10);
        if (!isUnique) {
            return res.status(500).json({ error: 'Failed to generate unique RTMP key' });
        }
        const clonedConfig = await prisma.rtmpConfiguration.create({
            data: {
                name: `${originalConfig.name} (Copy)`,
                rtmpKey,
                rtmpServerId: originalConfig.rtmpServerId,
                status: 'Inactive',
                selected: false,
                userId
            },
            include: {
                brandedUrls: true
            }
        });
        res.status(201).json(clonedConfig);
    }
    catch (error) {
        console.error('Error cloning configuration:', error);
        res.status(500).json({ error: 'Failed to clone configuration' });
    }
});
// Delete RTMP configuration
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        // Delete branded URLs first (due to foreign key constraint)
        await prisma.brandedUrl.deleteMany({
            where: {
                rtmpConfigId: id
            }
        });
        const configuration = await prisma.rtmpConfiguration.deleteMany({
            where: {
                id,
                userId // Ensure user can only delete their own configurations
            }
        });
        if (configuration.count === 0) {
            return res.status(404).json({ error: 'Configuration not found' });
        }
        res.json({ message: 'Configuration deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting configuration:', error);
        res.status(500).json({ error: 'Failed to delete configuration' });
    }
});
export default router;
//# sourceMappingURL=configurations.js.map