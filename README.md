# Custom Restreamer

A modern, self-hosted streaming platform for creating custom branded streaming URLs with RTMP ingestion and HLS delivery.

## Features

- 🎥 **RTMP Ingestion** - Stream from OBS, Zoom, or any RTMP source
- 🎨 **Custom Branding** - Personalized stream pages with logos, colors, and overlays
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- ⚡ **Low Latency** - Optimized HLS delivery with minimal delay
- 🔄 **Real-time Updates** - Live viewer counts and stream status
- 🛠️ **Admin Interface** - Manage streams, configurations, and settings
- 🐳 **Docker Ready** - Easy deployment with Docker Compose

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript, Prisma
- **Database**: PostgreSQL
- **Streaming**: Nginx RTMP + HLS
- **Real-time**: WebSockets
- **Deployment**: Docker, Docker Compose

## Quick Start

1. Clone the repository
2. Copy `.env.example` to `.env` and configure
3. Run `docker-compose up -d`
4. Access the admin panel at `http://localhost:3000/admin`
5. Create your first stream configuration
6. Start streaming!

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   OBS/Zoom     │───▶│  Nginx RTMP     │───▶│  HLS Segments   │
│   (RTMP)       │    │  (Ingestion)    │    │  (Delivery)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Backend API    │
                       │  (Webhooks)     │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Frontend      │
                       │  (Viewer)       │
                       └─────────────────┘
```

## License

MIT
