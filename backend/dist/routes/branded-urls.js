import { Router } from 'express';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';
const router = Router();
// Generate unique branded URL from slug
function generateBrandedUrl(slug) {
    const baseUrl = 'https://hive.restreamer.website/live';
    const cleanSlug = slug
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
    return `${baseUrl}/${cleanSlug}`;
}
// Get all branded URLs for a user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const brandedUrls = await prisma.brandedUrl.findMany({
            where: {
                rtmpConfig: {
                    userId
                }
            },
            include: {
                rtmpConfig: {
                    select: {
                        name: true,
                        rtmpKey: true,
                        rtmpServer: {
                            select: {
                                name: true,
                                rtmpUrl: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(brandedUrls);
    }
    catch (error) {
        console.error('Error fetching branded URLs:', error);
        res.status(500).json({ error: 'Failed to fetch branded URLs' });
    }
});
// Get branded URL by slug (public endpoint)
router.get('/slug/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const brandedUrl = await prisma.brandedUrl.findUnique({
            where: { slug },
            include: {
                rtmpConfig: {
                    select: {
                        name: true,
                        rtmpKey: true,
                        rtmpServer: {
                            select: {
                                name: true,
                                rtmpUrl: true
                            }
                        }
                    }
                }
            }
        });
        if (!brandedUrl) {
            return res.status(404).json({ error: 'Branded URL not found' });
        }
        // Increment view count
        await prisma.brandedUrl.update({
            where: { id: brandedUrl.id },
            data: {
                views: {
                    increment: 1
                }
            }
        });
        res.json(brandedUrl);
    }
    catch (error) {
        console.error('Error fetching branded URL by slug:', error);
        res.status(500).json({ error: 'Failed to fetch branded URL' });
    }
});
// Create new branded URL
router.post('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, slug, rtmpConfigId, color = '#3B82F6', logoUrl, overlayText, offlineContent = false, offlineMessage, ctaText, ctaUrl } = req.body;
        if (!name || !slug || !rtmpConfigId) {
            return res.status(400).json({ error: 'Name, slug, and RTMP configuration ID are required' });
        }
        // Verify the RTMP configuration belongs to the user
        const rtmpConfig = await prisma.rtmpConfiguration.findFirst({
            where: {
                id: rtmpConfigId,
                userId
            }
        });
        if (!rtmpConfig) {
            return res.status(404).json({ error: 'RTMP configuration not found' });
        }
        // Check if slug is unique
        const existingSlug = await prisma.brandedUrl.findUnique({
            where: { slug }
        });
        if (existingSlug) {
            return res.status(400).json({ error: 'Slug already exists. Please choose a different slug.' });
        }
        // Generate URL from slug
        const url = generateBrandedUrl(slug);
        const brandedUrl = await prisma.brandedUrl.create({
            data: {
                name,
                slug,
                url,
                rtmpConfigId,
                views: 0,
                color,
                logoUrl,
                overlayText,
                offlineContent,
                offlineMessage,
                ctaText,
                ctaUrl
            },
            include: {
                rtmpConfig: {
                    select: {
                        name: true,
                        rtmpKey: true,
                        rtmpServer: {
                            select: {
                                name: true,
                                rtmpUrl: true
                            }
                        }
                    }
                }
            }
        });
        res.status(201).json(brandedUrl);
    }
    catch (error) {
        console.error('Error creating branded URL:', error);
        res.status(500).json({ error: 'Failed to create branded URL' });
    }
});
// Update branded URL
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { name, views } = req.body;
        const brandedUrl = await prisma.brandedUrl.findFirst({
            where: {
                id,
                rtmpConfig: {
                    userId
                }
            }
        });
        if (!brandedUrl) {
            return res.status(404).json({ error: 'Branded URL not found' });
        }
        const updatedBrandedUrl = await prisma.brandedUrl.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(views !== undefined && { views })
            },
            include: {
                rtmpConfig: {
                    select: {
                        name: true,
                        rtmpKey: true,
                        rtmpServer: {
                            select: {
                                name: true,
                                rtmpUrl: true
                            }
                        }
                    }
                }
            }
        });
        res.json(updatedBrandedUrl);
    }
    catch (error) {
        console.error('Error updating branded URL:', error);
        res.status(500).json({ error: 'Failed to update branded URL' });
    }
});
// Delete branded URL
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const brandedUrl = await prisma.brandedUrl.findFirst({
            where: {
                id,
                rtmpConfig: {
                    userId
                }
            }
        });
        if (!brandedUrl) {
            return res.status(404).json({ error: 'Branded URL not found' });
        }
        await prisma.brandedUrl.delete({
            where: { id }
        });
        res.json({ message: 'Branded URL deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting branded URL:', error);
        res.status(500).json({ error: 'Failed to delete branded URL' });
    }
});
// Increment view count for a branded URL
router.post('/:id/view', async (req, res) => {
    try {
        const { id } = req.params;
        const brandedUrl = await prisma.brandedUrl.findUnique({
            where: { id }
        });
        if (!brandedUrl) {
            return res.status(404).json({ error: 'Branded URL not found' });
        }
        const updatedBrandedUrl = await prisma.brandedUrl.update({
            where: { id },
            data: {
                views: {
                    increment: 1
                }
            }
        });
        res.json(updatedBrandedUrl);
    }
    catch (error) {
        console.error('Error incrementing view count:', error);
        res.status(500).json({ error: 'Failed to increment view count' });
    }
});
export default router;
//# sourceMappingURL=branded-urls.js.map